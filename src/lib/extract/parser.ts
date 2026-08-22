/**
 * Invoice and receipt parsing.
 *
 * Input is the same positioned-line shape both readers produce (PDF text layer
 * and Tesseract OCR), so a native PDF and a photographed receipt go through one
 * parser. Column reconstruction uses the x coordinates of the recognised words
 * rather than splitting on whitespace, which is what makes a two-column table
 * survive a slightly skewed scan.
 *
 * The parser never invents a value. A field that is not present on the document
 * is absent from the result, and every value it does return carries a
 * confidence and, where the arithmetic disagrees, a warning. Anything uncertain
 * is flagged for manual review rather than silently exported.
 */

import { cellsOf, type Cell, type Line } from "@/lib/convert/layout";
import {
  AMOUNT_FIELDS,
  DATE_FIELDS,
  matchFieldLabel,
  matchItemHeader,
  type FieldKey,
  type ItemColumn,
} from "./labels";
import { detectCurrency, formatAmount, parseAmount, parseDate } from "./normalize";

export type ExtractedField = {
  key: FieldKey;
  /** Normalised value: ISO date, fixed-2 amount, or trimmed text. */
  value: string;
  /** Exactly what was read from the document, kept for the review screen. */
  raw: string;
  /** 0–1. Combines label specificity, parse success and arithmetic agreement. */
  confidence: number;
  needsReview: boolean;
};

export type ExtractedLineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  needsReview: boolean;
};

export type WarningCode =
  | "no_fields_found"
  | "no_line_items"
  | "line_total_mismatch"
  | "items_vs_subtotal_mismatch"
  | "total_mismatch"
  | "tax_rate_mismatch"
  | "low_ocr_confidence"
  | "ambiguous_date"
  /** A document is missing an identifier, a date or a total it should carry. */
  | "missing_key_fields"
  /** Rows were still readable after the last table the parser consumed. */
  | "unconsumed_content";

export type ValidationWarning = {
  code: WarningCode;
  /** Fields the warning is about, so the review screen can highlight them. */
  fields: FieldKey[];
  /** Row index into lineItems, when the warning is about one row. */
  itemIndex?: number;
  detail?: Record<string, string>;
};

export type ExtractedDocument = {
  kind: "invoice" | "receipt";
  currency: string | null;
  fields: ExtractedField[];
  lineItems: ExtractedLineItem[];
  warnings: ValidationWarning[];
  /** True when anything at all should be checked by a human before export. */
  needsReview: boolean;
  /** OCR engine confidence 0–100, or null when the text layer was used. */
  ocrConfidence: number | null;
};

export type ParseOptions = {
  kind: "invoice" | "receipt";
  /** Interface locale, used only to disambiguate all-numeric dates. */
  dayFirst?: boolean | undefined;
  ocrConfidence?: number | null | undefined;
};

/** Amounts within this fraction of each other are treated as agreeing. */
const AMOUNT_TOLERANCE = 0.02;
/** Below this, a field is sent to manual review. */
const REVIEW_THRESHOLD = 0.75;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `item_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function nearly(a: number, b: number, tolerance = AMOUNT_TOLERANCE): boolean {
  return Math.abs(a - b) <= Math.max(tolerance, Math.abs(b) * 0.01);
}

/* ------------------------------------------------------------------ */
/* Field extraction                                                    */
/* ------------------------------------------------------------------ */

/**
 * Splits a labelled line into its label and value halves.
 *
 * Tries the coordinate cells first — on a real invoice the value sits in its
 * own column — and falls back to text after a colon.
 */
function valueForLabel(line: Line, cells: Cell[]): string {
  if (cells.length >= 2) {
    const rest = cells
      .slice(1)
      .map((cell) => cell.text)
      .join(" ")
      .trim();
    if (rest) return rest;
  }
  const colon = /[:：]\s*(.+)$/.exec(line.text);
  if (colon?.[1]) return colon[1].trim();
  return "";
}

type FieldCandidate = { key: FieldKey; raw: string; confidence: number };

function extractFields(
  lines: Line[],
  options: ParseOptions,
): {
  fields: ExtractedField[];
  warnings: ValidationWarning[];
} {
  const candidates = new Map<FieldKey, FieldCandidate>();
  const warnings: ValidationWarning[] = [];

  for (const [index, line] of lines.entries()) {
    const key = matchFieldLabel(line.text);
    if (!key) continue;

    const cells = cellsOf(line);
    let raw = valueForLabel(line, cells);

    // Header-style layouts put the value on the line below the label.
    if (!raw) {
      const next = lines[index + 1];
      // Only when the next line is not itself a label, so "Total" followed by
      // "Tax" does not read the word "Tax" as the total.
      if (next && !matchFieldLabel(next.text)) raw = next.text.trim();
    }
    if (!raw) continue;

    // A later occurrence of the same label usually sits in the summary block
    // and is the authoritative one, so keep the last unless the first parsed
    // and the later one did not.
    const existing = candidates.get(key);
    const confidence = 0.9;
    if (existing && !parseableFor(key, raw, options) && parseableFor(key, existing.raw, options)) {
      continue;
    }
    candidates.set(key, { key, raw, confidence });
  }

  const fields: ExtractedField[] = [];
  for (const candidate of candidates.values()) {
    const normalised = normaliseField(candidate.key, candidate.raw, options);
    if (normalised === null) {
      // A label was present but its value could not be read. Surface it as a
      // low-confidence field so the reviewer can fill it in, rather than
      // dropping it silently or inventing a number.
      if (AMOUNT_FIELDS.has(candidate.key) || DATE_FIELDS.has(candidate.key)) {
        if (DATE_FIELDS.has(candidate.key) && /\d/.test(candidate.raw)) {
          warnings.push({ code: "ambiguous_date", fields: [candidate.key] });
        }
        fields.push({
          key: candidate.key,
          value: "",
          raw: candidate.raw,
          confidence: 0.2,
          needsReview: true,
        });
      }
      continue;
    }
    fields.push({
      key: candidate.key,
      value: normalised,
      raw: candidate.raw,
      confidence: candidate.confidence,
      needsReview: candidate.confidence < REVIEW_THRESHOLD,
    });
  }

  return { fields, warnings };
}

function parseableFor(key: FieldKey, raw: string, options: ParseOptions): boolean {
  return normaliseField(key, raw, options) !== null;
}

function normaliseField(key: FieldKey, raw: string, options: ParseOptions): string | null {
  if (AMOUNT_FIELDS.has(key)) {
    const amount = parseAmount(raw);
    return amount === null ? null : formatAmount(amount);
  }
  if (DATE_FIELDS.has(key)) {
    return parseDate(raw, options.dayFirst);
  }
  if (key === "taxRate") {
    const rate = parseAmount(raw.replace("%", ""));
    return rate === null ? null : String(rate);
  }
  if (key === "documentNumber") {
    // Keep the identifier as printed, minus any leading punctuation.
    const cleaned = raw.replace(/^[\s:#-]+/, "").trim();
    return cleaned || null;
  }
  const cleaned = raw.trim();
  return cleaned || null;
}

/* ------------------------------------------------------------------ */
/* Line items                                                          */
/* ------------------------------------------------------------------ */

type ColumnMap = { column: ItemColumn; x: number }[];

type ItemTable = { headerIndex: number; columns: ColumnMap };

/** Reads one line as a table header, or returns null when it is not one. */
function headerAt(lines: Line[], index: number): ColumnMap | null {
  const line = lines[index];
  if (!line) return null;
  const cells = cellsOf(line);
  if (cells.length < 2) return null;

  const columns: ColumnMap = [];
  const seen = new Set<ItemColumn>();
  for (const cell of cells) {
    const column = matchItemHeader(cell.text);
    if (column && !seen.has(column)) {
      seen.add(column);
      columns.push({ column, x: cell.x });
    }
  }
  // Two identified columns is the minimum that can carry a table; requiring a
  // description plus one number avoids latching onto a summary block.
  if (columns.length >= 2 && (seen.has("description") || seen.has("lineTotal"))) {
    return columns;
  }
  return null;
}

/**
 * Finds every item table in the document, not just the first.
 *
 * A multi-page invoice repeats its header on each page, and the reader hands us
 * all pages concatenated. Returning only the first header meant every row after
 * the first page's table was dropped — silently, because the rows that follow
 * simply fall outside the one range that was ever read. Scanning for all
 * headers keeps each page's rows and preserves document order.
 *
 * Headers that fall inside a table already consumed are skipped by the caller,
 * so a reprinted header never starts a second table over the same rows.
 */
function findItemTables(lines: Line[]): ItemTable[] {
  const tables: ItemTable[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const columns = headerAt(lines, index);
    if (columns) tables.push({ headerIndex: index, columns });
  }
  return tables;
}

/** Assigns a cell to the nearest column that starts at or before it. */
function columnFor(cell: Cell, columns: ColumnMap, tolerance: number): ItemColumn | null {
  let best: { column: ItemColumn; distance: number } | null = null;
  for (const { column, x } of columns) {
    const distance = Math.abs(cell.x - x);
    if (distance <= tolerance && (best === null || distance < best.distance)) {
      best = { column, distance };
    }
  }
  return best?.column ?? null;
}

/**
 * How many consecutive non-row lines may sit inside one table before it is
 * considered finished. A page break inserts a footer, a header and often a
 * repeated address block between two halves of the same table, so a single
 * stray line must not end it — but an unbounded gap would swallow the rest of
 * the document.
 */
const MAX_GAP_LINES = 8;

/**
 * The labels that close an item table.
 *
 * Only the summary block ends it. The identifier, the dates and the party names
 * are reprinted at the top of every page of a long invoice, so treating any
 * label as a terminator cut the table at the first page break.
 */
const SUMMARY_LABELS: ReadonlySet<FieldKey> = new Set<FieldKey>([
  "subtotal",
  "discount",
  "taxRate",
  "taxAmount",
  "total",
]);

/**
 * Decides whether a line is an item row, given the table's columns.
 *
 * The test is positive rather than "anything that is not a terminator": a
 * reprinted header block sits inside the same column band as the table, and a
 * negative test let "Invoice Number: INV-2026-0042" through as a row. A real
 * row always carries a number in a quantity, unit-price or amount column.
 */
function rowFrom(
  line: Line,
  columns: ColumnMap,
  tolerance: number,
): Partial<Record<ItemColumn, string>> | null {
  const cells = cellsOf(line);
  if (cells.length < 2) return null;

  const row: Partial<Record<ItemColumn, string>> = {};
  let mapped = 0;
  let numeric = false;
  for (const cell of cells) {
    const column = columnFor(cell, columns, tolerance);
    if (!column) continue;
    mapped += 1;
    row[column] = row[column] ? `${row[column]} ${cell.text}`.trim() : cell.text.trim();
    if (column !== "description" && parseAmount(cell.text) !== null) numeric = true;
  }

  return mapped >= 2 && numeric ? row : null;
}

function extractLineItems(
  lines: Line[],
  found: ItemTable,
): { items: ExtractedLineItem[]; endIndex: number } {
  const { headerIndex, columns } = found;
  const items: ExtractedLineItem[] = [];
  const tolerance = Math.max(40, (lines[headerIndex]?.size ?? 10) * 4);
  let gap = 0;
  let endIndex = headerIndex;

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;

    // A summary row ("Subtotal", "Total") terminates the item table. Only the
    // summary block does: metadata labels reappear on every page.
    const labelHit = matchFieldLabel(line.text);
    if (labelHit && SUMMARY_LABELS.has(labelHit)) break;

    // A repeated column header starts the next page of this same table. Skipping
    // it keeps the titles out of the rows and lets the table continue.
    if (headerAt(lines, index)) {
      gap = 0;
      endIndex = index;
      continue;
    }

    const row = rowFrom(line, columns, tolerance);
    if (!row) {
      // Footers, addresses and reprinted headers sit between two halves of one
      // table. Ending on the first of them is what lost every row after a page
      // break; a bounded run of them keeps the table open without running away.
      if (items.length > 0 && (gap += 1) > MAX_GAP_LINES) break;
      continue;
    }

    const description = (row.description ?? "").trim();
    const quantity = row.quantity ? parseAmount(row.quantity) : null;
    const unitPrice = row.unitPrice ? parseAmount(row.unitPrice) : null;
    const lineTotal = row.lineTotal ? parseAmount(row.lineTotal) : null;

    // A row with no description and no money on it is not an item.
    if (!description && lineTotal === null && unitPrice === null) {
      if (items.length > 0 && (gap += 1) > MAX_GAP_LINES) break;
      continue;
    }

    gap = 0;
    endIndex = index;
    items.push({
      id: nextId(),
      description,
      quantity: quantity === null ? "" : String(quantity),
      unitPrice: unitPrice === null ? "" : formatAmount(unitPrice),
      lineTotal: lineTotal === null ? "" : formatAmount(lineTotal),
      needsReview: false,
    });
  }

  return { items, endIndex };
}

/**
 * Walks every table in the document and returns the rows in reading order.
 *
 * Tables that begin inside a range already consumed are skipped: a repeated
 * page header is part of the table it continues, not the start of a new one.
 */
function extractAllLineItems(
  lines: Line[],
  tables: ItemTable[],
): { items: ExtractedLineItem[]; lastIndex: number } {
  const items: ExtractedLineItem[] = [];
  let consumedTo = -1;

  for (const table of tables) {
    if (table.headerIndex <= consumedTo) continue;
    const { items: rows, endIndex } = extractLineItems(lines, table);
    items.push(...rows);
    consumedTo = Math.max(consumedTo, endIndex);
  }

  return { items, lastIndex: consumedTo };
}

/**
 * Reports whether anything after the parsed tables still looks like an item row.
 *
 * This is the backstop for the failure that motivated the multi-table work: if
 * the extractor ever loses rows again, the document is flagged instead of being
 * handed to the user as complete.
 */
function hasUnconsumedRows(lines: Line[], lastIndex: number, tables: ItemTable[]): boolean {
  if (tables.length === 0) return false;
  const columns = tables[0]!.columns;
  const tolerance = Math.max(40, (lines[tables[0]!.headerIndex]?.size ?? 10) * 4);

  for (let index = lastIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;

    const labelHit = matchFieldLabel(line.text);
    // Everything from the summary block onwards is fields, not rows.
    if (labelHit && SUMMARY_LABELS.has(labelHit)) return false;

    if (headerAt(lines, index)) return true;
    if (rowFrom(line, columns, tolerance)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function amountOf(fields: ExtractedField[], key: FieldKey): number | null {
  const field = fields.find((f) => f.key === key);
  if (!field || !field.value) return null;
  const value = Number(field.value);
  return Number.isFinite(value) ? value : null;
}

/**
 * Checks the arithmetic and marks whatever disagrees.
 *
 * Every check is skipped when its inputs are missing — a document that simply
 * has no discount line must not produce a discount warning.
 */
function validate(fields: ExtractedField[], items: ExtractedLineItem[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // quantity × unit price = line total
  for (const [index, item] of items.entries()) {
    const quantity = item.quantity ? Number(item.quantity) : null;
    const unitPrice = item.unitPrice ? Number(item.unitPrice) : null;
    const lineTotal = item.lineTotal ? Number(item.lineTotal) : null;
    if (quantity === null || unitPrice === null || lineTotal === null) continue;
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) continue;
    if (!nearly(quantity * unitPrice, lineTotal)) {
      item.needsReview = true;
      warnings.push({
        code: "line_total_mismatch",
        fields: [],
        itemIndex: index,
        detail: {
          expected: formatAmount(quantity * unitPrice),
          found: formatAmount(lineTotal),
        },
      });
    }
  }

  const subtotal = amountOf(fields, "subtotal");
  const discount = amountOf(fields, "discount");
  const taxAmount = amountOf(fields, "taxAmount");
  const total = amountOf(fields, "total");
  const taxRate = amountOf(fields, "taxRate");

  // sum(line totals) = subtotal
  const lineTotals = items
    .map((item) => (item.lineTotal ? Number(item.lineTotal) : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));
  if (subtotal !== null && lineTotals.length > 0 && lineTotals.length === items.length) {
    const sum = lineTotals.reduce((a, b) => a + b, 0);
    if (!nearly(sum, subtotal)) {
      warnings.push({
        code: "items_vs_subtotal_mismatch",
        fields: ["subtotal"],
        detail: { expected: formatAmount(sum), found: formatAmount(subtotal) },
      });
      markReview(fields, "subtotal");
    }
  }

  // subtotal - discount + tax = total
  if (subtotal !== null && total !== null) {
    const expected = subtotal - (discount ?? 0) + (taxAmount ?? 0);
    if (!nearly(expected, total)) {
      warnings.push({
        code: "total_mismatch",
        fields: ["total", "subtotal", "taxAmount", "discount"].filter((key) =>
          fields.some((f) => f.key === key),
        ) as FieldKey[],
        detail: { expected: formatAmount(expected), found: formatAmount(total) },
      });
      markReview(fields, "total");
    }
  }

  // stated tax rate against the actual tax amount
  if (taxRate !== null && taxAmount !== null && subtotal !== null && subtotal !== 0) {
    const base = subtotal - (discount ?? 0);
    const expected = (base * taxRate) / 100;
    if (!nearly(expected, taxAmount, Math.max(0.05, Math.abs(taxAmount) * 0.02))) {
      warnings.push({
        code: "tax_rate_mismatch",
        fields: ["taxRate", "taxAmount"],
        detail: { expected: formatAmount(expected), found: formatAmount(taxAmount) },
      });
      markReview(fields, "taxAmount");
    }
  }

  return warnings;
}

function markReview(fields: ExtractedField[], key: FieldKey) {
  const field = fields.find((f) => f.key === key);
  if (!field) return;
  field.needsReview = true;
  field.confidence = Math.min(field.confidence, 0.5);
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parses positioned lines into a structured invoice or receipt.
 *
 * Throws nothing: a document that yields no fields and no items comes back with
 * a `no_fields_found` warning and `needsReview`, which the caller must treat as
 * a failed extraction rather than an empty success.
 */
/**
 * Reports rows that came back without any money on them.
 *
 * `hasUnconsumedRows` can only see rows it would have been able to parse, so a
 * row lost to a ragged column layout is invisible to it — the same blind spot
 * that dropped the row in the first place. Amounts are the independent signal:
 * a document that states a subtotal, and whose table produced rows, but where
 * not one row carries a line total, has lost its numbers somewhere between the
 * page and the table. Requiring a stated amount keeps this quiet for the
 * description-only tables that legitimately have no per-row prices.
 */
function amountsWereLost(fields: ExtractedField[], items: ExtractedLineItem[]): boolean {
  if (items.length === 0) return false;
  const stated = amountOf(fields, "subtotal") ?? amountOf(fields, "total");
  if (stated === null) return false;
  return items.every((item) => !item.lineTotal);
}

/**
 * The fields a document of each kind has to carry before its extraction can be
 * called confident.
 *
 * Deliberately narrow. An invoice without a number, a date or a total is not
 * usable, so those three are required. A receipt is often just a total and a
 * date — till slips rarely carry a document number — so only the total is
 * required there. Anything wider than this would flag ordinary documents and
 * teach people to ignore the review flag, which is the same failure as never
 * raising it.
 */
function missingKeyFields(fields: ExtractedField[], kind: "invoice" | "receipt"): FieldKey[] {
  const required: FieldKey[] =
    kind === "invoice" ? ["documentNumber", "issueDate", "total"] : ["total"];
  return required.filter((key) => {
    const field = fields.find((f) => f.key === key);
    return !field || !field.value || field.value.trim() === "";
  });
}

export function parseDocument(lines: Line[], options: ParseOptions): ExtractedDocument {
  const usable = lines.filter((line) => line.text.trim().length > 0);
  const documentText = usable.map((line) => line.text).join("\n");

  const { fields, warnings: fieldWarnings } = extractFields(usable, options);

  const tables = findItemTables(usable);
  const { items: lineItems, lastIndex } = extractAllLineItems(usable, tables);

  const warnings: ValidationWarning[] = [...fieldWarnings, ...validate(fields, lineItems)];

  if (fields.length === 0) {
    warnings.push({ code: "no_fields_found", fields: [] });
  }
  if (lineItems.length === 0) {
    warnings.push({ code: "no_line_items", fields: [] });
  }

  // A document that carries no identifier, no date or no total is not a
  // confident extraction, however many other fields came back. Saying nothing
  // here is what let a near-empty result be presented as verified.
  const missing = missingKeyFields(fields, options.kind);
  if (missing.length > 0) {
    warnings.push({ code: "missing_key_fields", fields: missing });
  }

  if (hasUnconsumedRows(usable, lastIndex, tables) || amountsWereLost(fields, lineItems)) {
    warnings.push({ code: "unconsumed_content", fields: [] });
  }

  const ocrConfidence = options.ocrConfidence ?? null;
  if (ocrConfidence !== null && ocrConfidence < 70) {
    warnings.push({ code: "low_ocr_confidence", fields: [] });
  }

  const needsReview =
    fields.some((field) => field.needsReview) ||
    lineItems.some((item) => item.needsReview) ||
    warnings.length > 0;

  return {
    kind: options.kind,
    currency: detectCurrency(documentText),
    fields,
    lineItems,
    warnings,
    needsReview,
    ocrConfidence,
  };
}

/**
 * True when the parse produced nothing worth showing.
 *
 * Callers use this to fail the conversion instead of presenting an empty
 * result as a success.
 */
export function isEmptyExtraction(document: ExtractedDocument): boolean {
  const hasValue = document.fields.some((field) => field.value.trim().length > 0);
  return !hasValue && document.lineItems.length === 0;
}
