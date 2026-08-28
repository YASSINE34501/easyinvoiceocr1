/**
 * What a year costs against twelve months of the same plan.
 *
 * Derived, never stored. A pricing page that states a discount the billing
 * does not honour is the one failure worth designing out, so the figure is
 * arithmetic on the live plan row rather than a second copy of it: change the
 * row to 5 and 48 and this returns 20%, $12 and $4 with no edit here.
 *
 * Returns null when there is no yearly price, or when the yearly price saves
 * nothing. A badge over a saving of zero is a lie, however small.
 */
export type CycleSaving = {
  /** Money saved across a year, in the plan's currency. */
  amount: number;
  /** Whole-number percentage off twelve monthly payments. */
  percent: number;
  /** What the yearly price works out to per month. */
  perMonth: number;
};

export function cycleSaving(plan: {
  monthlyPrice: number;
  yearlyPrice: number | null;
}): CycleSaving | null {
  const { monthlyPrice, yearlyPrice } = plan;
  if (yearlyPrice === null || monthlyPrice <= 0) return null;

  const twelveMonths = monthlyPrice * 12;
  const amount = twelveMonths - yearlyPrice;
  if (amount <= 0) return null;

  const round2 = (value: number) => Math.round(value * 100) / 100;
  return {
    amount: round2(amount),
    percent: Math.round((amount / twelveMonths) * 100),
    perMonth: round2(yearlyPrice / 12),
  };
}
