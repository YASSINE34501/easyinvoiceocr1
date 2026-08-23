import { describe, expect, it } from "vitest";
import { blocksToText, pagesToModel, type RecognisedPage } from "./pipelines";
import { assertUsableModel, toModel, xmlSafe } from "./docx";
import type { DocBlock } from "./types";

/**
 * PDF → Word fidelity.
 *
 * The conversion itself needs a browser (pdf.js renders to a canvas), so what
 * is pinned here is the layer underneath: the model that becomes the .docx.
 * Every defect this file guards against is one that produces a document which
 * opens cleanly and is missing its content — the failure that is worst to ship,
 * because nothing signals it until someone reads the file.
 */

function para(text: string, dir: "ltr" | "rtl" = "ltr"): DocBlock {
  return { kind: "paragraph", text, dir };
}

function heading(text: string, level: 1 | 2 | 3 = 1): DocBlock {
  return { kind: "heading", text, level, dir: "ltr" };
}

function page(index: number, blocks: DocBlock[], usedOcr = false): RecognisedPage {
  return { index, blocks, text: blocksToText(blocks), confidence: null, usedOcr };
}

describe("every source page reaches the document", () => {
  it("keeps all four pages of a four-page PDF", () => {
    const pages = [1, 2, 3, 4].map((i) =>
      page(i, [heading(`Chapter ${i}`), para(`Body of page ${i}.`)]),
    );
    const model = pagesToModel(pages, "multi-page.pdf");
    const text = model.blocks.map((b) => ("text" in b ? b.text : "")).join(" ");
    for (const i of [1, 2, 3, 4]) {
      expect(text, `chapter ${i}`).toContain(`Chapter ${i}`);
      expect(text, `body ${i}`).toContain(`Body of page ${i}.`);
    }
  });

  it("does not drop a page that sits between two others", () => {
    const pages = [page(1, [para("first")]), page(2, [para("middle")]), page(3, [para("last")])];
    const text = pagesToModel(pages, "x.pdf")
      .blocks.map((b) => ("text" in b ? b.text : ""))
      .join(" ");
    expect(text).toContain("middle");
  });

  it("reports the page count it was given", () => {
    expect(
      pagesToModel(
        [1, 2, 3, 4, 5].map((i) => page(i, [para(`p${i}`)])),
        "x.pdf",
      ).pageCount,
    ).toBe(5);
  });
});

describe("page boundaries are carried into the document", () => {
  // The model has a pageBreak block for exactly this. Without it a four-page
  // PDF opens in Word as one unbroken flow, which is not what the source said.
  const model = pagesToModel(
    [1, 2, 3].map((i) => page(i, [para(`Page ${i} content.`)])),
    "multi-page.pdf",
  );

  it("separates the pages rather than running them together", () => {
    const breaks = model.blocks.filter((b) => b.kind === "pageBreak").length;
    expect(breaks).toBe(2);
  });

  it("puts no break before the first page or after the last", () => {
    expect(model.blocks[0]?.kind).not.toBe("pageBreak");
    expect(model.blocks[model.blocks.length - 1]?.kind).not.toBe("pageBreak");
  });
});

describe("a blank page is carried without inventing content", () => {
  // A separator sheet or the back of a duplex scan produces a page with no
  // blocks at all. It must not fabricate text, and must not remove the pages
  // around it.
  const pages = [page(1, [para("Only page one has text")]), page(2, []), page(3, [])];

  it("keeps the surrounding content", () => {
    const text = pagesToModel(pages, "empty-pages.pdf")
      .blocks.map((b) => ("text" in b ? b.text : ""))
      .join(" ");
    expect(text).toContain("Only page one has text");
  });

  it("still counts the empty pages", () => {
    expect(pagesToModel(pages, "empty-pages.pdf").pageCount).toBe(3);
  });
});

describe("structure survives the conversion", () => {
  const model = pagesToModel(
    [
      page(1, [
        heading("Quarterly Report", 1),
        heading("Introduction", 2),
        para("Revenue grew across every region."),
      ]),
    ],
    "report.pdf",
  );

  it("keeps headings as headings rather than flattening them to text", () => {
    const kinds = model.blocks.map((b) => b.kind);
    expect(kinds).toContain("heading");
  });

  it("preserves heading levels", () => {
    const levels = model.blocks
      .filter((b): b is Extract<DocBlock, { kind: "heading" }> => b.kind === "heading")
      .map((b) => b.level);
    expect(levels).toContain(1);
    expect(levels).toContain(2);
  });

  it("keeps paragraphs separate from headings", () => {
    expect(model.blocks.some((b) => b.kind === "paragraph")).toBe(true);
  });
});

describe("accented and non-ASCII text is not mangled", () => {
  it("round-trips French accents", () => {
    const text = blocksToText([para("Les coûts sont restés stables — société créée à Paris.")]);
    expect(text).toContain("coûts");
    expect(text).toContain("restés");
    expect(text).toContain("société");
    expect(text).toContain("créée");
  });

  it("round-trips Arabic", () => {
    const text = blocksToText([para("فاتورة رقم ٢٠٢٦ — المجموع الكلي")]);
    expect(text).toContain("فاتورة");
    expect(text).toContain("المجموع");
  });
});

describe("a document that would open empty is refused", () => {
  it("rejects a model with no blocks", () => {
    // assertUsableModel exists so an empty .docx is never handed to a visitor
    // as a successful conversion.
    expect(() =>
      assertUsableModel({ baseName: "x", blocks: [], pageCount: 0, usedOcr: false, dir: "ltr" }),
    ).toThrow();
  });

  it("accepts a model that carries text", () => {
    expect(() =>
      assertUsableModel({
        baseName: "x",
        blocks: [para("real content")],
        pageCount: 1,
        usedOcr: false,
        dir: "ltr",
      }),
    ).not.toThrow();
  });
});

describe("toModel carries the document identity through", () => {
  it("keeps the base name it was given", () => {
    const model = toModel("Quarterly Report", [para("hello")], 1, false, "ltr");
    expect(model.baseName).toBe("Quarterly Report");
    expect(model.blocks).toHaveLength(1);
  });

  it("records the direction, which is what makes an Arabic document read correctly", () => {
    expect(toModel("فاتورة", [para("مرحبا")], 1, true, "rtl").dir).toBe("rtl");
  });

  it("records whether the text came from recognition rather than a text layer", () => {
    expect(toModel("scan", [para("x")], 1, true, "ltr").usedOcr).toBe(true);
    expect(toModel("native", [para("x")], 1, false, "ltr").usedOcr).toBe(false);
  });
});

describe("the document Word will actually open", () => {
  /**
   * A .docx is a zip full of XML, and XML 1.0 forbids the C0 control range
   * apart from tab, newline and carriage return. A PDF text layer and OCR both
   * emit those bytes routinely, and the docx library writes what it is handed —
   * so one stray 0x0B produced a file that packed correctly, passed a zip
   * signature check, and then made Word refuse the whole document with
   * "Word encountered an error trying to open the file".
   */
  const CONTROL = String.fromCharCode(0x03);
  const VERTICAL_TAB = String.fromCharCode(0x0b);
  const UNIT_SEP = String.fromCharCode(0x1f);

  it("removes the control characters XML cannot carry", () => {
    const dirty = `Invoice${CONTROL} total${VERTICAL_TAB} 2040.00${UNIT_SEP}`;
    expect(xmlSafe(dirty)).toBe("Invoice total 2040.00");
  });

  it("keeps the three whitespace characters XML does allow", () => {
    expect(xmlSafe("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });

  it("leaves ordinary text untouched, in every language the site supports", () => {
    expect(xmlSafe("Revenue grew")).toBe("Revenue grew");
    expect(xmlSafe("Les coûts sont restés stables — société")).toBe(
      "Les coûts sont restés stables — société",
    );
    expect(xmlSafe("فاتورة رقم ٢٠٢٦ — المجموع")).toBe("فاتورة رقم ٢٠٢٦ — المجموع");
    expect(xmlSafe("Total: 2 040,00 €")).toBe("Total: 2 040,00 €");
  });

  it("keeps a matched surrogate pair, which is one real character", () => {
    // An emoji is two code units that belong together; splitting it would
    // corrupt the text just as surely as leaving a lone half would.
    expect(xmlSafe("total 💶 due")).toBe("total 💶 due");
  });

  it("drops a lone surrogate, which is not a valid XML character", () => {
    expect(xmlSafe(`bad${String.fromCharCode(0xd800)}half`)).toBe("badhalf");
    expect(xmlSafe(`${String.fromCharCode(0xdc00)}trailing`)).toBe("trailing");
  });

  it("strips the DEL and C1 range as well", () => {
    expect(xmlSafe(`a${String.fromCharCode(0x7f)}b${String.fromCharCode(0x9f)}c`)).toBe("abc");
  });

  it("returns an empty string rather than throwing on control-only input", () => {
    expect(xmlSafe(CONTROL + VERTICAL_TAB + UNIT_SEP)).toBe("");
  });
});
