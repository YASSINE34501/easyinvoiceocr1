import { describe, expect, it } from "vitest";
import { assertUsableModel, assertValidDocx, buildDocx, fitWithin } from "./docx";
import { ConversionError, type DocumentModel } from "./types";

function model(blocks: DocumentModel["blocks"], dir: "ltr" | "rtl" = "ltr"): DocumentModel {
  return { baseName: "test", blocks, pageCount: 1, usedOcr: false, dir };
}

/** A .docx is a ZIP; "PK" is its magic number. */
async function isZip(blob: Blob): Promise<boolean> {
  const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  return header[0] === 0x50 && header[1] === 0x4b;
}

describe("assertUsableModel", () => {
  it("refuses a model with no content at all", () => {
    expect(() => assertUsableModel(model([]))).toThrow(ConversionError);
    try {
      assertUsableModel(model([{ kind: "pageBreak" }]));
    } catch (error) {
      expect((error as ConversionError).code).toBe("empty_result");
    }
  });

  it("accepts a model that only contains an image", () => {
    expect(() =>
      assertUsableModel(
        model([
          {
            kind: "image",
            data: new Uint8Array([1, 2, 3]),
            type: "png",
            widthPx: 10,
            heightPx: 10,
          },
        ]),
      ),
    ).not.toThrow();
  });
});

describe("buildDocx", () => {
  it("produces a real ZIP container", async () => {
    const blob = await buildDocx(
      model([
        { kind: "heading", level: 1, text: "Quarterly Report", dir: "ltr" },
        { kind: "paragraph", text: "The quarter closed ahead of plan.", dir: "ltr" },
      ]),
    );

    expect(blob.size).toBeGreaterThan(1000);
    await expect(isZip(blob)).resolves.toBe(true);
  });

  it("writes headings, lists, tables and page breaks without failing", async () => {
    const blob = await buildDocx(
      model([
        { kind: "heading", level: 2, text: "Line items", dir: "ltr" },
        { kind: "list", ordered: true, items: ["First", "Second"], dir: "ltr" },
        { kind: "list", ordered: false, items: ["Bullet"], dir: "ltr" },
        {
          kind: "table",
          rows: [
            ["Description", "Total"],
            ["Hosting", "1200.00"],
          ],
          dir: "ltr",
        },
        { kind: "pageBreak" },
        { kind: "paragraph", text: "Second page.", dir: "ltr" },
      ]),
    );

    await expect(assertValidDocx(blob)).resolves.toBeUndefined();
  });

  it("writes an Arabic document", async () => {
    const blob = await buildDocx(
      model(
        [
          { kind: "heading", level: 1, text: "تقرير ربع سنوي", dir: "rtl" },
          { kind: "paragraph", text: "أغلق الربع متقدمًا على الخطة.", dir: "rtl" },
          {
            kind: "table",
            rows: [
              ["الوصف", "الإجمالي"],
              ["الاستضافة", "1200.00"],
            ],
            dir: "rtl",
          },
        ],
        "rtl",
      ),
    );

    await expect(isZip(blob)).resolves.toBe(true);
  });

  it("refuses to build anything from an empty extraction", async () => {
    await expect(buildDocx(model([]))).rejects.toThrow(ConversionError);
  });
});

describe("assertValidDocx", () => {
  it("rejects a tiny blob", async () => {
    await expect(assertValidDocx(new Blob(["nope"]))).rejects.toThrow(ConversionError);
  });

  it("rejects a large blob that is not a ZIP", async () => {
    await expect(assertValidDocx(new Blob(["x".repeat(5000)]))).rejects.toThrow(ConversionError);
  });
});

describe("fitWithin", () => {
  it("scales a large image down to the box", () => {
    expect(fitWithin(2000, 1000, 600, 780)).toEqual({ width: 600, height: 300 });
  });

  it("never scales a small image up", () => {
    expect(fitWithin(100, 50, 600, 780)).toEqual({ width: 100, height: 50 });
  });

  it("survives a zero-sized image", () => {
    expect(fitWithin(0, 0, 600, 780)).toEqual({ width: 600, height: 780 });
  });
});
