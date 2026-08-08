import { describe, expect, it } from "vitest";
import { maskSubscriptionId, EMPTY_ENTITLEMENTS, SUBSCRIPTION_STATUSES } from "./types";
import { billingPeriod } from "./entitlements.server";
import { mapStatus } from "@/lib/paypal/subscriptions.server";

const base = {
  id: "row-1",
  user_id: "user-1",
  plan_id: "plan-1",
  provider: "paypal",
  provider_subscription_id: "I-BW452GLLEP1G",
  billing_interval: "month" as const,
  trial_started_at: null,
  trial_ends_at: null,
  current_period_start: null,
  current_period_end: null,
  cancel_at_period_end: false,
  cancelled_at: null,
  grace_until: null,
  last_payment_failed_at: null,
};

describe("maskSubscriptionId", () => {
  it("shows enough to match a PayPal receipt and no more", () => {
    expect(maskSubscriptionId("I-BW452GLLEP1G")).toBe("I-BW4…EP1G");
  });

  it("returns null when there is no subscription", () => {
    expect(maskSubscriptionId(null)).toBeNull();
    expect(maskSubscriptionId(undefined)).toBeNull();
  });

  it("leaves a very short value alone rather than producing nonsense", () => {
    expect(maskSubscriptionId("I-BW4")).toBe("I-BW4");
  });
});

describe("billingPeriod", () => {
  it("covers the whole trial in one period, so trial pages never reset", () => {
    const period = billingPeriod({
      ...base,
      status: "trialing",
      trial_started_at: "2026-08-01T00:00:00Z",
      trial_ends_at: "2026-08-31T00:00:00Z",
    });

    expect(period).toEqual({
      start: "2026-08-01T00:00:00Z",
      end: "2026-08-31T00:00:00Z",
      resets: false,
    });
  });

  it("follows the provider's period for a paid subscription, which does reset", () => {
    const period = billingPeriod({
      ...base,
      status: "active",
      current_period_start: "2026-08-01T00:00:00Z",
      current_period_end: "2026-09-01T00:00:00Z",
    });

    expect(period?.resets).toBe(true);
    expect(period?.end).toBe("2026-09-01T00:00:00Z");
  });

  it("has no period at all without a plan", () => {
    expect(billingPeriod(null)).toBeNull();
    expect(billingPeriod({ ...base, status: "no_plan" })).toBeNull();
  });

  it("has no period once a trial has expired, so nothing can be processed", () => {
    expect(
      billingPeriod({
        ...base,
        status: "trial_expired",
        trial_started_at: "2026-06-01T00:00:00Z",
        trial_ends_at: "2026-07-01T00:00:00Z",
      }),
    ).toBeNull();
  });
});

describe("mapStatus", () => {
  it("maps PayPal statuses onto the application's own", () => {
    expect(mapStatus("ACTIVE")).toBe("active");
    expect(mapStatus("APPROVAL_PENDING")).toBe("approval_pending");
    expect(mapStatus("APPROVED")).toBe("approval_pending");
    expect(mapStatus("SUSPENDED")).toBe("suspended");
    expect(mapStatus("CANCELLED")).toBe("cancelled");
    expect(mapStatus("EXPIRED")).toBe("expired");
  });

  it("only ever produces a status the application recognises", () => {
    for (const paypalStatus of [
      "ACTIVE",
      "APPROVAL_PENDING",
      "APPROVED",
      "SUSPENDED",
      "CANCELLED",
      "EXPIRED",
    ] as const) {
      expect(SUBSCRIPTION_STATUSES).toContain(mapStatus(paypalStatus));
    }
  });
});

describe("EMPTY_ENTITLEMENTS", () => {
  it("grants nothing and allows no tool", () => {
    expect(EMPTY_ENTITLEMENTS.monthlyPageLimit).toBe(0);
    expect(EMPTY_ENTITLEMENTS.allowedTools).toEqual([]);
    expect(EMPTY_ENTITLEMENTS.apiEnabled).toBe(false);
    expect(EMPTY_ENTITLEMENTS.batchEnabled).toBe(false);
  });
});
