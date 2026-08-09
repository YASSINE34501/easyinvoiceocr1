/**
 * Records one visitor_session_started per browser session, if consented.
 *
 * Mounted once, in the root layout. Mounting it per page would fire on every
 * navigation; the idempotency key would collapse the duplicates server-side,
 * but the requests themselves would be waste.
 *
 * What it sends is the minimum a funnel needs: an opaque per-tab token, the
 * locale, a viewport-derived device class and the referrer host. No cookie, no
 * IP, no fingerprint. The token lives in sessionStorage, so closing the tab
 * ends the session and nothing follows the visitor to their next visit.
 */

import { useEffect, useRef } from "react";
import { useConsent } from "@/components/site/CookieConsent";
import { useLocale } from "@/i18n/useLocale";
import { trackEvent } from "./analytics.functions";
import {
  SESSION_STORAGE_KEY,
  createSessionId,
  deviceFromViewport,
  shouldSkipBotSession,
  visitorSessionKey,
} from "./collection";
import { isValidSessionId } from "./events";

/**
 * Reads the session token, creating one on first use.
 *
 * Returns null when storage is unavailable — Safari private mode and some
 * embedded webviews throw on access. A visitor who cannot be given a token
 * simply is not counted, which is the correct outcome: without a stable token
 * there is no way to avoid counting them repeatedly.
 */
function readOrCreateSessionId(): string | null {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && isValidSessionId(existing)) return existing;

    const created = createSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function useVisitorSession(): void {
  const consent = useConsent();
  const locale = useLocale();
  // Guards against React's development double-invoke and against the locale
  // changing: this hook must attempt the beacon at most once per mount cycle.
  const firedRef = useRef(false);

  useEffect(() => {
    // consent === null means the visitor has not decided yet, or the store is
    // still loading. Undecided is not consent, so nothing is sent.
    if (consent === null) return;
    if (!consent.analytics) return;
    if (firedRef.current) return;
    if (typeof window === "undefined") return;

    if (shouldSkipBotSession(window.navigator?.userAgent)) {
      // Marked as handled so a bot is not re-evaluated on every render.
      firedRef.current = true;
      return;
    }

    const sessionId = readOrCreateSessionId();
    if (!sessionId) return;

    firedRef.current = true;

    // Deliberately not awaited. Analytics must never delay rendering, and the
    // outcome — recorded, duplicate, or refused by the limiter — changes
    // nothing the visitor can see.
    void trackEvent({
      data: {
        type: "visitor_session_started",
        sessionId,
        consent: true,
        locale,
        device: deviceFromViewport(window.innerWidth),
        referrer: document.referrer || undefined,
        idempotencyKey: visitorSessionKey(sessionId),
      },
    }).catch(() => {
      /* A failed beacon is not worth surfacing or retrying. */
    });
  }, [consent, locale]);
}
