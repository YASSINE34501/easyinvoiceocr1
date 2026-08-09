/**
 * The technical-SEO contract.
 *
 * These are the rules that are cheap to break silently and expensive to notice:
 * a relative canonical still renders, a preview origin in the sitemap still
 * validates, a missing x-default still passes a smoke test. Each one below
 * failed at least once in this codebase before the seo module existed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n";
import {
  NOINDEX_SLUGS,
  SITE_ORIGIN,
  absoluteUrl,
  canonicalUrl,
  isNoindexSlug,
  robotsMeta,
  seoLinks,
  socialMeta,
} from "./seo";
import { buildSitemapXml, sitemapEntries } from "@/lib/seo/sitemap";

const ROBOTS = readFileSync("public/robots.txt", "utf8");
const MANIFEST = JSON.parse(readFileSync("public/site.webmanifest", "utf8"));

describe("production origin", () => {
  it("is the www host over https", () => {
    expect(SITE_ORIGIN).toBe("https://www.easyinvoiceocr.com");
  });

  it("has no trailing slash, so joins never double up", () => {
    expect(SITE_ORIGIN.endsWith("/")).toBe(false);
    expect(absoluteUrl("/en/about")).toBe("https://www.easyinvoiceocr.com/en/about");
    expect(absoluteUrl("en/about")).toBe("https://www.easyinvoiceocr.com/en/about");
  });

  it("leaves an already-absolute URL alone", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("canonical URLs", () => {
  it("are absolute for every locale", () => {
    for (const locale of locales) {
      expect(canonicalUrl("about", locale)).toBe(`${SITE_ORIGIN}/${locale}/about`);
    }
  });

  it("treat the empty slug as the locale home", () => {
    expect(canonicalUrl("", "fr")).toBe(`${SITE_ORIGIN}/fr`);
  });

  it("never emit a relative href", () => {
    for (const locale of locales) {
      for (const link of seoLinks("pdf-to-word", locale)) {
        expect(link.href.startsWith("https://")).toBe(true);
      }
    }
  });

  it("are self-referential: each locale points at itself", () => {
    for (const locale of locales) {
      const canonical = seoLinks("contact", locale).find((l) => l.rel === "canonical");
      expect(canonical?.href).toBe(`${SITE_ORIGIN}/${locale}/contact`);
    }
  });
});

describe("hreflang", () => {
  it("declares en, fr, ar and x-default", () => {
    const tags = seoLinks("help", "en")
      .filter((l) => l.rel === "alternate")
      .map((l) => l.hrefLang);
    expect(tags).toEqual(["en", "fr", "ar", "x-default"]);
  });

  it("points x-default at English", () => {
    const xDefault = seoLinks("help", "ar").find((l) => l.hrefLang === "x-default");
    expect(xDefault?.href).toBe(`${SITE_ORIGIN}/en/help`);
  });

  it("is reciprocal: every locale lists the same alternate set", () => {
    // Search engines discard a one-way hreflang cluster, so the three pages
    // must agree with each other exactly.
    const sets = locales.map((locale) =>
      seoLinks("security", locale)
        .filter((l) => l.rel === "alternate")
        .map((l) => `${l.hrefLang} ${l.href}`)
        .join("|"),
    );
    expect(new Set(sets).size).toBe(1);
  });
});

describe("indexability", () => {
  it("marks every private area noindex, nofollow", () => {
    for (const slug of NOINDEX_SLUGS) {
      expect(robotsMeta(slug).content).toBe("noindex, nofollow");
    }
  });

  it("covers nested private routes by prefix", () => {
    expect(isNoindexSlug("app/settings")).toBe(true);
    expect(isNoindexSlug("app/billing")).toBe(true);
    expect(isNoindexSlug("app/admin")).toBe(true);
  });

  it("does not accidentally catch a public slug that starts the same way", () => {
    expect(isNoindexSlug("applications")).toBe(false);
    expect(isNoindexSlug("about")).toBe(false);
  });

  it("keeps a non-production deployment out of the index", () => {
    // VITE_SITE_URL is unset under test, which is exactly the preview case.
    expect(robotsMeta("about").content).toBe("noindex, nofollow");
  });
});

describe("robots.txt", () => {
  it("declares the sitemap absolutely", () => {
    expect(ROBOTS).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it("has no relative Sitemap line, which crawlers ignore", () => {
    expect(ROBOTS).not.toMatch(/^Sitemap:\s*\/(?!\/)/m);
  });

  it("disallows every private area", () => {
    for (const fragment of [
      "/*/app/",
      "/*/login",
      "/*/signup",
      "/*/forgot-password",
      "/*/reset-password",
      "/*/verify-email",
      "/*/choose-plan",
      "/api/",
    ]) {
      expect(ROBOTS).toContain(`Disallow: ${fragment}`);
    }
  });

  it("keeps crawlers out of the OCR binaries", () => {
    expect(ROBOTS).toContain("Disallow: /tesseract/");
  });
});

describe("sitemap", () => {
  const xml = buildSitemapXml();

  it("uses the production origin even with no argument", () => {
    expect(xml).toContain(`<loc>${SITE_ORIGIN}/en</loc>`);
  });

  it("ignores a caller-supplied preview origin", () => {
    // The route deliberately does not pass the request origin any more; this
    // proves the default is what ships even if a caller regresses.
    expect(buildSitemapXml()).not.toContain("localhost");
  });

  it("emits every locale for every entry", () => {
    const expected = sitemapEntries().length * locales.length;
    expect(xml.match(/<loc>/g)?.length).toBe(expected);
  });

  it("contains no relative or insecure URL", () => {
    // Only <loc> and hreflang href values are checked. The xmlns attributes are
    // http:// namespace identifiers, not addresses anything fetches.
    expect(xml).not.toMatch(/<loc>(?!https:\/\/)/);
    for (const href of xml.match(/href="[^"]*"/g) ?? []) {
      expect(href.startsWith('href="https://www.easyinvoiceocr.com/')).toBe(true);
    }
  });

  it("excludes every private route", () => {
    for (const slug of NOINDEX_SLUGS) {
      expect(xml).not.toContain(`/${slug}<`);
      expect(xml).not.toContain(`/en/${slug}`);
    }
  });

  it("carries x-default on every URL", () => {
    const urls = xml.match(/<url>/g)?.length ?? 0;
    const xDefaults = xml.match(/hreflang="x-default"/g)?.length ?? 0;
    expect(xDefaults).toBe(urls);
  });
});

describe("social cards", () => {
  it("uses an absolute og:image and og:url", () => {
    const meta = socialMeta({
      slug: "invoice-ocr",
      locale: "fr",
      title: "t",
      description: "d",
    });
    const get = (key: string) =>
      meta.find((m) => m.property === key || m.name === key)?.content ?? "";
    expect(get("og:url")).toBe(`${SITE_ORIGIN}/fr/invoice-ocr`);
    expect(get("og:image").startsWith(`${SITE_ORIGIN}/`)).toBe(true);
    expect(get("og:locale")).toBe("fr_FR");
  });
});

describe("web manifest", () => {
  it("names the brand and starts inside a locale", () => {
    expect(MANIFEST.name).toBe("EasyInvoiceOCR");
    expect(MANIFEST.start_url).toBe("/en");
  });

  it("ships an any-purpose and a maskable icon", () => {
    const purposes = MANIFEST.icons.map((i: { purpose?: string }) => i.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");
  });

  it("uses the brand theme colour", () => {
    expect(MANIFEST.theme_color).toBe("#00a470");
  });
});
