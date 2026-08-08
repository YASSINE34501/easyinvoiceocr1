import { describe, expect, it } from "vitest";
import { blocksFromLines, detectDirection, dominantDirection, type Line } from "./layout";

/** Builds a synthetic line whose fragments sit at the given x positions. */
function line(
  text: string,
  options: { top: number; size?: number; cells?: { text: string; x: number }[] },
): Line {
  const size = options.size ?? 10;
  const fragments = options.cells?.map((cell) => ({
    text: cell.text,
    x: cell.x,
    width: cell.text.length * size * 0.5,
    size,
  })) ?? [{ text, x: 0, width: text.length * size * 0.5, size }];

  return {
    fragments,
    text: fragments.map((f) => f.text).join(" "),
    top: options.top,
    height: size,
    size,
    x0: Math.min(...fragments.map((f) => f.x)),
    x1: Math.max(...fragments.map((f) => f.x + f.width)),
  };
}

describe("detectDirection", () => {
  it("reads Latin text as left-to-right", () => {
    expect(detectDirection("Invoice total due")).toBe("ltr");
  });

  it("reads Arabic text as right-to-left", () => {
    expect(detectDirection("فاتورة المبلغ الإجمالي")).toBe("rtl");
  });

  it("decides mixed text by which script dominates", () => {
    expect(detectDirection("الإجمالي المستحق: 1,240.00 USD")).toBe("rtl");
    expect(detectDirection("Total due الإجمالي 1240")).toBe("ltr");
  });

  it("treats digits and punctuation alone as left-to-right", () => {
    expect(detectDirection("1,240.00")).toBe("ltr");
  });
});

describe("blocksFromLines", () => {
  it("promotes noticeably larger short lines to headings", () => {
    const blocks = blocksFromLines([
      line("Quarterly Report", { top: 0, size: 20 }),
      line("The quarter closed ahead of plan.", { top: 24 }),
      line("Revenue grew across every region.", { top: 36 }),
    ]);

    expect(blocks[0]).toMatchObject({ kind: "heading", level: 1, text: "Quarterly Report" });
    expect(blocks[1]?.kind).toBe("paragraph");
  });

  it("merges wrapped lines into one paragraph", () => {
    const blocks = blocksFromLines([
      line("The quarter closed ahead of plan and every", { top: 0 }),
      line("region contributed to the result.", { top: 12 }),
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "paragraph",
      text: "The quarter closed ahead of plan and every region contributed to the result.",
    });
  });

  it("starts a new paragraph after a large vertical gap", () => {
    const blocks = blocksFromLines([
      line("First paragraph of the letter.", { top: 0 }),
      line("Second paragraph of the letter.", { top: 90 }),
    ]);

    expect(blocks).toHaveLength(2);
    expect(blocks.every((block) => block.kind === "paragraph")).toBe(true);
  });

  it("collects bulleted lines into one list", () => {
    const blocks = blocksFromLines([
      line("• First item", { top: 0 }),
      line("• Second item", { top: 14 }),
      line("• Third item", { top: 28 }),
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "list",
      ordered: false,
      items: ["First item", "Second item", "Third item"],
    });
  });

  it("recognises numbered lists as ordered", () => {
    const blocks = blocksFromLines([
      line("1. Prepare the invoice", { top: 0 }),
      line("2. Send it for approval", { top: 14 }),
    ]);

    expect(blocks[0]).toMatchObject({ kind: "list", ordered: true });
  });

  it("builds a table from consecutive lines sharing column positions", () => {
    const columns = (a: string, b: string, c: string) => [
      { text: a, x: 0 },
      { text: b, x: 200 },
      { text: c, x: 400 },
    ];

    const blocks = blocksFromLines([
      line("", { top: 0, cells: columns("Description", "Qty", "Total") }),
      line("", { top: 14, cells: columns("Hosting", "1", "1200.00") }),
      line("", { top: 28, cells: columns("Storage", "2", "320.00") }),
    ]);

    expect(blocks[0]?.kind).toBe("table");
    if (blocks[0]?.kind === "table") {
      expect(blocks[0].rows).toHaveLength(3);
      expect(blocks[0].rows[0]).toEqual(["Description", "Qty", "Total"]);
      expect(blocks[0].rows[2]).toEqual(["Storage", "2", "320.00"]);
    }
  });

  it("does not invent a table from a single column-like line", () => {
    const blocks = blocksFromLines([
      line("", {
        top: 0,
        cells: [
          { text: "Invoice", x: 0 },
          { text: "INV-1", x: 400 },
        ],
      }),
      line("An ordinary sentence follows here.", { top: 40 }),
    ]);

    expect(blocks.some((block) => block.kind === "table")).toBe(false);
  });

  it("marks an Arabic paragraph right-to-left", () => {
    const blocks = blocksFromLines([line("هذه فقرة عربية كاملة للاختبار", { top: 0 })]);
    expect(blocks[0]).toMatchObject({ kind: "paragraph", dir: "rtl" });
  });

  it("returns nothing for an empty page", () => {
    expect(blocksFromLines([])).toEqual([]);
  });
});

describe("dominantDirection", () => {
  it("follows the majority of blocks", () => {
    expect(
      dominantDirection([
        { kind: "paragraph", text: "one", dir: "rtl" },
        { kind: "paragraph", text: "two", dir: "rtl" },
        { kind: "paragraph", text: "three", dir: "ltr" },
      ]),
    ).toBe("rtl");
  });
});
