import { describe, expect, it } from "vitest";
import type { Line } from "@/lib/convert/layout";
import { parseDocument, type ExtractedDocument } from "./parser";

/**
 * When the extractor is allowed to claim confidence.
 *
 * A document that came back with two fields and no identifier, date or total
 * was reported with needsReview false and no warnings — the user was told a
 * near-empty result was verified. These tests fix both directions: incomplete
 * extractions must be flagged, and a complete one must not be, because a flag
 * that fires on everything is ignored and is worth no more than silence.
 */
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

const COL = { desc: 0, qty: 260, unit: 360, amount: 470 };

function table(top: number): Line[] {
  return [
    line(top, [
      ["Description", COL.desc],
      ["Qty", COL.qty],
      ["Unit Price", COL.unit],
      ["Amount", COL.amount],
    ]),
    line(top + 20, [
      ["Consulting services", COL.desc],
      ["10", COL.qty],
      ["120.00", COL.unit],
      ["1200.00", COL.amount],
    ]),
  ];
}

type Parts = { number?: boolean; date?: boolean; total?: boolean; items?: boolean };

function invoice(parts: Parts = {}): Line[] {
  const { number = true, date = true, total = true, items = true } = parts;
  const lines: Line[] = [line(0, [["ACME Supplies Ltd", 0]], 16)];
  let top = 30;

  if (number) {
    lines.push(
      line(top, [
        ["Invoice Number:", 0],
        ["INV-2026-0042", 300],
      ]),
    );
    top += 20;
  }
  if (date) {
    lines.push(
      line(top, [
        ["Invoice Date:", 0],
        ["2026-08-22", 300],
      ]),
    );
    top += 20;
  }
  if (items) {
    lines.push(...table(top + 20));
    top += 80;
  }
  if (total) {
    lines.push(
      line(top + 40, [
        ["Subtotal:", 0],
        ["1200.00", COL.amount],
      ]),
      line(top + 60, [
        ["Total:", 0],
        ["1200.00", COL.amount],
      ]),
    );
  }
  return lines;
}

function parse(lines: Line[], kind: "invoice" | "receipt" = "invoice"): ExtractedDocument {
  return parseDocument(lines, { kind });
}

function codes(doc: ExtractedDocument): string[] {
  return doc.warnings.map((w) => w.code);
}

describe("a complete extraction is trusted", () => {
  it("raises no warnings", () => {
    expect(codes(parse(invoice()))).toEqual([]);
  });

  it("does not ask for review", () => {
    expect(parse(invoice()).needsReview).toBe(false);
  });
});

describe("an incomplete extraction is never reported as confident", () => {
  const cases: Array<[string, Parts]> = [
    ["invoice number missing", { number: false }],
    ["invoice date missing", { date: false }],
    ["total missing", { total: false }],
    ["number and date missing", { number: false, date: false }],
    ["everything but the party name missing", { number: false, date: false, total: false }],
  ];

  for (const [label, parts] of cases) {
    it(`${label} — flags missing_key_fields and asks for review`, () => {
      const doc = parse(invoice(parts));
      expect(codes(doc)).toContain("missing_key_fields");
      expect(doc.needsReview).toBe(true);
    });
  }

  it("names the fields that were missing so the screen can point at them", () => {
    const doc = parse(invoice({ number: false, total: false }));
    const warning = doc.warnings.find((w) => w.code === "missing_key_fields");
    expect(warning?.fields).toContain("documentNumber");
    expect(warning?.fields).toContain("total");
    expect(warning?.fields).not.toContain("issueDate");
  });

  it("flags the near-empty extraction that started this", () => {
    // Two fields, no identifier, no date, no total — previously needsReview false.
    const doc = parse([
      line(0, [["Acme Corporation", 0]], 14),
      line(30, [
        ["Contact:", 0],
        ["11.00", 300],
      ]),
    ]);
    expect(doc.needsReview).toBe(true);
  });
});

describe("receipts are judged by their own shape", () => {
  it("does not demand an invoice number from a receipt", () => {
    const doc = parse(invoice({ number: false, date: false }), "receipt");
    expect(codes(doc)).not.toContain("missing_key_fields");
  });

  it("still demands a total", () => {
    const doc = parse(invoice({ total: false }), "receipt");
    expect(codes(doc)).toContain("missing_key_fields");
    expect(doc.needsReview).toBe(true);
  });
});

describe("rows that lost their amounts are flagged", () => {
  /**
   * A ragged column layout can produce rows whose descriptions land but whose
   * amounts do not. The row-shaped backstop cannot see those — it only
   * recognises rows it could have parsed — so the stated subtotal is the
   * independent signal that the numbers went missing.
   */
  function tableWithoutAmounts(): Line[] {
    return [
      line(0, [["ACME Supplies Ltd", 0]], 16),
      line(30, [
        ["Invoice Number:", 0],
        ["INV-2026-0042", 300],
      ]),
      line(50, [
        ["Invoice Date:", 0],
        ["2026-08-22", 300],
      ]),
      line(90, [
        ["Description", COL.desc],
        ["Qty", COL.qty],
        ["Amount", COL.amount],
      ]),
      // The amount sits far outside every column, so only the description maps.
      line(110, [
        ["Consulting services", COL.desc],
        ["10", COL.qty],
      ]),
      line(130, [
        ["Design work", COL.desc],
        ["4", COL.qty],
      ]),
      line(190, [
        ["Subtotal:", 0],
        ["1800.00", COL.amount],
      ]),
      line(210, [
        ["Total:", 0],
        ["1800.00", COL.amount],
      ]),
    ];
  }

  it("warns when a stated subtotal exists but no row carries an amount", () => {
    const doc = parse(tableWithoutAmounts());
    expect(doc.lineItems.length).toBeGreaterThan(0);
    expect(codes(doc)).toContain("unconsumed_content");
    expect(doc.needsReview).toBe(true);
  });

  it("stays quiet when the rows do carry their amounts", () => {
    expect(codes(parse(invoice()))).not.toContain("unconsumed_content");
  });
});

describe("other confidence signals still flag", () => {
  it("low OCR confidence asks for review", () => {
    const doc = parseDocument(invoice(), { kind: "invoice", ocrConfidence: 42 });
    expect(codes(doc)).toContain("low_ocr_confidence");
    expect(doc.needsReview).toBe(true);
  });

  it("high OCR confidence on a complete document does not", () => {
    const doc = parseDocument(invoice(), { kind: "invoice", ocrConfidence: 95 });
    expect(doc.needsReview).toBe(false);
  });

  it("a document with no table asks for review", () => {
    const doc = parse(invoice({ items: false }));
    expect(codes(doc)).toContain("no_line_items");
    expect(doc.needsReview).toBe(true);
  });

  it("arithmetic that does not add up asks for review", () => {
    const lines = invoice();
    lines.push(
      line(400, [
        ["Total:", 0],
        ["9999.00", COL.amount],
      ]),
    );
    expect(parse(lines).needsReview).toBe(true);
  });
});
