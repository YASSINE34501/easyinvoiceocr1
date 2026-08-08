/**
 * Server functions for plans, the trial and PayPal subscriptions.
 *
 * This file is bundled for the client, so it holds no secrets and imports
 * every server-only module lazily inside a handler. Each mutating function
 * derives the acting user from the verified bearer token, never from its
 * arguments.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BillingState, PublicPlan } from "./types";

/* ------------------------------------------------------------------ */
/* Public reads                                                        */
/* ------------------------------------------------------------------ */

/** Plans for the pricing cards. Public: no authentication, no user data. */
export const getPublicPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPlan[]> => {
    const { listPlans, toPublicPlan } = await import("./entitlements.server");
    const rows = await listPlans();
    return rows.map(toPublicPlan);
  },
);

/**
 * What the browser needs to render a PayPal button: the public client id and
 * the environment. The secret is deliberately absent.
 */
export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { readPayPalConfig } = await import("@/lib/paypal/client.server");
  const config = readPayPalConfig();
  return {
    enabled: Boolean(config),
    clientId: config?.clientId ?? null,
    environment: config?.environment ?? "sandbox",
  };
});

/* ------------------------------------------------------------------ */
/* Authenticated reads                                                 */
/* ------------------------------------------------------------------ */

export const getBillingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingState> => {
    const { resolveBillingState } = await import("./entitlements.server");
    return resolveBillingState(context.userId);
  });

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { data } = await db
      .from("user_notifications")
      .select("id, kind, payload, read_at, created_at")
      .eq("user_id", context.userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as { id: string; kind: string; created_at: string }[];
  });

/* ------------------------------------------------------------------ */
/* Trial                                                               */
/* ------------------------------------------------------------------ */

/**
 * Claims the one-time five-conversion trial.
 *
 * Every rule lives in `claim_trial`: a confirmed email address, a per-user
 * advisory lock, the `trial_claims` primary key, and a refusal for anyone who
 * has ever held a paid subscription. The email check is repeated here so the
 * caller gets a precise reason rather than a generic database error, but the
 * database is what actually enforces it — a replayed request or a second tab
 * cannot produce a second trial even if this check were bypassed.
 */
export const claimTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { claimTrial: claim, resolveBillingState } = await import("./entitlements.server");

    const { data: userResult } = await db.auth.admin.getUserById(context.userId);
    if (!userResult?.user?.email_confirmed_at) {
      return { ok: false as const, error: "email_not_verified" as const };
    }

    const result = await claim(context.userId);
    if (!result.ok) return { ok: false as const, error: result.reason };

    return { ok: true as const, state: await resolveBillingState(context.userId) };
  });

/**
 * The conversion gate, resolved server-side on every call.
 *
 * The browser renders from this but never decides it: the same resolver runs
 * again inside startConversion before any quota is reserved, so a tampered
 * response cannot buy a conversion.
 */
export const getConversionGate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolveBillingState } = await import("./entitlements.server");
    const { resolveGate } = await import("./gate");
    const state = await resolveBillingState(context.userId);

    const onTrial = state.status === "trialing";
    return {
      gate: resolveGate({
        subscriptionStatus: state.status,
        freeConversionsUsed: state.trialConversionsUsed,
        paidQuotaRemaining: onTrial ? null : state.usage.pagesRemaining,
      }),
      status: state.status,
      planCode: state.planCode,
      trialEligible: state.trialEligible,
      trialClaimed: state.trialClaimed,
      trialConversionsAllowed: state.trialConversionsAllowed,
      trialConversionsUsed: state.trialConversionsUsed,
      trialConversionsRemaining: state.trialConversionsRemaining,
      pagesUsed: state.usage.pagesUsed,
      pagesRemaining: state.usage.pagesRemaining,
      pageLimit: state.entitlements.monthlyPageLimit,
      blockedReason: state.blockedReason,
      canProcess: state.canProcess,
    };
  });

/* ------------------------------------------------------------------ */
/* PayPal subscription flow                                            */
/* ------------------------------------------------------------------ */

const planSelection = z.object({
  planCode: z.enum(["pro", "business"]),
  interval: z.enum(["month", "year"]).default("month"),
});

/**
 * Step 2 of the flow: the server validates the requested plan and returns the
 * PayPal plan id the button should use. A client-supplied plan id is never
 * accepted.
 */
export const createSubscriptionIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planSelection.parse(data))
  .handler(async ({ data }) => {
    const { getPlanByCode } = await import("./entitlements.server");
    const { envPlanId, readPayPalConfig } = await import("@/lib/paypal/client.server");

    const config = readPayPalConfig();
    if (!config) return { ok: false as const, error: "paypal_not_configured" as const };

    const plan = await getPlanByCode(data.planCode);
    if (!plan || !plan.active) return { ok: false as const, error: "plan_unavailable" as const };

    const paypalPlanId =
      (data.interval === "year" ? plan.paypal_yearly_plan_id : plan.paypal_monthly_plan_id) ??
      envPlanId(plan.code, data.interval);

    if (!paypalPlanId) return { ok: false as const, error: "plan_not_mapped" as const };

    return {
      ok: true as const,
      paypalPlanId,
      clientId: config.clientId,
      environment: config.environment,
      planName: plan.name,
      currency: plan.currency,
      price: Number(data.interval === "year" ? plan.yearly_price : plan.monthly_price),
    };
  });

const approvalInput = planSelection.extend({
  subscriptionId: z.string().trim().min(3).max(64),
});

/**
 * Step 5–8: the browser reports that PayPal returned a subscription id. The id
 * is stored as approval_pending, then verified directly with PayPal. Nothing
 * is activated on the strength of the callback alone.
 */
export const confirmSubscriptionApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => approvalInput.parse(data))
  .handler(async ({ context, data }) => {
    const { getPlanByCode, resolveBillingState } = await import("./entitlements.server");
    const { recordApproval, syncSubscriptionFromPayPal } =
      await import("@/lib/paypal/subscriptions.server");
    const { getSubscription: fetchRemote, envPlanId } = await import("@/lib/paypal/client.server");

    const plan = await getPlanByCode(data.planCode);
    if (!plan) return { ok: false as const, error: "plan_unavailable" as const };

    // The subscription must exist at PayPal and must be on the plan the server
    // authorised — otherwise a crafted id could attach a cheaper subscription
    // to an expensive plan.
    let remote;
    try {
      remote = await fetchRemote(data.subscriptionId);
    } catch {
      return { ok: false as const, error: "subscription_not_found" as const };
    }

    const expected =
      (data.interval === "year" ? plan.paypal_yearly_plan_id : plan.paypal_monthly_plan_id) ??
      envPlanId(plan.code, data.interval);
    if (expected && remote.plan_id !== expected) {
      return { ok: false as const, error: "plan_mismatch" as const };
    }

    await recordApproval({
      userId: context.userId,
      planId: plan.id,
      providerSubscriptionId: data.subscriptionId,
      interval: data.interval,
    });

    await syncSubscriptionFromPayPal(data.subscriptionId);

    return { ok: true as const, state: await resolveBillingState(context.userId) };
  });

/** Polled by the confirmation screen while PayPal finishes activating. */
export const refreshSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getSubscription, resolveBillingState } = await import("./entitlements.server");
    const { syncSubscriptionFromPayPal } = await import("@/lib/paypal/subscriptions.server");

    const subscription = await getSubscription(context.userId);
    if (subscription?.provider === "paypal" && subscription.provider_subscription_id) {
      try {
        await syncSubscriptionFromPayPal(subscription.provider_subscription_id);
      } catch (error) {
        console.error("[billing] refresh failed", (error as Error).name);
      }
    }
    return resolveBillingState(context.userId);
  });

const cancelInput = z.object({ reason: z.string().trim().max(200).default("Cancelled by user") });

/**
 * Cancels at PayPal first and only reports success once PayPal has accepted;
 * the local record is then rebuilt from PayPal's own answer.
 */
export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => cancelInput.parse(data))
  .handler(async ({ context, data }) => {
    const { getSubscription, resolveBillingState } = await import("./entitlements.server");
    const { cancelSubscription } = await import("@/lib/paypal/client.server");
    const { syncSubscriptionFromPayPal } = await import("@/lib/paypal/subscriptions.server");
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();

    const subscription = await getSubscription(context.userId);
    if (!subscription?.provider_subscription_id || subscription.provider !== "paypal") {
      return { ok: false as const, error: "no_active_subscription" as const };
    }

    try {
      await cancelSubscription(subscription.provider_subscription_id, data.reason);
    } catch (error) {
      console.error("[billing] cancel rejected by provider", (error as Error).name);
      return { ok: false as const, error: "provider_rejected" as const };
    }

    // Access continues to the end of the period already paid for.
    await db
      .from("user_subscriptions")
      .update({ cancel_at_period_end: true, cancelled_at: new Date().toISOString() })
      .eq("id", subscription.id);

    await syncSubscriptionFromPayPal(subscription.provider_subscription_id);

    return { ok: true as const, state: await resolveBillingState(context.userId) };
  });

/**
 * Trial reminder sweep: 7, 3 and 1 day out, plus expiry.
 *
 * The notifications table has a unique (user_id, kind) index, so running this
 * twice in a day produces one notification, not two. Delivery by email happens
 * only where an email provider is configured; the in-app notification is
 * written either way.
 */
export const runTrialNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();

    const { data: isAdmin } = await db.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "forbidden" as const };

    await db.rpc("expire_due_trials");

    const { data: trials } = await db
      .from("user_subscriptions")
      .select("user_id, status, trial_ends_at")
      .in("status", ["trialing", "trial_expired"])
      .not("trial_ends_at", "is", null);

    const rows = (trials ?? []) as {
      user_id: string;
      status: string;
      trial_ends_at: string;
    }[];

    const now = Date.now();
    const pending: { user_id: string; kind: string; payload: Record<string, unknown> }[] = [];

    for (const row of rows) {
      const daysLeft = Math.ceil((new Date(row.trial_ends_at).getTime() - now) / 86_400_000);
      const kind =
        row.status === "trial_expired" || daysLeft <= 0
          ? "trial_expired"
          : daysLeft <= 1
            ? "trial_1_day"
            : daysLeft <= 3
              ? "trial_3_days"
              : daysLeft <= 7
                ? "trial_7_days"
                : null;
      if (kind) {
        pending.push({
          user_id: row.user_id,
          kind,
          payload: { trialEndsAt: row.trial_ends_at, daysLeft: Math.max(0, daysLeft) },
        });
      }
    }

    if (pending.length > 0) {
      await db.from("user_notifications").upsert(pending, { onConflict: "user_id,kind" });
    }

    return { ok: true as const, created: pending.length };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    await db
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true as const };
  });
