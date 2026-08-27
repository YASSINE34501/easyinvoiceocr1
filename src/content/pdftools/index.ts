/**
 * PDF Tools copy, assembled per locale.
 *
 * Three complete locales, no fallback. `Record<Locale, PdfToolsContent>` means
 * a missing translation is a compile error rather than an English sentence on
 * /fr or /ar — the recurring class of bug on this site.
 */

import type { Locale } from "@/i18n";
import type { PdfToolsContent, PdfToolCopy } from "./types";
import type { PdfToolSlug } from "@/lib/pdftools/types";
import { pdfToolsEn } from "./en";
import { pdfToolsFr } from "./fr";
import { pdfToolsAr } from "./ar";

export type { PdfToolsContent, PdfToolCopy, PdfToolsUi, PdfFaq } from "./types";

export const pdfToolsContent: Record<Locale, PdfToolsContent> = {
  en: pdfToolsEn,
  fr: pdfToolsFr,
  ar: pdfToolsAr,
};

export function pdfToolsCopy(locale: Locale): PdfToolsContent {
  return pdfToolsContent[locale];
}

export function pdfToolCopy(slug: PdfToolSlug, locale: Locale): PdfToolCopy {
  return pdfToolsContent[locale].tools[slug];
}
