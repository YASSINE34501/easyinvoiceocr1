/**
 * Normalisation of the raw strings OCR returns.
 *
 * Everything here is deliberately conservative: a value that cannot be read
 * unambiguously comes back as null so the parser records "not found" rather
 * than guessing. A wrong total on an invoice is worse than a missing one.
 */

/** Arabic-Indic and Eastern Arabic-Indic digits mapped to ASCII. */
const DIGIT_MAP: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/** Rewrites any Arabic-Indic digits to ASCII, leaving everything else alone. */
export function asciiDigits(input: string): string {
  let out = "";
  for (const char of input) out += DIGIT_MAP[char] ?? char;
  return out;
}

/**
 * Characters OCR routinely confuses inside an otherwise numeric run.
 * Only applied when the surrounding token is already mostly digits.
 */
const OCR_DIGIT_CONFUSIONS: Record<string, string> = {
  O: "0",
  o: "0",
  D: "0",
  l: "1",
  I: "1",
  "|": "1",
  S: "5",
  B: "8",
};

function repairNumericToken(token: string): string {
  const digits = (token.match(/\d/g) ?? []).length;
  // Only repair when the token is already predominantly numeric, so a word
  // like "Total" is never mangled into "T0ta1".
  if (digits === 0 || digits < token.replace(/[^0-9A-Za-z|]/g, "").length - 2) return token;
  let out = "";
  for (const char of token) out += OCR_DIGIT_CONFUSIONS[char] ?? char;
  return out;
}

/**
 * Parses a monetary or quantity string into a number.
 *
 * Handles the three separator conventions the target locales use:
 *   1,234.56  (en)      1.234,56  (fr/de)      1 234,56  (fr, NBSP or space)
 * plus Arabic-Indic digits and a trailing or leading minus/parenthesis.
 *
 * Returns null when the string is not unambiguously a number.
 */
export function parseAmount(input: string): number | null {
  if (!input) return null;
  let text = asciiDigits(input).trim();
  if (!text) return null;

  // Accounting negatives: (1,234.56)
  let negative = false;
  const parenthesised = /^\((.*)\)$/.exec(text);
  if (parenthesised?.[1] !== undefined) {
    negative = true;
    text = parenthesised[1];
  }

  text = repairNumericToken(text);

  // Strip currency symbols, letters and stray marks, keep digits and separators.
  text = text.replace(/[^\d.,\u0020\u00a0\u202f\u2009\-+]/g, "").trim();
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }
  if (text.endsWith("-")) {
    negative = true;
    text = text.slice(0, -1);
  }
  text = text.replace(/[+\s\u00a0\u202f\u2009]/g, "");
  if (!text || !/\d/.test(text)) return null;
  // A bare separator run, or anything with letters left, is not a number.
  if (!/^[\d.,]+$/.test(text)) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let decimalSep: "," | "." | null = null;

  if (lastComma >= 0 && lastDot >= 0) {
    // Whichever appears last is the decimal separator.
    decimalSep = lastComma > lastDot ? "," : ".";
  } else if (lastComma >= 0) {
    const after = text.length - lastComma - 1;
    const commaCount = (text.match(/,/g) ?? []).length;
    // "1,234" with exactly three trailing digits and one comma is a thousands
    // group; "1,23" or "1,2345" is a decimal.
    decimalSep = commaCount === 1 && after !== 3 ? "," : null;
  } else if (lastDot >= 0) {
    const after = text.length - lastDot - 1;
    const dotCount = (text.match(/\./g) ?? []).length;
    decimalSep = dotCount === 1 && after !== 3 ? "." : null;
  }

  let normalised: string;
  if (decimalSep === ",") {
    normalised = text.replace(/\./g, "").replace(",", ".");
  } else if (decimalSep === ".") {
    normalised = text.replace(/,/g, "");
  } else {
    normalised = text.replace(/[.,]/g, "");
  }

  const value = Number(normalised);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** Formats a number back to a stable two-decimal string for export. */
export function formatAmount(value: number): string {
  return value.toFixed(2);
}

/* ------------------------------------------------------------------ */
/* Currency                                                            */
/* ------------------------------------------------------------------ */

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "د.إ": "AED",
  "د.م": "MAD",
  "د.ت": "TND",
  "ر.س": "SAR",
};

const CURRENCY_CODES = new Set([
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "MAD",
  "AED",
  "SAR",
  "TND",
  "DZD",
  "EGP",
  "QAR",
  "KWD",
]);

/** Finds a currency in a string. Returns an ISO code, or null. */
export function detectCurrency(input: string): string | null {
  if (!input) return null;
  const upper = input.toUpperCase();
  for (const code of CURRENCY_CODES) {
    // Word boundary so "USDA" does not read as USD.
    if (new RegExp(`(^|[^A-Z])${code}([^A-Z]|$)`).test(upper)) return code;
  }
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (input.includes(symbol)) return code;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const MONTHS: Record<string, number> = {
  // English
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
  // French
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
  // Arabic
  يناير: 1,
  فبراير: 2,
  مارس: 3,
  أبريل: 4,
  مايو: 5,
  يونيو: 6,
  يوليو: 7,
  أغسطس: 8,
  سبتمبر: 9,
  أكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
};

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31 February and friends: the roll-over changes the month.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fullYear(value: number): number {
  if (value >= 1000) return value;
  // Two-digit years: 70-99 read as 1900s, 00-69 as 2000s.
  return value >= 70 ? 1900 + value : 2000 + value;
}

/**
 * Parses a date to ISO `YYYY-MM-DD`.
 *
 * Ambiguous all-numeric dates (where both components could be the day) return
 * null unless `dayFirst` is given by the caller's locale, because reading
 * 03/04/2026 as the wrong one silently corrupts an invoice.
 */
export function parseDate(input: string, dayFirst?: boolean): string | null {
  if (!input) return null;
  const text = asciiDigits(input).trim();
  if (!text) return null;

  // ISO first — never ambiguous.
  const isoMatch = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(text);
  if (isoMatch) {
    return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  // Month name in any of the three languages — also never ambiguous.
  const named =
    /(\d{1,2})(?:st|nd|rd|th|er)?\s+(?:de\s+|of\s+)?([\p{L}]+)\.?\s+(\d{2,4})/u.exec(text) ??
    /([\p{L}]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})/u.exec(text);
  if (named) {
    const first = named[1] ?? "";
    const second = named[2] ?? "";
    const yearPart = named[3] ?? "";
    const dayText = /^\d+$/.test(first) ? first : second;
    const monthText = /^\d+$/.test(first) ? second : first;
    const month = MONTHS[monthText.toLowerCase()];
    if (month !== undefined) {
      return iso(fullYear(Number(yearPart)), month, Number(dayText));
    }
  }

  // All-numeric d/m/y or m/d/y.
  const numeric = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(text);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    const year = fullYear(Number(numeric[3]));
    if (a > 12 && b <= 12) return iso(year, b, a); // a must be the day
    if (b > 12 && a <= 12) return iso(year, a, b); // b must be the day
    if (a <= 12 && b <= 12) {
      if (dayFirst === true) return iso(year, b, a);
      if (dayFirst === false) return iso(year, a, b);
      return null; // genuinely ambiguous — do not guess
    }
  }

  return null;
}

/** Locale convention for all-numeric dates. English is month-first. */
export function dayFirstForLocale(locale: string): boolean {
  return locale !== "en";
}
