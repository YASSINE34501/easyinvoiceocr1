import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The half of the payment funnel that does not need PayPal.
 *
 * checkout -> payment -> webhook cannot run without sandbox credentials, and the
 * ones configured here are live-only — sandbox OAuth answers 401 invalid_client.
 * What can be run for real is everything after PayPal hands the event over:
 * webhook -> database -> entitlement.
 *
 * The payment-failure branch of applyWebhookEvent is the one to use for that,
 * because it decides entirely from the database. The activation branch re-reads
 * the subscription from PayPal, which is exactly the part that is blocked.
 *
 * This talks to the real project, so it is named .itest.ts and excluded from
 * the normal suite. Run it deliberately:
 *   npx vitest run --config vitest.integration.config.ts
 */

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [
        line.slice(0, at).trim(),
        line
          .slice(at + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);
Object.assign(process.env, env);

const URL_ = env["SUPABASE_URL"]!;
const KEY = env["SUPABASE_SERVICE_ROLE_KEY"]!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const PROVIDER_SUB_ID = `I-ITEST-${Date.now()}`;
let userId = "";
let planId = "";

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${URL_}${path}`, { ...init, headers: { ...H, ...init?.headers } });
  const text = await response.text();
  return { status: response.status, ok: response.ok, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  const created = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: `itest-${Date.now()}@easyinvoiceocr-qa.test`,
      password: `It!${Math.random().toString(36).slice(2, 10)}A1`,
      email_confirm: true,
    }),
  });
  userId = created.body.id;

  const plans = await api("/rest/v1/subscription_plans?select=id,code&code=eq.pro");
  planId = plans.body[0].id;

  // The row PayPal's activation webhook would have written.
  await api("/rest/v1/user_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      plan_id: planId,
      provider: "paypal",
      provider_subscription_id: PROVIDER_SUB_ID,
      status: "active",
      billing_interval: "month",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    }),
  });
}, 60_000);

afterAll(async () => {
  if (!userId) return;
  await api(`/rest/v1/analytics_events?user_id=eq.${userId}`, { method: "DELETE" });
  await api(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
}, 60_000);

describe("database -> entitlement", () => {
  it("grants the paid plan's entitlements from an active subscription row", async () => {
    const { resolveBillingState } = await import("./entitlements.server");
    const state = await resolveBillingState(userId);

    expect(state.status).toBe("active");
    expect(state.planCode).toBe("pro");
    expect(state.canProcess).toBe(true);
    // Read from the plans table, not from any constant in the source.
    expect(state.entitlements.monthlyPageLimit).toBeGreaterThan(0);
  }, 30_000);

  it("opens the conversion gate for a paying account", async () => {
    const { resolveBillingState } = await import("./entitlements.server");
    const { resolveGate } = await import("./gate");
    const state = await resolveBillingState(userId);

    expect(
      resolveGate({
        subscriptionStatus: state.status,
        freeConversionsUsed: state.trialConversionsUsed,
        paidQuotaRemaining: state.usage.pagesRemaining,
      }),
    ).toBe("paid_subscription_active");
  }, 30_000);
});

describe("webhook -> database -> entitlement", () => {
  it("moves a failed payment to past_due and records when it happened", async () => {
    const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");

    const result = await applyWebhookEvent({
      id: `WH-ITEST-${Date.now()}`,
      event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      create_time: new Date().toISOString(),
      resource: { id: PROVIDER_SUB_ID },
    });

    expect(result.handled).toBe(true);
    expect(result.note).toBe("past_due");

    const row = await api(
      `/rest/v1/user_subscriptions?select=status,grace_until,last_payment_failed_at&provider_subscription_id=eq.${PROVIDER_SUB_ID}`,
    );
    expect(row.body[0].status).toBe("past_due");
    expect(row.body[0].last_payment_failed_at).toBeTruthy();
    // A grace period is what keeps a retryable failure from locking someone out
    // of work they have already paid for.
    expect(row.body[0].grace_until).toBeTruthy();
  }, 30_000);

  it("tells the account holder, once", async () => {
    const notifications = await api(
      `/rest/v1/user_notifications?select=kind&user_id=eq.${userId}&kind=eq.payment_failed`,
    );
    expect(notifications.body.length).toBe(1);
  }, 30_000);

  it("refuses an event naming a subscription nobody owns", async () => {
    const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");
    const result = await applyWebhookEvent({
      id: `WH-ITEST-UNKNOWN-${Date.now()}`,
      event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      resource: { id: "I-DOES-NOT-EXIST" },
    });
    expect(result.handled).toBe(false);
    expect(result.note).toBe("unknown_subscription");
  }, 30_000);

  it("ignores an event carrying no subscription id at all", async () => {
    const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");
    const result = await applyWebhookEvent({
      id: `WH-ITEST-NOID-${Date.now()}`,
      event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
      resource: {},
    });
    expect(result.handled).toBe(false);
    expect(result.note).toBe("no_subscription_id");
  }, 30_000);
});

describe("a refund is money returned, not a delinquency", () => {
  /**
   * PAYMENT.SALE.REFUNDED used to fall through to ignored_event_type, so a
   * merchant refund changed nothing and never reached revenue analytics. It
   * must not join the payment-failure cases either: refunding someone is not a
   * reason to mark them past_due and tell them their payment failed.
   */
  const REFUND_SUB = `I-ITEST-REFUND-${Date.now()}`;

  it("records the refund and leaves the subscription running", async () => {
    const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");

    // Put the fixture back to active under a new provider id, so this assertion
    // is about the refund event and not about the past_due the earlier test
    // left behind. Filtered on the fixture id: an unfiltered PATCH here would
    // rewrite every subscription in the project, including real ones.
    await api(`/rest/v1/user_subscriptions?provider_subscription_id=eq.${PROVIDER_SUB_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active", provider_subscription_id: REFUND_SUB }),
    });

    const result = await applyWebhookEvent({
      id: `WH-ITEST-REFUND-${Date.now()}`,
      event_type: "PAYMENT.SALE.REFUNDED",
      create_time: new Date().toISOString(),
      resource: { billing_agreement_id: REFUND_SUB, amount: { total: "14.00", currency: "USD" } },
    });

    expect(result.handled).toBe(true);
    expect(result.note).toBe("refund_recorded");

    const row = await api(
      `/rest/v1/user_subscriptions?select=status&provider_subscription_id=eq.${REFUND_SUB}`,
    );
    // Still active: a refund does not suspend anyone.
    expect(row.body[0].status).toBe("active");
  }, 30_000);

  it("does not tell the customer their payment failed", async () => {
    const notifications = await api(
      `/rest/v1/user_notifications?select=kind&user_id=eq.${userId}&kind=eq.payment_failed`,
    );
    // Exactly the one from the earlier payment-failure test, and no more.
    expect(notifications.body.length).toBe(1);
  }, 30_000);

  it("refuses a refund naming a subscription nobody owns", async () => {
    const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");
    const result = await applyWebhookEvent({
      id: `WH-ITEST-REFUND-UNKNOWN-${Date.now()}`,
      event_type: "PAYMENT.SALE.REFUNDED",
      resource: { billing_agreement_id: "I-NOBODY-OWNS-THIS" },
    });
    expect(result.handled).toBe(false);
    expect(result.note).toBe("unknown_subscription");
  }, 30_000);
});
