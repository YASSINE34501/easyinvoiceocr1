/**
 * Three defects that shipped because every check measured the wrong layer.
 *
 * The document language was verified by reading `document.documentElement.lang`
 * in a browser — which is the hydrated DOM, not the HTML a crawler is served.
 * The client corrected it after hydration, so the check passed while /fr and
 * /ar were being served `lang="en"` with no `dir` at all.
 *
 * These assertions read source and computed values instead, so they cannot be
 * satisfied by a client-side correction. The raw-HTTP evidence is produced by
 * the SSR audit script against a running server.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales, localeDir, localeFromPathname, localeHtmlLang } from "@/i18n";
import { robotsMeta, isNoindexSlug } from "./seo";

const ROOT = readFileSync("src/routes/__root.tsx", "utf8");
const LEGAL = ["terms", "privacy", "cookies"] as const;

describe("document language and direction come from the URL", () => {
  it("resolves the locale from any locale-prefixed path", () => {
    expect(localeFromPathname("/en")).toBe("en");
    expect(localeFromPathname("/fr/blog")).toBe("fr");
    expect(localeFromPathname("/ar/blog/choosing-ocr-api")).toBe("ar");
    expect(localeFromPathname("/ar/invoice-ocr?x=1#y")).toBe("ar");
  });

  it("falls back to the default rather than throwing", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/sitemap.xml")).toBe("en");
    expect(localeFromPathname("/zz/nope")).toBe("en");
  });

  it("maps every locale to a direction", () => {
    expect(localeDir.en).toBe("ltr");
    expect(localeDir.fr).toBe("ltr");
    expect(localeDir.ar).toBe("rtl");
  });

  it("maps every locale to an html lang value", () => {
    for (const locale of locales) {
      expect(localeHtmlLang[locale].length).toBeGreaterThan(0);
    }
  });

  it("no longer hard-codes the shell language", () => {
    // The exact regression: <html lang="en"> with no dir, for every locale.
    expect(ROOT).not.toContain('<html lang="en">');
    expect(ROOT).toContain("localeFromPathname(pathname)");
    expect(ROOT).toContain("lang={localeHtmlLang[locale]}");
    expect(ROOT).toContain("dir={localeDir[locale]}");
  });

  it("derives the shell attributes from router state, so SSR and client agree", () => {
    // Reading the same value the server routed on is what avoids a hydration
    // mismatch; a browser-only source such as window.location would not.
    expect(ROOT).toContain("useRouterState");
    expect(ROOT).not.toContain("window.location.pathname");
  });
});

describe("robots precedence", () => {
  it("no route hard-codes an index directive", () => {
    // terms, privacy and cookies each carried
    //   { name: "robots", content: "index, follow" }
    // *after* robotsMeta(slug) in the same meta array, so the literal won and
    // the page advertised itself as indexable even on localhost.
    for (const slug of LEGAL) {
      const src = readFileSync(`src/routes/$locale.${slug}.tsx`, "utf8");
      expect(src, slug).not.toContain('{ name: "robots", content: "index, follow" }');
      expect(src, slug).toContain(`robotsMeta("${slug}")`);
    }
  });

  it("fails closed on a non-production deployment", () => {
    // VITE_SITE_URL is unset under test, which is the preview/localhost case.
    for (const slug of [...LEGAL, "about", "contact", "security", "blog", "documentation"]) {
      expect(robotsMeta(slug).content, slug).toBe("noindex, nofollow");
    }
  });

  it("keeps private and unavailable routes noindex by slug, whatever the deployment", () => {
    for (const slug of [
      "login",
      "signup",
      "forgot-password",
      "reset-password",
      "verify-email",
      "choose-plan",
      "app",
      "app/billing",
      "app/admin",
    ]) {
      expect(isNoindexSlug(slug), slug).toBe(true);
      expect(robotsMeta(slug).content, slug).toBe("noindex, nofollow");
    }
  });

  it("does not treat a legal page as permanently private", () => {
    // They fail closed today because this is not production, but they are
    // ordinary indexable pages — not members of the always-noindex set.
    for (const slug of LEGAL) expect(isNoindexSlug(slug)).toBe(false);
  });
});

describe("legal pages have a document heading", () => {
  it("renders a PageHero, which is the only H1 on the page", () => {
    for (const slug of LEGAL) {
      const src = readFileSync(`src/routes/$locale.${slug}.tsx`, "utf8");
      // Section renders an <h2>; using it for the page title left the document
      // opening at level two with no H1 at all.
      expect(src, slug).toContain("<PageHero title={c.title} />");
      expect(src, slug).not.toContain("<Section title={c.title}>");
    }
  });

  it("keeps the body sections at H2, below the new H1", () => {
    for (const slug of LEGAL) {
      const src = readFileSync(`src/routes/$locale.${slug}.tsx`, "utf8");
      expect(src, slug).toContain("<h2");
    }
  });
});
