/**
 * Blog localisation and SEO contract.
 *
 * The failure this suite exists to prevent is the one the blog already had:
 * a French URL that renders English prose. That is invisible to a typecheck,
 * survives a smoke test, and is only caught by asserting on the content itself.
 */

import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n";
import { blogBySlug, blogCategories, blogPosts, blogSlugs, relatedPosts } from "./blog";
import { canonicalUrl } from "@/config/seo";
import { buildSitemapXml } from "@/lib/seo/sitemap";

const EXPECTED_SLUGS = [
  "invoice-ocr-accuracy-guide",
  "receipts-to-spreadsheet-workflow",
  "multilingual-invoice-extraction",
  "gdpr-document-processing",
  "line-item-extraction-hard",
  "choosing-ocr-api",
  "what-is-browser-ocr",
  "tesseract-js-browser-ocr",
];

/** Latin letters outside a bracketed brand or unit. Used to spot English leakage. */
const LATIN_WORD = /[A-Za-z]{4,}/g;

/**
 * Terms that legitimately stay in Latin script in French and Arabic copy:
 * the brand, file formats, standards and protocol nouns.
 */
const ALLOWED_LATIN = new Set([
  "easyinvoiceocr",
  "excel",
  "word",
  "json",
  "html",
  "http",
  "https",
  "retry",
  "after",
  "cursor",
  "header",
  "iso",
  "rgpd",
  "gdpr",
  "pdf",
  "csv",
  "xlsx",
  "api",
  "ocr",
  "riyad",
  "riyadh",
  // Engineering proper nouns. These are names of projects, compilation
  // targets and file formats, not English prose: Arabic and French technical
  // writing keeps them in Latin script, and transliterating them would make
  // the articles harder to read rather than more localised.
  "tesseract",
  "webassembly",
  "wasm",
  "javascript",
  "simd",
  "lstm",
  "traineddata",
  "node",
  "modules",
]);

describe("article inventory", () => {
  it("publishes exactly the eight known articles", () => {
    expect([...blogSlugs].sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it("preserves every existing URL slug", () => {
    // These slugs may already be linked or indexed. Renaming one silently
    // breaks those links, so the test pins them.
    for (const slug of EXPECTED_SLUGS) expect(blogBySlug[slug]).toBeDefined();
  });

  it("orders the index newest first", () => {
    const dates = blogPosts.map((post) => post.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("has exactly one featured article", () => {
    expect(blogPosts.filter((post) => post.featured)).toHaveLength(1);
  });
});

describe("every article is complete in all three locales", () => {
  for (const post of blogPosts) {
    for (const locale of locales) {
      const content = post.content[locale];

      it(`${post.slug} / ${locale}: has all required fields`, () => {
        expect(content.title.length).toBeGreaterThan(20);
        expect(content.description.length).toBeGreaterThan(60);
        expect(content.heading.length).toBeGreaterThan(10);
        expect(content.category.length).toBeGreaterThan(0);
        expect(content.lede.length).toBeGreaterThan(40);
        expect(content.imageAlt.length).toBeGreaterThan(15);
        expect(content.cta.label.length).toBeGreaterThan(0);
        expect(content.cta.note.length).toBeGreaterThan(0);
      });

      it(`${post.slug} / ${locale}: has a real body, not a stub`, () => {
        expect(content.body.length).toBeGreaterThanOrEqual(4);
        const words = content.body
          .flatMap((block) => block.paragraphs)
          .join(" ")
          .split(/\s+/).length;
        // Word count is not comparable across these languages. Arabic carries
        // the definite article, prepositions and possessives as clitics on the
        // following word, so equivalent prose lands roughly 15% shorter than
        // English or French. A single threshold would either pass stubs in
        // English or fail complete Arabic articles.
        expect(words).toBeGreaterThan(locale === "ar" ? 150 : 180);
      });

      it(`${post.slug} / ${locale}: every block has prose`, () => {
        for (const block of content.body) {
          expect(block.paragraphs.length).toBeGreaterThan(0);
          for (const paragraph of block.paragraphs)
            expect(paragraph.trim().length).toBeGreaterThan(40);
        }
      });

      it(`${post.slug} / ${locale}: links stay inside this locale`, () => {
        for (const link of content.links) expect(link.href.startsWith(`/${locale}/`)).toBe(true);
        expect(content.cta.href.startsWith(`/${locale}/`)).toBe(true);
      });

      it(`${post.slug} / ${locale}: links to a product, a solution and a doc/help page`, () => {
        const hrefs = content.links.map((link) => link.href);
        expect(hrefs.length).toBeGreaterThanOrEqual(3);
        expect(hrefs.some((href) => href.includes("/solutions/"))).toBe(true);
        expect(
          hrefs.some(
            (href) =>
              href.includes("/documentation") ||
              href.includes("/help") ||
              href.includes("/security") ||
              href.includes("/api-reference"),
          ),
        ).toBe(true);
      });
    }
  }
});

describe("no English leaks into French or Arabic", () => {
  for (const post of blogPosts) {
    for (const locale of ["fr", "ar"] as Locale[]) {
      it(`${post.slug} / ${locale}: body differs from the English body`, () => {
        const other = post.content[locale].body.flatMap((b) => b.paragraphs).join(" ");
        const english = post.content.en.body.flatMap((b) => b.paragraphs).join(" ");
        expect(other).not.toBe(english);
      });

      it(`${post.slug} / ${locale}: headings differ from the English headings`, () => {
        expect(post.content[locale].heading).not.toBe(post.content.en.heading);
        expect(post.content[locale].description).not.toBe(post.content.en.description);
        expect(post.content[locale].category).not.toBe(post.content.en.category);
      });
    }

    it(`${post.slug} / ar: contains no stray English words`, () => {
      // Arabic is the strict case: any run of Latin letters that is not a
      // brand, format or protocol name means an English sentence survived.
      const text = [
        post.content.ar.heading,
        post.content.ar.lede,
        post.content.ar.description,
        ...post.content.ar.body.flatMap((b) => [...b.paragraphs, ...(b.list ?? [])]),
      ].join(" ");
      const stray = (text.match(LATIN_WORD) ?? []).filter(
        (word) => !ALLOWED_LATIN.has(word.toLowerCase()),
      );
      expect(stray).toEqual([]);
    });
  }
});

describe("titles and descriptions are unique", () => {
  it("no two locale variants of an article share a title", () => {
    for (const post of blogPosts) {
      const titles = locales.map((locale) => post.content[locale].title);
      expect(new Set(titles).size).toBe(locales.length);
    }
  });

  it("no two articles share a title within a locale", () => {
    for (const locale of locales) {
      const titles = blogPosts.map((post) => post.content[locale].title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it("no two articles share a description within a locale", () => {
    for (const locale of locales) {
      const descriptions = blogPosts.map((post) => post.content[locale].description);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });
});

describe("the OCR API is not overclaimed", () => {
  const api = blogBySlug["choosing-ocr-api"]!;

  it("says coming soon in every locale", () => {
    const markers: Record<Locale, string> = {
      en: "coming soon",
      fr: "prochainement",
      ar: "قريبًا",
    };
    for (const locale of locales) {
      const text = [
        api.content[locale].heading,
        ...api.content[locale].body.flatMap((b) => [b.heading ?? "", ...b.paragraphs]),
        api.content[locale].cta.note,
        ...api.content[locale].links.map((l) => l.label),
      ]
        .join(" ")
        .toLowerCase();
      expect(text).toContain(markers[locale].toLowerCase());
    }
  });

  it("states plainly that the API is not operational", () => {
    const en = api.content.en.body
      .flatMap((b) => b.paragraphs)
      .join(" ")
      .toLowerCase();
    expect(en).toContain("not yet available");
    expect(en).toContain("does not currently accept requests");
  });
});

describe("related articles", () => {
  it("every related slug resolves to a published article", () => {
    for (const post of blogPosts) {
      for (const slug of post.related) expect(blogBySlug[slug]).toBeDefined();
    }
  });

  it("never relates an article to itself", () => {
    for (const post of blogPosts) expect(post.related).not.toContain(post.slug);
  });

  it("gives every article at least two related reads", () => {
    for (const post of blogPosts) expect(relatedPosts(post).length).toBeGreaterThanOrEqual(2);
  });
});

describe("categories", () => {
  it("are localised, not shared across locales", () => {
    expect(blogCategories("en")).not.toEqual(blogCategories("fr"));
    expect(blogCategories("en")).not.toEqual(blogCategories("ar"));
  });

  it("cover every article in every locale", () => {
    for (const locale of locales) {
      const categories = blogCategories(locale);
      for (const post of blogPosts) expect(categories).toContain(post.content[locale].category);
    }
  });
});

describe("dates", () => {
  it("are valid ISO calendar dates", () => {
    for (const post of blogPosts) {
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(post.date))).toBe(false);
      if (post.updated) {
        expect(post.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Date.parse(post.updated)).toBeGreaterThanOrEqual(Date.parse(post.date));
      }
    }
  });

  it("carry a per-locale reading time", () => {
    for (const post of blogPosts) {
      for (const locale of locales) {
        expect(post.readingMinutes[locale]).toBeGreaterThan(0);
        expect(post.readingMinutes[locale]).toBeLessThan(60);
      }
    }
  });
});

describe("sitemap coverage", () => {
  const xml = buildSitemapXml();

  it("lists every article in every locale", () => {
    for (const slug of blogSlugs) {
      for (const locale of locales) {
        expect(xml).toContain(`<loc>${canonicalUrl(`blog/${slug}`, locale)}</loc>`);
      }
    }
  });

  it("lists the blog index too", () => {
    for (const locale of locales) {
      expect(xml).toContain(`<loc>${canonicalUrl("blog", locale)}</loc>`);
    }
  });
});
