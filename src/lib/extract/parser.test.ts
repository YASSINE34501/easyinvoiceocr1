import { describe, expect, it } from "vitest";
import type { Line } from "@/lib/convert/layout";
import { isEmptyExtraction, parseDocument, type ExtractedDocument } from "./parser";

/**
 * Builds a positioned line the way both readers produce them. Cells are placed
 * far enough apart that the layout analyser's gap threshold splits them, which
 * is what a real invoice's columns look like.
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

function fieldValue(doc: ExtractedDocument, key: string): string | undefined {
  return doc.fields.find((f) => f.key === key)?.value;
}

function hasWarning(doc: ExtractedDocument, code: string): boolean {
  return doc.warnings.some((w) => w.code === code);
}

/* ------------------------------------------------------------------ */

describe("parseDocument — English invoice", () => {
  const lines: Line[] = [
    line(0, [["ACME Supplies Ltd", 0]], 16),
    line(30, [
      ["Invoice Number:", 0],
      ["INV-2026-0042", 300],
    ]),
    line(50, [
      ["Invoice Date:", 0],
      ["2026-07-28", 300],
    ]),
    line(70, [
      ["Due Date:", 0],
      ["2026-08-27", 300],
    ]),
    line(120, [
      ["Description", 0],
      ["Quantity", 300],
      ["Unit Price", 420],
      ["Amount", 540],
    ]),
    line(145, [
      ["Widget A", 0],
      ["2", 300],
      ["50.00", 420],
      ["100.00", 540],
    ]),
    line(165, [
      ["Widget B", 0],
      ["3", 300],
      ["10.00", 420],
      ["30.00", 540],
    ]),
    line(210, [
      ["Subtotal", 300],
      ["130.00", 540],
    ]),
    line(230, [
      ["VAT", 300],
      ["26.00", 540],
    ]),
    line(250, [
      ["Total Due", 300],
      ["156.00", 540],
    ]),
  ];

  const doc = parseDocument(lines, { kind: "invoice", dayFirst: false });

  it("reads the identifier and both dates", () => {
    expect(fieldValue(doc, "documentNumber")).toBe("INV-2026-0042");
    expect(fieldValue(doc, "issueDate")).toBe("2026-07-28");
    expect(fieldValue(doc, "dueDate")).toBe("2026-08-27");
  });

  it("reads the summary amounts", () => {
    expect(fieldValue(doc, "subtotal")).toBe("130.00");
    expect(fieldValue(doc, "taxAmount")).toBe("26.00");
    expect(fieldValue(doc, "total")).toBe("156.00");
  });

  it("reconstructs both line items from coordinates", () => {
    expect(doc.lineItems).toHaveLength(2);
    expect(doc.lineItems[0]).toMatchObject({
      description: "Widget A",
      quantity: "2",
      unitPrice: "50.00",
      lineTotal: "100.00",
    });
    expect(doc.lineItems[1]).toMatchObject({
      description: "Widget B",
      quantity: "3",
      unitPrice: "10.00",
      lineTotal: "30.00",
    });
  });

  it("raises no arithmetic warnings when the document is consistent", () => {
    expect(hasWarning(doc, "line_total_mismatch")).toBe(false);
    expect(hasWarning(doc, "items_vs_subtotal_mismatch")).toBe(false);
    expect(hasWarning(doc, "total_mismatch")).toBe(false);
  });

  it("is not an empty extraction", () => {
    expect(isEmptyExtraction(doc)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */

describe("parseDocument — French invoice", () => {
  const lines: Line[] = [
    line(0, [
      ["Facture N°:", 0],
      ["FR-2026-118", 300],
    ]),
    line(20, [
      ["Date de facture:", 0],
      ["28/07/2026", 300],
    ]),
    line(60, [
      ["Désignation", 0],
      ["Qté", 300],
      ["Prix unitaire", 420],
      ["Montant", 560],
    ]),
    line(85, [
      ["Chaise de bureau", 0],
      ["2", 300],
      ["1 234,56", 420],
      ["2 469,12", 560],
    ]),
    line(130, [
      ["Sous-total", 300],
      ["2 469,12", 560],
    ]),
    line(150, [
      ["TVA", 300],
      ["493,82", 560],
    ]),
    line(170, [
      ["Total TTC", 300],
      ["2 962,94", 560],
    ]),
  ];

  const doc = parseDocument(lines, { kind: "invoice", dayFirst: true });

  it("reads a French numeric date as day-first", () => {
    expect(fieldValue(doc, "issueDate")).toBe("2026-07-28");
  });

  it("reads comma-decimal and space-grouped amounts", () => {
    expect(fieldValue(doc, "subtotal")).toBe("2469.12");
    expect(fieldValue(doc, "taxAmount")).toBe("493.82");
    expect(fieldValue(doc, "total")).toBe("2962.94");
  });

  it("distinguishes sous-total from total TTC", () => {
    expect(fieldValue(doc, "subtotal")).not.toBe(fieldValue(doc, "total"));
  });

  it("reconstructs the French line item", () => {
    expect(doc.lineItems).toHaveLength(1);
    expect(doc.lineItems[0]).toMatchObject({
      description: "Chaise de bureau",
      quantity: "2",
      unitPrice: "1234.56",
      lineTotal: "2469.12",
    });
  });

  it("validates the French arithmetic cleanly", () => {
    expect(hasWarning(doc, "total_mismatch")).toBe(false);
    expect(hasWarning(doc, "line_total_mismatch")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */

describe("parseDocument — Arabic invoice", () => {
  const lines: Line[] = [
    line(0, [
      ["رقم الفاتورة:", 0],
      ["AR-2026-7", 300],
    ]),
    line(20, [
      ["تاريخ الفاتورة:", 0],
      ["2026-07-28", 300],
    ]),
    line(60, [
      ["الوصف", 0],
      ["الكمية", 300],
      ["سعر الوحدة", 420],
      ["الإجمالي", 560],
    ]),
    line(85, [
      ["مكتب خشبي", 0],
      ["٢", 300],
      ["١٥٠٠,٠٠", 420],
      ["٣٠٠٠,٠٠", 560],
    ]),
    line(130, [
      ["المجموع الفرعي", 300],
      ["٣٠٠٠,٠٠", 560],
    ]),
    line(150, [
      ["الضريبة", 300],
      ["٦٠٠,٠٠", 560],
    ]),
    line(170, [
      ["الإجمالي الكلي", 300],
      ["٣٦٠٠,٠٠", 560],
    ]),
  ];

  const doc = parseDocument(lines, { kind: "invoice", dayFirst: true });

  it("reads Arabic labels and an ISO date", () => {
    expect(fieldValue(doc, "documentNumber")).toBe("AR-2026-7");
    expect(fieldValue(doc, "issueDate")).toBe("2026-07-28");
  });

  it("reads Arabic-Indic amounts", () => {
    expect(fieldValue(doc, "subtotal")).toBe("3000.00");
    expect(fieldValue(doc, "taxAmount")).toBe("600.00");
    expect(fieldValue(doc, "total")).toBe("3600.00");
  });

  it("reconstructs the Arabic line item with converted digits", () => {
    expect(doc.lineItems).toHaveLength(1);
    expect(doc.lineItems[0]).toMatchObject({
      description: "مكتب خشبي",
      quantity: "2",
      unitPrice: "1500.00",
      lineTotal: "3000.00",
    });
  });

  it("validates the Arabic arithmetic cleanly", () => {
    expect(hasWarning(doc, "total_mismatch")).toBe(false);
    expect(hasWarning(doc, "line_total_mismatch")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */

describe("parseDocument — validation catches bad arithmetic", () => {
  it("flags a line whose quantity × unit price disagrees with its total", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Description", 0],
          ["Qty", 300],
          ["Unit Price", 420],
          ["Amount", 540],
        ]),
        line(25, [
          ["Widget", 0],
          ["2", 300],
          ["50.00", 420],
          ["999.00", 540],
        ]),
      ],
      { kind: "invoice" },
    );

    expect(hasWarning(doc, "line_total_mismatch")).toBe(true);
    expect(doc.lineItems[0]?.needsReview).toBe(true);
    expect(doc.needsReview).toBe(true);
  });

  it("flags a total that does not equal subtotal + tax", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Subtotal", 300],
          ["100.00", 540],
        ]),
        line(20, [
          ["VAT", 300],
          ["20.00", 540],
        ]),
        line(40, [
          ["Total", 300],
          ["500.00", 540],
        ]),
      ],
      { kind: "invoice" },
    );

    expect(hasWarning(doc, "total_mismatch")).toBe(true);
    expect(doc.fields.find((f) => f.key === "total")?.needsReview).toBe(true);
  });

  it("flags a tax amount that contradicts the stated rate", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Subtotal", 300],
          ["100.00", 540],
        ]),
        line(20, [
          ["VAT Rate", 300],
          ["20", 540],
        ]),
        line(40, [
          ["Tax Amount", 300],
          ["55.00", 540],
        ]),
        line(60, [
          ["Total", 300],
          ["155.00", 540],
        ]),
      ],
      { kind: "invoice" },
    );

    expect(hasWarning(doc, "tax_rate_mismatch")).toBe(true);
  });

  it("flags item totals that do not sum to the stated subtotal", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Description", 0],
          ["Qty", 300],
          ["Unit Price", 420],
          ["Amount", 540],
        ]),
        line(25, [
          ["A", 0],
          ["1", 300],
          ["10.00", 420],
          ["10.00", 540],
        ]),
        line(45, [
          ["B", 0],
          ["1", 300],
          ["10.00", 420],
          ["10.00", 540],
        ]),
        line(80, [
          ["Subtotal", 300],
          ["999.00", 540],
        ]),
      ],
      { kind: "invoice" },
    );

    expect(hasWarning(doc, "items_vs_subtotal_mismatch")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */

describe("parseDocument — never invents data", () => {
  it("omits a due date that is not on the document", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["10.00", 540],
        ]),
      ],
      { kind: "invoice" },
    );
    expect(doc.fields.find((f) => f.key === "dueDate")).toBeUndefined();
  });

  it("reports an empty extraction for a document with no recognisable content", () => {
    const doc = parseDocument(
      [
        line(
          0,
          [["....."]].map(([t]) => [t as string, 0]),
        ),
      ],
      {
        kind: "receipt",
      },
    );
    expect(isEmptyExtraction(doc)).toBe(true);
    expect(hasWarning(doc, "no_fields_found")).toBe(true);
  });

  it("reports an empty extraction for no lines at all", () => {
    const doc = parseDocument([], { kind: "invoice" });
    expect(isEmptyExtraction(doc)).toBe(true);
    expect(doc.lineItems).toHaveLength(0);
    expect(doc.needsReview).toBe(true);
  });

  it("does not guess an ambiguous numeric date", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Invoice Date:", 0],
          ["03/04/2026", 300],
        ]),
      ],
      {
        kind: "invoice",
      },
    );
    expect(fieldValue(doc, "issueDate")).toBe("");
    expect(hasWarning(doc, "ambiguous_date")).toBe(true);
  });

  it("warns on low OCR confidence", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["10.00", 540],
        ]),
      ],
      {
        kind: "receipt",
        ocrConfidence: 42,
      },
    );
    expect(hasWarning(doc, "low_ocr_confidence")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */

describe("parseDocument — currency", () => {
  it("detects a symbol", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["$1,234.56", 540],
        ]),
      ],
      { kind: "invoice" },
    );
    expect(doc.currency).toBe("USD");
  });

  it("detects an ISO code", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["1 500,00 MAD", 540],
        ]),
      ],
      {
        kind: "invoice",
      },
    );
    expect(doc.currency).toBe("MAD");
  });

  it("returns null when no currency is present", () => {
    const doc = parseDocument(
      [
        line(0, [
          ["Total", 300],
          ["1234.56", 540],
        ]),
      ],
      { kind: "invoice" },
    );
    expect(doc.currency).toBeNull();
  });
});
