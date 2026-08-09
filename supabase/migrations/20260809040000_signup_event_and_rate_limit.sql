-- ---------------------------------------------------------------------------
-- Verified-signup analytics trigger and database-backed rate limiting.
--
-- Forward-only and additive. Two new tables, four new functions, one new
-- trigger. Nothing existing is altered or dropped. Contains no CREATE POLICY,
-- which is the one statement in this codebase that is not re-runnable.
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
--     N times the intended rate. This replaces it with atomic statements
--     against shared tables.
--
-- Requires: 20260808230000_analytics_and_audit.sql
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Verified signup event
-- ---------------------------------------------------------------------------

-- Records signup_completed the moment an account becomes genuinely verified.
--
-- The two firing conditions are mutually exclusive and exhaustive:
--
--   (a) INSERT where email_confirmed_at is already non-NULL. This is a provider
--       that verified the address itself, or an admin-created confirmed
--       account. TG_OP = 'INSERT' so the UPDATE guard below cannot apply.
--
--   (b) UPDATE where email_confirmed_at moves NULL -> non-NULL. This is the
--       ordinary email-verification path.
--
-- Everything else returns early:
--   * NEW.email_confirmed_at IS NULL          -> unverified, nothing to record.
--   * UPDATE, OLD.email_confirmed_at NOT NULL -> already verified before this
--                                                statement, so not a new signup.
--
-- That leaves no path where a password change, a metadata edit, a re-sent
-- confirmation or a token refresh can emit an event. Even if one did, the
-- idempotency key is signup_completed:{user_id} and the unique index on
-- analytics_events collapses the repeat — so duplication is prevented twice.
--
-- The email is deliberately never copied into analytics. The user_id is the
-- only identifier the funnel needs, and duplicating an address into a second
-- table would widen the blast radius of any future mistake for no benefit.
CREATE OR REPLACE FUNCTION public.record_signup_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Condition guard 1: only a real confirmation counts.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Condition guard 2: on UPDATE, require a genuine NULL -> timestamp move.
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
  -- Analytics must never be able to break authentication, so the signup or
  -- verification always completes. But it must not fail silently either: a
  -- trigger that quietly stops recording would leave the funnel wrong with no
  -- signal. A WARNING carries a fixed category and the SQLSTATE only — never
  -- the email, the user metadata, a token, or the row that failed.
  RAISE WARNING 'analytics_signup_event_failed (sqlstate=%)', SQLSTATE;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.record_signup_completed() IS
  'Records signup_completed once per account when auth.users becomes verified. Never stores the email. Warns, never raises, on failure.';

REVOKE ALL ON FUNCTION public.record_signup_completed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.record_signup_completed();

-- ---------------------------------------------------------------------------
-- 2. Per-session rate-limit buckets
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

CREATE INDEX IF NOT EXISTS analytics_rate_buckets_expiry_idx
  ON public.analytics_rate_buckets (bucket_start);

ALTER TABLE public.analytics_rate_buckets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_rate_buckets TO service_role;

-- No policy and no grant for anon or authenticated, deliberately. With RLS on
-- and no policy those roles can neither read nor write, so a visitor cannot
-- inspect or reset their own budget. Omitting CREATE POLICY also keeps this
-- migration re-runnable, since CREATE POLICY has no IF NOT EXISTS form.

-- ---------------------------------------------------------------------------
-- 3. Global ingestion circuit breaker
-- ---------------------------------------------------------------------------

-- The per-session limit is not, on its own, an abuse control.
--
-- session_id is generated by the browser, so an attacker can simply mint a new
-- one per request and never touch the same bucket twice. The per-session limit
-- stops a runaway loop or a buggy client; it does not stop a determined one.
--
-- This is the bounded fail-safe: a single counter for all browser-reported
-- events per minute. One row per minute for the entire deployment, so a
-- rotating-session flood inflates one integer instead of creating unbounded
-- rows. No IP address is involved, so nothing here identifies anyone.
--
-- The tradeoff is explicit and worth stating plainly: because the breaker is
-- global, an attacker who saturates it causes legitimate visitor events to be
-- dropped for the rest of that minute. It converts an unbounded-write problem
-- into a measurement-loss problem. For analytics that is the right way round —
-- losing funnel rows is recoverable, an unbounded table is not — but it does
-- mean the breaker is a denial-of-measurement vector, not a defence against
-- one. Trusted events are unaffected: signup, conversion, admin and webhook
-- events never call this function.
CREATE TABLE IF NOT EXISTS public.analytics_global_rate (
  bucket_start TIMESTAMPTZ PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT analytics_global_rate_count_positive CHECK (count >= 0)
);

ALTER TABLE public.analytics_global_rate ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_global_rate TO service_role;

-- Consumes one unit of both budgets and reports whether the event is allowed.
--
-- The global breaker is checked first and is the cheaper statement, so a
-- saturated deployment stops before touching the per-session table.
--
-- Each decision is a single INSERT ... ON CONFLICT DO UPDATE. That is what
-- makes it correct under concurrency: the conflicting row is locked for the
-- duration of the update, so two simultaneous requests are serialised by
-- Postgres and cannot both observe the same pre-increment count. The WHERE on
-- the DO UPDATE means the statement returns no row once the ceiling is
-- reached, which is how refusal is detected — there is no read-then-write gap
-- to race.
CREATE OR REPLACE FUNCTION public.analytics_rate_limit_check(
  p_session_id TEXT,
  p_limit INTEGER DEFAULT 60,
  p_global_limit INTEGER DEFAULT 5000
)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bucket TIMESTAMPTZ := date_trunc('minute', now());
  v_count INTEGER;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) < 16 OR length(p_session_id) > 64 THEN
    RETURN QUERY SELECT FALSE, 0, 'invalid_session'::TEXT;
    RETURN;
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_global_limit IS NULL OR p_global_limit < 1 THEN
    RAISE EXCEPTION 'limit_must_be_positive' USING ERRCODE = 'check_violation';
  END IF;

  -- Global breaker.
  INSERT INTO public.analytics_global_rate AS g (bucket_start, count)
  VALUES (v_bucket, 1)
  ON CONFLICT (bucket_start) DO UPDATE
    SET count = g.count + 1
    WHERE g.count < p_global_limit
  RETURNING g.count INTO v_count;

  IF v_count IS NULL THEN
    RETURN QUERY SELECT FALSE, p_global_limit, 'global_limit'::TEXT;
    RETURN;
  END IF;

  -- Per-session budget.
  INSERT INTO public.analytics_rate_buckets AS b (session_id, bucket_start, count)
  VALUES (p_session_id, v_bucket, 1)
  ON CONFLICT (session_id, bucket_start) DO UPDATE
    SET count = b.count + 1
    WHERE b.count < p_limit
  RETURNING b.count INTO v_count;

  IF v_count IS NULL THEN
    SELECT b2.count INTO v_count
      FROM public.analytics_rate_buckets b2
     WHERE b2.session_id = p_session_id AND b2.bucket_start = v_bucket;
    RETURN QUERY SELECT FALSE, COALESCE(v_count, p_limit), 'session_limit'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, v_count, 'ok'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER, INTEGER) IS
  'Atomically consumes one unit of the global and per-session analytics budgets. Shared across server instances. Does not prevent session-ID rotation.';

REVOKE ALL ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_rate_limit_check(TEXT, INTEGER, INTEGER)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Cleanup
-- ---------------------------------------------------------------------------

-- Removes buckets whose window has passed, from both limiter tables.
--
-- A few minutes of slack is kept rather than deleting the moment a window ends,
-- so a request that started just before the boundary still sees its own bucket.
-- Only expired rows are touched: the current window is never deleted, so an
-- in-flight budget cannot be reset by a concurrent cleanup.
CREATE OR REPLACE FUNCTION public.prune_analytics_rate_buckets(p_keep_minutes INTEGER DEFAULT 5)
RETURNS TABLE (session_rows INTEGER, global_rows INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_sessions INTEGER;
  v_global INTEGER;
BEGIN
  IF p_keep_minutes IS NULL OR p_keep_minutes < 2 THEN
    RAISE EXCEPTION 'keep_minutes_must_be_at_least_two' USING ERRCODE = 'check_violation';
  END IF;

  v_cutoff := date_trunc('minute', now()) - make_interval(mins => p_keep_minutes);

  DELETE FROM public.analytics_rate_buckets WHERE bucket_start < v_cutoff;
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  DELETE FROM public.analytics_global_rate WHERE bucket_start < v_cutoff;
  GET DIAGNOSTICS v_global = ROW_COUNT;

  RETURN QUERY SELECT v_sessions, v_global;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_analytics_rate_buckets(INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_analytics_rate_buckets(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Settings
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value, description)
VALUES
  (
    'analytics.rate_limit_per_minute',
    '60'::jsonb,
    'Browser-reported analytics events accepted per anonymous session per minute.'
  ),
  (
    'analytics.global_rate_limit_per_minute',
    '5000'::jsonb,
    'Circuit breaker: total browser-reported analytics events accepted per minute across the deployment. Guards against session-ID rotation at the cost of dropping legitimate events once saturated.'
  ),
  (
    'analytics.rate_bucket_keep_minutes',
    '5'::jsonb,
    'Minutes an expired rate-limit bucket is kept before prune_analytics_rate_buckets removes it.'
  )
ON CONFLICT (key) DO NOTHING;
