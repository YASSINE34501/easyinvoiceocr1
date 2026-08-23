import { describe, expect, it } from "vitest";
import { linesFromOcr } from "./ocr";
import { pageNeedsOcr } from "./pdf";
import { blocksFromLines } from "./layout";
import type { PdfPageText, PdfTextItem } from "./pdf";

/**
 * The scanned-PDF route, tested at every seam that does not need a browser.
 *
 * The full route is: page -> pageNeedsOcr decides there is no usable text layer
 * -> the page is rendered to a canvas -> Tesseract recognises it -> its nested
 * result is flattened by linesFromOcr -> blocksFromLines turns positioned lines
 * into document blocks -> the writer builds the .docx.
 *
 * Two of those steps need a real browser: rendering needs a compositing canvas
 * and recognition needs the WebAssembly worker. Everything on either side of
 * them is ordinary data transformation, and that is what is pinned here — the
 * decision to run OCR at all, and the reshaping of what comes back. A wrong
 * answer at either end produces a document that is empty, or scrambled, or
 * silently skips recognition on a page that needed it.
 *
 * These tests do NOT demonstrate that Tesseract recognises anything. That step
 * remains unverified in this environment and is reported as such.
 */

function item(str: string, y: number, x = 50): PdfTextItem {
  return {
    str,
    x,
    y,
    width: str.length * 6,
    height: 12,
    fontSize: 12,
    fontName: "g_d0_f1",
    dir: "ltr",
    hasEOL: false,
  };
}

function page(items: PdfTextItem[]): PdfPageText {
  return { pageNumber: 1, items, width: 595, height: 842 };
}

describe("deciding whether a page needs recognition", () => {
  it("sends a page with no text layer to OCR", () => {
    expect(pageNeedsOcr(page([]))).toBe(true);
  });

  it("leaves a page with a real text layer alone", () => {
    const body = "This page carries a full paragraph of genuine extractable text content.";
    expect(pageNeedsOcr(page([item(body, 700)]))).toBe(false);
  });

  it("still recognises a page carrying only a few stray glyphs", () => {
    // Some scanners embed a handful of characters — a page number, a scanner
    // watermark. Treating that as a usable text layer returns a nearly empty
    // document from a page that is entirely readable by OCR.
    expect(pageNeedsOcr(page([item("3", 40)]))).toBe(true);
  });

  it("ignores whitespace when measuring how much text there is", () => {
    expect(pageNeedsOcr(page([item("        ", 700), item("   ", 680)]))).toBe(true);
  });
});

describe("flattening what the engine returns", () => {
  const box = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });
  const word = (text: string, x0: number, y0: number, x1: number, y1: number) => ({
    text,
    bbox: box(x0, y0, x1, y1),
  });

  it("turns nested blocks and paragraphs into a flat list of positioned lines", () => {
    const lines = linesFromOcr([
      {
        paragraphs: [
          {
            lines: [
              {
                text: "INVOICE 2026",
                bbox: box(60, 40, 400, 90),
                words: [word("INVOICE", 60, 40, 240, 90), word("2026", 260, 40, 400, 90)],
              },
              {
                text: "TOTAL 2040.00 EUR",
                bbox: box(60, 120, 520, 170),
                words: [
                  word("TOTAL", 60, 120, 200, 170),
                  word("2040.00", 220, 120, 400, 170),
                  word("EUR", 420, 120, 520, 170),
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(lines).toHaveLength(2);
    expect(lines[0]?.text).toBe("INVOICE 2026");
    expect(lines[1]?.text).toBe("TOTAL 2040.00 EUR");
  });

  it("keeps the reading order the engine reported", () => {
    const mk = (text: string, y: number) => ({
      text,
      bbox: box(60, y, 400, y + 40),
      words: [word(text, 60, y, 400, y + 40)],
    });
    const lines = linesFromOcr([
      { paragraphs: [{ lines: [mk("first", 40), mk("second", 100), mk("third", 160)] }] },
    ]);
    expect(lines.map((l) => l.text)).toEqual(["first", "second", "third"]);
  });

  it("survives an engine result with no blocks at all", () => {
    // A page of blank paper recognises to nothing. That must be an empty
    // result, not a crash that loses the rest of the document.
    expect(linesFromOcr([])).toEqual([]);
    expect(linesFromOcr([{ paragraphs: [] }])).toEqual([]);
    expect(linesFromOcr([{ paragraphs: [{ lines: [] }] }])).toEqual([]);
  });

  it("carries Arabic text through unaltered", () => {
    const lines = linesFromOcr([
      {
        paragraphs: [
          {
            lines: [
              {
                text: "فاتورة رقم ٢٠٢٦",
                bbox: box(60, 40, 400, 90),
                words: [
                  word("فاتورة", 300, 40, 400, 90),
                  word("رقم", 200, 40, 290, 90),
                  word("٢٠٢٦", 60, 40, 180, 90),
                ],
              },
            ],
          },
        ],
      },
    ]);
    expect(lines[0]?.text).toBe("فاتورة رقم ٢٠٢٦");
  });
});

describe("recognised lines become document blocks", () => {
  // The shape linesFromOcr produces: fragments plus a vertical position.
  const line = (text: string, top: number, size = 14) => {
    let x = 60;
    const fragments = text.split(" ").map((word) => {
      const width = Math.max(1, word.length * size * 0.5);
      const fragment = { text: word, x, width, size };
      x += width + size * 0.3;
      return fragment;
    });
    return { fragments, text, top, height: size, size, x0: 60, x1: x };
  };

  it("produces paragraphs from recognised body text", () => {
    const blocks = blocksFromLines([line("A recognised line of body text.", 100)]);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => "text" in b && b.text.includes("recognised"))).toBe(true);
  });

  it("loses nothing: every recognised line reaches some block", () => {
    const texts = ["First recognised line", "Second recognised line", "Third recognised line"];
    const blocks = blocksFromLines(texts.map((t, i) => line(t, 100 + i * 40)));
    const joined = blocks.map((b) => ("text" in b ? b.text : "")).join(" ");
    for (const t of texts) expect(joined, t).toContain(t.split(" ")[0]!);
  });

  it("returns nothing for a page that recognised to nothing", () => {
    expect(blocksFromLines([])).toEqual([]);
  });

  it("marks right-to-left recognised lines so the document reads correctly", () => {
    const blocks = blocksFromLines([line("فاتورة رقم ٢٠٢٦ المجموع الكلي", 100, 16)]);
    // Direction is detected from the characters themselves, not declared.
    expect(blocks.some((b) => "dir" in b && b.dir === "rtl")).toBe(true);
  });
});
