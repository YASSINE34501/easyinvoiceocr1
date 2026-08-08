import { describe, expect, it } from "vitest";
import { assertValidPdf, DEFAULT_IMAGE_PDF_OPTIONS, pageGeometry, PAGE_SIZES } from "./imagePdf";
import { ConversionError } from "./types";

const options = (overrides: Partial<typeof DEFAULT_IMAGE_PDF_OPTIONS> = {}) => ({
  ...DEFAULT_IMAGE_PDF_OPTIONS,
  ...overrides,
});

describe("pageGeometry", () => {
  it("uses A4 portrait dimensions by default", () => {
    const geometry = pageGeometry(1000, 1400, options());
    expect(geometry.pageWidth).toBeCloseTo(PAGE_SIZES.a4.width, 1);
    expect(geometry.pageHeight).toBeCloseTo(PAGE_SIZES.a4.height, 1);
  });

  it("swaps the page dimensions in landscape", () => {
    const geometry = pageGeometry(1400, 1000, options({ orientation: "landscape" }));
    expect(geometry.pageWidth).toBeCloseTo(PAGE_SIZES.a4.height, 1);
    expect(geometry.pageHeight).toBeCloseTo(PAGE_SIZES.a4.width, 1);
  });

  it("fits the whole image inside the margins without distorting it", () => {
    const geometry = pageGeometry(2000, 1000, options({ fit: "fit" }));
    expect(geometry.drawWidth / geometry.drawHeight).toBeCloseTo(2, 2);
    expect(geometry.drawWidth).toBeLessThanOrEqual(geometry.pageWidth);
    expect(geometry.drawHeight).toBeLessThanOrEqual(geometry.pageHeight);
  });

  it("centres the image on the page", () => {
    const geometry = pageGeometry(1000, 1000, options());
    expect(geometry.x).toBeCloseTo((geometry.pageWidth - geometry.drawWidth) / 2, 5);
    expect(geometry.y).toBeCloseTo((geometry.pageHeight - geometry.drawHeight) / 2, 5);
  });

  it("gives an automatic page the shape of its image", () => {
    const geometry = pageGeometry(1200, 600, options({ pageSize: "auto", margin: "none" }));
    expect(geometry.pageWidth / geometry.pageHeight).toBeCloseTo(2, 2);
  });

  it("leaves no margin when margins are off", () => {
    const geometry = pageGeometry(
      1000,
      1000,
      options({ pageSize: "auto", margin: "none", fit: "fit" }),
    );
    expect(geometry.x).toBeCloseTo(0, 5);
    expect(geometry.y).toBeCloseTo(0, 5);
  });

  it("keeps a small image at its own size in original mode", () => {
    const geometry = pageGeometry(200, 100, options({ fit: "original" }));
    expect(geometry.drawWidth).toBeCloseTo(150, 1); // 200px at 96dpi = 150pt
    expect(geometry.drawHeight).toBeCloseTo(75, 1);
  });

  it("still fits an oversized image in original mode", () => {
    const geometry = pageGeometry(6000, 8000, options({ fit: "original" }));
    expect(geometry.drawWidth).toBeLessThanOrEqual(geometry.pageWidth);
    expect(geometry.drawHeight).toBeLessThanOrEqual(geometry.pageHeight);
  });

  it("never draws beyond the page in fill mode", () => {
    const geometry = pageGeometry(500, 4000, options({ fit: "fill" }));
    expect(geometry.drawWidth).toBeLessThanOrEqual(geometry.pageWidth);
    expect(geometry.drawHeight).toBeLessThanOrEqual(geometry.pageHeight);
  });
});

describe("assertValidPdf", () => {
  it("accepts bytes that start with the PDF header", async () => {
    const blob = new Blob(["%PDF-1.7" + "x".repeat(2000)]);
    await expect(assertValidPdf(blob, 1)).resolves.toBeUndefined();
  });

  it("rejects a blob that is not a PDF", async () => {
    await expect(assertValidPdf(new Blob(["x".repeat(2000)]), 1)).rejects.toThrow(ConversionError);
  });

  it("rejects a file too small for the number of pages claimed", async () => {
    await expect(assertValidPdf(new Blob(["%PDF-1.7"]), 20)).rejects.toThrow(ConversionError);
  });
});
