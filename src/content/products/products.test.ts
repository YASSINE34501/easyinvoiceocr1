/**
 * Product localisation and honesty contract.
 *
 * Two classes of failure are covered. The first is the one the pages already
 * had: a French or Arabic URL rendering English copy. The second is subtler and
 * worse — claiming a capability the product does not have. Both are invisible
 * to a typecheck.
 */

import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n";
import { comingSoonProductSlugs, isComingSoonProduct, productBySlug, products } from "./index";
import { productUi } from "./ui";
import { canonicalUrl } from "@/config/seo";
import { buildSitemapXml } from "@/lib/seo/sitemap";
import { faqs as siteFaqs } from "@/config/site";

const EXPECTED = [
  "invoice-ocr",
  "receipt-to-excel",
  "pdf-invoice-parser",
  "image-to-excel",
  "ocr-api",
];

/** Latin runs that legitimately survive in French and Arabic product copy. */
const ALLOWED_LATIN = new Set([
  "easyinvoiceocr",
  "excel",
  "word",
  "json",
  "html",
  "http",
  "https",
  "pdf",
  "csv",
  "xlsx",
  "api",
  "ocr",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "unicode",
  "iso",
  "sdk",
  "sum",
  "erp",
  "libreoffice",
  "numbers",
  "google",
  "sheets",
  "tls",
  "retry",
  "after",
  // Plan names are proper nouns and render in Latin in the pricing UI too, so
  // translating them in prose would name a plan that does not exist.
  "business",
  "pro",
]);

describe("registry", () => {
  it("holds exactly the five content-driven products", () => {
    expect(products.map((p) => p.slug).sort()).toEqual([...EXPECTED].sort());
  });

  it("preserves every slug and route", () => {
    for (const slug of EXPECTED) {
      expect(productBySlug[slug]).toBeDefined();
      expect(productBySlug[slug]!.route).toBe(`/en/${slug}`);
    }
  });
});

describe("every product is complete in all three locales", () => {
  for (const product of products) {
    for (const locale of locales) {
      const c = product.content[locale];

      it(`${product.slug} / ${locale}: has every required field`, () => {
        expect(c.title.length).toBeGreaterThan(20);
        expect(c.description.length).toBeGreaterThan(60);
        expect(c.heading.length).toBeGreaterThan(10);
        expect(c.lede.length).toBeGreaterThan(50);
        expect(c.what.length).toBeGreaterThanOrEqual(3);
        expect(c.fields.length).toBeGreaterThanOrEqual(2);
        expect(c.audience.length).toBeGreaterThanOrEqual(3);
        expect(c.formats.length).toBeGreaterThanOrEqual(2);
        expect(c.capabilities.length).toBeGreaterThanOrEqual(4);
        expect(c.security.length).toBeGreaterThanOrEqual(4);
        expect(c.faqs.length).toBeGreaterThanOrEqual(4);
        expect(c.emptyState.length).toBeGreaterThan(20);
        expect(c.errorState.length).toBeGreaterThan(20);
        expect(c.a11y.uploadLabel.length).toBeGreaterThan(3);
        expect(c.a11y.previewLabel.length).toBeGreaterThan(3);
      });

      it(`${product.slug} / ${locale}: every internal link stays in this locale`, () => {
        const hrefs = [
          ...c.relatedGuides.map((l) => l.href),
          ...c.relatedTools.map((l) => l.href),
          c.solutionLink.href,
          c.cta.href,
        ];
        for (const href of hrefs) expect(href.startsWith(`/${locale}/`)).toBe(true);
      });

      it(`${product.slug} / ${locale}: links to blog guides, sibling tools and a solution`, () => {
        expect(c.relatedGuides.length).toBeGreaterThanOrEqual(2);
        for (const link of c.relatedGuides) expect(link.href).toContain("/blog/");
        expect(c.relatedTools.length).toBeGreaterThanOrEqual(2);
        expect(c.solutionLink.href).toContain("/solutions/");
      });
    }

    for (const locale of ["fr", "ar"] as Locale[]) {
      it(`${product.slug} / ${locale}: copy differs from English`, () => {
        expect(product.content[locale].heading).not.toBe(product.content.en.heading);
        expect(product.content[locale].description).not.toBe(product.content.en.description);
        expect(product.content[locale].what.join(" ")).not.toBe(product.content.en.what.join(" "));
      });
    }

    it(`${product.slug} / ar: contains no stray English prose`, () => {
      const c = product.content.ar;
      const text = [
        c.heading,
        c.lede,
        c.description,
        ...c.what,
        ...c.capabilities.flatMap((x) => [x.title, x.body]),
        ...c.audience.flatMap((x) => [x.title, x.body]),
        ...c.security,
        ...c.faqs.flatMap((f) => [f.q, f.a]),
        c.emptyState,
        c.errorState,
      ].join(" ");
      const stray = (text.match(/[A-Za-z]{3,}/g) ?? []).filter(
        (w) => !ALLOWED_LATIN.has(w.toLowerCase()),
      );
      expect(stray).toEqual([]);
    });
  }
});

describe("metadata uniqueness", () => {
  it("no two products share a title within a locale", () => {
    for (const locale of locales) {
      const titles = products.map((p) => p.content[locale].title);
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it("no two products share a description within a locale", () => {
    for (const locale of locales) {
      const d = products.map((p) => p.content[locale].description);
      expect(new Set(d).size).toBe(d.length);
    }
  });

  it("gives each locale of a product its own title", () => {
    for (const product of products) {
      const titles = locales.map((l) => product.content[l].title);
      expect(new Set(titles).size).toBe(locales.length);
    }
  });
});

describe("security copy matches what the code does", () => {
  it("never claims extraction runs on a server", () => {
    // Recognition happens in the browser (src/lib/extract/pipeline.ts). The
    // previous copy said "Extraction runs server-side", which was false.
    for (const product of products) {
      for (const locale of locales) {
        const joined = product.content[locale].security.join(" ").toLowerCase();
        expect(joined).not.toContain("server-side");
        expect(joined).not.toContain("côté serveur");
      }
    }
  });

  it("states that the document is not uploaded to be read", () => {
    const markers: Record<Locale, string> = {
      en: "not uploaded to a server",
      fr: "n'est pas envoyé à un serveur",
      ar: "لا يُرفع المستند إلى خادم",
    };
    for (const product of products) {
      for (const locale of locales) {
        expect(product.content[locale].security.join(" ")).toContain(markers[locale]);
      }
    }
  });
});

describe("the OCR API is not overclaimed anywhere", () => {
  const api = productBySlug["ocr-api"]!;

  it("is registered as coming-soon", () => {
    expect(api.availability).toBe("coming-soon");
    expect(comingSoonProductSlugs).toEqual(["ocr-api"]);
    expect(isComingSoonProduct("ocr-api")).toBe(true);
    expect(isComingSoonProduct("invoice-ocr")).toBe(false);
  });

  it("says it accepts no requests, in every locale", () => {
    const markers: Record<Locale, string> = {
      en: "does not accept requests",
      fr: "n'accepte aucune requête",
      ar: "لا تستقبل أي طلبات",
    };
    for (const locale of locales) {
      const text = [
        api.content[locale].description,
        api.content[locale].lede,
        ...api.content[locale].what,
        ...api.content[locale].capabilities.map((c) => c.body),
        ...api.content[locale].faqs.map((f) => f.a),
      ].join(" ");
      expect(text).toContain(markers[locale]);
    }
  });

  it("denies that API access is part of any plan, in every locale", () => {
    const markers: Record<Locale, string> = {
      en: "not part of any current plan",
      fr: "ne fait partie d'aucune formule actuelle",
      ar: "ليس جزءًا من أي باقة حالية",
    };
    for (const locale of locales) {
      const text = [
        ...api.content[locale].capabilities.map((c) => c.body),
        ...api.content[locale].faqs.map((f) => f.a),
      ].join(" ");
      expect(text).toContain(markers[locale]);
    }
  });

  it("promises no availability date", () => {
    const en = api.content.en.faqs
      .map((f) => f.a)
      .join(" ")
      .toLowerCase();
    expect(en).toContain("no date to give");
  });

  it("shows no endpoint paths, credentials or rate figures", () => {
    for (const locale of locales) {
      const text = JSON.stringify(api.content[locale]);
      // The old copy listed real-looking routes and headers, which read as
      // documentation for something callable.
      expect(text).not.toContain("/v1/documents");
      expect(text).not.toContain("Authorization");
      expect(text).not.toContain("X-RateLimit");
      expect(text).not.toContain("YOUR_API_KEY");
      expect(text).not.toContain("Bearer");
    }
  });

  it("carries a coming-soon badge and notice in the shared chrome", () => {
    for (const locale of locales) {
      expect(productUi[locale].comingSoonBadge.length).toBeGreaterThan(3);
      expect(productUi[locale].comingSoonNotice.length).toBeGreaterThan(40);
    }
  });

  it("is corrected in the site-wide FAQ too", () => {
    const answer = siteFaqs.find((f) => f.q === "Is an API available?")?.a ?? "";
    expect(answer).not.toContain("part of the Business plan");
    expect(answer.toLowerCase()).toContain("not yet");
  });
});

describe("sitemap and indexing", () => {
  const xml = buildSitemapXml();

  it("excludes every coming-soon product in all three locales", () => {
    for (const slug of comingSoonProductSlugs) {
      for (const locale of locales) {
        expect(xml).not.toContain(canonicalUrl(slug, locale));
      }
    }
  });

  it("still lists every live product in all three locales", () => {
    for (const product of products) {
      if (product.availability !== "live") continue;
      for (const locale of locales) {
        expect(xml).toContain(`<loc>${canonicalUrl(product.slug, locale)}</loc>`);
      }
    }
  });
});
