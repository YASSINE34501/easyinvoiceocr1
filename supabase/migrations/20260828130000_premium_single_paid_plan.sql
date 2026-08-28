-- ---------------------------------------------------------------------------
-- One paid plan, called Premium.
--
-- Pro and Business are replaced on the pricing page by a single paid plan. The
-- plan *code* stays 'pro': the code is what the PayPal plan ids, the existing
-- subscriptions, the entitlement ranking and every foreign key are keyed on,
-- and renaming it would orphan all of them for a change that is only a label.
-- So Pro is renamed to Premium and Business is retired.
--
-- Business is retired, not deleted. subscription_plans rows are referenced by
-- user_subscriptions, and resolveBillingState loads a subscriber's plan by id
-- with no filter on `active` (entitlements.server.ts), so anyone already on
-- Business keeps their entitlements and keeps being billed by PayPal on the
-- plan they signed up to. They simply stop being offered it. Deleting the row
-- would break their foreign key and their access; this does neither.
--
-- The same treatment 20260807120000 already uses for anything out of the
-- catalogue: "retired rather than deleted, so subscriptions still pointing at
-- it keep their foreign key."
--
-- Separate from 20260828120000 rather than folded into it, because that one
-- may already have been applied. Forward-only, additive, re-runnable.
-- ---------------------------------------------------------------------------

-- Pro becomes Premium. Price and PayPal ids are set by 20260828120000 and are
-- deliberately not repeated here: one fact, one place.
UPDATE public.subscription_plans
   SET name        = 'Premium',
       description = 'Every converter and every extraction tool, no advertising.',
       sort_order  = 20,
       updated_at  = now()
 WHERE code = 'pro';

-- Business leaves the catalogue. Existing subscribers are unaffected.
UPDATE public.subscription_plans
   SET active     = false,
       updated_at = now()
 WHERE code = 'business';

DO $$
DECLARE
  premium  public.subscription_plans%ROWTYPE;
  business public.subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO premium FROM public.subscription_plans WHERE code = 'pro';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription_plans has no row with code = pro';
  END IF;
  IF premium.name <> 'Premium' THEN
    RAISE EXCEPTION 'pro was not renamed: name is %', premium.name;
  END IF;
  IF NOT premium.active THEN
    RAISE EXCEPTION 'the only paid plan is inactive; nothing would be purchasable';
  END IF;

  SELECT * INTO business FROM public.subscription_plans WHERE code = 'business';
  IF FOUND AND business.active THEN
    RAISE EXCEPTION 'business is still active';
  END IF;
END $$;
