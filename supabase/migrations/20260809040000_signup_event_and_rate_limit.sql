-- ---------------------------------------------------------------------------
-- Verified-signup analytics trigger and a database-backed rate limiter.
--
-- Forward-only and additive. One new table, three new functions, one new
-- trigger. Nothing existing is altered or dropped.
--
-- Two gaps this closes:
--
--   * signup_completed had no authoritative source. Sign-up happens through
--     supabase.auth.signUp in the browser, and there is no server function to
--     hook, so recording it client-side would mean trusting a browser-supplied
--     user id. The database itself is the only party that can attest a real,
--     verified account exists — so the database records it.
--
--   * The analytics rate limiter lived in a per-instance Map. On serverless
--     infrastructure every cold start gets its own Map, so N instances allow
--     N times the intended rate. This replaces it with a single atomic
--     statement against a shared table.
--
-- Requires: 20260808230000_analytics_and_audit.sql
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Verified signup event
-- ---------------------------------------------------------------------------

-- Records signup_completed the moment an account becomes genuinely verified.
--
-- Fires in exactly two situations:
--   * a row is inserted already confirmed (an OAuth provider that verifies the
--     address itself, or an admin-created confirmed account); or
--   * email_confirmed_at moves from NULL to a real timestamp, which is the
--     ordinary email-verification path.
--
-- It cannot fire twice. The idempotency key is signup_completed:{user_id} and
-- the unique index on analytics_events collapses any repeat, so a second
-- verification, a profile update or a replayed trigger all write nothing.
--
-- The email is deliberately never copied into analytics: the user_id is the
-- only identifier the funnel needs, and duplicating an address into a second
-- table would widen the blast radius of any future mistake for no benefit.
CREATE OR REPLACE FUNCTION public.record_signup_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only a real confirmation counts.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, require an actual NULL -> timestamp transition. Any other
  -- update to an already-confirmed row is not a new signup.
  IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.analytics_events (
    event_type, user_id, idempotency_key, occurred_at
  ) VALUES (
    'signup_completed',
    NEW.id,
    'signup_completed:' || NEW.id::text,
    COALESCE(NEW.email_confirmed_at, now())
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Analytics must never be able to break authentication. A failure here is
  -- swallowed so a signup or a verification always completes.
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.record_signup_completed() IS
  'Records signup_completed once per account, when auth.users becomes verified. Never stores the email.';

REVOKE ALL ON FUNCTION public.record_signup_completed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.record_signup_completed();

-- ---------------------------------------------------------------------------
-- 2. Rate-limit buckets
-- ---------------------------------------------------------------------------

-- One row per anonymous session per one-minute bucket.
--
-- Bounded by construction: a session can only ever own one row per minute, and
-- rows are deleted a few minutes later, so the table's size is a function of
-- current traffic rather than of history. It holds no IP address and no
-- personal data — only the same opaque session token analytics_events uses.
CREATE TABLE IF NOT EXISTS public.analytics_rate_buckets (
  session_id TEXT NOT NULL,
  -- Truncated to the minute, so the primary key *is* the window.
  bucket_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, bucket_start),

  CONSTRAINT analytics_rate_session_len CHECK (length(session_id) BETWEEN 16 AND 64),
  CONSTRAINT analytics_rate_count_positive CHECK (count >= 0)
);

-- Cleanup scans by age, so that is the index it gets.
CREATE INDEX IF NOT EXISTS analytics_rate_buckets_expiry_idx
  ON public.analytics_rate_buckets (bucket_start);

ALTER TABLE public.analytics_rate_buckets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_rate_buckets TO service_role;

-- No policy and no grant for anon or authenticated, deliberately. With RLS on
-- and no policy, those roles can neither read nor write: a visitor must not be
-- able to inspect or reset their own budget.

-- Consumes one unit of a session's budget and reports whether it was allowed.
--
-- The whole decision is a single INSERT ... ON CONFLICT DO UPDATE. That matters
-- for correctness under concurrency: the conflicting row is locked for the
-- duration of the update, so two simultaneous requests are serialised by
-- Postgres and cannot both observe the same pre-increment count. The WHERE on
-- the DO UPDATE means the statement returns no row once the ceiling is reached,
-- which is how refusal is detected — there is no read-then-write gap to race.
--
-- Trusted events never call this. Conversion, signup, admin and webhook events
-- are recorded by server code or by the database itself and are not subject to
-- a visitor's budget.
CREATE OR REPLACE FUNCTION public.analytics_rate_limit_check(
  p_session_id TEXT,
  p_limit INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bucket TIMESTAMPTZ := date_trunc('minute', now());
  v_count INTEGER;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 16 OR length(p_session_id) > 64 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'limit_must_be_positive' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.analytics_rate_buckets AS b (session_id, bucket_start, count)
  VALUES (p_session_id, v_bucket, 1)
  ON CONFLICT (session_id, bucket_start) DO UPDATE
    SET count = b.count + 1
    WHERE b.count < p_limit
  RETURNING b.count INTO v_count;

  IF v_count IS NULL THEN
    -- The DO UPDATE was filtered out: the ceiling is already reached.
    SELECT b2.count INTO v_count
      FROM public.analytics_rate_buckets b2
     WHERE b2.session_id = p_session_id AND b2.bucket_start = v_bucket;
    RETURN QUERY SELECT FALSE, COALESCE(v_count, p_limit);
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_count;
END;
$$;

COMMENT ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER) IS
  'Atomically consumes one unit of an anonymous session''s per-minute analytics budget. Shared across server instances.';

REVOKE ALL ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Cleanup
-- ---------------------------------------------------------------------------

-- Removes buckets whose window has passed.
--
-- A few minutes of slack is kept rather than deleting the moment a window ends,
-- so a request that started just before the boundary still sees its own bucket.
-- Only expired rows are touched: the current window is never deleted, so an
-- in-flight budget cannot be reset by a concurrent cleanup.
CREATE OR REPLACE FUNCTION public.prune_analytics_rate_buckets(p_keep_minutes INTEGER DEFAULT 5)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_keep_minutes IS NULL OR p_keep_minutes < 2 THEN
    RAISE EXCEPTION 'keep_minutes_must_be_at_least_two' USING ERRCODE = 'check_violation';
  END IF;

  DELETE FROM public.analytics_rate_buckets
   WHERE bucket_start < date_trunc('minute', now()) - make_interval(mins => p_keep_minutes);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_analytics_rate_buckets(INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_analytics_rate_buckets(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Settings
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value, description)
VALUES
  (
    'analytics.rate_limit_per_minute',
    '60'::jsonb,
    'Browser-reported analytics events accepted per anonymous session per minute.'
  ),
  (
    'analytics.rate_bucket_keep_minutes',
    '5'::jsonb,
    'Minutes an expired rate-limit bucket is kept before prune_analytics_rate_buckets removes it.'
  )
ON CONFLICT (key) DO NOTHING;
