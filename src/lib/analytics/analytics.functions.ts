/**
 * The one analytics endpoint a browser may call.
 *
 * Bundled for the client, so it holds no secrets and imports every server-only
 * module lazily inside the handler.
 *
 * What the browser is allowed to influence is deliberately narrow:
 *
 *   * the event type, but only from the client-reportable allowlist;
 *   * an opaque session id, locale, device and referrer host;
 *   * a handful of allowlisted scalar metadata fields.
 *
 * Everything with financial or entitlement meaning is ignored if supplied.
 * `user_id` comes from the verified session, never from the request body, so a
 * caller cannot attribute traffic to somebody else. Revenue and subscription
 * events are rejected outright — those are webhook territory.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ALLOWED_METADATA_KEYS,
  ANALYTICS_DEVICES,
  ANALYTICS_LOCALES,
  CLIENT_REPORTABLE_EVENTS,
  SESSION_ID_MAX,
  SESSION_ID_MIN,
} from "./events";

/** The two event types a browser may report. */
type ClientReportableEvent = (typeof CLIENT_REPORTABLE_EVENTS)[number];

/**
 * The schema is the allowlist. An event type outside CLIENT_REPORTABLE_EVENTS
 * fails validation before any handler code runs, so `payment_completed` from a
 * browser is rejected at the door rather than filtered later.
 */
const trackInput = z.object({
  // Typed as the narrow union, not string, so the handler cannot widen it back
  // and the allowlist survives refactoring.
  type: z.enum(
    CLIENT_REPORTABLE_EVENTS as unknown as readonly [
      ClientReportableEvent,
      ...ClientReportableEvent[],
    ],
  ),
  sessionId: z
    .string()
    .min(SESSION_ID_MIN)
    .max(SESSION_ID_MAX)
    .regex(/^[A-Za-z0-9_-]+$/),
  /** The visitor's analytics consent decision, taken from the consent store. */
  consent: z.boolean(),
  locale: z.enum(ANALYTICS_LOCALES).optional(),
  device: z.enum(ANALYTICS_DEVICES).optional(),
  /** Full referrer; reduced to a bare host server-side. */
  referrer: z.string().max(2048).optional(),
  metadata: z
    .record(z.enum(ALLOWED_METADATA_KEYS), z.union([z.string().max(120), z.number(), z.boolean()]))
    .optional(),
  /** Caller-generated, stable across retries of the same logical event. */
  idempotencyKey: z.string().trim().min(8).max(200),
});

/**
 * Consumes one unit of the visitor's analytics budget.
 *
 * The decision lives in the database, not in this process. An in-memory Map
 * would give every serverless instance its own budget, so N instances would
 * allow N times the intended rate; a single atomic statement against a shared
 * table is the same decision however many instances are running.
 *
 * Fails closed. If the limiter is unreachable the event is dropped rather than
 * admitted: an unmeasurable minute is a gap in a chart, whereas an unbounded
 * write path that opens precisely when the database is already struggling is
 * how a slow dependency becomes an outage. Only browser-reported events pass
 * through here — trusted signup, conversion, admin and webhook events never
 * call this function and are unaffected.
 */
async function withinRateLimit(sessionId: string): Promise<boolean> {
  try {
    const { serverDb } = await import("@/lib/db.server");
    const { getSetting } = await import("@/lib/billing/entitlements.server");
    const { RATE_LIMIT_GLOBAL_PER_MINUTE, RATE_LIMIT_PER_SESSION_PER_MINUTE } =
      await import("./collection");

    const [perSession, global] = await Promise.all([
      getSetting<number>("analytics.rate_limit_per_minute", RATE_LIMIT_PER_SESSION_PER_MINUTE),
      getSetting<number>("analytics.global_rate_limit_per_minute", RATE_LIMIT_GLOBAL_PER_MINUTE),
    ]);

    const db = await serverDb();
    const { data, error } = await db.rpc("analytics_rate_limit_check", {
      p_session_id: sessionId,
      p_limit: perSession,
      p_global_limit: global,
    });
    if (error) {
      // Fixed category and error code only — never the session id or payload.
      console.warn("[analytics] rate_limiter_unavailable", { code: error.code });
      return false;
    }

    // An absent or malformed row is treated as a refusal, not as permission.
    const row = (Array.isArray(data) ? data[0] : data) as { allowed?: boolean } | undefined;
    return row?.allowed === true;
  } catch (error) {
    console.warn("[analytics] rate_limiter_failed", { name: (error as Error).name });
    return false;
  }
}

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackInput.parse(data))
  .handler(async ({ data }) => {
    // Consent gate. An anonymous visitor who has not accepted analytics is not
    // measured at all — no row, not even an anonymised one.
    if (!data.consent) return { ok: false as const, reason: "no_consent" as const };

    // A refusal — whether the budget is spent or the limiter is down — returns
    // a benign ignored result. The caller is a fire-and-forget beacon, so this
    // never surfaces to the visitor and never blocks rendering or navigation.
    if (!(await withinRateLimit(data.sessionId))) {
      return { ok: false as const, reason: "rate_limited" as const };
    }

    const { recordEvent } = await import("./analytics.server");
    const { normalizeSource } = await import("./events");

    // user_id is deliberately absent. A browser-reported event is attributed to
    // its anonymous session only; associating it with an account is the job of
    // trusted server-side events such as signup_completed.
    const result = await recordEvent({
      type: data.type,
      anonSessionId: data.sessionId,
      locale: data.locale ?? null,
      device: data.device ?? null,
      source: normalizeSource(data.referrer, "easyinvoiceocr.com"),
      metadata: data.metadata,
      idempotencyKey: data.idempotencyKey,
    });

    if (!result.ok) return { ok: false as const, reason: result.reason };
    return { ok: true as const, recorded: result.recorded };
  });
