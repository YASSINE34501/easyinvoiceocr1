import { describe, expect, it } from "vitest";
import {
  converterProducts,
  getProduct,
  homepageProducts,
  navProducts,
  planAllowsProduct,
  relatedProducts,
  requireProduct,
  sortedProducts,
} from "./products";
import { productLinks, allPublicSlugs } from "./nav";
import { converterContent } from "@/content/converters";
import { dictionaries, locales } from "@/i18n";
import { sitemapEntries, buildSitemapXml } from "@/lib/seo/sitemap";
import { isComingSoonProduct } from "@/content/products";

const NEW_PRODUCTS = ["pdf-to-word", "image-to-word", "image-to-pdf"];
const EXISTING_PRODUCTS = [
  "invoice-ocr",
  "receipt-to-excel",
  "pdf-invoice-parser",
  "image-to-excel",
  "ocr-api",
];

describe("product registry", () => {
  it("still contains every original product", () => {
    for (const slug of EXISTING_PRODUCTS) expect(getProduct(slug)).toBeDefined();
  });

  it("contains the three new converters", () => {
    for (const slug of NEW_PRODUCTS) expect(getProduct(slug)?.converter).toBeDefined();
  });

  it("throws a clear error for an unknown slug", () => {
    expect(() => requireProduct("nope")).toThrow(/Unknown product slug/);
  });

  it("gives every product copy in every locale", () => {
    for (const product of sortedProducts) {
      for (const locale of locales) {
        const copy = product.copy[locale];
        expect(copy.name.length, `${product.slug}/${locale} name`).toBeGreaterThan(0);
        expect(copy.title.length, `${product.slug}/${locale} title`).toBeGreaterThan(10);
        expect(copy.description.length, `${product.slug}/${locale} description`).toBeGreaterThan(
          50,
        );
        expect(copy.h1.length, `${product.slug}/${locale} h1`).toBeGreaterThan(10);
      }
    }
  });

  it("gives every product a unique title and description per locale", () => {
    for (const locale of locales) {
      const titles = sortedProducts.map((p) => p.copy[locale].title);
      const descriptions = sortedProducts.map((p) => p.copy[locale].description);
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });

  it("has a nav label message key for every product, in every locale", () => {
    for (const product of navProducts) {
      for (const locale of locales) {
        const key = `link.${product.slug}` as keyof (typeof dictionaries)["en"];
        expect(dictionaries[locale][key], `${product.slug}/${locale}`).toBeTruthy();
      }
    }
  });
});

describe("navigation and sitemap wiring", () => {
  it("puts the new converters in the Product menu", () => {
    const slugs = productLinks.map((link) => link.slug);
    for (const slug of NEW_PRODUCTS) expect(slugs).toContain(slug);
  });

  it("puts the new converters in the footer link set", () => {
    for (const slug of NEW_PRODUCTS) expect(allPublicSlugs).toContain(slug);
  });

  it("shows the new converters as homepage cards", () => {
    const slugs = homepageProducts.map((product) => product.slug);
    for (const slug of NEW_PRODUCTS) expect(slugs).toContain(slug);
  });

  it("includes every working product in the sitemap entries", () => {
    const slugs = sitemapEntries().map((entry) => entry.slug);
    for (const product of sortedProducts) {
      // A coming-soon product is deliberately absent. This assertion used to
      // require every product unconditionally, which would have kept the
      // non-functional OCR API advertised to search engines.
      if (isComingSoonProduct(product.slug)) {
        expect(slugs).not.toContain(product.slug);
        continue;
      }
      expect(slugs).toContain(product.slug);
    }
  });

  it("emits one localized URL per locale for each new converter", () => {
    const xml = buildSitemapXml("https://example.com");
    for (const slug of NEW_PRODUCTS) {
      for (const locale of locales) {
        expect(xml).toContain(`<loc>https://example.com/${locale}/${slug}</loc>`);
      }
      expect(xml).toContain(`hreflang="x-default" href="https://example.com/en/${slug}"`);
    }
  });

  it("keeps private routes out of the sitemap", () => {
    const xml = buildSitemapXml("https://example.com");
    for (const slug of ["app", "choose-plan", "login", "signup"]) {
      expect(xml).not.toContain(`/en/${slug}<`);
    }
  });
});

describe("plan availability", () => {
  it("lets a trial account use every standard converter", () => {
    for (const slug of [...NEW_PRODUCTS, "invoice-ocr", "receipt-to-excel"]) {
      expect(planAllowsProduct("trial", slug)).toBe(true);
    }
  });

  it("grants the OCR API to nobody while it is not operational", () => {
    // Previously Business resolved to true, so the application believed a
    // paying customer had API access that does not exist.
    for (const plan of ["trial", "pro", "business"] as const) {
      expect(planAllowsProduct(plan, "ocr-api")).toBe(false);
    }
  });

  it("returns false for a product that does not exist", () => {
    expect(planAllowsProduct("business", "nope")).toBe(false);
  });
});

describe("converter content", () => {
  it("provides formats, sections, limitations and FAQs in every locale", () => {
    for (const product of converterProducts) {
      for (const locale of locales) {
        const copy = converterContent[product.converter][locale];
        expect(copy.formats.length).toBeGreaterThan(2);
        expect(copy.sections.length).toBeGreaterThan(1);
        expect(copy.limitations.length).toBeGreaterThan(2);
        expect(copy.faqs.length).toBeGreaterThan(3);
      }
    }
  });

  it("states plainly that recognition accuracy is not measured", () => {
    const english = converterContent["image-to-word"].en;
    const text = [...english.limitations, ...english.faqs.map((f) => f.a)].join(" ").toLowerCase();
    expect(text).toContain("not measured");
  });
});

describe("relatedProducts", () => {
  it("never suggests the page you are already on", () => {
    for (const product of sortedProducts) {
      const related = relatedProducts(product.slug);
      expect(related.map((item) => item.slug)).not.toContain(product.slug);
      expect(related.length).toBeGreaterThan(0);
    }
  });
});
