/**
 * Rules the collection foundation depends on, tested without a database.
 *
 * The signup and rate-limit logic lives in SQL, so what is testable in
 * TypeScript is the contract around it: the key format the trigger must
 * produce, the window arithmetic the limiter relies on, and the validation that
 * decides what a browser may assert. Anything that genuinely needs Postgres —
 * atomicity, RLS, the trigger firing — is verified against the real database
 * after the migration is applied, not mocked here.
 */

import { describe, expect, it } from "vitest";
import {
  CLIENT_REPORTABLE_EVENTS,
  buildIdempotencyKey,
  isClientReportable,
  isRevenueEvent,
  isValidSessionId,
  sanitizeMetadata,
} from "./events";
import {
  RATE_BUCKET_KEEP_MINUTES,
  RATE_LIMIT_GLOBAL_PER_MINUTE,
  RATE_LIMIT_PER_SESSION_PER_MINUTE,
  SESSION_ROTATION_IS_POSSIBLE,
  rateLimitBucketStart,
  shouldSkipBotSession,
} from "./collection";

const USER_ID = "a412e252-c022-4518-aec0-b1bde1def0d5";

describe("signup event contract", () => {
  it("produces exactly the key the database trigger writes", () => {
    // The trigger builds 'signup_completed:' || NEW.id. If these ever diverge,
    // the same signup could be recorded twice under two different keys.
    expect(buildIdempotencyKey("signup_completed", USER_ID)).toBe(`signup_completed:${USER_ID}`);
  });

  it("is stable, so a repeated verification cannot duplicate the event", () => {
    const first = buildIdempotencyKey("signup_completed", USER_ID);
    const second = buildIdempotencyKey("signup_completed", USER_ID);
    expect(first).toBe(second);
  });

  it("differs per account", () => {
    expect(buildIdempotencyKey("signup_completed", USER_ID)).not.toBe(
      buildIdempotencyKey("signup_completed", "00000000-0000-0000-0000-000000000000"),
    );
  });

  it("is not a client-reportable event", () => {
    // A browser must never be able to assert that an account was verified.
    expect(isClientReportable("signup_completed")).toBe(false);
  });

  it("carries no email, because email is not an allowlisted metadata key", () => {
    const meta = sanitizeMetadata({
      email: "someone@example.com",
      user_email: "someone@example.com",
      plan_code: "trial",
    });
    expect(meta).toEqual({ plan_code: "trial" });
    expect(JSON.stringify(meta)).not.toContain("@");
  });
});

describe("rate-limit window arithmetic", () => {
  it("truncates to the start of the minute", () => {
    const at = new Date("2026-08-09T02:34:56.789Z");
    expect(rateLimitBucketStart(at).toISOString()).toBe("2026-08-09T02:34:00.000Z");
  });

  it("puts two instants in the same minute in the same bucket", () => {
    const a = rateLimitBucketStart(new Date("2026-08-09T02:34:00.000Z"));
    const b = rateLimitBucketStart(new Date("2026-08-09T02:34:59.999Z"));
    expect(a.getTime()).toBe(b.getTime());
  });

  it("starts a new bucket on the minute boundary", () => {
    const a = rateLimitBucketStart(new Date("2026-08-09T02:34:59.999Z"));
    const b = rateLimitBucketStart(new Date("2026-08-09T02:35:00.000Z"));
    expect(b.getTime()).toBe(a.getTime() + 60_000);
  });

  it("is stable across repeated calls for the same instant", () => {
    const at = new Date("2026-08-09T02:34:12.345Z");
    expect(rateLimitBucketStart(at).getTime()).toBe(rateLimitBucketStart(at).getTime());
  });
});

describe("two-tier rate limit contract", () => {
  it("keeps the per-session ceiling at 60 per minute", () => {
    // Must match analytics_rate_limit_check's p_limit default. A drift here
    // means the server falls back to a different limit than the database.
    expect(RATE_LIMIT_PER_SESSION_PER_MINUTE).toBe(60);
  });

  it("keeps the global breaker default at 5000 per minute", () => {
    expect(RATE_LIMIT_GLOBAL_PER_MINUTE).toBe(5000);
  });

  it("sets the global breaker far above the per-session ceiling", () => {
    // Otherwise a single well-behaved session could trip the deployment-wide
    // breaker on its own.
    expect(RATE_LIMIT_GLOBAL_PER_MINUTE).toBeGreaterThan(RATE_LIMIT_PER_SESSION_PER_MINUTE * 10);
  });

  it("keeps retention at or above the two-minute floor the function enforces", () => {
    expect(RATE_BUCKET_KEEP_MINUTES).toBeGreaterThanOrEqual(2);
  });

  it("does not claim session rotation is prevented", () => {
    // Documented honestly rather than assumed away: the browser mints the
    // session id, so rotation remains possible and the global breaker — not
    // the per-session bucket — is what bounds it.
    expect(SESSION_ROTATION_IS_POSSIBLE).toBe(true);
  });
});

describe("anonymous session validation", () => {
  it("accepts an opaque token in range", () => {
    expect(isValidSessionId("Ab3-_xY9Qw2LmN0p")).toBe(true);
  });

  it("rejects out-of-range lengths, matching the database CHECK", () => {
    expect(isValidSessionId("a".repeat(15))).toBe(false);
    expect(isValidSessionId("a".repeat(16))).toBe(true);
    expect(isValidSessionId("a".repeat(64))).toBe(true);
    expect(isValidSessionId("a".repeat(65))).toBe(false);
  });

  it("rejects anything resembling personal data", () => {
    expect(isValidSessionId("person@example.com")).toBe(false);
    expect(isValidSessionId("203.0.113.7")).toBe(false);
  });
});

describe("event-type allowlist", () => {
  it("permits exactly two browser-reportable events", () => {
    expect([...CLIENT_REPORTABLE_EVENTS].sort()).toEqual([
      "checkout_started",
      "visitor_session_started",
    ]);
  });

  it("refuses every event that grants access or moves money", () => {
    for (const type of [
      "signup_completed",
      "trial_claimed",
      "trial_exhausted",
      "conversion_completed",
      "subscription_activated",
      "subscription_cancelled",
      "payment_completed",
      "payment_refunded",
    ] as const) {
      expect(isClientReportable(type)).toBe(false);
    }
  });

  it("keeps checkout intent out of revenue", () => {
    // checkout_started is the one client event adjacent to money. It must never
    // be counted as revenue.
    expect(isClientReportable("checkout_started")).toBe(true);
    expect(isRevenueEvent("checkout_started")).toBe(false);
  });

  it("strips a client-supplied price or payment status from checkout metadata", () => {
    const meta = sanitizeMetadata({
      plan_code: "pro",
      interval: "month",
      price: 14,
      amount: "14.00",
      currency: "USD",
      payment_status: "COMPLETED",
      paypal_subscription_id: "I-ABC123",
    });
    expect(meta).toEqual({ plan_code: "pro", interval: "month" });
  });
});

describe("visitor session beacon rules", () => {
  it("fires once per session because the key is the session id", () => {
    const session = "Ab3-_xY9Qw2LmN0p";
    const first = buildIdempotencyKey("visitor_session_started", session);
    const onRefresh = buildIdempotencyKey("visitor_session_started", session);
    expect(onRefresh).toBe(first);
  });

  it("treats a second browser session as a separate visitor", () => {
    expect(buildIdempotencyKey("visitor_session_started", "Ab3-_xY9Qw2LmN0p")).not.toBe(
      buildIdempotencyKey("visitor_session_started", "Zz9-_qP1Rt4KjH7c"),
    );
  });

  it("skips recognisable bots", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "curl/8.4.0",
      "python-requests/2.31.0",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0)",
      "HeadlessChrome/120.0.0.0",
    ]) {
      expect(shouldSkipBotSession(ua)).toBe(true);
    }
  });

  it("does not skip an ordinary browser", () => {
    for (const ua of [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1",
    ]) {
      expect(shouldSkipBotSession(ua)).toBe(false);
    }
  });

  it("does not skip when the agent is unknown", () => {
    // Absent evidence of a bot, the visitor counts. Guessing the other way
    // would silently under-report real traffic.
    expect(shouldSkipBotSession(undefined)).toBe(false);
    expect(shouldSkipBotSession("")).toBe(false);
  });
});

describe("checkout intent deduplication", () => {
  it("collapses repeated clicks on the same plan and interval", () => {
    const session = "Ab3-_xY9Qw2LmN0p";
    const click = () => buildIdempotencyKey("checkout_started", session, "pro", "month");
    expect(click()).toBe(click());
  });

  it("separates a different plan or interval", () => {
    const session = "Ab3-_xY9Qw2LmN0p";
    const pro = buildIdempotencyKey("checkout_started", session, "pro", "month");
    expect(pro).not.toBe(buildIdempotencyKey("checkout_started", session, "business", "month"));
    expect(pro).not.toBe(buildIdempotencyKey("checkout_started", session, "pro", "year"));
  });
});
