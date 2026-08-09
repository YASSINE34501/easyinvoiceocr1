/**
 * Google sign-in, through Supabase's own OAuth endpoint.
 *
 * This replaces `@lovable.dev/cloud-auth-js`, which sent the browser to a
 * relative broker path — `/~oauth/initiate` — that nothing in this application
 * serves. On the dev server that path returns HTTP 404, so clicking "Google"
 * navigated to a not-found page and the visitor never reached Google. The
 * broker is part of Lovable's own hosting, not of the app, so the same would
 * happen on any other host.
 *
 * Supabase's endpoint is already configured: GET /auth/v1/authorize?provider=google
 * answers 302 to accounts.google.com with a client id set, and returns to
 * <project>.supabase.co/auth/v1/callback. That callback URL is the one that has
 * to be registered in the Google Cloud console; the app never sees the client
 * secret and never handles one.
 */

import { supabase } from "@/integrations/supabase/client";
import { defaultLocale, isLocale, type Locale } from "@/i18n";

/**
 * Where the visitor should land after Google sends them back.
 *
 * Two rules, both of which the previous implementation broke by passing
 * `window.location.origin`:
 *
 *   * The locale survives. Returning a French visitor to `/` and re-guessing
 *     their language from `navigator.languages` is how a signed-in user ends
 *     up on the English site.
 *   * The destination is the protected area, or the page they were originally
 *     trying to reach.
 *
 * `next` is only honoured when it is a same-origin absolute path. A value
 * beginning `//` is rejected because the browser reads it as a protocol-relative
 * URL to another host, which would turn the login page into an open redirect.
 */
export function oauthRedirectTo(origin: string, locale: Locale, next?: string | undefined): string {
  const base = origin.replace(/\/+$/, "");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return `${base}${next}`;
  }
  const safe: Locale = isLocale(locale) ? locale : defaultLocale;
  return `${base}/${safe}/app`;
}

export type OAuthOutcome =
  | { ok: true }
  /** The provider is unreachable or refused. Never carries provider prose. */
  | { ok: false; reason: "provider_error" }
  /** Called outside a browser, so there is no origin to return to. */
  | { ok: false; reason: "unavailable" };

/**
 * Starts the Google flow.
 *
 * On success the browser navigates away, so nothing after the call runs. The
 * error branch deliberately returns a fixed reason rather than the provider's
 * message: Supabase returns English developer prose, which would reach a French
 * or Arabic user untranslated.
 */
export async function signInWithGoogle(
  locale: Locale,
  next?: string | undefined,
): Promise<OAuthOutcome> {
  if (typeof window === "undefined") return { ok: false, reason: "unavailable" };

  const redirectTo = oauthRedirectTo(window.location.origin, locale, next);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    // Logged for us with no user-facing detail, matching how the rest of the
    // auth surface handles provider failures.
    console.error("[auth] google sign-in failed", { name: error.name });
    return { ok: false, reason: "provider_error" };
  }
  return { ok: true };
}
