/**
 * Layout analysis: positioned text fragments in, structured blocks out.
 *
 * Both readers produce the same intermediate shape — a list of lines, each
 * with positioned pieces — so headings, paragraphs, lists and simple tables
 * are detected once instead of once per converter.
 *
 * These are heuristics. They handle ordinary documents (reports, letters,
 * invoices, statements) well and deliberately fall back to plain paragraphs
 * rather than inventing structure that is not there.
 */

import type { DocBlock, Direction } from "./types";
import type { PdfPageText, PdfTextItem } from "./pdf";

// Hebrew, Arabic, Syriac, Thaana, NKo and the Arabic presentation forms.
// Written as escapes so no literal zero-width or format character ends up in
// this source file.
const RTL_CHARS = /[\u0591-\u07ff\u0870-\u089f\u08a0-\u08ff\ufb1d-\ufdff\ufe70-\ufefe]/;
const LTR_CHARS = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;

/** Decides a block's direction from its own characters, not from the locale. */
export function detectDirection(text: string): Direction {
  let rtl = 0;
  let ltr = 0;
  for (const char of text) {
    if (RTL_CHARS.test(char)) rtl += 1;
    else if (LTR_CHARS.test(char)) ltr += 1;
  }
  return rtl > ltr ? "rtl" : "ltr";
}

export function dominantDirection(blocks: DocBlock[]): Direction {
  let rtl = 0;
  let ltr = 0;
  for (const block of blocks) {
    if (block.kind === "image" || block.kind === "pageBreak") continue;
    if (block.dir === "rtl") rtl += 1;
    else ltr += 1;
  }
  return rtl > ltr ? "rtl" : "ltr";
}

/** One piece of text with a horizontal position, in any source coordinate system. */
export type Fragment = { text: string; x: number; width: number; size: number };

/** A visual line of text: fragments plus its vertical position and height. */
export type Line = {
  fragments: Fragment[];
  text: string;
  top: number;
  height: number;
  size: number;
  x0: number;
  x1: number;
};

const BULLET = /^\s*([•·▪◦‣∙⁃*−-])\s+/;
// Letter markers are only recognised with a closing bracket — "a) first" is a
// list, "J. Smith" is a name, and treating the latter as a list looks broken.
const ORDERED = /^\s*(?:(?:\d{1,3}|[\u0660-\u0669]{1,3})[.)\u061b]|[A-Za-z]\))\s+/;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/** Groups positioned PDF text items into visual lines, top to bottom. */
export function linesFromPdfPage(page: PdfPageText): Line[] {
  const items = page.items.filter((item) => item.str.trim().length > 0);
  if (items.length === 0) return [];

  const bodySize = median(items.map((i) => i.fontSize)) || 10;
  const tolerance = Math.max(1.5, bodySize * 0.5);

  // PDF user space has its origin at the bottom-left, so a larger y is higher
  // on the page; sorting by -y walks the page top to bottom.
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const buckets: PdfTextItem[][] = [];
  let current: PdfTextItem[] = [];
  let currentY = Number.NaN;

  for (const item of sorted) {
    if (current.length === 0 || Math.abs(item.y - currentY) <= tolerance) {
      if (current.length === 0) currentY = item.y;
      current.push(item);
    } else {
      buckets.push(current);
      current = [item];
      currentY = item.y;
    }
  }
  if (current.length > 0) buckets.push(current);

  return buckets.map((bucket) => {
    const ordered = [...bucket].sort((a, b) => a.x - b.x);
    const fragments: Fragment[] = ordered.map((item) => ({
      text: item.str,
      x: item.x,
      width: item.width,
      size: item.fontSize,
    }));
    const size = Math.max(...ordered.map((i) => i.fontSize));
    const top = -Math.max(...ordered.map((i) => i.y));
    return {
      fragments,
      text: joinFragments(fragments),
      top,
      height: Math.max(...ordered.map((i) => i.height)) || size,
      size,
      x0: Math.min(...fragments.map((f) => f.x)),
      x1: Math.max(...fragments.map((f) => f.x + f.width)),
    };
  });
}

/** Joins fragments, inserting a space only where the gap implies one. */
function joinFragments(fragments: Fragment[]): string {
  let out = "";
  let previousEnd = Number.NaN;
  for (const fragment of fragments) {
    const gap = fragment.x - previousEnd;
    if (out.length > 0 && !out.endsWith(" ") && !fragment.text.startsWith(" ")) {
      if (Number.isNaN(gap) || gap > fragment.size * 0.2) out += " ";
    }
    out += fragment.text;
    previousEnd = fragment.x + fragment.width;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** One cell of a visual row, with the x position it starts at. */
export type Cell = { text: string; x: number };

/**
 * Splits a line into cells wherever the horizontal gap between fragments is
 * wide enough to read as a column separator rather than a word space.
 *
 * Exported because the invoice/receipt parser reconstructs table columns from
 * the same positioned lines, and must split them exactly the way the layout
 * analyser does or the two would disagree about where a column starts.
 */
export function cellsOf(line: Line): Cell[] {
  const threshold = Math.max(line.size * 1.8, 8);
  const cells: { text: string; x: number }[] = [];
  let buffer: Fragment[] = [];

  for (const fragment of line.fragments) {
    if (buffer.length > 0) {
      const last = buffer[buffer.length - 1]!;
      const gap = fragment.x - (last.x + last.width);
      if (gap > threshold) {
        cells.push({ text: joinFragments(buffer), x: buffer[0]!.x });
        buffer = [];
      }
    }
    buffer.push(fragment);
  }
  if (buffer.length > 0) cells.push({ text: joinFragments(buffer), x: buffer[0]!.x });
  return cells.filter((cell) => cell.text.length > 0);
}

function columnsMatch(a: { x: number }[], b: { x: number }[], tolerance: number): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  let matched = 0;
  for (const cell of shorter) {
    if (longer.some((other) => Math.abs(other.x - cell.x) <= tolerance)) matched += 1;
  }
  return matched >= Math.max(2, Math.ceil(shorter.length * 0.6));
}

/**
 * Turns visual lines into document blocks.
 *
 * Order of decisions per run of lines: table (two or more lines sharing column
 * positions) → heading (noticeably larger than body text and short) → list
 * (leading bullet or number) → paragraph (wrapped lines merged).
 */
export function blocksFromLines(lines: Line[]): DocBlock[] {
  const usable = lines.filter((line) => line.text.trim().length > 0);
  if (usable.length === 0) return [];

  const bodySize = median(usable.map((line) => line.size)) || 10;
  const lineHeight = median(usable.map((line) => line.height)) || bodySize;
  const blocks: DocBlock[] = [];

  let index = 0;
  while (index < usable.length) {
    const line = usable[index]!;
    const cells = cellsOf(line);

    // --- table -----------------------------------------------------------
    if (cells.length >= 2) {
      const rows: string[][] = [];
      const anchors = cells;
      let cursor = index;
      while (cursor < usable.length) {
        const candidate = usable[cursor]!;
        const candidateCells = cellsOf(candidate);
        if (candidateCells.length < 2) break;
        if (cursor > index && !columnsMatch(anchors, candidateCells, Math.max(bodySize, 6))) break;
        rows.push(candidateCells.map((cell) => cell.text));
        cursor += 1;
      }
      if (rows.length >= 2) {
        const width = Math.max(...rows.map((r) => r.length));
        blocks.push({
          kind: "table",
          rows: rows.map((row) => [...row, ...Array(width - row.length).fill("")]),
          dir: detectDirection(rows.flat().join(" ")),
        });
        index = cursor;
        continue;
      }
    }

    // --- heading ---------------------------------------------------------
    if (line.size > bodySize * 1.15 && line.text.length <= 120) {
      const ratio = line.size / bodySize;
      blocks.push({
        kind: "heading",
        level: ratio > 1.6 ? 1 : ratio > 1.32 ? 2 : 3,
        text: line.text,
        dir: detectDirection(line.text),
      });
      index += 1;
      continue;
    }

    // --- list ------------------------------------------------------------
    const bulleted = BULLET.test(line.text);
    const numbered = !bulleted && ORDERED.test(line.text);
    if (bulleted || numbered) {
      const items: string[] = [];
      let cursor = index;
      while (cursor < usable.length) {
        const candidate = usable[cursor]!;
        const isBullet = BULLET.test(candidate.text);
        const isNumber = ORDERED.test(candidate.text);
        if (bulleted ? !isBullet : !isNumber) break;
        items.push(candidate.text.replace(BULLET, "").replace(ORDERED, "").trim());
        cursor += 1;
      }
      if (items.length > 0) {
        blocks.push({
          kind: "list",
          ordered: numbered,
          items,
          dir: detectDirection(items.join(" ")),
        });
        index = cursor;
        continue;
      }
    }

    // --- paragraph (wrapped lines merged) --------------------------------
    const parts: string[] = [line.text];
    let cursor = index + 1;
    while (cursor < usable.length) {
      const previous = usable[cursor - 1]!;
      const candidate = usable[cursor]!;
      const gap = candidate.top - previous.top;
      const sameBlock =
        gap > 0 &&
        gap < lineHeight * 1.75 &&
        Math.abs(candidate.size - previous.size) < bodySize * 0.2 &&
        cellsOf(candidate).length < 2 &&
        !BULLET.test(candidate.text) &&
        !ORDERED.test(candidate.text) &&
        candidate.size <= bodySize * 1.15;
      if (!sameBlock) break;
      parts.push(candidate.text);
      cursor += 1;
    }
    const text = mergeWrapped(parts);
    blocks.push({ kind: "paragraph", text, dir: detectDirection(text) });
    index = cursor;
  }

  return blocks;
}

/** Rejoins wrapped lines, repairing hyphenated word breaks. */
function mergeWrapped(parts: string[]): string {
  let text = "";
  for (const part of parts) {
    if (text.length === 0) {
      text = part;
      continue;
    }
    if (/[-­]$/.test(text)) text = text.slice(0, -1) + part.trimStart();
    else text += " " + part.trimStart();
  }
  return text.replace(/\s+/g, " ").trim();
}

export function blocksFromPdfPage(page: PdfPageText): DocBlock[] {
  return blocksFromLines(linesFromPdfPage(page));
}
