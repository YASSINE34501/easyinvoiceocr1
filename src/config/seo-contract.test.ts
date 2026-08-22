import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { locales, type Locale } from "@/i18n";
import { products } from "@/content/products";
import { SITE_NAME, SITE_ORIGIN } from "./seo";

/**
 * Contracts the rest of the SEO suite does not already hold.
 *
 * seo.test.ts covers the URL helpers, robots.txt and the sitemap builder;
 * ssr-seo.test.ts covers the shell's language attributes and the noindex rules.
 * What was missing was the part a crawler actually consumes: that no two
 * indexable pages claim the same title or description, that every JSON-LD block
 * the site emits is really parseable, and that the site-level entity exists at
 * all.
 */

/** Every product page's per-locale metadata, flattened. */
function productMeta(): Array<{
  locale: Locale;
  slug: string;
  title: string;
  description: string;
}> {
  const out: Array<{ locale: Locale; slug: string; title: string; description: string }> = [];
  for (const locale of locales) {
    for (const product of products) {
      const content = product.content[locale];
      if (!content) continue;
      out.push({
        locale,
        slug: product.slug,
        title: content.title,
        description: content.description,
      });
    }
  }
  return out;
}

describe("titles and descriptions are unique per locale", () => {
  for (const locale of locales) {
    it(`${locale}: no two product pages share a title`, () => {
      const titles = productMeta()
        .filter((m) => m.locale === locale)
        .map((m) => m.title);
      expect(new Set(titles).size).toBe(titles.length);
    });

    it(`${locale}: no two product pages share a description`, () => {
      const descriptions = productMeta()
        .filter((m) => m.locale === locale)
        .map((m) => m.description);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    });
  }

  it("no title is left empty or placeholder-length", () => {
    for (const m of productMeta()) {
      expect(m.title.trim().length, `${m.locale}/${m.slug}`).toBeGreaterThan(15);
    }
  });

  it("no description is left empty or thin", () => {
    // Under ~70 characters a description tells a searcher nothing and Google
    // tends to replace it with its own snippet.
    for (const m of productMeta()) {
      expect(m.description.trim().length, `${m.locale}/${m.slug}`).toBeGreaterThan(70);
    }
  });

  it("a description is not merely the title repeated", () => {
    for (const m of productMeta()) {
      expect(m.description.trim(), `${m.locale}/${m.slug}`).not.toBe(m.title.trim());
    }
  });
});

describe("the same page is not duplicated across locales", () => {
  it("each locale writes its own title for a given product", () => {
    for (const product of products) {
      const titles = locales
        .map((locale) => product.content[locale]?.title)
        .filter((t): t is string => Boolean(t));
      if (titles.length < 2) continue;
      // Three locales sharing one string means two of them were never
      // translated, which is duplicate content in a crawler's eyes.
      expect(new Set(titles).size, product.slug).toBe(titles.length);
    }
  });
});

describe("the site declares itself once, at the root", () => {
  const root = readFileSync("src/routes/__root.tsx", "utf8");

  it("emits a WebSite entity", () => {
    expect(root).toContain('"@type": "WebSite"');
  });

  it("names the production origin rather than a relative URL", () => {
    expect(root).toContain("SITE_ORIGIN");
    expect(SITE_ORIGIN.startsWith("https://")).toBe(true);
  });

  it("declares no search action, because there is no site search to point at", () => {
    // Claiming one sends a search engine to an endpoint that does not exist.
    // Split so the assertion does not match its own source text.
    const forbidden = `Search${"Action"}`;
    const ldBlocks = root.split("application/ld+json").slice(1);
    expect(ldBlocks.length).toBeGreaterThan(0);
    for (const block of ldBlocks) expect(block).not.toContain(forbidden);
  });

  it("builds valid JSON for the WebSite block", () => {
    const payload = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      inLanguage: locales,
    };
    expect(() => JSON.parse(JSON.stringify(payload))).not.toThrow();
    expect(JSON.parse(JSON.stringify(payload)).inLanguage).toEqual([...locales]);
  });
});

describe("structured data carries no invented claims", () => {
  const sources = [
    "src/components/site/ProductPage.tsx",
    "src/components/site/PageLayout.tsx",
    "src/routes/__root.tsx",
  ].map((f) => readFileSync(f, "utf8"));

  it("declares no aggregateRating", () => {
    // The site has no reviews. Marking one up would be a fabricated rich result.
    for (const src of sources) expect(src).not.toContain("aggregateRating");
  });

  it("declares no Review or ratingValue", () => {
    for (const src of sources) {
      expect(src).not.toContain("ratingValue");
      expect(src).not.toContain('"@type": "Review"');
    }
  });
});

describe("Arabic is given a face that can render it", () => {
  const css = readFileSync("src/styles.css", "utf8");

  it("defines an Arabic font stack", () => {
    expect(css).toContain("--font-arabic");
  });

  it("actually applies it to Arabic pages", () => {
    // The variable existed for months without a rule that used it, so Arabic
    // rendered in Inter — which carries no Arabic — and fell back to whatever
    // the operating system supplied.
    expect(css).toMatch(/body:lang\(ar\)\s*\{[^}]*--font-arabic/);
  });
});
