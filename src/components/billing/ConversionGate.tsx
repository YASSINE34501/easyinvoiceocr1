/**
 * The conversion gate as the visitor sees it.
 *
 * `useConversionGate` holds the server's verdict and re-reads it after every
 * success, failure and cancellation, so the counter on screen always reflects
 * committed usage rather than an optimistic guess.
 *
 * Nothing here decides anything. The same resolver runs again inside
 * startConversion before a reservation is taken, so hiding or tampering with
 * this component cannot buy a conversion.
 */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/site/AppLink";
import { useQuery } from "@tanstack/react-query";
import { getConversionGate, getPublicPlans } from "@/lib/billing/billing.functions";
import { authSlugs, path } from "@/config/nav";
import { useLocale, useT } from "@/i18n/useLocale";
import type { MessageKey } from "@/i18n";
import { useAuth } from "@/auth/AuthProvider";

export type GateSnapshot = Awaited<ReturnType<typeof getConversionGate>>;

export function useConversionGate() {
  const { user, loading } = useAuth();
  const [gate, setGate] = useState<GateSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setGate(null);
      setReady(true);
      return;
    }
    try {
      setGate(await getConversionGate());
    } catch (error) {
      // A gate that cannot be resolved must not read as "allowed".
      console.error("[gate] could not resolve", (error as Error).name);
      setGate(null);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void reload();
  }, [loading, reload]);

  return { gate, ready, reload, signedIn: Boolean(user) };
}

/** Remaining free conversions, shown before the upload control. */
export function TrialCounter({ gate }: { gate: GateSnapshot }) {
  const t = useT();
  if (gate.status !== "trialing") return null;

  const spent = gate.trialConversionsRemaining === 0;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Badge variant={spent ? "destructive" : "secondary"} className="tabular-nums">
        {gate.trialConversionsUsed}/{gate.trialConversionsAllowed}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {t("billing.trialRemaining", { remaining: gate.trialConversionsRemaining })}
      </span>
    </div>
  );
}

/**
 * Shown in place of the upload control once the allowance is gone. It has no
 * dismiss affordance: the only ways forward are subscribing or signing in to an
 * account that already pays.
 */
export function Paywall({ reason }: { reason: "trial_exhausted" | "subscription_inactive" }) {
  const t = useT();
  const locale = useLocale();

  // Same key, staleTime and shape as the pricing section and the checkout.
  const { data: plans = [] } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => getPublicPlans(),
    staleTime: 300_000,
  });
  const paidPlans = plans.filter((plan) => plan.monthlyPrice > 0);

  return (
    <Alert variant="destructive" className="border-destructive/40">
      <Lock className="size-4" aria-hidden="true" />
      <AlertTitle>
        {reason === "trial_exhausted" ? t("paywall.title") : t("paywall.inactive")}
      </AlertTitle>
      <AlertDescription>
        <p>{t("paywall.body")}</p>

        {/* Rendered only when the plans are actually known. A paywall that
            invents a price is worse than one that shows none: the visitor is
            being asked to pay it. */}
        {paidPlans.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {paidPlans.map((plan) => (
              <li key={plan.id}>
                <strong>{t(`plan.name_${plan.code}` as MessageKey, {}) || plan.name}</strong> — $
                {plan.monthlyPrice} {t("pricing.monthly").toLowerCase()}
                {plan.yearlyPrice !== null && (
                  <>
                    {" / $"}
                    {plan.yearlyPrice} {t("pricing.yearly").toLowerCase()}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={path(authSlugs.choosePlan, locale)}>{t("nav.pricing")}</AppLink>
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <AppLink href={path(authSlugs.login, locale)}>{t("paywall.signIn")}</AppLink>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/** Prompt for a signed-out visitor: the allowance belongs to an account. */
export function SignInToConvert() {
  const t = useT();
  const locale = useLocale();

  return (
    <Alert>
      <AlertTriangle className="size-4" aria-hidden="true" />
      <AlertTitle>{t("free.tryFree")}</AlertTitle>
      <AlertDescription>
        <p>
          {t("free.noCard")}. {t("free.afterFive")}.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={path(authSlugs.signup, locale)}>{t("cta.signup")}</AppLink>
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-lg">
            <AppLink href={path(authSlugs.login, locale)}>{t("cta.login")}</AppLink>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
