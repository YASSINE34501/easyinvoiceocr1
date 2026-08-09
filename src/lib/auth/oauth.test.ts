/**
 * OAuth return-destination rules.
 *
 * The previous implementation passed `window.location.origin`, which threw the
 * locale away and dropped the visitor on the site root. These assertions pin
 * the two properties that broke: the locale survives the round trip, and the
 * `?redirect=` parameter cannot be turned into an open redirect.
 */

import { describe, expect, it } from "vitest";
import { locales } from "@/i18n";
import { oauthRedirectTo } from "./oauth";

const ORIGIN = "http://localhost:8080";

describe("locale is preserved", () => {
  it("returns to the protected app in the visitor's own locale", () => {
    for (const locale of locales) {
      expect(oauthRedirectTo(ORIGIN, locale)).toBe(`${ORIGIN}/${locale}/app`);
    }
  });

  it("never returns to the bare origin", () => {
    // The exact regression: origin alone means the locale is re-guessed from
    // navigator.languages on the way back.
    for (const locale of locales) {
      expect(oauthRedirectTo(ORIGIN, locale)).not.toBe(ORIGIN);
    }
  });

  it("works against the production origin too", () => {
    expect(oauthRedirectTo("https://www.easyinvoiceocr.com", "ar")).toBe(
      "https://www.easyinvoiceocr.com/ar/app",
    );
  });

  it("tolerates a trailing slash on the origin", () => {
    expect(oauthRedirectTo("http://localhost:8080/", "fr")).toBe(`${ORIGIN}/fr/app`);
  });
});

describe("the redirect parameter", () => {
  it("is honoured when it is a same-origin path", () => {
    expect(oauthRedirectTo(ORIGIN, "fr", "/fr/app/billing")).toBe(`${ORIGIN}/fr/app/billing`);
  });

  it("keeps a deep link in a different locale than the login page", () => {
    // Someone hitting /ar/app/settings while signed out is sent to login; they
    // should come back to the page they asked for.
    expect(oauthRedirectTo(ORIGIN, "en", "/ar/app/settings")).toBe(`${ORIGIN}/ar/app/settings`);
  });

  it("refuses a protocol-relative URL, which would leave the site", () => {
    expect(oauthRedirectTo(ORIGIN, "en", "//evil.example.com")).toBe(`${ORIGIN}/en/app`);
  });

  it("refuses an absolute URL to another host", () => {
    expect(oauthRedirectTo(ORIGIN, "en", "https://evil.example.com/steal")).toBe(
      `${ORIGIN}/en/app`,
    );
  });

  it("ignores an empty or missing value", () => {
    expect(oauthRedirectTo(ORIGIN, "en", "")).toBe(`${ORIGIN}/en/app`);
    expect(oauthRedirectTo(ORIGIN, "en", undefined)).toBe(`${ORIGIN}/en/app`);
  });
});

describe("the Lovable broker is no longer used", () => {
  it("is not referenced by the auth routes", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["src/routes/$locale.login.tsx", "src/routes/$locale.signup.tsx"]) {
      const src = readFileSync(file, "utf8");
      // /~oauth/initiate is served by Lovable's hosting, not by this app, so it
      // answers 404 here and on any other host.
      expect(src).not.toContain("@/integrations/lovable");
      expect(src).not.toContain('signInWithOAuth("google"');
    }
  });
});
