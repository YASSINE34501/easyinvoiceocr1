/**
 * PDF Tools — shared types.
 *
 * Deliberately separate from src/config/products.ts. That registry drives the
 * commercial products: navigation, homepage cards, the sitemap, ad eligibility
 * and plan entitlements. Adding thirty utilities to it would swamp eight
 * products that the business actually sells, and every one of those surfaces
 * would have to grow a filter to cope. This registry answers to nothing but the
 * PDF tools pages.
 *
 * Every operation here runs in the visitor's browser. Nothing is uploaded,
 * because there is no upload path in this application and the security page
 * says so in three languages.
 */

/** A page selection expressed the way a person writes one: "1-3, 7, 9-". */
export type PageSelection = string;

export type ToolCategory = "organise" | "edit";

export type PdfToolSlug =
  | "merge-pdf"
  | "split-pdf"
  | "remove-pages"
  | "extract-pages"
  | "organize-pdf"
  | "rotate-pdf"
  | "crop-pdf"
  | "page-numbers";

/** Where a generated number or label sits on the page. */
export type PagePosition =
  "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

export type RotationAngle = 90 | 180 | 270;

/**
 * One produced file. A tool returning several — Split, Extract — is zipped by
 * the caller; a tool returning one hands it over directly, because wrapping a
 * single PDF in an archive only makes the visitor do more work.
 */
export type OutputFile = {
  /** Filename including extension. */
  name: string;
  bytes: Uint8Array;
  mime: string;
};

export type ToolResult = {
  files: OutputFile[];
  /** Facts worth showing: pages in, pages out, bytes. Never invented. */
  summary: Record<string, string | number>;
};

/**
 * Every failure a visitor can cause.
 *
 * A closed union rather than free-form strings, so the three translation files
 * are checked against it: an operation that learns a new way to fail breaks the
 * build until en, fr and ar all have a sentence for it. An untranslated error
 * is the kind of thing that surfaces only on /ar, in front of a visitor, at the
 * moment something has already gone wrong.
 */
export type PdfErrorCode =
  | "file_empty"
  | "file_too_large"
  | "no_files"
  | "not_a_pdf"
  | "too_many_files"
  | "need_two_files"
  | "pdf_corrupt"
  | "pdf_encrypted"
  | "pdf_no_pages"
  | "pdf_too_many_pages"
  | "selection_empty"
  | "selection_invalid"
  | "selection_out_of_range"
  | "would_remove_every_page"
  | "crop_invalid"
  | "crop_too_large"
  | "font_invalid"
  | "font_missing_glyphs"
  | "font_size_invalid"
  | "output_invalid"
  | "unknown";

/** Raised for anything a visitor can cause and should be told about. */
export class PdfToolError extends Error {
  /** Maps to a translated message; never shown raw. */
  readonly code: PdfErrorCode;

  constructor(code: PdfErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PdfToolError";
    this.code = code;
  }
}

export function isPdfToolError(error: unknown): error is PdfToolError {
  return error instanceof PdfToolError;
}
