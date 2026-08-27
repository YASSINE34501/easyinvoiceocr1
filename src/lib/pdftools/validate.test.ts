import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  assertPdfSignature,
  formatBytes,
  hasPdfSignature,
  validatePdfFile,
  validatePdfFiles,
} from "./validate";
import { PDF_TOOLS, isPdfToolSlug, pdfTool, pdfToolPath, pdfToolsInCategory } from "./registry";

describe("what counts as a file we will open", () => {
  const ok = { name: "invoice.pdf", size: 1024, type: "application/pdf" };

  it("accepts a plain PDF", () => {
    expect(() => validatePdfFile(ok)).not.toThrow();
  });

  it("accepts a dragged file whose type the browser did not report", () => {
    expect(() => validatePdfFile({ ...ok, type: "" })).not.toThrow();
  });

  it("refuses an empty file", () => {
    expect(() => validatePdfFile({ ...ok, size: 0 })).toThrow();
  });

  it("refuses a file past the size limit", () => {
    expect(() => validatePdfFile({ ...ok, size: MAX_FILE_BYTES + 1 })).toThrow();
  });

  it("refuses something that is not a PDF at all", () => {
    expect(() => validatePdfFile({ name: "photo.jpg", size: 100, type: "image/jpeg" })).toThrow();
  });

  it("refuses a renamed file whose declared type disagrees with its name", () => {
    // invoice.exe renamed to invoice.pdf, with the browser still reporting the
    // real type. The extension alone would have let this through.
    expect(() =>
      validatePdfFile({ name: "invoice.pdf", size: 100, type: "application/x-msdownload" }),
    ).toThrow();
  });

  it("refuses an empty batch and an oversized one", () => {
    expect(() => validatePdfFiles([])).toThrow();
    expect(() => validatePdfFiles(Array.from({ length: 25 }, () => ok))).toThrow();
  });
});

describe("the check an extension cannot fake", () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n");

  it("finds the header", () => {
    expect(hasPdfSignature(pdf)).toBe(true);
    expect(() => assertPdfSignature(pdf)).not.toThrow();
  });

  it("tolerates junk before the header, as readers do", () => {
    const withPreamble = new TextEncoder().encode("﻿   %PDF-1.4\n");
    expect(hasPdfSignature(withPreamble)).toBe(true);
  });

  it("rejects a file that only claims to be a PDF", () => {
    const text = new TextEncoder().encode("Dear Sir, please find attached...");
    expect(hasPdfSignature(text)).toBe(false);
    expect(() => assertPdfSignature(text)).toThrow();
  });

  it("rejects empty bytes", () => {
    expect(() => assertPdfSignature(new Uint8Array())).toThrow();
  });
});

describe("sizes a person can read", () => {
  it("scales the unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("the registry", () => {
  it("lists only tools that are implemented", () => {
    // Phase 1 is eight tools. A ninth entry here would be a tool a visitor can
    // click with nothing behind it.
    expect(PDF_TOOLS).toHaveLength(8);
  });

  it("gives every tool a unique slug", () => {
    const slugs = PDF_TOOLS.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every tool a unique display order", () => {
    const orders = PDF_TOOLS.map((tool) => tool.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("finds a tool by slug and rejects an unknown one", () => {
    expect(pdfTool("merge-pdf")?.slug).toBe("merge-pdf");
    expect(pdfTool("compress-pdf")).toBeUndefined();
    expect(isPdfToolSlug("rotate-pdf")).toBe(true);
    expect(isPdfToolSlug("protect-pdf")).toBe(false);
  });

  it("splits cleanly into categories with nothing left over", () => {
    const organise = pdfToolsInCategory("organise");
    const edit = pdfToolsInCategory("edit");
    expect(organise.length + edit.length).toBe(PDF_TOOLS.length);
  });

  it("builds locale-prefixed paths, like every other page on the site", () => {
    expect(pdfToolPath("merge-pdf", "ar")).toBe("/ar/pdf/merge-pdf");
    expect(pdfToolPath("split-pdf", "fr")).toBe("/fr/pdf/split-pdf");
  });

  it("marks only the tools that can produce several files", () => {
    expect(pdfTool("split-pdf")?.multiOutput).toBe(true);
    expect(pdfTool("merge-pdf")?.multiOutput).toBe(false);
  });
});
