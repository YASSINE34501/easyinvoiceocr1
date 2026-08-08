-- ---------------------------------------------------------------------------
-- Analytics events and the admin audit trail.
--
-- Forward-only and additive. Two new tables, one enum, one helper function and
-- two settings rows. Nothing existing is created, altered, dropped or deleted.
--
-- Deliberately NOT a second source of truth. conversion_jobs, usage_records,
-- trial_claims, user_subscriptions and subscription_events remain authoritative
-- for quota, trials, subscriptions and revenue. analytics_events records only
-- the funnel signal those tables cannot answer — chiefly anonymous visits and
-- checkout intent — plus lightweight markers that make funnel joins cheap.
--
-- Revenue is never taken from this table. It comes from subscription_events,
-- which only ever holds PayPal payloads whose signature has been verified.
--
-- Requires: 20260803170000_plans_subscriptions_usage.sql
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Event vocabulary
-- ---------------------------------------------------------------------------

-- An enum rather than free text: an unknown event name is rejected by the
-- database, so a compromised or buggy client cannot invent event types and
-- pollute the funnel.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
    CREATE TYPE public.analytics_event_type AS ENUM (
      'visitor_session_started',
      'signup_completed',
      'trial_claimed',
      'conversion_started',
      'conversion_completed',
      'conversion_failed',
      'conversion_cancelled',
      'trial_exhausted',
      'checkout_started',
      'subscription_activated',
      'subscription_cancelled',
      'payment_completed',
      'payment_refunded'
    );
  END IF;
END
$$;

-- Events a browser may report. Everything else is server- or webhook-only:
-- a client claiming "payment_completed" must never be believed.
CREATE OR REPLACE FUNCTION public.analytics_event_is_client_reportable(
  p_type public.analytics_event_type
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_type IN (
    'visitor_session_started',
    'checkout_started'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. analytics_events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.analytics_event_type NOT NULL,

  -- Null for anonymous visitors. Set only by trusted server code, never from a
  -- browser-supplied value.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Opaque, rotating, client-generated session id. Not an email, not a device
  -- fingerprint, not derived from an IP address. It exists so a funnel can tell
  -- one visit from another and nothing more.
  anon_session_id TEXT,

  -- Coarse, non-identifying dimensions for segmentation.
  locale TEXT,
  -- ISO-3166 alpha-2, resolved server-side from the edge header. The IP itself
  -- is never stored.
  country CHAR(2),
  device TEXT,
  -- Referrer host only ("google.com"), never a full URL with query parameters.
  source TEXT,
  -- Product slug for conversion events.
  tool TEXT,

  -- Small, allowlisted extras. Capped so a caller cannot use analytics as
  -- arbitrary storage, and never a place for OCR text or filenames.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Stable per logical event. A retried beacon collides here and is ignored.
  idempotency_key TEXT NOT NULL,

  -- Always UTC. The interface formats it in the viewer's locale.
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT analytics_events_locale_check
    CHECK (locale IS NULL OR locale IN ('en', 'fr', 'ar')),
  CONSTRAINT analytics_events_device_check
    CHECK (device IS NULL OR device IN ('desktop', 'tablet', 'mobile', 'bot', 'unknown')),
  -- Bounded free text, so nothing large or structured can be smuggled in.
  CONSTRAINT analytics_events_source_len CHECK (source IS NULL OR length(source) <= 120),
  CONSTRAINT analytics_events_tool_len CHECK (tool IS NULL OR length(tool) <= 40),
  CONSTRAINT analytics_events_session_len
    CHECK (anon_session_id IS NULL OR length(anon_session_id) BETWEEN 16 AND 64),
  -- Hard ceiling on metadata size. 2 KB is far more than any legitimate event
  -- needs and far less than a document.
  CONSTRAINT analytics_events_metadata_size CHECK (pg_column_size(metadata) <= 2048),
  -- An event must be attributable to something, or it cannot be counted.
  CONSTRAINT analytics_events_subject
    CHECK (user_id IS NOT NULL OR anon_session_id IS NOT NULL)
);

-- The idempotency guarantee. A duplicate beacon, a retried server call or a
-- redelivered webhook collides here and is skipped rather than double-counted.
CREATE UNIQUE INDEX IF NOT EXISTS analytics_events_idempotency_key
  ON public.analytics_events (idempotency_key);

-- Dashboard reads are overwhelmingly "events of type X in date range Y".
CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx
  ON public.analytics_events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_time_idx
  ON public.analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx
  ON public.analytics_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events (anon_session_id, occurred_at DESC)
  WHERE anon_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_tool_idx
  ON public.analytics_events (tool, event_type, occurred_at DESC)
  WHERE tool IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_events TO service_role;

-- No grant to anon or authenticated at all. Ingestion goes through a server
-- function holding the service-role key, and reads are an admin-only server
-- function. A browser cannot insert events directly, so it cannot forge a
-- funnel, and cannot select them, so one visitor cannot profile another.
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. admin_audit_log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The admin who acted. Kept even if the account is later deleted, because an
  -- audit trail that erases its own actor is not an audit trail.
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  -- Safe descriptive detail only: which field changed, not the document.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT admin_audit_action_len CHECK (length(action) BETWEEN 1 AND 80),
  CONSTRAINT admin_audit_target_type_len CHECK (length(target_type) BETWEEN 1 AND 60),
  CONSTRAINT admin_audit_target_id_len CHECK (target_id IS NULL OR length(target_id) <= 120),
  CONSTRAINT admin_audit_metadata_size CHECK (pg_column_size(metadata) <= 4096)
);

CREATE INDEX IF NOT EXISTS admin_audit_log_time_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx
  ON public.admin_audit_log (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON public.admin_audit_log (target_type, target_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_audit_log TO service_role;

-- Admins may read the trail. Nobody may write it from a browser, and there is
-- deliberately no UPDATE or DELETE policy for any role: the log is append-only
-- from the application's point of view.
CREATE POLICY "Admins can read the audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 4. Retention
-- ---------------------------------------------------------------------------

-- Deletes analytics events older than the retention window. Analytics is for
-- trends, not for keeping a permanent record of individual visits.
--
-- Only analytics_events is pruned. The audit log is not: an admin action must
-- stay auditable, and it contains no visitor data to minimise.
CREATE OR REPLACE FUNCTION public.prune_analytics_events(p_retention_days INTEGER DEFAULT 400)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_retention_days IS NULL OR p_retention_days < 30 THEN
    RAISE EXCEPTION 'retention_must_be_at_least_30_days' USING ERRCODE = 'check_violation';
  END IF;

  DELETE FROM public.analytics_events
   WHERE occurred_at < now() - make_interval(days => p_retention_days);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_analytics_events(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_analytics_events(INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.analytics_event_is_client_reportable(public.analytics_event_type)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_event_is_client_reportable(public.analytics_event_type)
  TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Settings
-- ---------------------------------------------------------------------------

-- The dashboard shows "Data collection started on <date>" from this value, so a
-- reader can tell an empty chart apart from a chart of genuinely zero activity.
-- Set once, on first application, and never overwritten afterwards.
INSERT INTO public.app_settings (key, value, description)
VALUES
  (
    'analytics.collection_started_at',
    to_jsonb(now()),
    'UTC timestamp when analytics collection began. Displayed so empty periods are not mistaken for missing data.'
  ),
  (
    'analytics.retention_days',
    '400'::jsonb,
    'Days an analytics event is kept before prune_analytics_events removes it.'
  ),
  (
    'analytics.enabled',
    'true'::jsonb,
    'Master switch for analytics ingestion. Consent is still required per visitor.'
  )
ON CONFLICT (key) DO NOTHING;
