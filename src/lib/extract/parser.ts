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
  | "ambiguous_date";

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

/** Finds the header row of the item table and the x position of each column. */
function findItemColumns(lines: Line[]): { headerIndex: number; columns: ColumnMap } | null {
  for (const [index, line] of lines.entries()) {
    const cells = cellsOf(line);
    if (cells.length < 2) continue;

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
      return { headerIndex: index, columns };
    }
  }
  return null;
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

function extractLineItems(
  lines: Line[],
  found: { headerIndex: number; columns: ColumnMap },
): ExtractedLineItem[] {
  const { headerIndex, columns } = found;
  const items: ExtractedLineItem[] = [];
  const tolerance = Math.max(40, (lines[headerIndex]?.size ?? 10) * 4);

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    const cells = cellsOf(line);
    if (cells.length < 2) {
      // A single-cell line ends the table unless it is clearly a continuation.
      if (items.length > 0) break;
      continue;
    }

    // A summary row ("Subtotal", "Total") terminates the item table.
    const labelHit = matchFieldLabel(line.text);
    if (labelHit && labelHit !== "documentNumber") break;

    const row: Partial<Record<ItemColumn, string>> = {};
    for (const cell of cells) {
      const column = columnFor(cell, columns, tolerance);
      if (!column) continue;
      row[column] = row[column] ? `${row[column]} ${cell.text}`.trim() : cell.text.trim();
    }

    const description = (row.description ?? "").trim();
    const quantity = row.quantity ? parseAmount(row.quantity) : null;
    const unitPrice = row.unitPrice ? parseAmount(row.unitPrice) : null;
    const lineTotal = row.lineTotal ? parseAmount(row.lineTotal) : null;

    // A row with no description and no money on it is not an item.
    if (!description && lineTotal === null && unitPrice === null) continue;

    items.push({
      id: nextId(),
      description,
      quantity: quantity === null ? "" : String(quantity),
      unitPrice: unitPrice === null ? "" : formatAmount(unitPrice),
      lineTotal: lineTotal === null ? "" : formatAmount(lineTotal),
      needsReview: false,
    });
  }

  return items;
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
export function parseDocument(lines: Line[], options: ParseOptions): ExtractedDocument {
  const usable = lines.filter((line) => line.text.trim().length > 0);
  const documentText = usable.map((line) => line.text).join("\n");

  const { fields, warnings: fieldWarnings } = extractFields(usable, options);

  const found = findItemColumns(usable);
  const lineItems = found ? extractLineItems(usable, found) : [];

  const warnings: ValidationWarning[] = [...fieldWarnings, ...validate(fields, lineItems)];

  if (fields.length === 0) {
    warnings.push({ code: "no_fields_found", fields: [] });
  }
  if (lineItems.length === 0) {
    warnings.push({ code: "no_line_items", fields: [] });
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
