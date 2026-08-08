import { describe, expect, it } from "vitest";
import {
  asciiDigits,
  detectCurrency,
  formatAmount,
  parseAmount,
  parseDate,
  dayFirstForLocale,
} from "./normalize";

describe("asciiDigits", () => {
  it("rewrites Arabic-Indic digits", () => {
    expect(asciiDigits("١٢٣٤٥")).toBe("12345");
    expect(asciiDigits("۱۲۳")).toBe("123");
  });

  it("leaves other characters untouched", () => {
    expect(asciiDigits("Total: ١٢٣ MAD")).toBe("Total: 123 MAD");
  });
});

describe("parseAmount", () => {
  it("reads en-style thousands and decimals", () => {
    expect(parseAmount("1,234.56")).toBe(1234.56);
    expect(parseAmount("$1,234.56")).toBe(1234.56);
    expect(parseAmount("12.50")).toBe(12.5);
  });

  it("reads fr/de-style thousands and decimals", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
    expect(parseAmount("1 234,56")).toBe(1234.56);
    expect(parseAmount("12,50")).toBe(12.5);
  });

  it("reads a non-breaking-space group separator", () => {
    expect(parseAmount("1 234,56")).toBe(1234.56);
    expect(parseAmount("1 234,56")).toBe(1234.56);
  });

  it("treats a single comma with three trailing digits as thousands", () => {
    expect(parseAmount("1,234")).toBe(1234);
    expect(parseAmount("1.234")).toBe(1234);
  });

  it("treats a single comma with two trailing digits as a decimal", () => {
    expect(parseAmount("1,23")).toBe(1.23);
  });

  it("reads Arabic-Indic amounts", () => {
    expect(parseAmount("١٢٣٤,٥٦")).toBe(1234.56);
  });

  it("handles negatives and accounting parentheses", () => {
    expect(parseAmount("-45.00")).toBe(-45);
    expect(parseAmount("(1,234.56)")).toBe(-1234.56);
    expect(parseAmount("45.00-")).toBe(-45);
  });

  it("strips currency symbols and codes", () => {
    expect(parseAmount("€ 99,90")).toBe(99.9);
    expect(parseAmount("MAD 1 500,00")).toBe(1500);
  });

  it("returns null for things that are not numbers", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("Total")).toBeNull();
    expect(parseAmount("N/A")).toBeNull();
    expect(parseAmount("...")).toBeNull();
    expect(parseAmount("--")).toBeNull();
  });

  it("repairs common OCR digit confusions inside numeric tokens", () => {
    expect(parseAmount("1O0.00")).toBe(100);
    expect(parseAmount("l2.50")).toBe(12.5);
  });

  it("does not mangle a word into a number", () => {
    expect(parseAmount("Total")).toBeNull();
    expect(parseAmount("Sous-total")).toBeNull();
  });
});

describe("formatAmount", () => {
  it("always gives two decimals", () => {
    expect(formatAmount(1234.5)).toBe("1234.50");
    expect(formatAmount(0)).toBe("0.00");
  });
});

describe("detectCurrency", () => {
  it("finds ISO codes", () => {
    expect(detectCurrency("Total 1234.56 USD")).toBe("USD");
    expect(detectCurrency("1 500,00 MAD")).toBe("MAD");
  });

  it("finds symbols", () => {
    expect(detectCurrency("$1,234.56")).toBe("USD");
    expect(detectCurrency("€99,90")).toBe("EUR");
    expect(detectCurrency("£10")).toBe("GBP");
  });

  it("does not match a code embedded in a longer word", () => {
    expect(detectCurrency("USDA inspection")).toBeNull();
  });

  it("returns null when there is no currency", () => {
    expect(detectCurrency("Total 1234.56")).toBeNull();
    expect(detectCurrency("")).toBeNull();
  });
});

describe("parseDate", () => {
  it("reads ISO dates", () => {
    expect(parseDate("2026-07-28")).toBe("2026-07-28");
    expect(parseDate("Date: 2026/07/28")).toBe("2026-07-28");
  });

  it("reads English month names", () => {
    expect(parseDate("28 July 2026")).toBe("2026-07-28");
    expect(parseDate("July 28, 2026")).toBe("2026-07-28");
    expect(parseDate("28 Jul 2026")).toBe("2026-07-28");
  });

  it("reads French month names", () => {
    expect(parseDate("28 juillet 2026")).toBe("2026-07-28");
    expect(parseDate("1 mars 2026")).toBe("2026-03-01");
  });

  it("reads Arabic month names", () => {
    expect(parseDate("28 يوليو 2026")).toBe("2026-07-28");
  });

  it("resolves numeric dates when one component exceeds 12", () => {
    expect(parseDate("28/07/2026")).toBe("2026-07-28");
    expect(parseDate("07/28/2026")).toBe("2026-07-28");
  });

  it("refuses ambiguous numeric dates without a locale hint", () => {
    expect(parseDate("03/04/2026")).toBeNull();
  });

  it("uses the locale hint for ambiguous numeric dates", () => {
    expect(parseDate("03/04/2026", true)).toBe("2026-04-03");
    expect(parseDate("03/04/2026", false)).toBe("2026-03-04");
  });

  it("expands two-digit years", () => {
    expect(parseDate("28/07/26")).toBe("2026-07-28");
    expect(parseDate("28/07/99")).toBe("1999-07-28");
  });

  it("rejects impossible dates", () => {
    expect(parseDate("2026-02-31")).toBeNull();
    expect(parseDate("2026-13-01")).toBeNull();
  });

  it("returns null for non-dates", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("Invoice")).toBeNull();
  });
});

describe("dayFirstForLocale", () => {
  it("is month-first only for English", () => {
    expect(dayFirstForLocale("en")).toBe(false);
    expect(dayFirstForLocale("fr")).toBe(true);
    expect(dayFirstForLocale("ar")).toBe(true);
  });
});
