/**
 * /:locale/choose-plan — the trial-or-subscribe decision.
 *
 * The two options are mutually exclusive by construction: starting the trial
 * calls the trial endpoint and nothing else, and subscribing records a PayPal
 * approval which clears any trial end date. Neither path can produce both.
 *
 * Trial eligibility shown here is only the server's answer rendered back; the
 * decision itself is made in start_trial, keyed on a table that keeps one row
 * per account forever.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/site/AppLink";
import { PayPalSubscribeButton } from "@/components/billing/PayPalSubscribeButton";
import { cycleSaving } from "@/components/billing/cycleSaving";
import { useConsent } from "@/components/site/CookieConsent";
import { trackEvent } from "@/lib/analytics/analytics.functions";
import { SESSION_STORAGE_KEY, checkoutStartedKey } from "@/lib/analytics/collection";
import { useAuth } from "@/auth/AuthProvider";
import { useBilling } from "@/billing/BillingProvider";
import { claimTrial, getPublicPlans } from "@/lib/billing/billing.functions";
import type { PublicPlan } from "@/lib/billing/types";
import { authSlugs, path } from "@/config/nav";
import { formatDate, type MessageKey } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { robotsMeta } from "@/config/seo";

/**
 * A plan's entitlements as sentences, straight from the row.
 *
 * The same fields the entitlement code enforces — page limit, file size,
 * batching, advertising, exports — so the panel cannot promise something the
 * server will refuse. Anything sold but not built is listed as coming soon
 * rather than folded in with the rest.
 */
function planEntitlements(
  plan: PublicPlan,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
): string[] {
  const megabytes = Math.round(plan.maxFileSize / (1024 * 1024));
  const comingSoon = plan.comingSoon ?? [];
  return [
    t("plan.pagesPerPeriod", { pages: plan.monthlyPageLimit }),
    t("plan.maxFile", { mb: megabytes }),
    plan.batchEnabled
      ? t("plan.batchFiles", { files: plan.batchMaxFiles })
      : t("plan.oneFileAtATime"),
    plan.adsEnabled ? t("plan.adsShown") : t("plan.noAds"),
    t("plan.exports", {
      formats: (plan.features.exports ?? []).join(", ").toUpperCase() || "—",
    }),
    ...(comingSoon.length > 0 ? [t("plan.comingSoon", { features: comingSoon.join(", ") })] : []),
  ];
}

export const Route = createFileRoute("/$locale/choose-plan")({
  // Session state lives in the browser, so this page is decided after hydration.
  ssr: false,
  component: ChoosePlanPage,
  head: () => ({
    meta: [
      { title: "Choose your plan — EasyInvoiceOCR" },
      robotsMeta("choose-plan"),
      { name: "description", content: "Start a free trial or subscribe to EasyInvoiceOCR." },
    ],
  }),
});

function ChoosePlanPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { state, refresh } = useBilling();
  const [interval, setInterval] = useState<"month" | "year">("month");
  // Pro is selected on arrival so PayPal's buttons are on screen straight away.
  // With nothing selected the card showed only the words "Continue to PayPal",
  // which reads as a button, does nothing when clicked, and gives no hint that
  // a plan has to be picked first — so the page looked like a broken checkout.
  const [selected, setSelected] = useState<"pro" | "business" | null>("pro");
  const consent = useConsent();

  /**
   * Records checkout intent, if the visitor consented to analytics.
   *
   * Deliberately not awaited and deliberately silent on failure: a tracking
   * problem must never change what the page does next, and above all must never
   * be mistaken for a payment outcome. Nothing here contacts PayPal.
   */
  function trackCheckoutIntent(planCode: "pro" | "business", billingInterval: "month" | "year") {
    if (!consent?.analytics) return;
    let sessionId: string | null = null;
    try {
      sessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return;
    }
    if (!sessionId) return;

    void trackEvent({
      data: {
        type: "checkout_started",
        sessionId,
        consent: true,
        locale,
        // Only the two allowlisted scalars. The price lives in the database and
        // is never taken from, or echoed back through, the browser.
        metadata: { plan_code: planCode, interval: billingInterval },
        idempotencyKey: checkoutStartedKey(sessionId, planCode, billingInterval),
      },
    }).catch(() => {
      /* intentionally silent */
    });
  }
  const [startingTrial, setStartingTrial] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => getPublicPlans(),
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/$locale/login", params: { locale }, replace: true });
    }
  }, [authLoading, user, navigate, locale]);

  if (authLoading || !user) {
    return (
      <PageLayout>
        <PageHero title={t("state.loading")} />
      </PageLayout>
    );
  }

  const paidPlans = plans.filter((plan) => plan.code === "pro" || plan.code === "business");
  const trialPlan = plans.find((plan) => plan.code === "trial");
  const trialEligible = state?.trialEligible ?? false;
  // The panel describes whatever is selected, or the first paid plan before a
  // choice is made, so it is never empty.
  const panelPlan = paidPlans.find((plan) => plan.code === selected) ?? paidPlans[0];

  async function beginTrial() {
    setStartingTrial(true);
    try {
      const result = await claimTrial();
      if (!result.ok) {
        toast.error(
          result.error === "email_not_verified"
            ? t("auth.emailNotConfirmed")
            : t("choose.trialUsed"),
        );
        return;
      }
      await refresh();
      toast.success(t("trial.started"));
      navigate({ to: "/$locale/app/billing", params: { locale } });
    } catch (error) {
      console.error("[choose-plan] trial could not be started", (error as Error).name);
      toast.error(t("auth.genericError"));
    } finally {
      setStartingTrial(false);
    }
  }

  return (
    <PageLayout breadcrumbs={[{ label: t("choose.title") }]}>
      <PageHero title={t("choose.title")} lede={t("choose.lede")} />

      <Section>
        <p className="mb-6 text-sm font-medium text-navy">{t("choose.exclusive")}</p>

        {/* One panel, two columns: the choice on the left, what the plan
            actually allows on the right. The old layout put each option in its
            own card inside the section, which was a box inside a box before
            the plan buttons added a third. */}
        <div className="grid overflow-hidden rounded-3xl border border-border shadow-lift lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-card p-6 sm:p-8">
            <span className="grid size-10 place-items-center rounded-lg bg-pale-green">
              <CalendarClock className="size-5 text-primary" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-navy">{t("choose.trialTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("choose.trialBody")}
            </p>

            {trialPlan && (
              <ul className="mt-5 space-y-2.5">
                {[
                  t("plan.pagesPerMonth", { pages: trialPlan.monthlyPageLimit }),
                  t("conv.privacyLocal"),
                ].map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-navy">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-6">
              {state?.status === "trialing" ? (
                <p className="text-sm font-medium text-primary">
                  {state.trialEndsAt
                    ? t("trial.endsOn", { date: formatDate(state.trialEndsAt, locale) })
                    : t("status.trialing")}
                </p>
              ) : trialEligible ? (
                <Button
                  className="min-h-11 w-full rounded-lg font-semibold"
                  disabled={startingTrial}
                  onClick={() => void beginTrial()}
                >
                  {startingTrial && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t("choose.trialCta")}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{t("choose.trialUsed")}</p>
              )}
            </div>

            <div className="my-7 border-t border-border" />

            <span className="grid size-10 place-items-center rounded-lg bg-pale-blue">
              <CreditCard className="size-5 text-navy" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-navy">{t("choose.subscribeTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("choose.subscribeBody")}
            </p>

            {/* Priced against the chosen plan, or the first paid one before a
                choice is made, so the cards always show a real figure. */}
            {(() => {
              const priced = paidPlans.find((p) => p.code === selected) ?? paidPlans[0];
              if (!priced) return null;
              const saving = cycleSaving(priced);
              return (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(["month", "year"] as const).map((value) => {
                    const active = interval === value;
                    const price = value === "year" ? priced.yearlyPrice : priced.monthlyPrice;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setInterval(value)}
                        className={cn(
                          "relative rounded-2xl border-2 p-4 text-start transition-colors",
                          active
                            ? "border-primary bg-pale-green/40"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        {value === "year" && saving && (
                          <span className="brand-surface absolute -top-2.5 end-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {t("plan.percentOff", { percent: saving.percent })}
                          </span>
                        )}
                        <span className="block text-xs font-semibold text-muted-foreground">
                          {value === "month" ? t("plan.monthly") : t("plan.yearly")}
                        </span>
                        <span className="mt-1 block text-2xl font-extrabold tracking-[-0.02em] text-navy">
                          {price === null ? "—" : `$${price}`}
                        </span>
                        {value === "year" && saving ? (
                          <>
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {t("plan.perMonthBilledYearly", { amount: saving.perMonth })}
                            </span>
                            <span className="mt-1 block text-[11px] font-semibold text-primary">
                              {t("plan.savePerYear", { amount: saving.amount })}
                            </span>
                          </>
                        ) : (
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {value === "month" ? t("plan.perMonth") : t("plan.perYear")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {paidPlans.map((plan) => {
                const price = interval === "year" ? plan.yearlyPrice : plan.monthlyPrice;
                const isSelected = selected === plan.code;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      const code = plan.code as "pro" | "business";
                      setSelected(code);
                      // Intent, recorded on a deliberate click on a real paid
                      // plan. It is not revenue and grants nothing: the key
                      // carries only the plan code and interval, never a price
                      // or a payment status, and a repeated click on the same
                      // choice collapses to one row.
                      trackCheckoutIntent(code, interval);
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "rounded-xl border p-4 text-start transition-colors",
                      isSelected ? "border-primary bg-pale-green/50" : "border-border",
                    )}
                  >
                    <p className="text-sm font-bold text-navy">{plan.name}</p>
                    <p className="mt-1 text-2xl font-extrabold text-navy">
                      {price === null ? "—" : `$${price}`}
                      <span className="ml-1 text-xs font-medium text-muted-foreground">
                        {interval === "year" ? t("plan.perYear") : t("plan.perMonth")}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("plan.pagesPerMonth", { pages: plan.monthlyPageLimit })}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {t("pricing.note")}
            </p>

            <div className="mt-5">
              {selected ? (
                <PayPalSubscribeButton
                  planCode={selected}
                  interval={interval}
                  onActivated={() => navigate({ to: "/$locale/app/billing", params: { locale } })}
                />
              ) : (
                <p className="text-xs text-muted-foreground">{t("choose.selectPlanFirst")}</p>
              )}
            </div>
          </div>

          {/* The value panel. Navy carries it rather than a gradient: the
              palette already has the contrast, and the entitlements below are
              read from the plan row, never written here. */}
          <aside className="bg-navy p-6 text-background sm:p-8">
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em]">
              {t("choose.included")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-background/70">
              {t("choose.panelLede")}
            </p>

            {panelPlan && (
              <>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-background/60">
                  {t(`plan.name_${panelPlan.code}` as MessageKey, {}) || panelPlan.name}
                </p>
                <ul className="mt-3 space-y-3">
                  {planEntitlements(panelPlan, t).map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 text-background/90">{line}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-8 border-t border-background/15 pt-6 text-[13px] leading-relaxed text-background/70">
              {t("pricing.note")}
            </p>
          </aside>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          <AppLink
            href={path(authSlugs.billing, locale)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("billing.title")}
          </AppLink>
        </p>
      </Section>
    </PageLayout>
  );
}
