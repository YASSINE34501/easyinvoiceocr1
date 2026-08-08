/**
 * Export formats for an extracted document.
 *
 * Every format is generated from the same corrected `ExtractedDocument` the
 * reviewer sees on screen, so a download can never disagree with the table it
 * came from. Nothing is fabricated: a field the parser did not find is exported
 * as empty, not as a plausible-looking value.
 */

import type { ExtractedDocument } from "./parser";
import { FIELD_LABELS, workbookBytes } from "./workbook";

export type ExportFormat = "xlsx" | "csv" | "json";

/** Serialisable shape written to JSON. */
export type ExportedJson = {
  kind: "invoice" | "receipt";
  currency: string | null;
  ocrConfidence: number | null;
  needsReview: boolean;
  fields: { key: string; label: string; value: string; confidence: number; needsReview: boolean }[];
  lineItems: {
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    needsReview: boolean;
  }[];
  warnings: {
    code: string;
    fields: string[];
    itemIndex?: number;
    detail?: Record<string, string>;
  }[];
};

export function toJson(document: ExtractedDocument): ExportedJson {
  return {
    kind: document.kind,
    currency: document.currency,
    ocrConfidence: document.ocrConfidence,
    needsReview: document.needsReview,
    fields: document.fields.map((field) => ({
      key: field.key,
      label: FIELD_LABELS[field.key] ?? field.key,
      value: field.value,
      confidence: Number(field.confidence.toFixed(2)),
      needsReview: field.needsReview,
    })),
    lineItems: document.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      needsReview: item.needsReview,
    })),
    warnings: document.warnings.map((warning) => ({
      code: warning.code,
      fields: warning.fields,
      ...(warning.itemIndex === undefined ? {} : { itemIndex: warning.itemIndex }),
      ...(warning.detail === undefined ? {} : { detail: warning.detail }),
    })),
  };
}

/** RFC 4180 quoting: wrap in quotes and double any embedded quote. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Builds a CSV of the line items with the summary fields as a leading block.
 * A UTF-8 BOM is prepended so Excel opens Arabic and accented French text
 * correctly instead of showing mojibake.
 */
export function toCsv(document: ExtractedDocument): string {
  const rows: string[][] = [];

  rows.push(["Field", "Value", "Confidence", "Needs Review"]);
  for (const field of document.fields) {
    rows.push([
      FIELD_LABELS[field.key] ?? field.key,
      field.value,
      field.confidence.toFixed(2),
      field.needsReview ? "Yes" : "No",
    ]);
  }
  if (document.currency) rows.push(["Currency", document.currency, "", "No"]);

  if (document.lineItems.length > 0) {
    rows.push([]);
    rows.push(["Description", "Quantity", "Unit Price", "Line Total", "Needs Review"]);
    for (const item of document.lineItems) {
      rows.push([
        item.description,
        item.quantity,
        item.unitPrice,
        item.lineTotal,
        item.needsReview ? "Yes" : "No",
      ]);
    }
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

const MIME: Record<ExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv;charset=utf-8",
  json: "application/json",
};

/** Bytes for one format. Kept separate from the download so tests can assert on it. */
export function exportBytes(document: ExtractedDocument, format: ExportFormat): Uint8Array {
  if (format === "xlsx") return workbookBytes(document);
  const encoder = new TextEncoder();
  if (format === "csv") {
    // U+FEFF so Excel detects UTF-8.
    return encoder.encode(`\uFEFF${toCsv(document)}`);
  }
  return encoder.encode(JSON.stringify(toJson(document), null, 2));
}

export function downloadExport(
  document: ExtractedDocument,
  format: ExportFormat,
  baseName: string,
): void {
  const bytes = exportBytes(document, format);
  const blob = new Blob([bytes as BlobPart], { type: MIME[format] });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${baseName}.${format}`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
