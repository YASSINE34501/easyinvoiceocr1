/**
 * Server-side analytics recording.
 *
 * Server-only: this module holds the service-role client, so importing it from
 * a route or the top level of a *.functions.ts file would ship that key to the
 * browser. Load it inside a handler with `await import(...)`.
 *
 * Two rules shape everything here:
 *
 *   1. Analytics must never break the product. Every write is best-effort — a
 *      failure is logged and swallowed, because losing a funnel row is a far
 *      smaller harm than failing a conversion the user paid an attempt for.
 *
 *   2. A duplicate is not an error. The unique index on idempotency_key is the
 *      exactly-once guarantee, so a collision means the event was already
 *      recorded and the call succeeds.
 */

import {
  isAnalyticsEventType,
  isValidSessionId,
  normalizeDevice,
  normalizeLocale,
  sanitizeMetadata,
  TOOL_MAX,
  type AnalyticsEventType,
  type AnalyticsMetadata,
} from "./events";

export type RecordEventInput = {
  type: AnalyticsEventType;
  /** Resolved from the verified session server-side. Never from the browser. */
  userId?: string | null;
  anonSessionId?: string | null;
  locale?: string | null;
  /** ISO-3166 alpha-2, resolved from the edge header. The IP is never stored. */
  country?: string | null;
  device?: string | null;
  /** Referrer host only, already reduced by normalizeSource. */
  source?: string | null;
  tool?: string | null;
  metadata?: unknown;
  idempotencyKey: string;
  occurredAt?: string;
};

export type RecordResult =
  { ok: true; recorded: boolean } | { ok: false; reason: "invalid" | "disabled" | "error" };

/** Postgres unique_violation: the event already exists, which is success. */
const UNIQUE_VIOLATION = "23505";

/**
 * Records one event. Safe to call from anywhere on the server.
 *
 * `recorded: false` means the event was already present — the caller retried,
 * or a webhook was redelivered. Either way the funnel is correct.
 */
export async function recordEvent(input: RecordEventInput): Promise<RecordResult> {
  if (!isAnalyticsEventType(input.type)) return { ok: false, reason: "invalid" };
  if (!input.idempotencyKey || input.idempotencyKey.length > 200) {
    return { ok: false, reason: "invalid" };
  }

  const anonSessionId =
    input.anonSessionId && isValidSessionId(input.anonSessionId) ? input.anonSessionId : null;

  // The database CHECK enforces this too; failing here avoids a pointless round
  // trip and gives the caller a clearer reason.
  if (!input.userId && !anonSessionId) return { ok: false, reason: "invalid" };

  try {
    const { serverDb } = await import("@/lib/db.server");
    const { getSetting } = await import("@/lib/billing/entitlements.server");

    if (!(await getSetting<boolean>("analytics.enabled", true))) {
      return { ok: false, reason: "disabled" };
    }

    const db = await serverDb();
    const { error } = await db.from("analytics_events").insert({
      event_type: input.type,
      user_id: input.userId ?? null,
      anon_session_id: anonSessionId,
      locale: normalizeLocale(input.locale),
      country: normalizeCountry(input.country),
      device: normalizeDevice(input.device),
      source: input.source ? input.source.slice(0, 120) : null,
      tool: input.tool ? input.tool.slice(0, TOOL_MAX) : null,
      metadata: sanitizeMetadata(input.metadata) satisfies AnalyticsMetadata,
      idempotency_key: input.idempotencyKey,
      ...(input.occurredAt ? { occurred_at: input.occurredAt } : {}),
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) return { ok: true, recorded: false };
      console.error("[analytics] insert failed", { code: error.code });
      return { ok: false, reason: "error" };
    }

    return { ok: true, recorded: true };
  } catch (error) {
    // Never rethrow: a broken analytics path must not surface to the user.
    console.error("[analytics] unavailable", (error as Error).name);
    return { ok: false, reason: "error" };
  }
}

/** Two uppercase letters, or nothing. Anything else is not a country code. */
function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Fire-and-forget wrapper for hot paths.
 *
 * The conversion lifecycle should not wait on an analytics insert, so callers
 * that care about latency use this and let the promise settle on its own.
 */
export function recordEventDetached(input: RecordEventInput): void {
  void recordEvent(input).catch(() => {
    /* recordEvent already logs; nothing further to do */
  });
}
