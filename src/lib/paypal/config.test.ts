/**
 * Configuration-reading tests.
 *
 * These cover the two defects that made the documented environment variables
 * inert: the environment name was read from the wrong key (so live credentials
 * resolved to the sandbox host), and the plan-id lookup built a variable name
 * that did not match the documented one.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  envPlanId,
  checkoutBlockedReason,
  isLiveCheckoutEnabled,
  missingPayPalConfig,
  readPayPalConfig,
  readPayPalEnvironment,
} from "./client.server";

const KEYS = [
  "PAYPAL_ENV",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "PAYPAL_LIVE_CHECKOUT_ENABLED",
  "PAYPAL_PRO_MONTHLY_PLAN_ID",
  "PAYPAL_PRO_YEARLY_PLAN_ID",
  "PAYPAL_BUSINESS_MONTHLY_PLAN_ID",
  "PAYPAL_BUSINESS_YEARLY_PLAN_ID",
  "PAYPAL_PLAN_ID_PRO_MONTHLY",
];

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function configureFully() {
  process.env["PAYPAL_CLIENT_ID"] = "test-client-id";
  process.env["PAYPAL_CLIENT_SECRET"] = "test-secret";
  process.env["PAYPAL_WEBHOOK_ID"] = "test-webhook";
  process.env["PAYPAL_PRO_MONTHLY_PLAN_ID"] = "P-PRO-M";
  process.env["PAYPAL_PRO_YEARLY_PLAN_ID"] = "P-PRO-Y";
  process.env["PAYPAL_BUSINESS_MONTHLY_PLAN_ID"] = "P-BUS-M";
  process.env["PAYPAL_BUSINESS_YEARLY_PLAN_ID"] = "P-BUS-Y";
}

describe("readPayPalEnvironment", () => {
  it("reads the documented PAYPAL_ENV variable", () => {
    process.env["PAYPAL_ENV"] = "live";
    expect(readPayPalEnvironment()).toBe("live");
  });

  it("still reads the legacy PAYPAL_ENVIRONMENT alias", () => {
    process.env["PAYPAL_ENVIRONMENT"] = "live";
    expect(readPayPalEnvironment()).toBe("live");
  });

  it("prefers PAYPAL_ENV when both are set", () => {
    process.env["PAYPAL_ENV"] = "live";
    process.env["PAYPAL_ENVIRONMENT"] = "sandbox";
    expect(readPayPalEnvironment()).toBe("live");
  });

  it("tolerates surrounding whitespace and case", () => {
    process.env["PAYPAL_ENV"] = "  LIVE  ";
    expect(readPayPalEnvironment()).toBe("live");
  });

  it("falls back to sandbox when unset", () => {
    expect(readPayPalEnvironment()).toBe("sandbox");
  });

  it("treats any unrecognised value as sandbox, never as live", () => {
    for (const value of ["production", "prod", "1", "true", "", "LIVEISH"]) {
      process.env["PAYPAL_ENV"] = value;
      expect(readPayPalEnvironment()).toBe("sandbox");
    }
  });
});

describe("readPayPalConfig", () => {
  it("points a live environment at the live API host", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "live";
    expect(readPayPalConfig()?.apiBase).toBe("https://api-m.paypal.com");
  });

  it("points a sandbox environment at the sandbox host", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "sandbox";
    expect(readPayPalConfig()?.apiBase).toBe("https://api-m.sandbox.paypal.com");
  });

  it("returns null when the client id is missing", () => {
    process.env["PAYPAL_CLIENT_SECRET"] = "test-secret";
    expect(readPayPalConfig()).toBeNull();
  });

  it("returns null when the client secret is missing", () => {
    process.env["PAYPAL_CLIENT_ID"] = "test-client-id";
    expect(readPayPalConfig()).toBeNull();
  });
});

describe("envPlanId", () => {
  it("reads the documented PAYPAL_<CODE>_<INTERVAL>_PLAN_ID name", () => {
    process.env["PAYPAL_PRO_MONTHLY_PLAN_ID"] = "P-DOCUMENTED";
    expect(envPlanId("pro", "month")).toBe("P-DOCUMENTED");
  });

  it("reads the yearly variant", () => {
    process.env["PAYPAL_BUSINESS_YEARLY_PLAN_ID"] = "P-BUS-Y";
    expect(envPlanId("business", "year")).toBe("P-BUS-Y");
  });

  it("still reads the legacy PAYPAL_PLAN_ID_<CODE>_<INTERVAL> name", () => {
    process.env["PAYPAL_PLAN_ID_PRO_MONTHLY"] = "P-LEGACY";
    expect(envPlanId("pro", "month")).toBe("P-LEGACY");
  });

  it("prefers the documented name over the legacy one", () => {
    process.env["PAYPAL_PRO_MONTHLY_PLAN_ID"] = "P-DOCUMENTED";
    process.env["PAYPAL_PLAN_ID_PRO_MONTHLY"] = "P-LEGACY";
    expect(envPlanId("pro", "month")).toBe("P-DOCUMENTED");
  });

  it("returns null when neither is set", () => {
    expect(envPlanId("pro", "month")).toBeNull();
  });
});

describe("missingPayPalConfig", () => {
  it("lists every absent required variable", () => {
    expect(missingPayPalConfig()).toContain("PAYPAL_CLIENT_ID");
    expect(missingPayPalConfig()).toContain("PAYPAL_WEBHOOK_ID");
    expect(missingPayPalConfig()).toContain("PAYPAL_BUSINESS_YEARLY_PLAN_ID");
  });

  it("is empty once everything is configured", () => {
    configureFully();
    expect(missingPayPalConfig()).toEqual([]);
  });

  it("reports a missing client id even when plan ids are present", () => {
    configureFully();
    delete process.env["PAYPAL_CLIENT_ID"];
    expect(missingPayPalConfig()).toEqual(["PAYPAL_CLIENT_ID"]);
  });
});

describe("isLiveCheckoutEnabled — fails closed", () => {
  it("is false when configuration is complete but the owner has not opted in", () => {
    configureFully();
    expect(isLiveCheckoutEnabled()).toBe(false);
  });

  it("is false when the flag is explicitly false", () => {
    configureFully();
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "false";
    expect(isLiveCheckoutEnabled()).toBe(false);
  });

  it("is false when opted in but configuration is incomplete", () => {
    configureFully();
    delete process.env["PAYPAL_BUSINESS_YEARLY_PLAN_ID"];
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "true";
    expect(isLiveCheckoutEnabled()).toBe(false);
  });

  it("is false for truthy-looking values that are not exactly true", () => {
    configureFully();
    for (const value of ["1", "yes", "TRUE ", "on"]) {
      process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = value;
      const expected = value.trim().toLowerCase() === "true";
      expect(isLiveCheckoutEnabled()).toBe(expected);
    }
  });

  it("is true only with complete configuration and an explicit opt-in", () => {
    configureFully();
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "true";
    expect(isLiveCheckoutEnabled()).toBe(true);
  });
});

describe("checkoutBlockedReason — the gate checkout actually calls", () => {
  /**
   * isLiveCheckoutEnabled was correct, documented and tested, and no production
   * code path called it, so live checkout opened whatever it said. The rule is
   * now a value the handler must consult, and these are what keep it consulted.
   */
  it("blocks when PayPal is not configured at all", () => {
    delete process.env["PAYPAL_CLIENT_ID"];
    delete process.env["PAYPAL_CLIENT_SECRET"];
    expect(checkoutBlockedReason()).toBe("paypal_not_configured");
  });

  it("blocks live checkout when the owner has not opted in", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "live";
    delete process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"];
    expect(checkoutBlockedReason()).toBe("paypal_not_configured");
  });

  it("blocks live checkout when opted in but a plan id is missing", () => {
    // Without every plan id the button can open on a plan that cannot be
    // created, and without the webhook id nothing that is paid for activates.
    configureFully();
    process.env["PAYPAL_ENV"] = "live";
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "true";
    delete process.env["PAYPAL_BUSINESS_YEARLY_PLAN_ID"];
    expect(checkoutBlockedReason()).toBe("paypal_not_configured");
  });

  it("blocks live checkout when the webhook id is missing", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "live";
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "true";
    delete process.env["PAYPAL_WEBHOOK_ID"];
    expect(checkoutBlockedReason()).toBe("paypal_not_configured");
  });

  it("allows live checkout only with complete configuration and an explicit opt-in", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "live";
    process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] = "true";
    expect(checkoutBlockedReason()).toBeNull();
  });

  it("allows sandbox without the opt-in, since it moves no real money", () => {
    configureFully();
    process.env["PAYPAL_ENV"] = "sandbox";
    delete process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"];
    expect(checkoutBlockedReason()).toBeNull();
  });
});
