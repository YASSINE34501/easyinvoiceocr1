-- Plans, subscriptions, usage and conversion jobs.
--
-- Additive only: nothing in the existing profiles / documents / contact_messages
-- schema is altered or dropped, so this migration is safe to apply on top of a
-- database that already holds user data.

-- ---------------------------------------------------------------------------
-- roles (needed before RLS policies can reference has_role)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'support', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- SECURITY DEFINER so a policy can call it without the policy re-entering the
-- table it protects (which would recurse).
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read every role"
  ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- subscription_plans
-- ---------------------------------------------------------------------------

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  yearly_price NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  monthly_page_limit INTEGER NOT NULL DEFAULT 0,
  max_file_size INTEGER NOT NULL DEFAULT 20971520,
  batch_enabled BOOLEAN NOT NULL DEFAULT false,
  api_enabled BOOLEAN NOT NULL DEFAULT false,
  ads_enabled BOOLEAN NOT NULL DEFAULT true,
  trial_days INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  paypal_monthly_plan_id TEXT,
  paypal_yearly_plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;

-- Pricing has to render on a public page, so active plans are world-readable.
-- The PayPal plan ids are operational identifiers, not secrets, but they are
-- still only written by trusted server code.
CREATE POLICY "Anyone can read active plans"
  ON public.subscription_plans FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins can read every plan"
  ON public.subscription_plans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER subscription_plans_set_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_subscriptions
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'none',
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'no_plan',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  grace_until TIMESTAMPTZ,
  last_payment_failed_at TIMESTAMPTZ,
  -- create_time of the newest provider event already applied. Webhooks can
  -- arrive out of order; an older event is recorded but never applied.
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_subscriptions_status_check CHECK (
    status IN (
      'no_plan', 'trialing', 'trial_expired', 'approval_pending',
      'active', 'past_due', 'suspended', 'cancelled', 'expired'
    )
  ),
  CONSTRAINT user_subscriptions_interval_check CHECK (billing_interval IN ('month', 'year'))
);

-- One live subscription record per user; history lives in subscription_events.
CREATE UNIQUE INDEX user_subscriptions_user_id_key ON public.user_subscriptions (user_id);
CREATE UNIQUE INDEX user_subscriptions_provider_id_key
  ON public.user_subscriptions (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

-- Read-only to the owner. Every write goes through server code that has just
-- verified the change with PayPal, so no client role may INSERT or UPDATE.
CREATE POLICY "Users can read their own subscription"
  ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read every subscription"
  ON public.user_subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_subscriptions_set_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trial_claims — the server-side guarantee that a trial is used once
-- ---------------------------------------------------------------------------

CREATE TABLE public.trial_claims (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_days INTEGER NOT NULL,
  plan_code TEXT NOT NULL
);

ALTER TABLE public.trial_claims ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.trial_claims TO authenticated;
GRANT ALL ON public.trial_claims TO service_role;

CREATE POLICY "Users can read their own trial claim"
  ON public.trial_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- subscription_events — raw provider webhooks, stored once
-- ---------------------------------------------------------------------------

CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'paypal',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  provider_subscription_id TEXT,
  payload JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT subscription_events_status_check CHECK (
    processing_status IN ('received', 'processed', 'ignored', 'failed', 'unverified')
  )
);

-- The uniqueness constraint is what makes webhook delivery idempotent: a
-- redelivered event collides here and is skipped instead of applied twice.
CREATE UNIQUE INDEX subscription_events_provider_event_id_key
  ON public.subscription_events (provider, provider_event_id);
CREATE INDEX subscription_events_received_at_idx
  ON public.subscription_events (received_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

-- Raw provider payloads can contain payer details, so only admins may read them.
CREATE POLICY "Admins can read subscription events"
  ON public.subscription_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- conversion_jobs
-- ---------------------------------------------------------------------------

CREATE TABLE public.conversion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  input_mime_type TEXT NOT NULL,
  input_size BIGINT NOT NULL DEFAULT 0,
  input_storage_path TEXT,
  output_storage_path TEXT,
  output_mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  page_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversion_jobs_status_check CHECK (
    status IN ('pending', 'uploading', 'processing', 'completed', 'failed', 'expired', 'deleted')
  ),
  CONSTRAINT conversion_jobs_tool_check CHECK (
    tool_type IN (
      'pdf-to-word', 'image-to-word', 'image-to-pdf',
      'invoice-ocr', 'receipt-to-excel', 'pdf-invoice-parser', 'image-to-excel'
    )
  )
);

CREATE UNIQUE INDEX conversion_jobs_idempotency_key
  ON public.conversion_jobs (user_id, idempotency_key);
CREATE INDEX conversion_jobs_user_created_idx
  ON public.conversion_jobs (user_id, created_at DESC);
CREATE INDEX conversion_jobs_expiry_idx
  ON public.conversion_jobs (expires_at) WHERE status IN ('completed', 'failed');

ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, DELETE ON public.conversion_jobs TO authenticated;
GRANT ALL ON public.conversion_jobs TO service_role;

-- Owners can see and delete their own jobs. Creating and advancing a job is a
-- server decision (it consumes quota), so no INSERT or UPDATE policy exists.
CREATE POLICY "Users can read their own conversion jobs"
  ON public.conversion_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversion jobs"
  ON public.conversion_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read every conversion job"
  ON public.conversion_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER conversion_jobs_set_updated_at BEFORE UPDATE ON public.conversion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- usage_records
-- ---------------------------------------------------------------------------

CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  conversion_job_id UUID REFERENCES public.conversion_jobs(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL DEFAULT 'pages',
  quantity INTEGER NOT NULL DEFAULT 0,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usage_records_type_check CHECK (
    usage_type IN ('pages', 'documents', 'api_requests', 'storage_bytes')
  )
);

-- Retrying a conversion reuses its idempotency key, so quota is charged once.
CREATE UNIQUE INDEX usage_records_idempotency_key ON public.usage_records (idempotency_key);
CREATE INDEX usage_records_period_idx
  ON public.usage_records (user_id, usage_type, billing_period_start);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.usage_records TO authenticated;
GRANT ALL ON public.usage_records TO service_role;

CREATE POLICY "Users can read their own usage"
  ON public.usage_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read every usage record"
  ON public.usage_records FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- notifications (trial reminders, payment problems)
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One notification of each kind per user: re-running the reminder sweep does
-- not produce duplicates.
CREATE UNIQUE INDEX user_notifications_unique_kind ON public.user_notifications (user_id, kind);
CREATE INDEX user_notifications_user_idx ON public.user_notifications (user_id, created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

CREATE POLICY "Users can read their own notifications"
  ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can mark their own notifications read"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- app_settings — admin-editable configuration, never secrets
-- ---------------------------------------------------------------------------

CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- Values reach the browser through a server function that whitelists keys, so
-- direct read access is limited to admins.
CREATE POLICY "Admins can read settings"
  ON public.app_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- atomic quota accounting
-- ---------------------------------------------------------------------------

-- Reserves quota for one job. Returns whether it was allowed together with the
-- resulting usage, in a single transaction, so two concurrent conversions can
-- never both slip past the last remaining page.
CREATE OR REPLACE FUNCTION public.consume_quota(
  p_user_id UUID,
  p_subscription_id UUID,
  p_job_id UUID,
  p_usage_type TEXT,
  p_quantity INTEGER,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_limit INTEGER,
  p_idempotency_key TEXT
)
RETURNS TABLE (used INTEGER, remaining INTEGER, allowed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INTEGER;
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.usage_records WHERE idempotency_key = p_idempotency_key)
    INTO v_exists;

  IF v_exists THEN
    -- A retry of an already-charged conversion: report state, charge nothing.
    SELECT COALESCE(SUM(quantity), 0) INTO v_used
      FROM public.usage_records
      WHERE user_id = p_user_id AND usage_type = p_usage_type
        AND billing_period_start = p_period_start;
    RETURN QUERY SELECT v_used, GREATEST(p_limit - v_used, 0), TRUE;
    RETURN;
  END IF;

  -- Serialises quota decisions per user for the rest of this transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  SELECT COALESCE(SUM(quantity), 0) INTO v_used
    FROM public.usage_records
    WHERE user_id = p_user_id AND usage_type = p_usage_type
      AND billing_period_start = p_period_start;

  IF p_limit >= 0 AND v_used + p_quantity > p_limit THEN
    RETURN QUERY SELECT v_used, GREATEST(p_limit - v_used, 0), FALSE;
    RETURN;
  END IF;

  INSERT INTO public.usage_records (
    user_id, subscription_id, conversion_job_id, usage_type, quantity,
    billing_period_start, billing_period_end, idempotency_key
  ) VALUES (
    p_user_id, p_subscription_id, p_job_id, p_usage_type, p_quantity,
    p_period_start, p_period_end, p_idempotency_key
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  v_used := v_used + p_quantity;
  RETURN QUERY SELECT v_used, GREATEST(p_limit - v_used, 0), TRUE;
END;
$$;

-- Gives quota back when a job failed. Failed work must not consume the
-- allowance the user paid for.
CREATE OR REPLACE FUNCTION public.release_quota(p_user_id UUID, p_idempotency_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.usage_records
    WHERE idempotency_key = p_idempotency_key AND user_id = p_user_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ---------------------------------------------------------------------------
-- trial start — one per account, enforced by the primary key on trial_claims
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_trial(
  p_user_id UUID,
  p_plan_id UUID,
  p_plan_code TEXT,
  p_days INTEGER
)
RETURNS public.user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_subscription public.user_subscriptions;
BEGIN
  INSERT INTO public.trial_claims (user_id, trial_days, plan_code)
  VALUES (p_user_id, p_days, p_plan_code)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial_already_used' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.user_subscriptions (
    user_id, plan_id, provider, status,
    trial_started_at, trial_ends_at, current_period_start, current_period_end
  ) VALUES (
    p_user_id, p_plan_id, 'none', 'trialing',
    v_now, v_now + make_interval(days => p_days), v_now, v_now + make_interval(days => p_days)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'trialing',
    trial_started_at = EXCLUDED.trial_started_at,
    trial_ends_at = EXCLUDED.trial_ends_at,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end
  RETURNING * INTO v_subscription;

  RETURN v_subscription;
END;
$$;

-- Marks every trial whose end date has passed. Called by the entitlement
-- resolver, so an expired trial stops working even if no scheduled job runs.
CREATE OR REPLACE FUNCTION public.expire_due_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.user_subscriptions
    SET status = 'trial_expired'
    WHERE status = 'trialing' AND trial_ends_at IS NOT NULL AND trial_ends_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_quota(UUID, UUID, UUID, TEXT, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_quota(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.start_trial(UUID, UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_due_trials() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

-- ---------------------------------------------------------------------------
-- private storage for conversion inputs and outputs
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('conversions', 'conversions', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Objects are stored under <user-id>/<job-id>/<name>, so the first path
-- segment is the ownership check. Files are served through short-lived signed
-- URLs; the bucket itself is never public.
CREATE POLICY "Users can read their own conversion files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'conversions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own conversion files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'conversions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- seed data — every value stays editable from the admin console
-- ---------------------------------------------------------------------------

INSERT INTO public.subscription_plans (
  code, name, description, monthly_price, yearly_price, currency,
  monthly_page_limit, max_file_size, batch_enabled, api_enabled, ads_enabled,
  trial_days, sort_order, features
) VALUES
  (
    'trial', 'Free Trial', '30 days to try every standard converter.',
    0, NULL, 'USD',
    100, 20971520, false, false, true,
    30, 10,
    '{"exports":["xlsx","csv","json","docx","pdf"],"history":true,"team_members":1,"support":"standard","advanced_ocr":false}'::jsonb
  ),
  (
    'pro', 'Pro', 'For professionals and small teams.',
    14, 140, 'USD',
    500, 52428800, true, false, false,
    0, 20,
    '{"exports":["xlsx","csv","json","docx","pdf"],"history":true,"team_members":1,"support":"priority","advanced_ocr":true}'::jsonb
  ),
  (
    'business', 'Business', 'For growing teams and companies.',
    49, 490, 'USD',
    5000, 104857600, true, true, false,
    0, 30,
    '{"exports":["xlsx","csv","json","docx","pdf"],"history":true,"team_members":5,"support":"priority","advanced_ocr":true,"integrations":true}'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.app_settings (key, value, description) VALUES
  ('trial.enabled', 'true'::jsonb, 'Whether new accounts may start a free trial.'),
  ('trial.days', '30'::jsonb, 'Length of the free trial in days.'),
  ('billing.grace_period_days', '3'::jsonb, 'Days of continued access after a failed payment.'),
  ('retention.output_hours', '24'::jsonb, 'Hours a converted file is kept before deletion.'),
  ('ads.enabled', 'false'::jsonb, 'Master switch for AdSense. Keep false until the site is approved.'),
  ('ads.client_id', '""'::jsonb, 'AdSense publisher id (ca-pub-...). Empty until approved.'),
  ('ads.slots', '{}'::jsonb, 'Named ad slot ids, e.g. {"home_below_hero":"1234567890"}.')
ON CONFLICT (key) DO NOTHING;
