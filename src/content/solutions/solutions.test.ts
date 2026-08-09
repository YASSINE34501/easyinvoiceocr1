/**
 * Solution localisation and honesty contract.
 *
 * The regression this guards against is concrete and was visible in a
 * screenshot: /ar/solutions/accountants served Arabic navigation, correct RTL
 * and an English body. A typecheck cannot see that.
 *
 * It also pins four claims that were factually wrong in the previous English
 * copy, so they cannot come back through a future edit.
 */

import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n";
import { SOLUTION_SLUGS, solutionBySlug, solutions } from "./index";
import { FREE_CONVERSION_ALLOWANCE } from "@/lib/billing/gate";
import { NOINDEX_SLUGS, canonicalUrl, isNoindexSlug, robotsMeta } from "@/config/seo";
import { buildSitemapXml } from "@/lib/seo/sitemap";

/** Latin runs that legitimately survive in French and Arabic solution copy. */
const ALLOWED_LATIN = new Set([
  "easyinvoiceocr",
  "excel",
  "csv",
  "json",
  "pdf",
  "ocr",
  "api",
  "xlsx",
  "unicode",
  "sdk",
  "business",
  "pro",
  "libreoffice",
  "numbers",
  "google",
  "sheets",
  "erp",
]);

describe("registry", () => {
  it("holds exactly the four audience pages", () => {
    expect(solutions.map((s) => s.slug)).toEqual([...SOLUTION_SLUGS]);
  });

  it("keeps every existing slug and route", () => {
    for (const slug of SOLUTION_SLUGS) {
      expect(solutionBySlug[slug]).toBeDefined();
      expect(solutionBySlug[slug]!.route).toBe(`/en/solutions/${slug}`);
    }
  });
});

describe("every solution is complete in all three locales", () => {
  for (const solution of solutions) {
    for (const locale of locales) {
      const c = solution.content[locale];

      it(`${solution.slug} / ${locale}: has every required field`, () => {
        expect(c.title.length).toBeGreaterThan(25);
        expect(c.description.length).toBeGreaterThan(70);
        expect(c.heading.length).toBeGreaterThan(10);
        expect(c.lede.length).toBeGreaterThan(50);
        expect(c.intro.length).toBeGreaterThanOrEqual(2);
        expect(c.blocks.length).toBeGreaterThanOrEqual(5);
        expect(c.faqs.length).toBeGreaterThanOrEqual(3);
        expect(c.productLinks.length).toBeGreaterThanOrEqual(3);
        expect(c.blogLinks.length).toBeGreaterThanOrEqual(2);
        expect(c.cta.label.length).toBeGreaterThan(3);
        expect(c.cta.note.length).toBeGreaterThan(20);
        expect(c.a11y.navLabel.length).toBeGreaterThan(10);
        expect(c.emptyState.length).toBeGreaterThan(8);
        expect(c.errorState.length).toBeGreaterThan(15);
        for (const key of Object.values(c.labels)) expect(key.length).toBeGreaterThan(2);
      });

      it(`${solution.slug} / ${locale}: every link stays inside this locale`, () => {
        const hrefs = [
          ...c.productLinks.map((l) => l.href),
          ...c.blogLinks.map((l) => l.href),
          c.cta.href,
        ];
        for (const href of hrefs) expect(href.startsWith(`/${locale}/`)).toBe(true);
      });

      it(`${solution.slug} / ${locale}: links to at least two real blog articles`, () => {
        for (const link of c.blogLinks) expect(link.href).toContain("/blog/");
      });
    }

    for (const locale of ["fr", "ar"] as Locale[]) {
      it(`${solution.slug} / ${locale}: body differs from English`, () => {
        const other = solution.content[locale];
        const en = solution.content.en;
        expect(other.heading).not.toBe(en.heading);
        expect(other.description).not.toBe(en.description);
        expect(other.intro.join(" ")).not.toBe(en.intro.join(" "));
        expect(other.blocks.map((b) => b.body).join(" ")).not.toBe(
          en.blocks.map((b) => b.body).join(" "),
        );
      });
    }

    it(`${solution.slug} / ar: no English sentence survives`, () => {
      const c = solution.content.ar;
      const text = [
        c.heading,
        c.lede,
        c.description,
        ...c.intro,
        ...c.blocks.flatMap((b) => [b.title, b.body, ...(b.points ?? [])]),
        ...c.faqs.flatMap((f) => [f.q, f.a]),
        c.cta.note,
        c.a11y.navLabel,
        c.emptyState,
        c.errorState,
        ...Object.values(c.labels),
      ].join(" ");
      const stray = (text.match(/[A-Za-z]{3,}/g) ?? []).filter(
        (w) => !ALLOWED_LATIN.has(w.toLowerCase()),
      );
      expect(stray).toEqual([]);
    });
  }
});

describe("metadata uniqueness", () => {
  it("no two solutions share a title or description within a locale", () => {
    for (const locale of locales) {
      const titles = solutions.map((s) => s.content[locale].title);
      const descriptions = solutions.map((s) => s.content[locale].description);
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });

  it("gives each locale of a solution its own title", () => {
    for (const solution of solutions) {
      const titles = locales.map((l) => solution.content[l].title);
      expect(new Set(titles).size).toBe(locales.length);
    }
  });
});

describe("claims corrected from the previous copy", () => {
  it("never offers a monthly page allowance that does not exist", () => {
    // The old small-businesses page said "10 pages a month". The model is five
    // successful conversions, once per account.
    for (const solution of solutions) {
      for (const locale of locales) {
        const text = JSON.stringify(solution.content[locale]).toLowerCase();
        expect(text).not.toContain("10 pages a month");
        expect(text).not.toContain("10 pages par mois");
      }
    }
  });

  it("describes the free allowance as five conversions where it mentions it", () => {
    expect(FREE_CONVERSION_ALLOWANCE).toBe(5);
    const sb = solutionBySlug["small-businesses"]!;
    expect(sb.content.en.faqs.map((f) => f.a).join(" ")).toContain("Five successful conversions");
    expect(sb.content.fr.faqs.map((f) => f.a).join(" ")).toContain("Cinq conversions réussies");
    expect(sb.content.ar.faqs.map((f) => f.a).join(" ")).toContain("خمس عمليات تحويل ناجحة");
  });

  it("never claims the demo works without an account", () => {
    // ConversionGate refuses an anonymous visitor.
    for (const solution of solutions) {
      for (const locale of locales) {
        const text = JSON.stringify(solution.content[locale]).toLowerCase();
        expect(text).not.toContain("no account needed");
        expect(text).not.toContain("sans compte");
      }
    }
  });

  it("never claims documents are held in storage and read from signed URLs", () => {
    for (const solution of solutions) {
      for (const locale of locales) {
        const text = JSON.stringify(solution.content[locale]).toLowerCase();
        expect(text).not.toContain("signed url");
        expect(text).not.toContain("url signée");
      }
    }
  });

  it("does not present the API as callable on the developers page", () => {
    const dev = solutionBySlug["developers"]!;
    for (const locale of locales) {
      const text = JSON.stringify(dev.content[locale]);
      expect(text).not.toContain("/v1/documents");
      expect(text).not.toContain("Authorization");
      expect(text).not.toContain("Bearer");
      expect(text).not.toContain("X-API-Version");
    }
  });

  it("states the API is in no plan, in every locale", () => {
    const dev = solutionBySlug["developers"]!;
    const markers: Record<Locale, string> = {
      en: "not part of any current plan",
      fr: "ne fait partie d'aucune formule actuelle",
      ar: "ليس جزءًا من أي باقة حالية",
    };
    for (const locale of locales) {
      const text = [
        ...dev.content[locale].blocks.map((b) => b.body),
        ...dev.content[locale].faqs.map((f) => f.a),
      ].join(" ");
      expect(text).toContain(markers[locale]);
    }
  });
});

describe("indexing", () => {
  const xml = buildSitemapXml();

  it("keeps every solution in the sitemap in all three locales", () => {
    for (const slug of SOLUTION_SLUGS) {
      for (const locale of locales) {
        expect(xml).toContain(`<loc>${canonicalUrl(`solutions/${slug}`, locale)}</loc>`);
      }
    }
  });

  it("marks the API reference noindex", () => {
    expect(NOINDEX_SLUGS).toContain("api-reference");
    expect(isNoindexSlug("api-reference")).toBe(true);
    expect(robotsMeta("api-reference").content).toBe("noindex, nofollow");
  });

  it("excludes the API reference from the sitemap in all three locales", () => {
    for (const locale of locales) {
      expect(xml).not.toContain(canonicalUrl("api-reference", locale));
    }
  });

  it("keeps every noindex slug out of the sitemap, not just the API reference", () => {
    // The sitemap derives its exclusion from NOINDEX_SLUGS, so this holds for
    // any route added to that list later.
    for (const slug of NOINDEX_SLUGS) {
      for (const locale of locales) {
        expect(xml).not.toContain(`<loc>${canonicalUrl(slug, locale)}</loc>`);
      }
    }
  });
});
