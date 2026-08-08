import { describe, expect, it } from "vitest";
import { dictionaries, locales, translate, type MessageKey } from "./index";

const englishKeys = Object.keys(dictionaries.en) as MessageKey[];

describe("dictionaries", () => {
  it.each(locales)("%s translates every message key", (locale) => {
    const missing = englishKeys.filter((key) => !dictionaries[locale][key]);
    expect(missing).toEqual([]);
  });

  it.each(locales)("%s has no extra keys", (locale) => {
    const extra = Object.keys(dictionaries[locale]).filter(
      (key) => !englishKeys.includes(key as MessageKey),
    );
    expect(extra).toEqual([]);
  });

  it("translates the new converter labels in every locale", () => {
    for (const locale of locales) {
      expect(translate(locale, "link.pdf-to-word")).toBeTruthy();
      expect(translate(locale, "link.image-to-word")).toBeTruthy();
      expect(translate(locale, "link.image-to-pdf")).toBeTruthy();
    }
  });
});

describe("translate", () => {
  it("fills placeholders", () => {
    expect(translate("en", "billing.pagesUsed", { used: 12, limit: 100 })).toBe(
      "12 of 100 pages used",
    );
  });

  it("leaves an unknown placeholder visible rather than printing undefined", () => {
    const result = translate("en", "billing.pagesUsed", { used: 12 });
    expect(result).toContain("{limit}");
    expect(result).not.toContain("undefined");
  });

  it("returns the message untouched when no parameters are given", () => {
    expect(translate("en", "conv.stage.completed")).toBe("Completed");
  });

  it("keeps every locale's placeholders consistent with English", () => {
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of englishKeys) {
      const expected = placeholders(dictionaries.en[key]);
      if (expected.length === 0) continue;
      for (const locale of locales) {
        expect(placeholders(dictionaries[locale][key]), `${locale}:${key}`).toEqual(expected);
      }
    }
  });
});
