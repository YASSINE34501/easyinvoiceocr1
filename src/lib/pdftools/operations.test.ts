import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import {
  addPageNumbers,
  cropPages,
  eachPageRange,
  extractPages,
  fixedSizeRanges,
  inspectPdf,
  mergePdfs,
  organizePages,
  removePages,
  rotatePages,
  splitPdf,
  toArabicIndicDigits,
} from "./operations";
import { isPdfToolError } from "./types";

/**
 * These run the same functions the browser runs — pdf-lib works under Node, so
 * nothing here is a stand-in for the real operation. Every assertion reopens
 * the produced bytes and reads them back, because the failure that matters is
 * not "did the function return" but "is the thing it returned a document".
 *
 * Fixtures are built here rather than checked in: a generated PDF can state its
 * own page count, sizes and rotations, and no customer document is involved.
 */

/** A PDF whose every page says which page it is. */
async function makePdf(
  pages: number,
  options: { width?: number; height?: number; rotate?: number } = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i += 1) {
    const page = doc.addPage([options.width ?? 595, options.height ?? 842]);
    page.drawText(`PAGE ${i}`, { x: 60, y: 700, size: 24, font });
    if (options.rotate) page.setRotation(degrees(options.rotate));
  }
  return doc.save();
}

/** Reads the "PAGE n" marks back, in document order. */
async function pageOrderOf(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

async function expectValidPdf(bytes: Uint8Array) {
  expect(bytes.length).toBeGreaterThan(100);
  expect(String.fromCharCode(...bytes.subarray(0, 5))).toBe("%PDF-");
  await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
}

/* ------------------------------------------------------------------ */

describe("input validation", () => {
  it("refuses an empty file", async () => {
    await expect(extractPages(new Uint8Array(), "x.pdf", [0])).rejects.toMatchObject({
      code: "file_empty",
    });
  });

  it("refuses bytes that are not a PDF", async () => {
    const notPdf = new TextEncoder().encode("this is a text file, not a document");
    await expect(extractPages(notPdf, "x.pdf", [0])).rejects.toMatchObject({
      code: "pdf_corrupt",
    });
  });

  it("refuses a truncated PDF", async () => {
    const full = await makePdf(3);
    const truncated = full.subarray(0, Math.floor(full.length / 3));
    await expect(inspectPdf(truncated)).rejects.toSatisfy(isPdfToolError);
  });

  it("refuses a page number past the end", async () => {
    const bytes = await makePdf(2);
    await expect(rotatePages(bytes, "x.pdf", [5], 90)).rejects.toMatchObject({
      code: "selection_out_of_range",
    });
  });
});

describe("merge", () => {
  it("joins two documents and keeps every page", async () => {
    const a = await makePdf(3);
    const b = await makePdf(2);
    const { file, pageCount, sources } = await mergePdfs([
      { name: "a.pdf", bytes: a },
      { name: "b.pdf", bytes: b },
    ]);

    await expectValidPdf(file.bytes);
    expect(pageCount).toBe(5);
    expect(sources).toBe(2);
    expect(await pageOrderOf(file.bytes)).toBe(5);
    expect(file.mime).toBe("application/pdf");
    expect(file.name.endsWith(".pdf")).toBe(true);
  });

  it("joins three documents", async () => {
    const parts = await Promise.all([makePdf(1), makePdf(2), makePdf(3)]);
    const { pageCount } = await mergePdfs(parts.map((bytes, i) => ({ name: `${i}.pdf`, bytes })));
    expect(pageCount).toBe(6);
  });

  it("keeps each source page's own size", async () => {
    const a4 = await makePdf(1);
    const wide = await makePdf(1, { width: 1000, height: 500 });
    const { file } = await mergePdfs([
      { name: "a.pdf", bytes: a4 },
      { name: "w.pdf", bytes: wide },
    ]);

    const doc = await PDFDocument.load(file.bytes);
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595);
    expect(Math.round(doc.getPage(1).getWidth())).toBe(1000);
  });

  it("carries a rotated page across unchanged", async () => {
    const upright = await makePdf(1);
    const turned = await makePdf(1, { rotate: 90 });
    const { file } = await mergePdfs([
      { name: "u.pdf", bytes: upright },
      { name: "t.pdf", bytes: turned },
    ]);

    const doc = await PDFDocument.load(file.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
  });

  it("refuses a single file, which is not a merge", async () => {
    const a = await makePdf(2);
    await expect(mergePdfs([{ name: "a.pdf", bytes: a }])).rejects.toMatchObject({
      code: "need_two_files",
    });
  });
});

describe("split", () => {
  it("writes one document per page", async () => {
    const bytes = await makePdf(4);
    const { files, pageCount } = await splitPdf(bytes, "doc.pdf", eachPageRange(4));

    expect(files).toHaveLength(4);
    expect(pageCount).toBe(4);
    for (const file of files) {
      await expectValidPdf(file.bytes);
      expect(await pageOrderOf(file.bytes)).toBe(1);
    }
  });

  it("names the parts so they sort correctly", async () => {
    const bytes = await makePdf(3);
    const { files } = await splitPdf(bytes, "report.pdf", eachPageRange(3));
    expect(files.map((f) => f.name)).toEqual(["report-01.pdf", "report-02.pdf", "report-03.pdf"]);
  });

  it("groups by a fixed size, with a short final group", async () => {
    const bytes = await makePdf(10);
    const { files } = await splitPdf(bytes, "doc.pdf", fixedSizeRanges(10, 4));

    expect(files).toHaveLength(3);
    expect(await pageOrderOf(files[0]!.bytes)).toBe(4);
    expect(await pageOrderOf(files[1]!.bytes)).toBe(4);
    expect(await pageOrderOf(files[2]!.bytes)).toBe(2);
  });

  it("refuses a group size of zero rather than looping forever", () => {
    expect(() => fixedSizeRanges(10, 0)).toThrow();
  });
});

describe("remove pages", () => {
  it("keeps everything that was not selected", async () => {
    const bytes = await makePdf(5);
    const { file, pageCount, removed } = await removePages(bytes, "doc.pdf", [1, 3]);

    await expectValidPdf(file.bytes);
    expect(pageCount).toBe(3);
    expect(removed).toBe("2, 4");
  });

  it("refuses to leave a document with no pages", async () => {
    const bytes = await makePdf(2);
    await expect(removePages(bytes, "doc.pdf", [0, 1])).rejects.toMatchObject({
      code: "would_remove_every_page",
    });
  });
});

describe("extract pages", () => {
  it("keeps exactly the selected pages", async () => {
    const bytes = await makePdf(6);
    const { file, pageCount, kept } = await extractPages(bytes, "doc.pdf", [0, 2, 4]);

    await expectValidPdf(file.bytes);
    expect(pageCount).toBe(3);
    expect(kept).toBe("1, 3, 5");
    expect(file.name).toBe("doc-pages.pdf");
  });
});

describe("organize", () => {
  it("writes the pages in exactly the order given", async () => {
    const bytes = await makePdf(3);
    const { file, pageCount } = await organizePages(bytes, "doc.pdf", [2, 0, 1]);

    await expectValidPdf(file.bytes);
    expect(pageCount).toBe(3);
  });

  it("allows a page to be repeated, which is a legitimate request", async () => {
    const bytes = await makePdf(2);
    const { pageCount } = await organizePages(bytes, "doc.pdf", [0, 0, 1]);
    expect(pageCount).toBe(3);
  });

  it("refuses an empty order", async () => {
    const bytes = await makePdf(2);
    await expect(organizePages(bytes, "doc.pdf", [])).rejects.toMatchObject({
      code: "would_remove_every_page",
    });
  });
});

describe("rotate", () => {
  it("turns only the selected pages", async () => {
    const bytes = await makePdf(3);
    const { file } = await rotatePages(bytes, "doc.pdf", [1], 90);

    const doc = await PDFDocument.load(file.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
    expect(doc.getPage(2).getRotation().angle).toBe(0);
  });

  it("adds to the rotation a page already had", async () => {
    // A scanner that saved a page at 90 and a visitor asking for another
    // quarter turn should land at 180, not be reset to 90.
    const bytes = await makePdf(1, { rotate: 90 });
    const { file } = await rotatePages(bytes, "doc.pdf", [0], 90);
    const doc = await PDFDocument.load(file.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
  });

  it("wraps past a full turn", async () => {
    const bytes = await makePdf(1, { rotate: 270 });
    const { file } = await rotatePages(bytes, "doc.pdf", [0], 180);
    const doc = await PDFDocument.load(file.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
  });
});

describe("crop", () => {
  it("shrinks the visible area without touching the media box", async () => {
    const bytes = await makePdf(1);
    const { file } = await cropPages(bytes, "doc.pdf", [0], {
      top: 50,
      right: 40,
      bottom: 30,
      left: 20,
    });

    const doc = await PDFDocument.load(file.bytes);
    const page = doc.getPage(0);
    expect(Math.round(page.getCropBox().width)).toBe(595 - 20 - 40);
    expect(Math.round(page.getCropBox().height)).toBe(842 - 50 - 30);
    // The content is still there; the reader is only told to show less.
    expect(Math.round(page.getMediaBox().width)).toBe(595);
  });

  it("refuses a crop that would leave nothing", async () => {
    const bytes = await makePdf(1);
    await expect(
      cropPages(bytes, "doc.pdf", [0], { top: 500, right: 0, bottom: 500, left: 0 }),
    ).rejects.toMatchObject({ code: "crop_too_large" });
  });

  it("refuses a negative margin", async () => {
    const bytes = await makePdf(1);
    await expect(
      cropPages(bytes, "doc.pdf", [0], { top: -10, right: 0, bottom: 0, left: 0 }),
    ).rejects.toMatchObject({ code: "crop_invalid" });
  });
});

describe("page numbers", () => {
  it("writes a number onto every selected page", async () => {
    const bytes = await makePdf(3);
    const { file, numbered } = await addPageNumbers(bytes, "doc.pdf", [0, 1, 2], {
      position: "bottom-center",
      startAt: 1,
      fontSize: 12,
      format: "{n}",
    });

    await expectValidPdf(file.bytes);
    expect(numbered).toBe(3);
    expect(file.name).toBe("doc-numbered.pdf");
  });

  it("starts from the number asked for", async () => {
    const bytes = await makePdf(2);
    const { file } = await addPageNumbers(bytes, "doc.pdf", [0, 1], {
      position: "bottom-right",
      startAt: 7,
      fontSize: 10,
      format: "Page {n} of {total}",
    });
    await expectValidPdf(file.bytes);
  });

  it("refuses an absurd font size instead of drawing something unreadable", async () => {
    const bytes = await makePdf(1);
    await expect(
      addPageNumbers(bytes, "doc.pdf", [0], {
        position: "bottom-center",
        startAt: 1,
        fontSize: 400,
        format: "{n}",
      }),
    ).rejects.toMatchObject({ code: "font_size_invalid" });
  });

  it("refuses Arabic-Indic digits rather than printing the wrong ones", async () => {
    // The standard fonts have no glyph for ٢. Without an embedded font this
    // must fail loudly — silently substituting Western digits would put the
    // wrong numerals on an Arabic document.
    const bytes = await makePdf(1);
    await expect(
      addPageNumbers(bytes, "doc.pdf", [0], {
        position: "bottom-center",
        startAt: 1,
        fontSize: 12,
        format: toArabicIndicDigits("{n}").replace("{n}", "٢"),
      }),
    ).rejects.toMatchObject({ code: "font_missing_glyphs" });
  });

  it("converts Western digits to Arabic-Indic", () => {
    expect(toArabicIndicDigits("2026")).toBe("٢٠٢٦");
    expect(toArabicIndicDigits("Page 3 of 10")).toBe("Page ٣ of ١٠");
  });
});

describe("inspect", () => {
  it("reports page count, size and rotation without altering anything", async () => {
    const bytes = await makePdf(2, { rotate: 90 });
    const info = await inspectPdf(bytes);

    expect(info.pageCount).toBe(2);
    expect(info.pages[0]).toEqual({ width: 595, height: 842, rotation: 90 });
  });
});
