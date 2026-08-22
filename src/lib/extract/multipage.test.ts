import { describe, expect, it } from "vitest";
import type { Line } from "@/lib/convert/layout";
import { parseDocument, type ExtractedDocument } from "./parser";

/**
 * Multi-page extraction.
 *
 * The parser used to find one table header and stop at the first break, so on a
 * three-page invoice only page one's rows survived — with needsReview false and
 * no warning, which presented a truncated export as a complete one. These tests
 * pin the row counts per shape so that failure cannot return silently.
 *
 * The reader concatenates pages and offsets each page's y coordinates, so a
 * multi-page document arrives here as one ordered list of lines. `page()`
 * reproduces that: a repeated header block, rows, then a footer.
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

function tableHeader(top: number): Line {
  return line(top, [
    ["Description", COL.desc],
    ["Qty", COL.qty],
    ["Unit Price", COL.unit],
    ["Amount", COL.amount],
  ]);
}

function row(top: number, description: string, qty: string, unit: string, amount: string): Line {
  return line(top, [
    [description, COL.desc],
    [qty, COL.qty],
    [unit, COL.unit],
    [amount, COL.amount],
  ]);
}

type PageOptions = {
  /** Repeat the invoice header block, as a real multi-page invoice does. */
  repeatHeader?: boolean;
  /** Emit the column header row. Omitted to model a table split across a break. */
  withTableHeader?: boolean;
  footer?: string;
};

/** Builds one page's worth of lines starting at `offset`. */
function page(
  offset: number,
  rows: Array<[string, string, string, string]>,
  options: PageOptions = {},
): Line[] {
  const { repeatHeader = true, withTableHeader = true, footer = "Page footer" } = options;
  const out: Line[] = [];
  let top = offset;

  if (repeatHeader) {
    out.push(line(top, [["ACME Supplies Ltd", 0]], 16));
    top += 30;
    out.push(
      line(top, [
        ["Invoice Number:", 0],
        ["INV-2026-0042", 300],
      ]),
    );
    top += 20;
    out.push(
      line(top, [
        ["Invoice Date:", 0],
        ["2026-08-22", 300],
      ]),
    );
    top += 30;
  }

  if (withTableHeader) {
    out.push(tableHeader(top));
    top += 20;
  }

  for (const [description, qty, unit, amount] of rows) {
    out.push(row(top, description, qty, unit, amount));
    top += 20;
  }

  if (footer) {
    out.push(line(top + 10, [[footer, 0]]));
  }
  return out;
}

function summary(top: number, subtotal: string, total: string): Line[] {
  return [
    line(top, [
      ["Subtotal:", 0],
      [subtotal, COL.amount],
    ]),
    line(top + 20, [
      ["Total:", 0],
      [total, COL.amount],
    ]),
  ];
}

function parse(lines: Line[]): ExtractedDocument {
  return parseDocument(lines, { kind: "invoice" });
}

function descriptions(doc: ExtractedDocument): string[] {
  return doc.lineItems.map((item) => item.description);
}

function hasWarning(doc: ExtractedDocument, code: string): boolean {
  return doc.warnings.some((w) => w.code === code);
}

const PAGE_1: Array<[string, string, string, string]> = [
  ["Consulting services", "10", "120.00", "1200.00"],
  ["Design work", "4", "150.00", "600.00"],
];
const PAGE_2: Array<[string, string, string, string]> = [
  ["Server hardware", "2", "899.00", "1798.00"],
  ["Rack mounting", "3", "75.00", "225.00"],
];
const PAGE_3: Array<[string, string, string, string]> = [
  ["Training session", "5", "300.00", "1500.00"],
  ["Support retainer", "12", "99.00", "1188.00"],
];

describe("single page is unchanged", () => {
  it("returns every row of a one-page table", () => {
    const doc = parse([...page(0, PAGE_1), ...summary(400, "1800.00", "1800.00")]);
    expect(doc.lineItems).toHaveLength(2);
    expect(descriptions(doc)).toEqual(["Consulting services", "Design work"]);
  });

  it("does not flag a complete single-page invoice for review", () => {
    const doc = parse([...page(0, PAGE_1), ...summary(400, "1800.00", "1800.00")]);
    expect(doc.warnings.map((w) => w.code)).toEqual([]);
    expect(doc.needsReview).toBe(false);
  });
});

describe("two pages, table continues", () => {
  it("returns 4 items, not 2", () => {
    const doc = parse([
      ...page(0, PAGE_1),
      ...page(1000, PAGE_2),
      ...summary(1400, "3823.00", "3823.00"),
    ]);
    expect(doc.lineItems).toHaveLength(4);
  });

  it("keeps document order across the page break", () => {
    const doc = parse([...page(0, PAGE_1), ...page(1000, PAGE_2)]);
    expect(descriptions(doc)).toEqual([
      "Consulting services",
      "Design work",
      "Server hardware",
      "Rack mounting",
    ]);
  });
});

describe("three pages, table continues", () => {
  // This is the shape that exposed the bug: 6 rows expected, 2 returned.
  const lines = [
    ...page(0, PAGE_1),
    ...page(1000, PAGE_2),
    ...page(2000, PAGE_3),
    ...summary(2400, "6511.00", "6511.00"),
  ];

  it("returns 6 items, not 2", () => {
    expect(parse(lines).lineItems).toHaveLength(6);
  });

  it("returns them in reading order", () => {
    expect(descriptions(parse(lines))).toEqual([
      "Consulting services",
      "Design work",
      "Server hardware",
      "Rack mounting",
      "Training session",
      "Support retainer",
    ]);
  });

  it("never emits a repeated column header as an item", () => {
    const doc = parse(lines);
    for (const item of doc.lineItems) {
      expect(item.description).not.toBe("Description");
    }
    expect(doc.lineItems.some((i) => i.quantity === "Qty")).toBe(false);
  });

  it("reports no unconsumed content once every row is read", () => {
    expect(hasWarning(parse(lines), "unconsumed_content")).toBe(false);
  });
});

describe("page break inside the table", () => {
  it("continues a table whose second page repeats no column header", () => {
    const doc = parse([
      ...page(0, PAGE_1),
      ...page(1000, PAGE_2, { repeatHeader: false, withTableHeader: false }),
    ]);
    expect(doc.lineItems).toHaveLength(4);
    expect(descriptions(doc)).toContain("Server hardware");
  });

  it("survives a repeated invoice header between the two halves", () => {
    const doc = parse([
      ...page(0, PAGE_1),
      ...page(1000, PAGE_2, { repeatHeader: true, withTableHeader: false }),
    ]);
    expect(doc.lineItems).toHaveLength(4);
  });
});

describe("pages without rows", () => {
  it("ignores a page that carries only a footer", () => {
    const doc = parse([
      ...page(0, PAGE_1),
      ...page(1000, [], { repeatHeader: false, withTableHeader: false, footer: "Page 2 of 3" }),
      ...page(2000, PAGE_2),
    ]);
    expect(doc.lineItems).toHaveLength(4);
  });

  it("ignores a page with a header but no rows", () => {
    const doc = parse([...page(0, PAGE_1), ...page(1000, [])]);
    expect(doc.lineItems).toHaveLength(2);
  });
});

describe("documents with no table at all", () => {
  const noTable: Line[] = [
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
      ["Total:", 0],
      ["1800.00", 470],
    ]),
  ];

  it("still parses the fields", () => {
    const doc = parse(noTable);
    expect(doc.fields.find((f) => f.key === "documentNumber")?.value).toBe("INV-2026-0042");
  });

  it("warns that no line items were found rather than failing", () => {
    const doc = parse(noTable);
    expect(doc.lineItems).toHaveLength(0);
    expect(hasWarning(doc, "no_line_items")).toBe(true);
    expect(doc.needsReview).toBe(true);
  });

  it("reports no unconsumed content when there was never a table", () => {
    expect(hasWarning(parse(noTable), "unconsumed_content")).toBe(false);
  });
});
