import { describe, expect, it } from "vitest";
import {
  FREE_CONVERSION_ALLOWANCE,
  canConvert,
  freeConversionsRemaining,
  resolveGate,
  type GateInput,
} from "./gate";

function gate(overrides: Partial<GateInput> = {}) {
  return resolveGate({
    subscriptionStatus: null,
    freeConversionsUsed: 0,
    paidQuotaRemaining: null,
    ...overrides,
  });
}

describe("free allowance", () => {
  it("is exactly five", () => {
    expect(FREE_CONVERSION_ALLOWANCE).toBe(5);
  });

  it("allows attempts 1 through 5", () => {
    for (let used = 0; used < 5; used += 1) {
      expect(gate({ freeConversionsUsed: used })).toBe("free_attempt_available");
    }
  });

  it("blocks the sixth attempt", () => {
    expect(gate({ freeConversionsUsed: 5 })).toBe("limit_reached");
  });

  it("stays blocked beyond the sixth", () => {
    expect(gate({ freeConversionsUsed: 6 })).toBe("limit_reached");
    expect(gate({ freeConversionsUsed: 99 })).toBe("limit_reached");
  });

  it("counts down correctly", () => {
    expect(freeConversionsRemaining(0)).toBe(5);
    expect(freeConversionsRemaining(1)).toBe(4);
    expect(freeConversionsRemaining(4)).toBe(1);
    expect(freeConversionsRemaining(5)).toBe(0);
  });

  it("never shows a negative or inflated remaining count", () => {
    expect(freeConversionsRemaining(7)).toBe(0);
    expect(freeConversionsRemaining(-3)).toBe(5);
  });
});

describe("paid subscriptions", () => {
  it("lets an active subscriber convert regardless of free usage", () => {
    expect(
      gate({ subscriptionStatus: "active", freeConversionsUsed: 5, paidQuotaRemaining: 100 }),
    ).toBe("paid_subscription_active");
  });

  it("treats past_due as still paying, per the grace policy", () => {
    expect(gate({ subscriptionStatus: "past_due", paidQuotaRemaining: 10 })).toBe(
      "paid_subscription_active",
    );
  });

  it("blocks an active subscriber whose plan quota is exhausted", () => {
    expect(gate({ subscriptionStatus: "active", paidQuotaRemaining: 0 })).toBe("limit_reached");
  });
});

describe("inactive subscriptions cannot bypass the paywall", () => {
  it.each(["cancelled", "suspended", "expired", "approval_pending"] as const)(
    "reports %s as subscription_inactive",
    (status) => {
      expect(gate({ subscriptionStatus: status })).toBe("subscription_inactive");
    },
  );

  it("does NOT hand a cancelled subscriber a fresh five conversions", () => {
    // The important case: cancelling must not look like "no plan".
    expect(gate({ subscriptionStatus: "cancelled", freeConversionsUsed: 0 })).not.toBe(
      "free_attempt_available",
    );
  });

  it("does not let an inactive subscriber convert", () => {
    expect(canConvert(gate({ subscriptionStatus: "cancelled" }))).toBe(false);
    expect(canConvert(gate({ subscriptionStatus: "suspended" }))).toBe(false);
  });
});

describe("canConvert", () => {
  it("permits only the two allowed states", () => {
    expect(canConvert("free_attempt_available")).toBe(true);
    expect(canConvert("paid_subscription_active")).toBe(true);
    expect(canConvert("limit_reached")).toBe(false);
    expect(canConvert("subscription_inactive")).toBe(false);
  });
});

describe("there is no unlimited free plan", () => {
  it("has no input combination that grants free conversions past the allowance", () => {
    const statuses = [null, "no_plan", "cancelled", "expired", "suspended"] as const;
    for (const status of statuses) {
      const state = gate({ subscriptionStatus: status, freeConversionsUsed: 5 });
      expect(canConvert(state)).toBe(false);
    }
  });

  it("never returns free_attempt_available once the allowance is spent", () => {
    for (let used = 5; used <= 20; used += 1) {
      expect(gate({ freeConversionsUsed: used })).not.toBe("free_attempt_available");
    }
  });
});

describe("no time-based trial remains in the gate", () => {
  it("ignores trialing status rather than granting time-based access", () => {
    // "trialing" is a legacy status; it must not grant unlimited access. With no
    // free usage it falls through to the counted allowance, not to a 30-day pass.
    expect(gate({ subscriptionStatus: "trialing", freeConversionsUsed: 0 })).toBe(
      "free_attempt_available",
    );
    expect(gate({ subscriptionStatus: "trialing", freeConversionsUsed: 5 })).toBe("limit_reached");
  });
});
