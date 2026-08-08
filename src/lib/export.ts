import * as XLSX from "xlsx";

export type LineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  tax: string;
  total: string;
};

export type ExtractionField = {
  key: string;
  label: string;
  value: string;
  confidence: number;
};

export type Extraction = {
  documentName: string;
  fields: ExtractionField[];
  items: LineItem[];
};

function toRows(extraction: Extraction) {
  return extraction.items.map((i) => ({
    Description: i.description,
    Quantity: i.quantity,
    "Unit Price": i.unitPrice,
    Tax: i.tax,
    Total: i.total,
  }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "extraction";

/** Writes a genuine .xlsx workbook with a summary sheet and a line-item sheet. */
export function exportXlsx(extraction: Extraction) {
  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.json_to_sheet(
    extraction.fields.map((f) => ({
      Field: f.label,
      Value: f.value,
      Confidence: `${Math.round(f.confidence * 100)}%`,
    })),
  );
  XLSX.utils.book_append_sheet(wb, summary, "Invoice Summary");

  const items = XLSX.utils.json_to_sheet(toRows(extraction));
  XLSX.utils.book_append_sheet(wb, items, "Line Items");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${baseName(extraction.documentName)}.xlsx`,
  );
}

export function exportCsv(extraction: Extraction) {
  const sheet = XLSX.utils.json_to_sheet(toRows(extraction));
  const csv = XLSX.utils.sheet_to_csv(sheet);
  // BOM keeps Arabic and accented characters intact when opened in Excel.
  download(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    `${baseName(extraction.documentName)}.csv`,
  );
}

export function exportJson(extraction: Extraction) {
  const payload = {
    document: extraction.documentName,
    fields: Object.fromEntries(
      extraction.fields.map((f) => [f.key, { value: f.value, confidence: f.confidence }]),
    ),
    lineItems: extraction.items.map(({ id: _id, ...rest }) => rest),
  };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
    `${baseName(extraction.documentName)}.json`,
  );
}
