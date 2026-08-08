/**
 * The account's plan situation, shown wherever a signed-in user works.
 *
 * It reflects the server-resolved state and nothing else. When processing is
 * blocked it says why and links to the plan chooser rather than letting the
 * user discover the block by having a conversion refused.
 */

import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/site/AppLink";
import { useBilling } from "@/billing/BillingProvider";
import { authSlugs, path } from "@/config/nav";
import { formatDate } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

export function PlanStatusBanner() {
  const { state, loading } = useBilling();
  const locale = useLocale();
  const t = useT();

  if (loading || !state) return null;

  const choosePlan = path(authSlugs.choosePlan, locale);
  const billing = path(authSlugs.billing, locale);

  if (state.status === "no_plan") {
    return (
      <Alert>
        <CalendarClock className="size-4" aria-hidden="true" />
        <AlertTitle>{t("choose.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("choose.lede")}</p>
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={choosePlan}>{t("choose.trialCta")}</AppLink>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "trial_expired") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>{t("trial.expiredTitle")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("trial.expiredBody")}</p>
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={choosePlan}>{t("billing.upgrade")}</AppLink>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "past_due" || state.status === "suspended") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>{t("billing.paymentFailed")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("billing.paymentFailedBody")}</p>
          {state.graceUntil && (
            <p>{t("billing.graceUntil", { date: formatDate(state.graceUntil, locale) })}</p>
          )}
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={billing}>{t("billing.title")}</AppLink>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "trialing") {
    // The reminder tightens as the trial runs out, which is the point at which
    // a user needs to decide rather than be surprised.
    const days = state.trialDaysRemaining ?? 0;
    return (
      <Alert className={days <= 3 ? "border-destructive/40" : "border-primary/30 bg-pale-green"}>
        <CalendarClock className="size-4" aria-hidden="true" />
        <AlertTitle>{t("trial.daysLeft", { days })}</AlertTitle>
        <AlertDescription className="space-y-2">
          {state.trialEndsAt && (
            <p>{t("trial.endsOn", { date: formatDate(state.trialEndsAt, locale) })}</p>
          )}
          <p>
            {t("billing.pagesUsed", {
              used: state.usage.pagesUsed,
              limit: state.entitlements.monthlyPageLimit,
            })}
          </p>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <AppLink href={choosePlan}>{t("billing.upgrade")}</AppLink>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.blockedReason === "quota_exceeded") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>{t("conv.gate.quotaTitle")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("conv.gate.quotaBody")}</p>
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={choosePlan}>{t("billing.upgrade")}</AppLink>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-primary/30 bg-pale-green">
      <CheckCircle2 className="size-4" aria-hidden="true" />
      <AlertTitle>{state.planName ?? t("status.active")}</AlertTitle>
      <AlertDescription>
        {t("billing.pagesUsed", {
          used: state.usage.pagesUsed,
          limit: state.entitlements.monthlyPageLimit,
        })}
        {state.nextBillingDate
          ? ` · ${t("billing.nextBilling")}: ${formatDate(state.nextBillingDate, locale)}`
          : ""}
      </AlertDescription>
    </Alert>
  );
}
