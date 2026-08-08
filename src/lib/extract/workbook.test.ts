/**
 * These tests do not check a file signature. Every case writes a real workbook,
 * reads the bytes back through SheetJS, and asserts on the cell values and cell
 * types that Excel would actually show.
 */

import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import type { Line } from "@/lib/convert/layout";
import { parseDocument, type ExtractedDocument } from "./parser";
import { buildWorkbook, workbookBytes } from "./workbook";

function line(top: number, cells: [text: string, x: number][], size = 10): Line {
  const fragments = cells.map(([text, x]) => ({ text, x, width: text.length * 6, size }));
  return {
    fragments,
    text: cells.map(([text]) => text).join(" "),
    top,
    height: size,
    size,
    x0: Math.min(...fragments.map((f) => f.x)),
    x1: Math.max(...fragments.map((f) => f.x + f.width)),
  };
}

/** Writes then reopens, returning the workbook Excel would see. */
function roundTrip(document: ExtractedDocument): XLSX.WorkBook {
  const bytes = workbookBytes(document);
  return XLSX.read(bytes, { type: "array" });
}

function sheetRows(book: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = book.Sheets[name];
  if (!sheet) throw new Error(`sheet ${name} missing`);
  return XLSX.utils.sheet_to_json(sheet);
}

const RECEIPT_LINES: Line[] = [
  line(
    0,
    [["Corner Hardware"]].map(([t]) => [t as string, 0]),
    14,
  ),
  line(25, [
    ["Receipt Number:", 0],
    ["R-88214", 300],
  ]),
  line(45, [
    ["Date:", 0],
    ["2026-07-28", 300],
  ]),
  line(90, [
    ["Description", 0],
    ["Qty", 300],
    ["Unit Price", 400],
    ["Amount", 520],
  ]),
  line(115, [
    ["Hammer", 0],
    ["2", 300],
    ["12.50", 400],
    ["25.00", 520],
  ]),
  line(135, [
    ["Nails 500g", 0],
    ["3", 300],
    ["4.00", 400],
    ["12.00", 520],
  ]),
  line(175, [
    ["Subtotal", 300],
    ["37.00", 520],
  ]),
  line(195, [
    ["Tax", 300],
    ["7.40", 520],
  ]),
  line(215, [
    ["Total", 300],
    ["44.40", 520],
  ]),
];

describe("workbook — round trip", () => {
  const document = parseDocument(RECEIPT_LINES, { kind: "receipt", dayFirst: false });
  const book = roundTrip(document);

  it("produces a file that reopens as a valid workbook", () => {
    expect(book.SheetNames).toContain("Summary");
    expect(book.SheetNames).toContain("Line Items");
  });

  it("writes bytes with the ZIP magic number of a real xlsx", () => {
    const bytes = workbookBytes(document);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
  });

  it("round-trips the summary values", () => {
    const rows = sheetRows(book, "Summary");
    const byField = new Map(rows.map((row) => [row["Field"], row["Value"]]));

    expect(byField.get("Document Number")).toBe("R-88214");
    expect(byField.get("Date")).toBe("2026-07-28");
    expect(byField.get("Subtotal")).toBe(37);
    expect(byField.get("Tax Amount")).toBe(7.4);
    expect(byField.get("Total")).toBe(44.4);
  });

  it("round-trips both line items with correct values", () => {
    const rows = sheetRows(book, "Line Items");
    expect(rows).toHaveLength(2);

    expect(rows[0]).toMatchObject({
      Description: "Hammer",
      Quantity: 2,
      "Unit Price": 12.5,
      "Line Total": 25,
    });
    expect(rows[1]).toMatchObject({
      Description: "Nails 500g",
      Quantity: 3,
      "Unit Price": 4,
      "Line Total": 12,
    });
  });

  it("writes amounts as numeric cells, not text that looks numeric", () => {
    const sheet = book.Sheets["Line Items"]!;
    // Row 2 is the first data row; column C is Unit Price.
    const cell = sheet["C2"] as XLSX.CellObject | undefined;
    expect(cell).toBeDefined();
    expect(cell!.t).toBe("n");
    expect(cell!.v).toBe(12.5);
  });

  it("keeps the numbers arithmetically consistent after the round trip", () => {
    const rows = sheetRows(book, "Line Items");
    const sum = rows.reduce((total, row) => total + Number(row["Line Total"]), 0);
    const summary = sheetRows(book, "Summary");
    const subtotal = summary.find((row) => row["Field"] === "Subtotal")?.["Value"];
    expect(sum).toBeCloseTo(Number(subtotal), 2);
  });
});

describe("workbook — review and warnings survive export", () => {
  it("marks a flagged row as needing review in the exported file", () => {
    const document = parseDocument(
      [
        line(0, [
          ["Description", 0],
          ["Qty", 300],
          ["Unit Price", 400],
          ["Amount", 520],
        ]),
        line(25, [
          ["Widget", 0],
          ["2", 300],
          ["50.00", 400],
          ["999.00", 520],
        ]),
      ],
      { kind: "invoice" },
    );

    const rows = sheetRows(roundTrip(document), "Line Items");
    expect(rows[0]?.["Needs Review"]).toBe("Yes");
  });

  it("writes a warnings sheet describing the mismatch", () => {
    const document = parseDocument(
      [
        line(0, [
          ["Subtotal", 300],
          ["100.00", 520],
        ]),
        line(20, [
          ["VAT", 300],
          ["20.00", 520],
        ]),
        line(40, [
          ["Total", 300],
          ["500.00", 520],
        ]),
      ],
      { kind: "invoice" },
    );

    const book = roundTrip(document);
    expect(book.SheetNames).toContain("Warnings");

    const rows = sheetRows(book, "Warnings");
    const mismatch = rows.find((row) => row["Code"] === "total_mismatch");
    expect(mismatch).toBeDefined();
    expect(mismatch!["Expected"]).toBe("120.00");
    expect(mismatch!["Found"]).toBe("500.00");
  });

  it("omits the line-item sheet entirely when nothing was extracted", () => {
    const document = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["10.00", 520],
        ]),
      ],
      {
        kind: "receipt",
      },
    );
    const book = roundTrip(document);
    expect(book.SheetNames).toContain("Summary");
    expect(book.SheetNames).not.toContain("Line Items");
  });
});

describe("workbook — multilingual round trip", () => {
  it("preserves Arabic descriptions through the file", () => {
    const document = parseDocument(
      [
        line(0, [
          ["الوصف", 0],
          ["الكمية", 300],
          ["سعر الوحدة", 400],
          ["الإجمالي", 520],
        ]),
        line(25, [
          ["مكتب خشبي", 0],
          ["٢", 300],
          ["١٥٠٠,٠٠", 400],
          ["٣٠٠٠,٠٠", 520],
        ]),
      ],
      { kind: "invoice" },
    );

    const rows = sheetRows(roundTrip(document), "Line Items");
    expect(rows[0]?.["Description"]).toBe("مكتب خشبي");
    // Arabic-Indic digits must arrive in Excel as real numbers.
    expect(rows[0]?.["Quantity"]).toBe(2);
    expect(rows[0]?.["Unit Price"]).toBe(1500);
    expect(rows[0]?.["Line Total"]).toBe(3000);
  });

  it("preserves French accented descriptions and comma decimals", () => {
    const document = parseDocument(
      [
        line(0, [
          ["Désignation", 0],
          ["Qté", 300],
          ["Prix unitaire", 400],
          ["Montant", 540],
        ]),
        line(25, [
          ["Chaise de bureau", 0],
          ["2", 300],
          ["1 234,56", 400],
          ["2 469,12", 540],
        ]),
      ],
      { kind: "invoice" },
    );

    const rows = sheetRows(roundTrip(document), "Line Items");
    expect(rows[0]?.["Description"]).toBe("Chaise de bureau");
    expect(rows[0]?.["Unit Price"]).toBe(1234.56);
    expect(rows[0]?.["Line Total"]).toBe(2469.12);
  });
});

describe("buildWorkbook", () => {
  it("names sheets predictably", () => {
    const document = parseDocument(RECEIPT_LINES, { kind: "receipt" });
    expect(buildWorkbook(document).SheetNames[0]).toBe("Summary");
  });
});
