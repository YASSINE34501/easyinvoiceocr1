/**
 * Client-side collection rules for the two browser-reportable events.
 *
 * Pure and runtime-agnostic: no DOM access, no storage, no network. The React
 * hook that eventually calls these lives elsewhere; keeping the decisions here
 * means the rules that govern what gets measured are unit-testable rather than
 * buried in an effect.
 *
 * Nothing in this file identifies a person or a device. There is no
 * fingerprinting, no IP handling, and the session token is random rather than
 * derived from anything about the visitor.
 */

import { buildIdempotencyKey, type AnalyticsDevice } from "./events";

/* ------------------------------------------------------------------ */
/* Session identity                                                    */
/* ------------------------------------------------------------------ */

/** Where the per-tab session token lives. Cleared when the tab closes. */
export const SESSION_STORAGE_KEY = "eio_analytics_session";

/**
 * A fresh opaque session token.
 *
 * Random, not derived. Two visitors with identical hardware, locale and
 * browser get unrelated tokens, and the same visitor returning tomorrow gets a
 * new one — which is the point: this counts sessions, not people.
 */
export function createSessionId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  // base64url: 24 characters from 18 bytes, inside the 16..64 range the
  // database CHECK enforces, and matching its [A-Za-z0-9_-] pattern.
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ------------------------------------------------------------------ */
/* Rate-limit window                                                   */
/* ------------------------------------------------------------------ */

/**
 * Defaults mirroring the database function's parameter defaults.
 *
 * The live values come from app_settings and the database is authoritative;
 * these exist so the server has a sane fallback if a setting is missing, and so
 * a drift between the two layers shows up as a failing test rather than as a
 * silently different limit in production.
 */
export const RATE_LIMIT_PER_SESSION_PER_MINUTE = 60;
export const RATE_LIMIT_GLOBAL_PER_MINUTE = 5000;

/** Minutes an expired bucket is kept. Must stay >= 2; the function rejects less. */
export const RATE_BUCKET_KEEP_MINUTES = 5;

/**
 * Why the per-session limit is not, by itself, an abuse control.
 *
 * `session_id` is minted by the browser, so an attacker can rotate it per
 * request and never collide with their own bucket. The per-session ceiling
 * stops a runaway loop or a buggy client. The global breaker is what bounds a
 * rotating-session flood — at the cost of dropping legitimate events once
 * saturated. Neither prevents abuse outright; they bound its blast radius.
 */
export const SESSION_ROTATION_IS_POSSIBLE = true;

/**
 * Start of the one-minute bucket an instant belongs to.
 *
 * Mirrors `date_trunc('minute', now())` in analytics_rate_limit_check. The
 * database is authoritative — this exists so the client can reason about its
 * own budget and so the arithmetic is testable without a round trip.
 */
export function rateLimitBucketStart(at: Date = new Date()): Date {
  const bucket = new Date(at.getTime());
  bucket.setUTCSeconds(0, 0);
  return bucket;
}

/* ------------------------------------------------------------------ */
/* Bots                                                                */
/* ------------------------------------------------------------------ */

/**
 * Well-known automated agents.
 *
 * Deliberately conservative. Bot detection is guesswork, and the failure modes
 * are asymmetric: wrongly skipping a real visitor silently under-reports
 * traffic, while wrongly counting a crawler inflates it by a knowable amount.
 * So only unambiguous self-identifying agents are skipped, and an unknown or
 * absent user agent counts as a visitor.
 */
const BOT_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /headless/i,
  /\bcurl\//i,
  /\bwget\b/i,
  /python-requests/i,
  /axios\//i,
  /node-fetch/i,
  /lighthouse/i,
  /pingdom/i,
  /uptimerobot/i,
];

export function shouldSkipBotSession(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/* ------------------------------------------------------------------ */
/* Device class                                                        */
/* ------------------------------------------------------------------ */

/**
 * Coarse device category from viewport width.
 *
 * Width rather than user agent on purpose: it is the property that actually
 * matters for the funnel, and it reveals nothing that could help identify a
 * visitor.
 */
export function deviceFromViewport(width: number): AnalyticsDevice {
  if (!Number.isFinite(width) || width <= 0) return "unknown";
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/* ------------------------------------------------------------------ */
/* Event keys                                                          */
/* ------------------------------------------------------------------ */

/**
 * One visitor event per session.
 *
 * Keyed on the session token alone, so a refresh, a client-side navigation or a
 * double-invoked effect all resolve to the same row. A genuinely new session
 * has a new token and therefore counts separately.
 */
export function visitorSessionKey(sessionId: string): string {
  return buildIdempotencyKey("visitor_session_started", sessionId);
}

/**
 * One checkout-intent event per session, plan and interval.
 *
 * Impatient double-clicks collapse into a single row, while a genuine change of
 * mind — switching plan or switching to yearly — is recorded as separate
 * intent, which is what the funnel needs to see.
 */
export function checkoutStartedKey(
  sessionId: string,
  planCode: string,
  interval: "month" | "year",
): string {
  return buildIdempotencyKey("checkout_started", sessionId, planCode, interval);
}
