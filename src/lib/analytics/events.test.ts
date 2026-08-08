/**
 * Validation, allowlist and idempotency rules for analytics events.
 *
 * These are the checks that decide what a browser is permitted to assert, so
 * they are tested against the same functions the server calls — not mocks.
 */

import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENT_TYPES,
  CLIENT_REPORTABLE_EVENTS,
  METADATA_MAX_BYTES,
  REVENUE_EVENTS,
  buildIdempotencyKey,
  isAnalyticsEventType,
  isClientReportable,
  isRevenueEvent,
  isValidSessionId,
  normalizeDevice,
  normalizeLocale,
  normalizeSource,
  sanitizeMetadata,
} from "./events";

describe("event vocabulary", () => {
  it("declares exactly the 13 required event types", () => {
    expect(ANALYTICS_EVENT_TYPES).toHaveLength(13);
    for (const required of [
      "visitor_session_started",
      "signup_completed",
      "trial_claimed",
      "conversion_started",
      "conversion_completed",
      "conversion_failed",
      "conversion_cancelled",
      "trial_exhausted",
      "checkout_started",
      "subscription_activated",
      "subscription_cancelled",
      "payment_completed",
      "payment_refunded",
    ]) {
      expect(ANALYTICS_EVENT_TYPES).toContain(required);
    }
  });

  it("rejects anything not in the vocabulary", () => {
    expect(isAnalyticsEventType("not_a_real_event")).toBe(false);
    expect(isAnalyticsEventType("")).toBe(false);
    expect(isAnalyticsEventType(null)).toBe(false);
    expect(isAnalyticsEventType(42)).toBe(false);
  });
});

describe("forged revenue rejection", () => {
  it("lets a browser report only the two harmless events", () => {
    expect(CLIENT_REPORTABLE_EVENTS).toEqual(["visitor_session_started", "checkout_started"]);
  });

  it("never lets a browser report a revenue event", () => {
    for (const type of REVENUE_EVENTS) {
      expect(isClientReportable(type)).toBe(false);
    }
  });

  it("never lets a browser report an entitlement-granting event", () => {
    // These decide what a user may do or what they were charged. A client
    // asserting any of them would be asserting it paid.
    for (const type of [
      "payment_completed",
      "payment_refunded",
      "subscription_activated",
      "subscription_cancelled",
      "trial_claimed",
      "trial_exhausted",
      "conversion_completed",
    ] as const) {
      expect(isClientReportable(type)).toBe(false);
    }
  });

  it("classifies revenue events correctly", () => {
    expect(isRevenueEvent("payment_completed")).toBe(true);
    expect(isRevenueEvent("payment_refunded")).toBe(true);
    expect(isRevenueEvent("checkout_started")).toBe(false);
    expect(isRevenueEvent("subscription_activated")).toBe(false);
  });

  it("leaves no client-reportable event that carries money", () => {
    for (const type of CLIENT_REPORTABLE_EVENTS) {
      expect(isRevenueEvent(type)).toBe(false);
    }
  });
});

describe("session identifiers", () => {
  it("accepts an opaque token of the right length", () => {
    expect(isValidSessionId("abcdefghijklmnop")).toBe(true);
    expect(isValidSessionId("a1b2-c3d4_e5f6g7h8")).toBe(true);
  });

  it("rejects anything too short or too long", () => {
    expect(isValidSessionId("short")).toBe(false);
    expect(isValidSessionId("x".repeat(65))).toBe(false);
  });

  it("rejects values that look like personal data rather than a token", () => {
    expect(isValidSessionId("user@example.com")).toBe(false);
    expect(isValidSessionId("https://example.com/page")).toBe(false);
    expect(isValidSessionId("192.168.100.23")).toBe(false);
  });
});

describe("metadata sanitisation", () => {
  it("keeps allowlisted scalar fields", () => {
    expect(sanitizeMetadata({ plan_code: "pro", page_count: 3, step: "checkout" })).toEqual({
      plan_code: "pro",
      page_count: 3,
      step: "checkout",
    });
  });

  it("drops keys that are not allowlisted", () => {
    const out = sanitizeMetadata({
      plan_code: "pro",
      ocr_text: "Invoice total 1234.56",
      filename: "client-invoice.pdf",
      email: "someone@example.com",
    });
    expect(out).toEqual({ plan_code: "pro" });
    expect(out).not.toHaveProperty("ocr_text");
    expect(out).not.toHaveProperty("filename");
    expect(out).not.toHaveProperty("email");
  });

  it("drops nested objects and arrays", () => {
    expect(sanitizeMetadata({ plan_code: { nested: true } })).toEqual({});
    expect(sanitizeMetadata({ step: ["a", "b"] })).toEqual({});
  });

  it("discards oversized metadata rather than the event", () => {
    const huge = sanitizeMetadata({ reason: "x".repeat(5000) });
    // The string is first truncated to 120 chars, so this stays under the cap.
    expect(JSON.stringify(huge).length).toBeLessThanOrEqual(METADATA_MAX_BYTES);
    expect(String(huge["reason"])).toHaveLength(120);
  });

  it("returns an empty object for non-objects", () => {
    expect(sanitizeMetadata(null)).toEqual({});
    expect(sanitizeMetadata("string")).toEqual({});
    expect(sanitizeMetadata([1, 2, 3])).toEqual({});
    expect(sanitizeMetadata(undefined)).toEqual({});
  });

  it("ignores non-finite numbers", () => {
    expect(sanitizeMetadata({ page_count: Number.NaN })).toEqual({});
    expect(sanitizeMetadata({ duration_ms: Number.POSITIVE_INFINITY })).toEqual({});
  });
});

describe("dimension normalisation", () => {
  it("accepts only the three supported locales", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("ar")).toBe("ar");
    expect(normalizeLocale("de")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });

  it("accepts only known device classes", () => {
    expect(normalizeDevice("mobile")).toBe("mobile");
    expect(normalizeDevice("fridge")).toBeNull();
  });
});

describe("referrer reduction", () => {
  it("keeps only the host", () => {
    expect(normalizeSource("https://www.google.com/search?q=invoice+ocr&token=abc")).toBe(
      "google.com",
    );
  });

  it("treats our own site as not a source", () => {
    expect(
      normalizeSource("https://www.easyinvoiceocr.com/en/pricing", "easyinvoiceocr.com"),
    ).toBeNull();
  });

  it("never leaks a query string or path", () => {
    const out = normalizeSource("https://ref.example.com/a/b?utm=x&session=secret");
    expect(out).toBe("ref.example.com");
    expect(out).not.toContain("secret");
    expect(out).not.toContain("?");
    expect(out).not.toContain("/");
  });

  it("returns null for junk", () => {
    expect(normalizeSource("not a url")).toBeNull();
    expect(normalizeSource("")).toBeNull();
    expect(normalizeSource(null)).toBeNull();
  });
});

describe("idempotency keys", () => {
  it("is stable for the same logical event", () => {
    const a = buildIdempotencyKey("conversion_completed", "job-1");
    const b = buildIdempotencyKey("conversion_completed", "job-1");
    expect(a).toBe(b);
  });

  it("differs across events and subjects", () => {
    expect(buildIdempotencyKey("conversion_completed", "job-1")).not.toBe(
      buildIdempotencyKey("conversion_failed", "job-1"),
    );
    expect(buildIdempotencyKey("conversion_completed", "job-1")).not.toBe(
      buildIdempotencyKey("conversion_completed", "job-2"),
    );
  });

  it("ignores empty parts so an optional field cannot split the key", () => {
    expect(buildIdempotencyKey("checkout_started", "sess", null, undefined, "")).toBe(
      "checkout_started:sess",
    );
  });
});
