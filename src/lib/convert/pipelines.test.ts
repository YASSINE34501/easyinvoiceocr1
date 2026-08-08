import { describe, expect, it } from "vitest";
import {
  blocksToText,
  pagesToModel,
  summarise,
  textToBlocks,
  type RecognisedPage,
} from "./pipelines";
import { ConversionError, type DocBlock } from "./types";

const page = (index: number, blocks: DocBlock[], text: string): RecognisedPage => ({
  index,
  blocks,
  text,
  confidence: 88,
  usedOcr: true,
});

describe("textToBlocks", () => {
  it("splits on blank lines and rejoins wrapped lines", () => {
    const blocks = textToBlocks("First paragraph\nstill first.\n\nSecond paragraph.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ text: "First paragraph still first." });
  });

  it("ignores empty input", () => {
    expect(textToBlocks("   \n\n  ")).toEqual([]);
  });

  it("marks Arabic corrections right-to-left", () => {
    expect(textToBlocks("هذه فقرة عربية")[0]).toMatchObject({ dir: "rtl" });
  });
});

describe("pagesToModel", () => {
  const pages = [
    page(1, [{ kind: "paragraph", text: "Page one text.", dir: "ltr" }], "Page one text."),
    page(2, [{ kind: "paragraph", text: "Page two text.", dir: "ltr" }], "Page two text."),
  ];

  it("keeps the pages in order and separates them with a page break", () => {
    const model = pagesToModel(pages, "report.pdf");
    expect(model.pageCount).toBe(2);
    expect(model.blocks[0]).toMatchObject({ text: "Page one text." });
    expect(model.blocks[1]).toMatchObject({ kind: "pageBreak" });
    expect(model.blocks[2]).toMatchObject({ text: "Page two text." });
  });

  it("uses the user's correction instead of what was recognised", () => {
    const model = pagesToModel(pages, "report.pdf", { 1: "Corrected first page." });
    expect(blocksToText(model.blocks)).toContain("Corrected first page.");
    expect(blocksToText(model.blocks)).not.toContain("Page one text.");
  });

  it("cleans the filename for the download name", () => {
    expect(pagesToModel(pages, "../secret/report.pdf").baseName).toBe("secretreport");
  });

  it("records that OCR was involved", () => {
    expect(pagesToModel(pages, "report.pdf").usedOcr).toBe(true);
  });

  it("refuses to build a document from pages with no text", () => {
    expect(() => pagesToModel([page(1, [], "")], "empty.pdf")).toThrow(ConversionError);
  });

  it("refuses when every page was corrected to nothing", () => {
    expect(() => pagesToModel(pages, "report.pdf", { 1: "   ", 2: "" })).toThrow(ConversionError);
  });
});

describe("summarise", () => {
  it("counts what was detected", () => {
    const model = pagesToModel(
      [
        page(
          1,
          [
            { kind: "heading", level: 1, text: "Title", dir: "ltr" },
            { kind: "paragraph", text: "Body copy.", dir: "ltr" },
            { kind: "list", ordered: false, items: ["a", "b"], dir: "ltr" },
            { kind: "table", rows: [["x", "y"]], dir: "ltr" },
          ],
          "Title",
        ),
      ],
      "report.pdf",
    );

    expect(summarise(model)).toMatchObject({
      headings: 1,
      paragraphs: 1,
      lists: 1,
      tables: 1,
    });
  });
});
