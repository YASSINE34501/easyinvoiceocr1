/**
 * AdSense policy rules that must hold whatever else changes.
 *
 * These are not style preferences. Each one corresponds to a way a site gets
 * refused at AdSense review or breaks a consent obligation, and each was a real
 * gap in this codebase before the assertions existed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales, dictionaries } from "@/i18n";
import { adsConfig, adsRuntimeReady, isAdEligiblePath } from "./ads";
import { comingSoonProductSlugs } from "@/content/products";

const ADS_TXT = readFileSync("public/ads.txt", "utf8");
const AD_SLOT = readFileSync("src/components/site/AdSlot.tsx", "utf8");

describe("nothing can serve an ad in this build", () => {
  it("keeps the master switch off", () => {
    expect(adsConfig.enabled).toBe(false);
  });

  it("has no publisher id configured", () => {
    expect(adsConfig.clientId).toBe("");
  });

  it("refuses to consider itself runtime-ready", () => {
    expect(adsRuntimeReady()).toBe(false);
  });

  it("would still refuse if the flag were on but the id were absent or fake", () => {
    // adsRuntimeReady requires a ca-pub- prefix, so a placeholder cannot slip
    // through by being non-empty.
    expect(adsConfig.clientId.startsWith("ca-pub-")).toBe(false);
  });
});

describe("ads.txt declares no seller", () => {
  it("contains no seller record at all", () => {
    const records = ADS_TXT.split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    expect(records).toEqual([]);
  });

  it("contains no invented publisher id", () => {
    // A fabricated pub- line is worse than an empty file: it misdeclares who
    // may sell this site's inventory.
    expect(ADS_TXT).not.toMatch(/\bpub-\d{5,}/);
  });

  it("still explains what the owner must add", () => {
    expect(ADS_TXT).toContain("google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0");
  });
});

describe("denied routes", () => {
  const denied = [
    "/en/login",
    "/fr/signup",
    "/ar/forgot-password",
    "/en/reset-password",
    "/en/verify-email",
    "/fr/choose-plan",
    "/en/app",
    "/en/app/billing",
    "/en/app/settings",
    "/en/app/admin",
    "/fr/contact",
    "/en/terms",
    "/fr/privacy",
    "/ar/cookies",
    "/en/security",
  ];

  for (const path of denied) {
    it(`refuses ${path}`, () => expect(isAdEligiblePath(path)).toBe(false));
  }

  it("refuses an unknown route, so a 404 page can never carry an ad", () => {
    expect(isAdEligiblePath("/en/does-not-exist")).toBe(false);
    expect(isAdEligiblePath("/fr/nope/deeper")).toBe(false);
  });

  it("refuses every coming-soon product", () => {
    expect(comingSoonProductSlugs.length).toBeGreaterThan(0);
    for (const slug of comingSoonProductSlugs) {
      for (const locale of locales) {
        expect(isAdEligiblePath(`/${locale}/${slug}`), `${locale}/${slug}`).toBe(false);
      }
    }
  });

  it("refuses the API reference while the API is not operational", () => {
    for (const locale of locales) {
      expect(isAdEligiblePath(`/${locale}/api-reference`)).toBe(false);
    }
  });
});

describe("eligible routes", () => {
  const eligible = [
    "/en",
    "/fr",
    "/ar",
    "/en/invoice-ocr",
    "/fr/receipt-to-excel",
    "/ar/pdf-to-word",
    "/en/documentation",
    "/fr/help",
    "/ar/blog",
    "/en/blog/invoice-ocr-accuracy-guide",
    "/fr/solutions/accountants",
  ];

  for (const path of eligible) {
    it(`allows ${path}`, () => expect(isAdEligiblePath(path)).toBe(true));
  }
});

describe("consent", () => {
  it("blocks entirely when marketing consent is refused", () => {
    // The rule the previous implementation broke: with the
    // non-personalised flag on, a decided-but-refused consent still counted as
    // grounds to load, so Google's script reached someone who said no.
    expect(AD_SLOT).toContain(
      "const refusedMarketing = consent !== null && consent.marketing === false",
    );
    expect(AD_SLOT).toContain("!refusedMarketing &&");
  });

  it("only considers the non-personalised path while undecided", () => {
    expect(AD_SLOT).toContain("adsConfig.allowNonPersonalisedWithoutConsent && consent === null");
  });

  it("keeps the non-personalised escape hatch off by default", () => {
    expect(adsConfig.allowNonPersonalisedWithoutConsent).toBe(false);
  });

  it("keeps advertising consent separate from analytics consent", () => {
    // A visitor may accept measurement and refuse advertising.
    expect(AD_SLOT).toContain("consent?.marketing");
    expect(AD_SLOT).not.toContain("consent?.analytics");
  });
});

describe("placement and presentation", () => {
  it("injects the loader at most once per document", () => {
    expect(AD_SLOT).toContain("let scriptRequested = false");
    expect(AD_SLOT).toContain(
      'document.querySelector<HTMLScriptElement>("script[data-eio-adsense]")',
    );
  });

  it("reserves height for every variant, so a slot cannot shift the layout", () => {
    expect(AD_SLOT).toContain("RESERVED_HEIGHT");
    for (const variant of ["in-article", "banner", "sidebar"]) {
      expect(AD_SLOT).toContain(variant);
    }
  });

  it("only fills a slot as it approaches the viewport", () => {
    expect(AD_SLOT).toContain("IntersectionObserver");
    expect(AD_SLOT).toContain('rootMargin: "400px"');
  });

  it("withholds ads from accounts whose plan excludes them", () => {
    expect(AD_SLOT).toContain("adsAllowed");
  });

  it("labels the unit in the reader's language, not in English", () => {
    // The label was hard-coded "Advertisement", so a French or Arabic page
    // carried one untranslated word above every unit.
    expect(AD_SLOT).toContain('t("ads.label")');
    expect(AD_SLOT).not.toContain('label ?? "Advertisement"');
    for (const locale of locales) {
      expect(dictionaries[locale]["ads.label"].length).toBeGreaterThan(0);
    }
    expect(dictionaries.fr["ads.label"]).not.toBe(dictionaries.en["ads.label"]);
    expect(dictionaries.ar["ads.label"]).not.toBe(dictionaries.en["ads.label"]);
  });

  it("marks the unit up as an aside with its own label", () => {
    expect(AD_SLOT).toContain("<aside");
    expect(AD_SLOT).toContain("aria-label");
  });
});
