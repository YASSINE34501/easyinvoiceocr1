/**
 * No unsupported "AI-powered" claim while the only operational engine is
 * Tesseract.js.
 *
 * The site described its OCR as AI-powered in five places. The engine that
 * actually runs is Tesseract.js, in the browser (src/lib/extract/pipeline.ts).
 * The Gemini provider that would justify the phrase is not implemented and its
 * flag, GEMINI_OCR_ENABLED, is false.
 *
 * This suite fails if the phrase returns in any locale. It is deliberately
 * scoped to the *engine* claim: "AI" may legitimately appear elsewhere, for
 * example in a blog article discussing the field, so the assertions target the
 * marketing surfaces that describe what this product does today.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n";
import { homeFor } from "./home";
import { siteConfig } from "@/config/site";
import { dictionaries } from "@/i18n";

/** Files whose job is to describe the current product to a visitor. */
const SURFACES = [
  "src/content/home.ts",
  "src/routes/$locale.index.tsx",
  "src/routes/__root.tsx",
  "src/config/site.ts",
];

/** The claim, in each language it was written in. */
const AI_CLAIMS = [
  "AI-powered",
  "AI powered",
  "powered by AI",
  "artificial intelligence",
  "pilotée par l'IA",
  "piloté par l'IA",
  "par IA",
  "intelligence artificielle",
  "الذكاء الاصطناعي",
];

describe("no AI-powered claim on the product surfaces", () => {
  for (const file of SURFACES) {
    it(`${file} makes no AI claim`, () => {
      const src = readFileSync(file, "utf8");
      for (const claim of AI_CLAIMS) {
        expect(src, `${file} contains "${claim}"`).not.toContain(claim);
      }
    });
  }

  it("the footer tagline makes no AI claim in any locale", () => {
    for (const locale of locales) {
      const tagline = dictionaries[locale]["footer.tagline"];
      for (const claim of AI_CLAIMS) expect(tagline).not.toContain(claim);
    }
  });

  it("siteConfig no longer describes the product as AI-powered", () => {
    for (const claim of AI_CLAIMS) expect(siteConfig.description).not.toContain(claim);
  });
});

describe("the homepage describes what actually runs", () => {
  it("names OCR rather than AI, in every locale", () => {
    for (const locale of locales) {
      expect(homeFor(locale).hero.description).toContain("OCR");
    }
  });

  it("says processing happens in the browser, in every locale", () => {
    expect(homeFor("en").hero.description).toContain("in your browser");
    expect(homeFor("fr").hero.description).toContain("dans votre navigateur");
    expect(homeFor("ar").hero.description).toContain("من متصفحك");
  });

  it("keeps the meta description distinct from the visible paragraph", () => {
    // A search snippet that repeats the on-page paragraph verbatim wastes the
    // slot, so the two are written separately rather than copied.
    const route = readFileSync("src/routes/$locale.index.tsx", "utf8");
    for (const locale of locales) {
      expect(route).not.toContain(homeFor(locale).hero.description);
    }
  });

  it("keeps every meta description a readable length", () => {
    const route = readFileSync("src/routes/$locale.index.tsx", "utf8");
    const descriptions = [...route.matchAll(/description:\s*\n?\s*"([^"]+)"/g)].map((m) => m[1]!);
    expect(descriptions.length).toBeGreaterThanOrEqual(3);
    for (const d of descriptions) {
      expect(d.length).toBeGreaterThan(70);
      expect(d.length).toBeLessThan(200);
    }
  });
});

describe("the Gemini provider is still disabled", () => {
  it("has no implementation in the source tree", () => {
    // The AI claim can only become accurate once this exists and is enabled.
    // If a provider is added later, this test should be updated deliberately —
    // not deleted to make the claim pass.
    let found = false;
    try {
      readFileSync("src/lib/extract/gemini.server.ts", "utf8");
      found = true;
    } catch {
      found = false;
    }
    expect(found).toBe(false);
  });
});
