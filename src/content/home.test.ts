/**
 * Homepage localisation contract.
 *
 * The homepage was the last page serving English prose to French and Arabic
 * visitors, and it was the hardest to notice because the navigation, footer
 * and pricing card around it were already translated. These assertions fail if
 * any of it falls back to English again.
 *
 * The Latin allowlist below is deliberately short. It covers brand names and
 * file formats only — the things that would be wrong to translate. It is not a
 * place to hide untranslated sentences: every entry is a proper noun or a
 * format, none is a common English word.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n";
import { homeContent, homeFor, type HomeContent } from "./home";

/** Brand names and formats that must stay in Latin script. */
const ALLOWED_LATIN = new Set([
  "easyinvoiceocr",
  "ocr",
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "excel",
  "csv",
  "json",
  "xlsx",
  "iso",
  "http",
  "api",
  "sdk",
  // The recognition-language chips are intentionally shown in their own
  // language, so "English" and "Français" appear on the Arabic page too.
  "english",
  "français",
]);

/** Every human-readable string in one locale, flattened. */
function allStrings(c: HomeContent): string[] {
  return [
    c.hero.h1Line1,
    c.hero.h1Line2,
    c.hero.description,
    c.hero.primaryCta,
    c.hero.secondaryCta,
    ...c.hero.badges,
    c.audience.heading,
    c.languages.label,
    c.howItWorks.heading,
    ...c.howItWorks.steps.flatMap((s) => [s.title, s.body]),
    c.extract.heading,
    c.extract.description,
    ...c.extract.fields,
    c.extract.sampleLabel,
    c.extract.panelTitle,
    c.extract.confidenceLabel,
    c.extract.previewAlt,
    c.workflows.heading,
    ...c.workflows.cards.flatMap((x) => [x.title, x.body]),
    c.global.heading,
    c.global.description,
    ...c.global.cards.flatMap((x) => [x.title, x.body]),
    c.faq.heading,
    ...c.faq.items.flatMap((f) => [f.q, f.a]),
    c.finalCta.heading,
    c.finalCta.body,
    c.finalCta.cta,
    c.a11y.uploadRegion,
    c.a11y.sampleInvoice,
  ];
}

describe("every locale is complete", () => {
  for (const locale of locales) {
    const c = homeFor(locale);

    it(`${locale}: no string is empty`, () => {
      for (const value of allStrings(c)) expect(value.trim().length).toBeGreaterThan(0);
    });

    it(`${locale}: prose surfaces are real sentences, not stubs`, () => {
      expect(c.hero.description.length).toBeGreaterThan(80);
      expect(c.extract.description.length).toBeGreaterThan(50);
      expect(c.global.description.length).toBeGreaterThan(50);
      for (const step of c.howItWorks.steps) expect(step.body.length).toBeGreaterThan(30);
      for (const item of c.faq.items) expect(item.a.length).toBeGreaterThan(50);
    });

    it(`${locale}: has the same section shape as every other locale`, () => {
      expect(c.hero.badges).toHaveLength(3);
      expect(c.howItWorks.steps).toHaveLength(3);
      expect(c.extract.fields).toHaveLength(6);
      expect(c.workflows.cards).toHaveLength(4);
      expect(c.global.cards).toHaveLength(3);
      expect(c.faq.items.length).toBeGreaterThanOrEqual(6);
      expect(c.languages.items).toHaveLength(3);
    });
  }
});

describe("French and Arabic do not fall back to English", () => {
  for (const locale of ["fr", "ar"] as Locale[]) {
    const other = homeFor(locale);
    const en = homeFor("en");

    it(`${locale}: no surface is byte-identical to English`, () => {
      const pairs: [string, string][] = [
        [other.hero.h1Line1, en.hero.h1Line1],
        [other.hero.description, en.hero.description],
        [other.hero.primaryCta, en.hero.primaryCta],
        [other.audience.heading, en.audience.heading],
        [other.howItWorks.heading, en.howItWorks.heading],
        [other.extract.heading, en.extract.heading],
        [other.workflows.heading, en.workflows.heading],
        [other.global.heading, en.global.heading],
        [other.faq.heading, en.faq.heading],
        [other.finalCta.heading, en.finalCta.heading],
      ];
      for (const [a, b] of pairs) expect(a).not.toBe(b);
    });

    it(`${locale}: every FAQ answer differs from the English one`, () => {
      other.faq.items.forEach((item, index) => {
        expect(item.a).not.toBe(en.faq.items[index]?.a);
      });
    });
  }

  it("ar: contains no stray English words", () => {
    // The strict case. Any Latin run that is not a brand or a format means an
    // English sentence survived into the Arabic homepage.
    const text = allStrings(homeFor("ar")).join(" ");
    const stray = (text.match(/[A-Za-z][A-Za-z'’]{2,}/g) ?? []).filter(
      (w) => !ALLOWED_LATIN.has(w.toLowerCase()),
    );
    expect(stray).toEqual([]);
  });

  it("fr: contains no English function words", () => {
    // A Latin-script scan cannot tell French from English — both use the same
    // alphabet — so this looks for words that exist in English and not in
    // French. An untranslated sentence will always carry several of them.
    const ENGLISH_ONLY = [
      "the",
      "your",
      "with",
      "into",
      "from",
      "and",
      "you",
      "that",
      "this",
      "which",
      "invoice",
      "receipt",
      "browser",
      "upload",
      "free",
      "every",
      "field",
      "built",
    ];
    const words = new Set(
      allStrings(homeFor("fr"))
        .join(" ")
        .toLowerCase()
        .match(/[a-zà-ÿ'’]+/g) ?? [],
    );
    const found = ENGLISH_ONLY.filter((w) => words.has(w));
    expect(found).toEqual([]);
  });
});

describe("the homepage no longer overstates what the product does", () => {
  const raw = JSON.stringify(homeContent);
  const SECTIONS = readFileSync("src/components/site/sections.tsx", "utf8");

  it("claims three recognition languages, not fifty", () => {
    expect(raw).not.toContain("50+");
    expect(raw).not.toContain("more than 50");
    for (const locale of locales) {
      // The strip lists exactly the vendored models: eng, fra, ara.
      expect(homeFor(locale).languages.items).toEqual(["English", "Français", "العربية"]);
    }
  });

  it("no longer renders the six-language list from siteConfig", () => {
    // siteConfig.languages advertises Spanish, German and Portuguese, for which
    // no recognition model is vendored.
    expect(SECTIONS).not.toContain("siteConfig.languages");
    expect(SECTIONS).not.toContain("siteConfig");
  });

  it("does not promise an API or an SDK on the developers card", () => {
    for (const locale of locales) {
      const card = homeFor(locale).workflows.cards[3]!;
      expect(card.body.toLowerCase()).not.toContain("powerful api");
      expect(card.body.toLowerCase()).not.toContain("sdks");
    }
    expect(homeFor("en").workflows.cards[3]!.body).toContain("not available yet");
    expect(homeFor("fr").workflows.cards[3]!.body).toContain("pas encore disponible");
    expect(homeFor("ar").workflows.cards[3]!.body).toContain("غير متاحة بعد");
  });

  it("labels the extraction preview as an example", () => {
    for (const locale of locales)
      expect(homeFor(locale).extract.sampleLabel.length).toBeGreaterThan(0);
    expect(SECTIONS).toContain("sampleLabel");
  });

  it("states that recognition runs in the browser", () => {
    expect(homeFor("en").hero.description).toContain("in your browser");
    expect(homeFor("fr").hero.description).toContain("dans votre navigateur");
    expect(homeFor("ar").hero.description).toContain("داخل متصفحك");
  });
});

describe("sections.tsx reads from the locale model", () => {
  const SECTIONS = readFileSync("src/components/site/sections.tsx", "utf8");

  it("imports the homepage content registry", () => {
    expect(SECTIONS).toContain('from "@/content/home"');
  });

  it("no longer hard-codes the English headings", () => {
    for (const phrase of [
      "Convert Any Invoice or",
      "How It Works",
      "Extract Every Invoice Field",
      "Built for Every Workflow",
      "Global by Design",
      "Frequently Asked Questions",
      "Ready to automate your invoice processing?",
      "Start Free Now",
      "Supported Languages:",
    ]) {
      expect(SECTIONS, phrase).not.toContain(phrase);
    }
  });
});
