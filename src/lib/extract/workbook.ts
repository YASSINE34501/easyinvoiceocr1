/**
 * Excel export for extracted invoices and receipts.
 *
 * Produces a real .xlsx workbook through SheetJS — numbers are written as
 * numbers, not as strings that merely look like them, so the file opens in
 * Excel with working arithmetic. Anything the parser flagged for review is
 * carried into the workbook rather than quietly dropped, so the exported file
 * says the same thing the review screen said.
 */

import * as XLSX from "xlsx";
import type { ExtractedDocument, ExtractedLineItem, ExtractedField } from "./parser";
import type { FieldKey } from "./labels";

/** Column order for the line-item sheet. */
const ITEM_COLUMNS = ["Description", "Quantity", "Unit Price", "Line Total"] as const;

export const FIELD_LABELS: Record<FieldKey, string> = {
  supplierName: "Supplier",
  customerName: "Customer",
  documentNumber: "Document Number",
  issueDate: "Date",
  dueDate: "Due Date",
  subtotal: "Subtotal",
  discount: "Discount",
  taxRate: "Tax Rate (%)",
  taxAmount: "Tax Amount",
  total: "Total",
};

/** Fields whose value should be written to the sheet as a number. */
const NUMERIC_FIELDS: ReadonlySet<FieldKey> = new Set<FieldKey>([
  "subtotal",
  "discount",
  "taxRate",
  "taxAmount",
  "total",
]);

function numberOrText(value: string, numeric: boolean): string | number {
  if (!numeric || value === "") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

type SummaryRow = {
  Field: string;
  Value: string | number;
  Confidence: number | string;
  "Needs Review": string;
};

function summaryRows(fields: ExtractedField[], currency: string | null): SummaryRow[] {
  const rows: SummaryRow[] = fields.map((field) => ({
    Field: FIELD_LABELS[field.key] ?? field.key,
    Value: numberOrText(field.value, NUMERIC_FIELDS.has(field.key)),
    Confidence: Number(field.confidence.toFixed(2)),
    "Needs Review": field.needsReview ? "Yes" : "No",
  }));

  if (currency) {
    rows.push({ Field: "Currency", Value: currency, Confidence: "", "Needs Review": "No" });
  }
  return rows;
}

type ItemRow = Record<(typeof ITEM_COLUMNS)[number] | "Needs Review", string | number>;

function itemRows(items: ExtractedLineItem[]): ItemRow[] {
  return items.map((item) => ({
    Description: item.description,
    Quantity: numberOrText(item.quantity, true),
    "Unit Price": numberOrText(item.unitPrice, true),
    "Line Total": numberOrText(item.lineTotal, true),
    "Needs Review": item.needsReview ? "Yes" : "No",
  }));
}

/**
 * Builds the workbook.
 *
 * Always writes the summary sheet; adds a line-item sheet only when there are
 * items, and a warnings sheet only when the parser raised something, so an
 * exported file never contains an empty tab implying data that is not there.
 */
export function buildWorkbook(document: ExtractedDocument): XLSX.WorkBook {
  const book = XLSX.utils.book_new();

  const summary = XLSX.utils.json_to_sheet(summaryRows(document.fields, document.currency), {
    header: ["Field", "Value", "Confidence", "Needs Review"],
  });
  summary["!cols"] = [{ wch: 20 }, { wch: 26 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(book, summary, "Summary");

  if (document.lineItems.length > 0) {
    const items = XLSX.utils.json_to_sheet(itemRows(document.lineItems), {
      header: [...ITEM_COLUMNS, "Needs Review"],
    });
    items["!cols"] = [{ wch: 40 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(book, items, "Line Items");
  }

  if (document.warnings.length > 0) {
    const warnings = XLSX.utils.json_to_sheet(
      document.warnings.map((warning) => ({
        Code: warning.code,
        Fields: warning.fields.join(", "),
        Row: warning.itemIndex === undefined ? "" : warning.itemIndex + 1,
        Expected: warning.detail?.["expected"] ?? "",
        Found: warning.detail?.["found"] ?? "",
      })),
      { header: ["Code", "Fields", "Row", "Expected", "Found"] },
    );
    warnings["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 6 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(book, warnings, "Warnings");
  }

  return book;
}

/** Serialises the workbook to bytes. Same output in the browser and in tests. */
export function workbookBytes(document: ExtractedDocument): Uint8Array {
  const book = buildWorkbook(document);
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Uint8Array(out);
}

/** Browser download. Kept separate so the byte-building stays testable in node. */
export function downloadWorkbook(document: ExtractedDocument, baseName: string): void {
  const bytes = workbookBytes(document);
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${baseName}.xlsx`;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
