/**
 * Documentation and Help localisation and honesty contract.
 *
 * Guards two things a typecheck cannot see: that /fr and /ar serve their own
 * prose rather than the English source, and that seven factual claims removed
 * from the old copy cannot come back through a future edit.
 */

import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n";
import {
  docChaptersFor,
  docSlugs,
  helpArticlesFor,
  helpCategoriesFor,
  helpSlugs,
  resources,
  resourcesUi,
} from "./index";
import { FREE_CONVERSION_ALLOWANCE } from "@/lib/billing/gate";
import { canonicalUrl } from "@/config/seo";
import { buildSitemapXml } from "@/lib/seo/sitemap";

/** Latin runs that legitimately survive in French and Arabic copy. */
const ALLOWED_LATIN = new Set([
  "easyinvoiceocr",
  "excel",
  "csv",
  "json",
  "pdf",
  "ocr",
  "api",
  "xlsx",
  "docx",
  "webp",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "iphone",
  "google",
  "numbers",
  "utf",
  "iso",
  "unicode",
  "business",
  "pro",
  "paypal",
  "delete",
  "letter",
  "sheets",
  "libreoffice",
  "word",
]);

describe("registry", () => {
  it("carries the same chapters and articles in every locale", () => {
    for (const locale of locales) {
      expect(docChaptersFor(locale).map((c) => c.slug)).toEqual(docSlugs);
      expect(helpArticlesFor(locale).map((a) => a.slug)).toEqual(helpSlugs);
    }
  });

  it("keeps six help categories per locale", () => {
    for (const locale of locales) expect(helpCategoriesFor(locale)).toHaveLength(6);
  });

  it("assigns every article to a category that exists in its locale", () => {
    for (const locale of locales) {
      const categories = helpCategoriesFor(locale);
      for (const article of helpArticlesFor(locale)) {
        expect(categories, `${article.slug}/${locale}`).toContain(article.category);
      }
    }
  });
});

describe("completeness", () => {
  for (const locale of locales) {
    it(`${locale}: every chapter has a title, summary and sections with prose`, () => {
      for (const chapter of docChaptersFor(locale)) {
        expect(chapter.title.length).toBeGreaterThan(3);
        expect(chapter.summary.length).toBeGreaterThan(25);
        expect(chapter.sections.length).toBeGreaterThanOrEqual(2);
        for (const section of chapter.sections) {
          // "CSV" is a legitimate three-character section title.
          expect(section.title.length).toBeGreaterThanOrEqual(3);
          expect(section.body.length).toBeGreaterThan(0);
          // Arabic encodes the same content in fewer characters as well as
          // fewer words, so the floor is a sentence rather than a fixed length
          // tuned to English.
          for (const p of section.body) expect(p.trim().length).toBeGreaterThan(30);
        }
      }
    });

    it(`${locale}: every help article has a question and a real answer`, () => {
      for (const article of helpArticlesFor(locale)) {
        expect(article.question.length).toBeGreaterThan(10);
        expect(article.answer.length).toBeGreaterThan(0);
        for (const p of article.answer) expect(p.trim().length).toBeGreaterThan(40);
      }
    });

    it(`${locale}: the page chrome is fully populated`, () => {
      const ui = resourcesUi(locale);
      for (const [key, value] of Object.entries(ui)) {
        if (typeof value === "string") expect(value.length, key).toBeGreaterThan(1);
      }
      expect(ui.relatedLinks.length).toBeGreaterThanOrEqual(3);
      for (const link of ui.relatedLinks) expect(link.href.startsWith(`/${locale}/`)).toBe(true);
      expect(ui.ctaHref.startsWith(`/${locale}/`)).toBe(true);
    });
  }
});

describe("no English leaks into French or Arabic", () => {
  for (const locale of ["fr", "ar"] as Locale[]) {
    it(`${locale}: documentation prose differs from English`, () => {
      const other = docChaptersFor(locale)
        .flatMap((c) => c.sections.flatMap((s) => s.body))
        .join(" ");
      const en = docChaptersFor("en")
        .flatMap((c) => c.sections.flatMap((s) => s.body))
        .join(" ");
      expect(other).not.toBe(en);
    });

    it(`${locale}: help answers differ from English`, () => {
      const other = helpArticlesFor(locale)
        .flatMap((a) => a.answer)
        .join(" ");
      const en = helpArticlesFor("en")
        .flatMap((a) => a.answer)
        .join(" ");
      expect(other).not.toBe(en);
    });

    it(`${locale}: categories and chrome differ from English`, () => {
      expect(helpCategoriesFor(locale)).not.toEqual(helpCategoriesFor("en"));
      expect(resourcesUi(locale).docTitle).not.toBe(resourcesUi("en").docTitle);
      expect(resourcesUi(locale).helpTitle).not.toBe(resourcesUi("en").helpTitle);
    });
  }

  it("ar: contains no stray English prose anywhere", () => {
    const ui = resourcesUi("ar");
    const text = [
      ...docChaptersFor("ar").flatMap((c) => [
        c.title,
        c.summary,
        ...c.sections.flatMap((s) => [s.title, ...s.body, ...(s.list ?? [])]),
      ]),
      ...helpArticlesFor("ar").flatMap((a) => [a.question, a.category, ...a.answer]),
      ...helpCategoriesFor("ar"),
      // Prose only. A URL such as ctaHref legitimately contains English slugs
      // and is not something a reader reads.
      ...Object.values(ui).filter((v): v is string => typeof v === "string" && !v.startsWith("/")),
      ...ui.relatedLinks.map((l) => l.label),
    ].join(" ");
    const stray = (text.match(/[A-Za-z]{3,}/g) ?? []).filter(
      (w) => !ALLOWED_LATIN.has(w.toLowerCase()),
    );
    expect(stray).toEqual([]);
  });
});

describe("metadata uniqueness", () => {
  it("gives documentation and help distinct titles in each locale", () => {
    for (const locale of locales) {
      const ui = resourcesUi(locale);
      expect(ui.docTitle).not.toBe(ui.helpTitle);
      expect(ui.docDescription).not.toBe(ui.helpDescription);
    }
  });

  it("gives each locale its own titles", () => {
    const docTitles = locales.map((l) => resourcesUi(l).docTitle);
    const helpTitles = locales.map((l) => resourcesUi(l).helpTitle);
    expect(new Set(docTitles).size).toBe(locales.length);
    expect(new Set(helpTitles).size).toBe(locales.length);
  });

  it("gives every help question a unique wording within its locale", () => {
    for (const locale of locales) {
      const questions = helpArticlesFor(locale).map((a) => a.question);
      expect(new Set(questions).size).toBe(questions.length);
    }
  });
});

describe("claims corrected from the previous copy", () => {
  const allText = (locale: Locale) => JSON.stringify(resources[locale]).toLowerCase();

  it("never mentions a 30-day trial or a 100-page allowance", () => {
    for (const locale of locales) {
      const text = allText(locale);
      expect(text).not.toContain("30-day");
      expect(text).not.toContain("30 jours");
      expect(text).not.toContain("100 pages");
      expect(text).not.toContain("١٠٠ صفحة");
    }
  });

  it("describes the free allowance as five conversions", () => {
    expect(FREE_CONVERSION_ALLOWANCE).toBe(5);
    expect(allText("en")).toContain("five successful conversions");
    expect(allText("fr")).toContain("cinq conversions réussies");
    expect(JSON.stringify(resources.ar)).toContain("خمس عمليات تحويل ناجحة");
  });

  it("never claims a conversion works without an account", () => {
    for (const locale of locales) {
      const text = allText(locale);
      expect(text).not.toContain("no account is needed");
      expect(text).not.toContain("without an account");
      expect(text).not.toContain("sans compte");
    }
  });

  it("never claims uploaded documents are stored", () => {
    // Recognition runs in the browser; only a conversion record is stored.
    for (const locale of locales) {
      const text = allText(locale);
      expect(text).not.toContain("signed url");
      expect(text).not.toContain("url signée");
    }
    expect(allText("en")).toContain("not uploaded to a server");
  });

  it("never invents a page or image cap that the code does not enforce", () => {
    // Only DEFAULT_MAX_FILE_BYTES (20 MB) is enforced.
    for (const locale of locales) {
      const text = allText(locale);
      expect(text).not.toContain("50 pages");
      expect(text).not.toContain("40 images");
    }
  });

  it("labels API access as coming soon and in no plan", () => {
    const markers: Record<Locale, string> = {
      en: "no working api",
      fr: "pas d'api en service",
      ar: "لا توجد واجهة برمجية عاملة",
    };
    for (const locale of locales) {
      const raw = locale === "ar" ? JSON.stringify(resources.ar) : allText(locale);
      expect(raw).toContain(markers[locale]);
    }
  });

  it("never promises to train on a customer document", () => {
    expect(allText("en")).toContain("not used to train");
    expect(allText("en")).not.toContain("improve the model");
  });
});

describe("sitemap", () => {
  const xml = buildSitemapXml();

  it("includes documentation and help in all three locales", () => {
    for (const slug of ["documentation", "help"]) {
      for (const locale of locales) {
        expect(xml).toContain(`<loc>${canonicalUrl(slug, locale)}</loc>`);
      }
    }
  });
});
