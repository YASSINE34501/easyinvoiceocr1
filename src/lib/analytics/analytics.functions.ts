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
 * Per-session ceiling for one server instance.
 *
 * Crude on purpose: it is a guard against a runaway loop or a casual flood, not
 * a defence against a determined attacker. The real protection is that a
 * browser can only write two harmless event types and cannot forge attribution.
 */
const RATE_LIMIT_PER_SESSION = 60;
const RATE_WINDOW_MS = 60_000;
const seen = new Map<string, { count: number; resetAt: number }>();

function withinRateLimit(sessionId: string, now: number): boolean {
  const entry = seen.get(sessionId);
  if (!entry || entry.resetAt <= now) {
    seen.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // Opportunistic sweep so the map cannot grow without bound.
    if (seen.size > 5000) {
      for (const [key, value] of seen) if (value.resetAt <= now) seen.delete(key);
    }
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_SESSION) return false;
  entry.count += 1;
  return true;
}

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackInput.parse(data))
  .handler(async ({ data }) => {
    // Consent gate. An anonymous visitor who has not accepted analytics is not
    // measured at all — no row, not even an anonymised one.
    if (!data.consent) return { ok: false as const, reason: "no_consent" as const };

    if (!withinRateLimit(data.sessionId, Date.now())) {
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
