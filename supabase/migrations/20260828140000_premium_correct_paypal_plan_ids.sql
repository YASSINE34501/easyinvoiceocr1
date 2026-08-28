-- ---------------------------------------------------------------------------
-- Point Premium at the PayPal plans that actually bill $5 and $48.
--
-- 20260828120000 set the price to $5/$48 and wrote two plan ids alongside it.
-- Those ids turned out to be the OLD plans. Read back from the live PayPal
-- account:
--
--   P-0T11340213437223LNJ2QNAI   INACTIVE   $14.00 USD / 1 MONTH  "Pro Monthly"
--   P-55929159U5400864DNJ2QRGI   INACTIVE  $140.00 USD / 1 YEAR   "Pro Yearly"
--
-- while the plans that carry the new pricing are:
--
--   P-3XV25671923003246NJ2QUNA   ACTIVE      $5.00 USD / 1 MONTH
--   P-6XB8408055029715DNJ2QV5Y   ACTIVE     $48.00 USD / 1 YEAR
--
-- Two separate faults, both fixed by this one update:
--
--   1. Checkout was dead. PayPal refuses to create a subscription against an
--      INACTIVE plan, so every visitor who reached the payment step failed.
--   2. Had those plans been reactivated, the site would have advertised $5 and
--      charged $14 — the precise mismatch 20260828120000 was written to
--      prevent, reintroduced through the id rather than the price.
--
-- The prices in the row are already correct and are deliberately not restated
-- here: one fact, one place. Only the ids move.
--
-- The application never needed a change. billing.functions.ts reads the id
-- from this row and refuses any subscription whose plan_id differs, so a wrong
-- id fails closed rather than billing the wrong amount.
--
-- Existing subscribers are untouched: PayPal keeps a subscription on the plan
-- it was created against, and resolveBillingState loads a subscriber's plan by
-- id. Anyone already paying $14 keeps that arrangement until they cancel.
--
-- Forward-only, additive, re-runnable: an UPDATE by stable code. Nothing is
-- dropped and no schema changes.
-- ---------------------------------------------------------------------------

UPDATE public.subscription_plans
   SET paypal_monthly_plan_id = 'P-3XV25671923003246NJ2QUNA',
       paypal_yearly_plan_id  = 'P-6XB8408055029715DNJ2QV5Y',
       updated_at             = now()
 WHERE code = 'pro';

-- A silent no-op here would leave checkout broken, so fail loudly instead.
DO $$
DECLARE
  premium public.subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO premium FROM public.subscription_plans WHERE code = 'pro';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription_plans has no row with code = pro';
  END IF;

  IF premium.paypal_monthly_plan_id <> 'P-3XV25671923003246NJ2QUNA'
     OR premium.paypal_yearly_plan_id <> 'P-6XB8408055029715DNJ2QV5Y' THEN
    RAISE EXCEPTION 'premium plan ids did not apply: monthly=%, yearly=%',
      premium.paypal_monthly_plan_id, premium.paypal_yearly_plan_id;
  END IF;

  -- The ids and the prices have to agree, or the site quotes one number and
  -- PayPal charges another.
  IF premium.monthly_price <> 5 OR premium.yearly_price <> 48 THEN
    RAISE EXCEPTION 'premium pricing is not 5/48: monthly=%, yearly=%',
      premium.monthly_price, premium.yearly_price;
  END IF;
END $$;
