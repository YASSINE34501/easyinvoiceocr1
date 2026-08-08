-- ---------------------------------------------------------------------------
-- Five-conversion trial and the final Pro / Business pricing.
--
-- Forward-only and additive. Nothing is dropped and no row is deleted, so
-- existing subscriptions, trial claims, usage history and webhook events all
-- survive. Every statement is written to be safely re-runnable.
--
-- What changes:
--   * The trial stops being time-based. It becomes exactly five successful
--     conversions, once per account, shared across every converter.
--   * usage_records learns a 'conversions' usage type, so the existing atomic
--     consume_quota / release_quota pair counts trial conversions with the same
--     advisory lock and the same idempotency guarantees as paid pages.
--   * Plans are re-seeded by stable code: Trial, Pro (14 / 140, 500 pages),
--     Business (49 / 490, 5000 pages).
--   * The 30-day expiry job becomes a no-op; nothing calls a clock any more.
--
-- Requires: 20260803170000_plans_subscriptions_usage.sql
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. usage_records: allow counting successful conversions
-- ---------------------------------------------------------------------------

-- The trial allowance is a count of conversions, not pages, so the existing
-- quota machinery needs one more usage type. Replacing the CHECK does not touch
-- any row; it only widens what is permitted from here on.
ALTER TABLE public.usage_records
  DROP CONSTRAINT IF EXISTS usage_records_type_check;

ALTER TABLE public.usage_records
  ADD CONSTRAINT usage_records_type_check CHECK (
    usage_type IN ('pages', 'documents', 'api_requests', 'storage_bytes', 'conversions')
  );

-- Counting a user's trial conversions is the hottest read on the gate path.
CREATE INDEX IF NOT EXISTS usage_records_conversions_idx
  ON public.usage_records (user_id, usage_type)
  WHERE usage_type = 'conversions';

-- ---------------------------------------------------------------------------
-- 2. subscription_plans: columns the new model needs
-- ---------------------------------------------------------------------------

ALTER TABLE public.subscription_plans
  -- Trial only: total successful conversions before payment is required.
  -- NULL on paid plans, which are limited by monthly_page_limit instead.
  ADD COLUMN IF NOT EXISTS conversion_allowance INTEGER,
  -- Per-conversion page ceiling. 0 means "no per-conversion ceiling".
  ADD COLUMN IF NOT EXISTS max_pages_per_conversion INTEGER NOT NULL DEFAULT 0,
  -- Batch size. 1 means one file at a time.
  ADD COLUMN IF NOT EXISTS batch_max_files INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS team_members INTEGER NOT NULL DEFAULT 0,
  -- Features that are sold but not yet built. Surfaced as "Coming soon" and
  -- deliberately excluded from entitlement checks until they are real.
  ADD COLUMN IF NOT EXISTS coming_soon JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.subscription_plans.trial_days IS
  'Deprecated. The trial is a count of successful conversions, not a period. Always 0.';
COMMENT ON COLUMN public.subscription_plans.conversion_allowance IS
  'Trial only: total successful conversions allowed, shared across all products.';
COMMENT ON COLUMN public.subscription_plans.coming_soon IS
  'Advertised-but-unimplemented feature keys. Never consulted by entitlement logic.';

-- ---------------------------------------------------------------------------
-- 3. trial_claims: a claim is a one-off allowance, not a dated window
-- ---------------------------------------------------------------------------

ALTER TABLE public.trial_claims
  ADD COLUMN IF NOT EXISTS conversions_allowed INTEGER NOT NULL DEFAULT 5;

-- Historic claims carry a day count that no longer means anything. The column
-- stays (forward-only, no data loss) but stops being required for new rows.
ALTER TABLE public.trial_claims ALTER COLUMN trial_days SET DEFAULT 0;
ALTER TABLE public.trial_claims ALTER COLUMN trial_days DROP NOT NULL;

COMMENT ON COLUMN public.trial_claims.trial_days IS
  'Deprecated, retained for historical claims. The trial is count-based.';

-- ---------------------------------------------------------------------------
-- 4. user_subscriptions: allow the exhausted-trial state to be stored
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_status_check CHECK (
    status IN (
      'no_plan', 'trialing', 'trial_expired', 'trial_exhausted', 'approval_pending',
      'active', 'past_due', 'suspended', 'cancelled', 'expired'
    )
  );

COMMENT ON COLUMN public.user_subscriptions.trial_ends_at IS
  'Deprecated. Retained for historical rows; the trial no longer expires on a date.';

-- ---------------------------------------------------------------------------
-- 5. Plan catalogue
--
-- Upsert by stable code so re-running cannot create a duplicate plan row and
-- so an operator's PayPal plan ids are never overwritten with NULL.
-- ---------------------------------------------------------------------------

INSERT INTO public.subscription_plans (
  code, name, description,
  monthly_price, yearly_price, currency,
  monthly_page_limit, max_file_size, batch_enabled, api_enabled, ads_enabled,
  trial_days, conversion_allowance, max_pages_per_conversion, batch_max_files,
  team_members, features, coming_soon, active, sort_order
) VALUES
  (
    'trial', 'One-Time Free Trial',
    'Five successful conversions, once per account. No card required.',
    0, 0, 'USD',
    0,                      -- paid page quota does not apply
    10485760,               -- 10 MB
    false, false, true,     -- no batch, no API, ads shown
    0,                      -- not a 30-day trial
    5,                      -- five successful conversions in total
    5,                      -- max 5 pages per conversion
    1,                      -- one file at a time
    0,
    '{"exports": ["xlsx", "csv", "json", "docx", "pdf"], "history": false, "support": "none", "advanced_ocr": false, "integrations": false}'::jsonb,
    '[]'::jsonb,
    true, 10
  ),
  (
    'pro', 'Pro',
    '500 successfully processed pages per billing period, all converters, no advertising.',
    14, 140, 'USD',
    500,
    52428800,               -- 50 MB
    true, false, false,
    0, NULL, 0, 20, 0,
    '{"exports": ["xlsx", "csv", "json", "docx", "pdf"], "history": true, "support": "email", "advanced_ocr": true, "integrations": false}'::jsonb,
    '[]'::jsonb,
    true, 20
  ),
  (
    'business', 'Business',
    'Everything in Pro, 5,000 pages per billing period, larger batches and team access.',
    49, 490, 'USD',
    5000,
    104857600,              -- 100 MB
    true,
    false,                  -- api_enabled stays false until the OCR API is real
    false,
    0, NULL, 0, 100, 5,
    '{"exports": ["xlsx", "csv", "json", "docx", "pdf"], "history": true, "support": "priority", "advanced_ocr": true, "integrations": false, "team_members": 5}'::jsonb,
    -- Sold on the pricing page as "Coming soon", excluded from entitlements.
    '["ocr_api", "api_keys", "api_analytics", "webhooks", "accounting_integrations"]'::jsonb,
    true, 30
  )
ON CONFLICT (code) DO UPDATE SET
  name                     = EXCLUDED.name,
  description              = EXCLUDED.description,
  monthly_price            = EXCLUDED.monthly_price,
  yearly_price             = EXCLUDED.yearly_price,
  currency                 = EXCLUDED.currency,
  monthly_page_limit       = EXCLUDED.monthly_page_limit,
  max_file_size            = EXCLUDED.max_file_size,
  batch_enabled            = EXCLUDED.batch_enabled,
  api_enabled              = EXCLUDED.api_enabled,
  ads_enabled              = EXCLUDED.ads_enabled,
  trial_days               = EXCLUDED.trial_days,
  conversion_allowance     = EXCLUDED.conversion_allowance,
  max_pages_per_conversion = EXCLUDED.max_pages_per_conversion,
  batch_max_files          = EXCLUDED.batch_max_files,
  team_members             = EXCLUDED.team_members,
  features                 = EXCLUDED.features,
  coming_soon              = EXCLUDED.coming_soon,
  active                   = EXCLUDED.active,
  sort_order               = EXCLUDED.sort_order,
  updated_at               = now();
  -- paypal_monthly_plan_id / paypal_yearly_plan_id are intentionally NOT in the
  -- update list: they are operator-configured and must survive a re-run.

-- Any plan not in the final catalogue is retired rather than deleted, so
-- subscriptions still pointing at it keep their foreign key.
UPDATE public.subscription_plans
   SET active = false, updated_at = now()
 WHERE code NOT IN ('trial', 'pro', 'business')
   AND active = true;

-- Strip the 30-day rule from any plan row that still carries it.
UPDATE public.subscription_plans
   SET trial_days = 0, updated_at = now()
 WHERE trial_days <> 0;

-- ---------------------------------------------------------------------------
-- 6. Claiming the trial — once per verified account
-- ---------------------------------------------------------------------------

-- Replaces start_trial(). Requires a confirmed email, takes the claim under a
-- per-user advisory lock, and relies on the trial_claims primary key as the
-- final guarantee that a second claim can never succeed — including for a user
-- who has already cancelled a paid subscription.
CREATE OR REPLACE FUNCTION public.claim_trial(p_user_id UUID)
RETURNS public.user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan   public.subscription_plans;
  v_sub    public.user_subscriptions;
  v_email_confirmed TIMESTAMPTZ;
BEGIN
  SELECT email_confirmed_at INTO v_email_confirmed
    FROM auth.users WHERE id = p_user_id;

  IF v_email_confirmed IS NULL THEN
    RAISE EXCEPTION 'email_not_verified' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_plan FROM public.subscription_plans WHERE code = 'trial' AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial_plan_missing' USING ERRCODE = 'no_data_found';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- One claim per account, for the lifetime of the account.
  IF EXISTS (SELECT 1 FROM public.trial_claims WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'trial_already_claimed' USING ERRCODE = 'unique_violation';
  END IF;

  -- A user who has ever held a paid subscription does not get a free trial.
  IF EXISTS (
    SELECT 1 FROM public.user_subscriptions
     WHERE user_id = p_user_id
       AND status IN ('active', 'past_due', 'suspended', 'cancelled', 'expired')
  ) THEN
    RAISE EXCEPTION 'not_trial_eligible' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.trial_claims (user_id, trial_days, plan_code, conversions_allowed)
  VALUES (p_user_id, 0, 'trial', COALESCE(v_plan.conversion_allowance, 5));

  INSERT INTO public.user_subscriptions (
    user_id, plan_id, provider, status, billing_interval, trial_started_at
  ) VALUES (
    p_user_id, v_plan.id, 'none', 'trialing', 'month', now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id          = EXCLUDED.plan_id,
    status           = 'trialing',
    -- Inside ON CONFLICT the existing row is referenced by the bare table name.
    trial_started_at = COALESCE(user_subscriptions.trial_started_at, now()),
    updated_at       = now()
  RETURNING * INTO v_sub;

  RETURN v_sub;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Reading trial usage
-- ---------------------------------------------------------------------------

-- Successful conversions committed against the trial allowance. Reservations
-- released by release_quota() are gone from usage_records, so a failed or
-- cancelled conversion is not counted here.
CREATE OR REPLACE FUNCTION public.trial_conversions_used(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(quantity), 0)::INTEGER
    FROM public.usage_records
   WHERE user_id = p_user_id
     AND usage_type = 'conversions';
$$;

-- One row answering "may this account convert, and how much is left".
-- The server resolves the gate from this; the browser never supplies any of it.
CREATE OR REPLACE FUNCTION public.trial_status(p_user_id UUID)
RETURNS TABLE (
  claimed BOOLEAN,
  allowed INTEGER,
  used INTEGER,
  remaining INTEGER,
  exhausted BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tc.user_id IS NOT NULL,
    COALESCE(tc.conversions_allowed, 5),
    public.trial_conversions_used(p_user_id),
    GREATEST(COALESCE(tc.conversions_allowed, 5) - public.trial_conversions_used(p_user_id), 0),
    public.trial_conversions_used(p_user_id) >= COALESCE(tc.conversions_allowed, 5)
  FROM (SELECT p_user_id AS uid) q
  LEFT JOIN public.trial_claims tc ON tc.user_id = q.uid;
$$;

REVOKE ALL ON FUNCTION public.claim_trial(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_trial(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.trial_conversions_used(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trial_conversions_used(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.trial_status(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trial_status(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 8. Retire the time-based trial logic
-- ---------------------------------------------------------------------------

-- Kept as a no-op rather than dropped: anything still scheduled to call it
-- keeps working and simply changes nothing. A trial can no longer expire by
-- date, only by using its five conversions.
CREATE OR REPLACE FUNCTION public.expire_due_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.expire_due_trials() IS
  'Deprecated no-op. The trial is count-based; nothing expires on a schedule.';

-- start_trial() carried the day count. Superseded by claim_trial(); it now
-- refuses rather than silently creating a dated trial.
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
BEGIN
  RAISE EXCEPTION 'start_trial_removed: use claim_trial(user_id)'
    USING ERRCODE = 'feature_not_supported';
END;
$$;

COMMENT ON FUNCTION public.start_trial(UUID, UUID, TEXT, INTEGER) IS
  'Removed. The 30-day trial no longer exists; call claim_trial(user_id).';

-- Accounts left on the old 'trial_expired' status are deliberately NOT moved
-- back to 'trialing'. They already claimed and consumed the one-time trial, and
-- the rule is that no account ever receives a second free allowance. Their rows
-- and history are untouched; the gate simply requires Pro or Business.

-- ---------------------------------------------------------------------------
-- 9. Settings
-- ---------------------------------------------------------------------------

INSERT INTO public.app_settings (key, value, description)
VALUES
  ('trial.conversion_allowance', '5'::jsonb,
   'Successful conversions granted once per account, shared across all products.'),
  ('trial.requires_verified_email', 'true'::jsonb,
   'A trial may only be claimed by an account with a confirmed email address.')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- The 30-day length setting is the last place the old rule survived in data.
-- Zeroed rather than deleted so the key keeps its audit trail.
UPDATE public.app_settings
   SET value = '0'::jsonb,
       description = 'Deprecated. The trial is count-based; this is always 0.'
 WHERE key = 'trial.days';
