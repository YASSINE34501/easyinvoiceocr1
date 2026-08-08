/**
 * The analytics event vocabulary and its validation rules.
 *
 * Pure: no database, no network, no clock beyond what a caller passes in. The
 * server calls into here before writing anything, and the tests call the same
 * functions, so what is tested is exactly what runs.
 *
 * The security posture is a deny-list-free allowlist. A browser may report only
 * events that carry no financial or entitlement meaning; everything that grants
 * access or represents money is recorded by trusted server code or by a
 * signature-verified webhook, never by a client claiming it happened.
 */

export const ANALYTICS_EVENT_TYPES = [
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
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/**
 * The only events a browser may report.
 *
 * `visitor_session_started` is anonymous traffic, which nothing server-side can
 * observe. `checkout_started` is intent, not money — it grants nothing.
 *
 * Everything else is excluded on purpose. A client reporting
 * `payment_completed` or `subscription_activated` would be asserting that money
 * moved; only a verified PayPal webhook may do that.
 */
export const CLIENT_REPORTABLE_EVENTS: readonly AnalyticsEventType[] = [
  "visitor_session_started",
  "checkout_started",
];

/** Events that represent money. Webhook-only, never server-guessed. */
export const REVENUE_EVENTS: readonly AnalyticsEventType[] = [
  "payment_completed",
  "payment_refunded",
];

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === "string" && (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value);
}

export function isClientReportable(type: AnalyticsEventType): boolean {
  return CLIENT_REPORTABLE_EVENTS.includes(type);
}

export function isRevenueEvent(type: AnalyticsEventType): boolean {
  return REVENUE_EVENTS.includes(type);
}

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

export const ANALYTICS_LOCALES = ["en", "fr", "ar"] as const;
export const ANALYTICS_DEVICES = ["desktop", "tablet", "mobile", "bot", "unknown"] as const;

export type AnalyticsLocale = (typeof ANALYTICS_LOCALES)[number];
export type AnalyticsDevice = (typeof ANALYTICS_DEVICES)[number];

/** Mirrors the database CHECK, so a bad value is caught before the round trip. */
export const SESSION_ID_MIN = 16;
export const SESSION_ID_MAX = 64;
/** Well under the 2 KB database ceiling, leaving room for JSON overhead. */
export const METADATA_MAX_BYTES = 1024;
export const METADATA_MAX_KEYS = 12;
export const SOURCE_MAX = 120;
export const TOOL_MAX = 40;

/**
 * Metadata keys a caller may set. Anything else is dropped rather than
 * rejected, so a future client sending an extra field does not lose the whole
 * event — but it can never smuggle document text or a filename through.
 */
export const ALLOWED_METADATA_KEYS = [
  "plan_code",
  "interval",
  "error_code",
  "page_count",
  "duration_ms",
  "step",
  "reason",
  "referrer_host",
] as const;

export type AnalyticsMetadata = Record<string, string | number | boolean>;

/**
 * Keeps only allowlisted keys holding primitive values, then enforces the size
 * ceiling. Objects, arrays, null and functions are dropped: metadata is for
 * small scalar facts, never nested payloads.
 */
export function sanitizeMetadata(input: unknown): AnalyticsMetadata {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const out: AnalyticsMetadata = {};
  let keys = 0;

  for (const key of ALLOWED_METADATA_KEYS) {
    if (keys >= METADATA_MAX_KEYS) break;
    const value = (input as Record<string, unknown>)[key];
    if (value === undefined || value === null) continue;

    if (typeof value === "string") {
      if (value.length === 0) continue;
      out[key] = value.slice(0, 120);
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value;
    } else {
      continue;
    }
    keys += 1;
  }

  // Final size guard. If it still does not fit, the metadata is discarded
  // rather than the event: a funnel count matters more than its annotations.
  if (byteLength(JSON.stringify(out)) > METADATA_MAX_BYTES) return {};
  return out;
}

function byteLength(value: string): number {
  // TextEncoder is present in every runtime this ships to.
  return new TextEncoder().encode(value).length;
}

export function isValidSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= SESSION_ID_MIN &&
    value.length <= SESSION_ID_MAX &&
    // Opaque token only. Rejecting anything else stops an email or a URL being
    // passed off as a session id.
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

export function normalizeLocale(value: unknown): AnalyticsLocale | null {
  return typeof value === "string" && (ANALYTICS_LOCALES as readonly string[]).includes(value)
    ? (value as AnalyticsLocale)
    : null;
}

export function normalizeDevice(value: unknown): AnalyticsDevice | null {
  return typeof value === "string" && (ANALYTICS_DEVICES as readonly string[]).includes(value)
    ? (value as AnalyticsDevice)
    : null;
}

/**
 * Reduces a referrer to its bare host.
 *
 * A full referrer can carry a search query or a session token, so only the host
 * survives. An internal referrer returns null: our own pages are not a source.
 */
export function normalizeSource(referrer: unknown, ownHost?: string): string | null {
  if (typeof referrer !== "string" || referrer.length === 0) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host) return null;
    if (ownHost && host === ownHost.toLowerCase().replace(/^www\./, "")) return null;
    return host.slice(0, SOURCE_MAX);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Idempotency                                                         */
/* ------------------------------------------------------------------ */

/**
 * Builds the key that makes an event exactly-once.
 *
 * The parts must identify the *logical* event, not the attempt: a retried
 * beacon, a double-fired effect and a redelivered webhook all have to produce
 * the same string so the unique index collapses them into one row.
 */
export function buildIdempotencyKey(
  type: AnalyticsEventType,
  ...parts: (string | number | null | undefined)[]
): string {
  const tail = parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => String(part))
    .join(":");
  return tail ? `${type}:${tail}` : type;
}
