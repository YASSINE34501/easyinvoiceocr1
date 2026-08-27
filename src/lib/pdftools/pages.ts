/**
 * Page selection: turning what a person types into page indices.
 *
 * People write page ranges the way they say them — "1-3, 7, 9-" — one-based,
 * with an open end meaning "to the last page". Everything downstream works in
 * zero-based indices, and getting that boundary wrong silently removes the
 * wrong page, so the conversion lives in one place with tests around it rather
 * than being re-done at each call site.
 */

import { PdfToolError } from "./types";

const RANGE = /^(\d+)?\s*-\s*(\d+)?$/;

/**
 * Parses a selection against a document of `pageCount` pages.
 *
 * Returns zero-based indices, sorted, without duplicates: "3,1,1-2" and "1-3"
 * describe the same three pages and must behave identically.
 *
 * Throws rather than silently dropping anything a visitor got wrong — a page
 * number beyond the end is a mistake worth surfacing, not a no-op.
 */
export function parsePageSelection(selection: string, pageCount: number): number[] {
  if (pageCount <= 0) throw new PdfToolError("pdf_no_pages");

  const trimmed = selection.trim();
  if (trimmed === "") throw new PdfToolError("selection_empty");

  const indices = new Set<number>();

  for (const rawPart of trimmed.split(",")) {
    const part = rawPart.trim();
    if (part === "") continue;

    const range = RANGE.exec(part);
    if (range) {
      // "-5" means from the first page, "5-" means to the last.
      const from = range[1] ? Number(range[1]) : 1;
      const to = range[2] ? Number(range[2]) : pageCount;
      if (!Number.isInteger(from) || !Number.isInteger(to)) {
        throw new PdfToolError("selection_invalid");
      }
      if (from < 1 || to < 1 || from > pageCount || to > pageCount) {
        throw new PdfToolError("selection_out_of_range");
      }
      // "5-2" is a range written backwards, not an error worth refusing.
      const [lo, hi] = from <= to ? [from, to] : [to, from];
      for (let page = lo; page <= hi; page += 1) indices.add(page - 1);
      continue;
    }

    if (!/^\d+$/.test(part)) throw new PdfToolError("selection_invalid");
    const page = Number(part);
    if (page < 1 || page > pageCount) throw new PdfToolError("selection_out_of_range");
    indices.add(page - 1);
  }

  if (indices.size === 0) throw new PdfToolError("selection_empty");
  return [...indices].sort((a, b) => a - b);
}

/**
 * The pages left once a selection is removed.
 *
 * Refuses to empty the document: a PDF with no pages is not a document, and
 * every reader treats it as damaged.
 */
export function invertSelection(selection: number[], pageCount: number): number[] {
  const drop = new Set(selection);
  const kept: number[] = [];
  for (let index = 0; index < pageCount; index += 1) {
    if (!drop.has(index)) kept.push(index);
  }
  if (kept.length === 0) throw new PdfToolError("would_remove_every_page");
  return kept;
}

/**
 * Renders indices back into the one-based form a person recognises, collapsing
 * runs: [0,1,2,6] becomes "1-3, 7". Used in summaries so the visitor can check
 * what actually happened against what they asked for.
 */
export function formatPageSelection(indices: number[]): string {
  if (indices.length === 0) return "";
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0]!;
  let previous = start;

  for (const index of sorted.slice(1)) {
    if (index === previous + 1) {
      previous = index;
      continue;
    }
    parts.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
    start = index;
    previous = index;
  }
  parts.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
  return parts.join(", ");
}
