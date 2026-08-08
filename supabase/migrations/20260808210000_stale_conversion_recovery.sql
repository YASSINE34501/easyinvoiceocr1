-- ---------------------------------------------------------------------------
-- Recovery for abandoned conversion jobs.
--
-- Quota is reserved before processing starts, which is what makes the last
-- conversion race-proof. The cost is that a browser which dies mid-conversion —
-- a crashed OCR worker, a closed tab, a lost network — leaves its job in
-- 'processing' with the reservation still held. The user silently loses one of
-- their five conversions and nothing ever gives it back.
--
-- This adds one function that finds those jobs and releases them.
--
-- Forward-only and additive:
--   * no table is created, altered or dropped
--   * no existing function is replaced
--   * the only rows touched are conversion_jobs still stuck in 'processing'
--     past the timeout, and the usage_records reservations belonging to them
--
-- Requires: 20260803170000_plans_subscriptions_usage.sql
-- ---------------------------------------------------------------------------

-- Releases quota for conversions abandoned mid-flight.
--
-- Correctness rests on a single CTE. The UPDATE moves a job out of 'processing'
-- and returns it in the same statement; the DELETE then releases only the
-- reservations belonging to jobs that this particular UPDATE moved. Two
-- consequences follow, and they are the whole safety argument:
--
--   * A completed job is never touched. The WHERE clause matches 'processing'
--     only, so a conversion that finished — and legitimately spent its
--     allowance — keeps its usage row.
--
--   * A reservation cannot be released twice. Whichever concurrent call wins
--     the UPDATE takes the row out of 'processing', so the loser's WHERE no
--     longer matches it and its DELETE has nothing to act on. Re-running the
--     function is therefore a no-op rather than a second refund.
--
-- The whole thing is one statement, so it is atomic without an explicit
-- transaction block.
CREATE OR REPLACE FUNCTION public.expire_stale_conversions(p_timeout_minutes INTEGER DEFAULT 30)
RETURNS TABLE (jobs_expired INTEGER, reservations_released INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobs INTEGER;
  v_released INTEGER;
BEGIN
  IF p_timeout_minutes IS NULL OR p_timeout_minutes < 1 THEN
    RAISE EXCEPTION 'timeout_must_be_at_least_one_minute' USING ERRCODE = 'check_violation';
  END IF;

  WITH stale AS (
    UPDATE public.conversion_jobs
       SET status = 'failed',
           error_code = 'timeout',
           completed_at = now()
     WHERE status = 'processing'
       -- A job with no start time cannot be aged, so it is left alone rather
       -- than guessed at.
       AND processing_started_at IS NOT NULL
       AND processing_started_at < now() - make_interval(mins => p_timeout_minutes)
    RETURNING id, user_id, idempotency_key
  ),
  released AS (
    DELETE FROM public.usage_records ur
     USING stale s
     WHERE ur.user_id = s.user_id
       AND ur.idempotency_key = s.idempotency_key
    RETURNING ur.id
  )
  SELECT
    (SELECT count(*) FROM stale)::INTEGER,
    (SELECT count(*) FROM released)::INTEGER
  INTO v_jobs, v_released;

  RETURN QUERY SELECT v_jobs, v_released;
END;
$$;

COMMENT ON FUNCTION public.expire_stale_conversions(INTEGER) IS
  'Fails conversion jobs abandoned in processing past the timeout and releases their reserved quota exactly once. Idempotent.';

-- Trusted server code only. A client must never be able to age out its own
-- jobs, which would be a way to refund a conversion it actually received.
REVOKE ALL ON FUNCTION public.expire_stale_conversions(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_conversions(INTEGER) TO service_role;

-- How long a job may sit in 'processing' before it is considered abandoned.
-- Comfortably above the 120s per-page pipeline timeout, so a slow but live
-- conversion is never cut off.
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'conversions.stale_timeout_minutes',
  '30'::jsonb,
  'Minutes a conversion may stay in processing before its quota is released.'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;
