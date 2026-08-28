-- ---------------------------------------------------------------------------
-- Pro moves to $5 a month and $48 a year, on new PayPal plans.
--
-- Twelve months at $5 is $60, so $48 saves $12 — twenty per cent. Nothing in
-- the application stores that figure: the pricing cards derive it from the two
-- columns below, so the page cannot advertise a discount the billing does not
-- honour.
--
-- Price and plan id are set in the SAME statement on purpose. A PayPal plan's
-- price is fixed when it is created, so the old ids still bill $14; updating
-- the price alone would leave the site quoting $5 while PayPal charged $14.
-- Together, the displayed price and the billed price change at one instant.
--
-- Business is deliberately untouched. Existing Pro subscribers are also
-- untouched: PayPal keeps them on the plan they subscribed to, so anyone who
-- signed up at $14 stays at $14 until they cancel and resubscribe. Migrating
-- them is a separate, deliberate decision, not a side effect of a price change.
--
-- Forward-only and safely re-runnable: an UPDATE by stable code, matching the
-- convention of 20260807120000. Nothing is dropped and no schema changes.
-- ---------------------------------------------------------------------------

UPDATE public.subscription_plans
   SET monthly_price          = 5,
       yearly_price           = 48,
       currency               = 'USD',
       paypal_monthly_plan_id = 'P-0T11340213437223LNJ2QNAI',
       paypal_yearly_plan_id  = 'P-55929159U5400864DNJ2QRGI',
       updated_at             = now()
 WHERE code = 'pro';

-- A row that did not update means the catalogue is not what this migration
-- expected. Failing loudly beats a checkout that silently keeps the old price.
DO $$
DECLARE
  priced   public.subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO priced FROM public.subscription_plans WHERE code = 'pro';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription_plans has no row with code = pro';
  END IF;

  IF priced.monthly_price <> 5 OR priced.yearly_price <> 48 THEN
    RAISE EXCEPTION 'pro pricing did not apply: monthly=%, yearly=%',
      priced.monthly_price, priced.yearly_price;
  END IF;

  IF priced.paypal_monthly_plan_id IS NULL OR priced.paypal_yearly_plan_id IS NULL THEN
    RAISE EXCEPTION 'pro is missing a PayPal plan id after the update';
  END IF;
END $$;
