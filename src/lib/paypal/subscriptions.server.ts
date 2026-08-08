/**
 * Applying PayPal state to the application's own subscription records.
 *
 * One rule runs through this module: entitlements only ever change from what
 * PayPal itself reports. The browser's onApprove callback, a query parameter
 * and a webhook body are all treated as hints that something happened — the
 * subscription is then re-fetched from PayPal and that answer is what gets
 * written. This is also what makes out-of-order webhooks safe: whichever event
 * arrives, the state applied is the current one.
 */

import type { SubscriptionStatus } from "@/lib/billing/types";
import { serverDb } from "@/lib/db.server";
import {
  getSubscription as fetchPayPalSubscription,
  type PayPalSubscription,
} from "./client.server";

const admin = serverDb;

/** PayPal subscription status → application status. */
export function mapStatus(paypal: PayPalSubscription["status"]): SubscriptionStatus {
  switch (paypal) {
    case "ACTIVE":
      return "active";
    case "APPROVAL_PENDING":
    case "APPROVED":
      return "approval_pending";
    case "SUSPENDED":
      return "suspended";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
    default:
      return "no_plan";
  }
}

export type ApplyResult = {
  applied: boolean;
  status: SubscriptionStatus;
  reason?: "unknown_subscription" | "stale_event" | "no_user";
};

/**
 * Re-reads a subscription from PayPal and writes the resulting state.
 *
 * @param eventTime create_time of the triggering webhook, when there was one.
 */
export async function syncSubscriptionFromPayPal(
  providerSubscriptionId: string,
  eventTime?: string | null,
): Promise<ApplyResult> {
  const db = await admin();

  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id, user_id, plan_id, status, last_event_at, current_period_end, cancel_at_period_end")
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle();

  if (!existing) return { applied: false, status: "no_plan", reason: "unknown_subscription" };

  if (
    eventTime &&
    existing.last_event_at &&
    new Date(eventTime).getTime() < new Date(existing.last_event_at).getTime()
  ) {
    // A late delivery of an older event. It is stored for audit, not applied.
    return { applied: false, status: existing.status, reason: "stale_event" };
  }

  const remote = await fetchPayPalSubscription(providerSubscriptionId);
  const status = mapStatus(remote.status);

  const nextBilling = remote.billing_info?.next_billing_time ?? null;
  const lastPayment = remote.billing_info?.last_payment?.time ?? null;
  const failedPayments = remote.billing_info?.failed_payments_count ?? 0;

  const patch: Record<string, unknown> = {
    status: status === "active" && failedPayments > 0 && !nextBilling ? "past_due" : status,
    current_period_start: lastPayment ?? remote.start_time ?? null,
    current_period_end: nextBilling,
    last_event_at: eventTime ?? new Date().toISOString(),
  };

  if (status === "cancelled" || status === "expired") {
    patch["cancelled_at"] = new Date().toISOString();
    patch["cancel_at_period_end"] = false;
  }
  if (status === "active") {
    patch["cancelled_at"] = null;
    patch["grace_until"] = null;
    patch["last_payment_failed_at"] = null;
  }

  const { error } = await db.from("user_subscriptions").update(patch).eq("id", existing.id);
  if (error) throw new Error(error.message);

  return { applied: true, status: patch["status"] as SubscriptionStatus };
}

/**
 * Records that a user approved a subscription in the PayPal window.
 *
 * This only ever writes approval_pending. Activation happens in
 * syncSubscriptionFromPayPal, after PayPal confirms — never from the callback.
 */
export async function recordApproval(input: {
  userId: string;
  planId: string;
  providerSubscriptionId: string;
  interval: "month" | "year";
}): Promise<void> {
  const db = await admin();

  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id, status")
    .eq("user_id", input.userId)
    .maybeSingle();

  const row = {
    user_id: input.userId,
    plan_id: input.planId,
    provider: "paypal",
    provider_subscription_id: input.providerSubscriptionId,
    status: "approval_pending" as const,
    billing_interval: input.interval,
    // Approving a paid subscription ends any trial: the two are never active
    // at the same time.
    trial_ends_at: null,
    cancel_at_period_end: false,
    cancelled_at: null,
  };

  const { error } = existing
    ? await db.from("user_subscriptions").update(row).eq("id", existing.id)
    : await db.from("user_subscriptions").insert(row);

  if (error) throw new Error(error.message);
}

/** Applies a verified webhook. Returns what was done, for the event record. */
export async function applyWebhookEvent(event: {
  id: string;
  event_type: string;
  create_time?: string | undefined;
  resource?: Record<string, unknown> | undefined;
}): Promise<{ handled: boolean; note: string }> {
  const db = await admin();
  const resource = (event.resource ?? {}) as Record<string, unknown>;

  const subscriptionId =
    typeof resource["id"] === "string" && event.event_type.startsWith("BILLING.SUBSCRIPTION")
      ? (resource["id"] as string)
      : typeof resource["billing_agreement_id"] === "string"
        ? (resource["billing_agreement_id"] as string)
        : null;

  if (!subscriptionId) return { handled: false, note: "no_subscription_id" };

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.UPDATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "PAYMENT.SALE.COMPLETED": {
      const result = await syncSubscriptionFromPayPal(subscriptionId, event.create_time ?? null);
      return { handled: result.applied, note: result.reason ?? result.status };
    }

    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
    case "PAYMENT.SALE.DENIED":
    case "PAYMENT.SALE.REVERSED": {
      const graceDays = await graceDaysSetting();
      const { data: existing } = await db
        .from("user_subscriptions")
        .select("id")
        .eq("provider_subscription_id", subscriptionId)
        .maybeSingle();
      if (!existing) return { handled: false, note: "unknown_subscription" };

      const now = new Date();
      await db
        .from("user_subscriptions")
        .update({
          status: "past_due",
          last_payment_failed_at: now.toISOString(),
          grace_until: new Date(now.getTime() + graceDays * 86_400_000).toISOString(),
          last_event_at: event.create_time ?? now.toISOString(),
        })
        .eq("id", existing.id);

      await notify(existing.id, subscriptionId, "payment_failed");
      return { handled: true, note: "past_due" };
    }

    default:
      return { handled: false, note: "ignored_event_type" };
  }
}

async function graceDaysSetting(): Promise<number> {
  const db = await admin();
  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "billing.grace_period_days")
    .maybeSingle();
  const value = Number(data?.value ?? 3);
  return Number.isFinite(value) && value >= 0 ? value : 3;
}

/** Queues an in-app notification for the owner of a subscription. */
async function notify(subscriptionRowId: string, _providerId: string, kind: string): Promise<void> {
  const db = await admin();
  const { data } = await db
    .from("user_subscriptions")
    .select("user_id")
    .eq("id", subscriptionRowId)
    .maybeSingle();
  if (!data?.user_id) return;

  await db
    .from("user_notifications")
    .upsert({ user_id: data.user_id, kind, payload: {} }, { onConflict: "user_id,kind" });
}
