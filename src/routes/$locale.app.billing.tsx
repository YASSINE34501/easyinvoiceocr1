/**
 * /:locale/app/billing — everything about the account's subscription.
 *
 * Every value on this page comes from the server's resolved billing state.
 * Nothing here derives a status from a query parameter or a local flag, and
 * cancelling reports success only after PayPal has accepted it.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppLink } from "@/components/site/AppLink";
import { useBilling } from "@/billing/BillingProvider";
import { cancelMySubscription, refreshSubscription } from "@/lib/billing/billing.functions";
import { listMyConversions } from "@/lib/convert/conversions.functions";
import { authSlugs, path } from "@/config/nav";
import { formatDate, type MessageKey } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

export const Route = createFileRoute("/$locale/app/billing")({
  component: BillingPage,
  head: () => ({
    meta: [
      { title: "Billing — EasyInvoiceOCR" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Your EasyInvoiceOCR plan, usage and subscription." },
    ],
  }),
});

function BillingPage() {
  const t = useT();
  const locale = useLocale();
  const { state, loading, refresh } = useBilling();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: jobs = [] } = useQuery({
    queryKey: ["my-conversions"],
    queryFn: () => listMyConversions(),
    staleTime: 60_000,
  });

  if (loading || !state) {
    return (
      <PageLayout breadcrumbs={[{ label: t("billing.title") }]}>
        <PageHero title={t("billing.title")} lede={t("state.loading")} />
      </PageLayout>
    );
  }

  const statusKey = `status.${state.status}` as MessageKey;
  const limit = state.entitlements.monthlyPageLimit;
  const usedPercent =
    limit > 0 ? Math.min(100, Math.round((state.usage.pagesUsed / limit) * 100)) : 0;

  const onTrial = state.status === "trialing";
  const trialPercent =
    state.trialConversionsAllowed > 0
      ? Math.min(
          100,
          Math.round((state.trialConversionsUsed / state.trialConversionsAllowed) * 100),
        )
      : 0;

  async function doCancel() {
    setBusy(true);
    try {
      const result = await cancelMySubscription({
        data: { reason: "Cancelled from billing page" },
      });
      if (result.ok) {
        toast.success(t("billing.cancelled"));
        await refresh();
      } else {
        toast.error(t("auth.genericError"));
      }
    } catch (error) {
      console.error("[billing] cancel failed", (error as Error).name);
      toast.error(t("auth.genericError"));
    } finally {
      setBusy(false);
      setCancelOpen(false);
    }
  }

  async function doRefresh() {
    setBusy(true);
    try {
      await refreshSubscription();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageLayout
      breadcrumbs={[
        { label: t("cta.dashboard"), href: path(authSlugs.app, locale) },
        { label: t("billing.title") },
      ]}
    >
      <PageHero eyebrow={t("cta.account")} title={t("billing.title")} lede={t("billing.lede")} />

      {state.status === "past_due" && (
        <Section>
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>{t("billing.paymentFailed")}</AlertTitle>
            <AlertDescription>
              <p>{t("billing.paymentFailedBody")}</p>
              {state.graceUntil && (
                <p className="mt-1">
                  {t("billing.graceUntil", { date: formatDate(state.graceUntil, locale) })}
                </p>
              )}
            </AlertDescription>
          </Alert>
        </Section>
      )}

      {state.status === "trial_expired" && (
        <Section>
          <Alert>
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>{t("trial.expiredTitle")}</AlertTitle>
            <AlertDescription>{t("trial.expiredBody")}</AlertDescription>
          </Alert>
        </Section>
      )}

      {state.blockedReason === "trial_exhausted" && (
        <Section>
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertTitle>{t("paywall.title")}</AlertTitle>
            <AlertDescription>
              {t("paywall.body")}
              <div className="mt-3">
                <Button asChild size="sm" className="min-h-10 rounded-lg font-semibold">
                  <AppLink href={path(authSlugs.choosePlan, locale)}>
                    {t("billing.upgrade")}
                  </AppLink>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </Section>
      )}

      <Section title={t("billing.currentPlan")}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <dl className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
            <Field label={t("billing.currentPlan")}>{state.planName ?? t("billing.noPlan")}</Field>
            <Field label={t("billing.status")}>
              <Badge variant={state.canProcess ? "secondary" : "destructive"}>{t(statusKey)}</Badge>
              {state.cancelAtPeriodEnd && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("billing.cancelPending")}
                </span>
              )}
            </Field>
            {state.trialEndsAt && (
              <Field label={t("billing.trialEnds")}>{formatDate(state.trialEndsAt, locale)}</Field>
            )}
            {state.nextBillingDate && (
              <Field label={t("billing.nextBilling")}>
                {formatDate(state.nextBillingDate, locale)}
              </Field>
            )}
            <Field label={t("billing.provider")}>{state.provider}</Field>
            {state.providerSubscriptionIdMasked && (
              <Field label={t("billing.subscriptionId")}>
                <code className="text-xs">{state.providerSubscriptionIdMasked}</code>
              </Field>
            )}
          </dl>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-navy">{t("billing.usage")}</p>

            {onTrial ? (
              // The trial is counted in conversions. Its page quota is zero by
              // design, so showing "0 of 0 pages" here would be meaningless.
              <>
                <p className="mt-2 text-2xl font-bold tabular-nums text-navy">
                  {state.trialConversionsUsed}/{state.trialConversionsAllowed}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("billing.trialUsage", {
                    used: state.trialConversionsUsed,
                    allowed: state.trialConversionsAllowed,
                  })}
                </p>
                <Progress value={trialPercent} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("billing.trialRemaining", { remaining: state.trialConversionsRemaining })}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">{t("free.total")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("free.sharedNote")}</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("billing.pagesUsed", { used: state.usage.pagesUsed, limit })}
                </p>
                <Progress value={usedPercent} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("billing.pagesRemaining", { remaining: state.usage.pagesRemaining })}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {state.usage.resets ? t("billing.periodResets") : t("billing.periodTrial")}
                </p>
                {state.usage.periodStart && state.usage.periodEnd && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(state.usage.periodStart, locale)} –{" "}
                    {formatDate(state.usage.periodEnd, locale)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="min-h-11 rounded-lg font-semibold">
            <AppLink href={path(authSlugs.choosePlan, locale)}>
              {state.status === "active" ? t("billing.changePlan") : t("billing.upgrade")}
            </AppLink>
          </Button>

          {state.provider === "paypal" && (
            <Button
              variant="outline"
              className="min-h-11 rounded-lg"
              disabled={busy}
              onClick={() => void doRefresh()}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t("cta.retry")}
            </Button>
          )}

          {(state.status === "active" || state.status === "past_due") &&
            state.provider === "paypal" &&
            !state.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                className="min-h-11 rounded-lg text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                {t("billing.cancel")}
              </Button>
            )}

          {state.cancelAtPeriodEnd && (
            <Button asChild variant="outline" className="min-h-11 rounded-lg">
              <AppLink href={path(authSlugs.choosePlan, locale)}>{t("billing.reactivate")}</AppLink>
            </Button>
          )}
        </div>
      </Section>

      <Section title={t("billing.history")} muted>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("billing.noHistory")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface text-navy">
                <tr>
                  {["Tool", "File", "Pages", "Status", "Date"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-3 py-2 text-start text-xs font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((jobRow) => (
                  <tr key={jobRow.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{jobRow.tool_type}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-navy">
                      {jobRow.original_filename}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{jobRow.page_count}</td>
                    <td className="px-3 py-2 text-muted-foreground">{jobRow.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(jobRow.created_at, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("billing.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("billing.cancelBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cta.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void doCancel()}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t("billing.cancelConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy">{children}</dd>
    </div>
  );
}
