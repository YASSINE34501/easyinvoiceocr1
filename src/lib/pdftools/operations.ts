/**
 * The eight page-level PDF operations, all of them real.
 *
 * Every one runs on pdf-lib in the visitor's browser. Nothing is uploaded, and
 * nothing here reaches the network. pdf-lib also runs under Node, which is why
 * these are plain functions over bytes rather than anything tied to the DOM:
 * the same code the browser runs is the code the tests run, so a passing test
 * says something about what a visitor gets.
 *
 * Each function loads, transforms, saves, and then checks its own output before
 * handing it back. A PDF that is structurally wrong must fail here, where the
 * visitor sees an error, rather than at the moment they open the download.
 */

import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import { PdfToolError, type OutputFile, type PagePosition, type RotationAngle } from "./types";
import { formatPageSelection, invertSelection } from "./pages";

const PDF_MIME = "application/pdf";

/** Beyond this a browser tab is likely to run out of memory mid-operation. */
export const MAX_PAGES = 2000;

/**
 * Opens a PDF, translating pdf-lib's failures into codes the interface can
 * translate. `ignoreEncryption` is deliberately absent: a document we cannot
 * legitimately read is refused, never worked around.
 */
async function load(bytes: Uint8Array): Promise<PDFDocument> {
  if (bytes.length === 0) throw new PdfToolError("file_empty");

  let document: PDFDocument;
  try {
    document = await PDFDocument.load(bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("encrypt")) throw new PdfToolError("pdf_encrypted");
    throw new PdfToolError("pdf_corrupt");
  }

  const pageCount = document.getPageCount();
  if (pageCount === 0) throw new PdfToolError("pdf_no_pages");
  if (pageCount > MAX_PAGES) throw new PdfToolError("pdf_too_many_pages");
  return document;
}

/**
 * Saves and verifies before the bytes are allowed out.
 *
 * Checks the header, a plausible size and the page count, then reopens the
 * result. Reopening is the check that matters: it is the only one that would
 * notice a document which serialised without error and is nonetheless not
 * readable.
 */
async function saveVerified(
  document: PDFDocument,
  name: string,
  expectedPages?: number,
): Promise<OutputFile> {
  const bytes = await document.save();

  if (bytes.length < 100) throw new PdfToolError("output_invalid");
  const header = String.fromCharCode(...bytes.subarray(0, 5));
  if (header !== "%PDF-") throw new PdfToolError("output_invalid");

  let reopened: PDFDocument;
  try {
    reopened = await PDFDocument.load(bytes);
  } catch {
    throw new PdfToolError("output_invalid");
  }
  if (reopened.getPageCount() === 0) throw new PdfToolError("output_invalid");
  if (expectedPages !== undefined && reopened.getPageCount() !== expectedPages) {
    throw new PdfToolError("output_invalid");
  }

  return { name, bytes, mime: PDF_MIME };
}

/** Strips a trailing .pdf so names do not end up as "report.pdf-pages.pdf". */
export function baseName(filename: string): string {
  return filename.replace(/\.pdf$/i, "") || "document";
}

/* ------------------------------------------------------------------ */
/* Merge                                                               */
/* ------------------------------------------------------------------ */

/**
 * Joins documents in the order given. The order is the caller's: the interface
 * lets a visitor drag files around, and merging in upload order instead would
 * quietly ignore that.
 */
export async function mergePdfs(
  inputs: { name: string; bytes: Uint8Array }[],
  outputName = "merged.pdf",
): Promise<{ file: OutputFile; pageCount: number; sources: number }> {
  if (inputs.length < 2) throw new PdfToolError("need_two_files");

  const merged = await PDFDocument.create();
  let total = 0;

  for (const input of inputs) {
    const source = await load(input.bytes);
    total += source.getPageCount();
    if (total > MAX_PAGES) throw new PdfToolError("pdf_too_many_pages");
    // copyPages carries the page's own size and rotation across, so a
    // landscape or rotated page keeps its geometry in the merged file.
    const copied = await merged.copyPages(source, source.getPageIndices());
    for (const page of copied) merged.addPage(page);
  }

  const file = await saveVerified(merged, outputName, total);
  return { file, pageCount: total, sources: inputs.length };
}

/* ------------------------------------------------------------------ */
/* Keeping or dropping pages                                           */
/* ------------------------------------------------------------------ */

/** Builds a new document from the given indices, in the order given. */
async function documentFromPages(source: PDFDocument, indices: number[]): Promise<PDFDocument> {
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, indices);
  for (const page of copied) output.addPage(page);
  return output;
}

/** Extract: keeps exactly the selected pages, in ascending order. */
export async function extractPages(
  bytes: Uint8Array,
  filename: string,
  indices: number[],
): Promise<{ file: OutputFile; pageCount: number; kept: string }> {
  const source = await load(bytes);
  if (indices.length === 0) throw new PdfToolError("selection_empty");

  const output = await documentFromPages(source, indices);
  const file = await saveVerified(output, `${baseName(filename)}-pages.pdf`, indices.length);
  return { file, pageCount: indices.length, kept: formatPageSelection(indices) };
}

/** Remove: keeps everything the selection does not name. */
export async function removePages(
  bytes: Uint8Array,
  filename: string,
  indices: number[],
): Promise<{ file: OutputFile; pageCount: number; removed: string }> {
  const source = await load(bytes);
  const kept = invertSelection(indices, source.getPageCount());

  const output = await documentFromPages(source, kept);
  const file = await saveVerified(output, `${baseName(filename)}-edited.pdf`, kept.length);
  return { file, pageCount: kept.length, removed: formatPageSelection(indices) };
}

/**
 * Organize: writes the pages in exactly the order given.
 *
 * The order may repeat an index — duplicating a page is a legitimate thing to
 * want — so this does not deduplicate the way a selection does.
 */
export async function organizePages(
  bytes: Uint8Array,
  filename: string,
  order: number[],
): Promise<{ file: OutputFile; pageCount: number }> {
  const source = await load(bytes);
  if (order.length === 0) throw new PdfToolError("would_remove_every_page");

  const pageCount = source.getPageCount();
  for (const index of order) {
    if (!Number.isInteger(index) || index < 0 || index >= pageCount) {
      throw new PdfToolError("selection_out_of_range");
    }
  }

  const output = await documentFromPages(source, order);
  const file = await saveVerified(output, `${baseName(filename)}-organised.pdf`, order.length);
  return { file, pageCount: order.length };
}

/* ------------------------------------------------------------------ */
/* Split                                                               */
/* ------------------------------------------------------------------ */

/**
 * Splits into one document per range.
 *
 * Returns the files rather than an archive: whether to zip is the caller's
 * decision, and a single-range split should not force the visitor through an
 * archive to reach one PDF.
 */
export async function splitPdf(
  bytes: Uint8Array,
  filename: string,
  ranges: number[][],
): Promise<{ files: OutputFile[]; pageCount: number }> {
  const source = await load(bytes);
  if (ranges.length === 0) throw new PdfToolError("selection_empty");

  const stem = baseName(filename);
  const files: OutputFile[] = [];
  let total = 0;

  for (const [position, indices] of ranges.entries()) {
    if (indices.length === 0) throw new PdfToolError("selection_empty");
    const output = await documentFromPages(source, indices);
    // Padded so a ten-part split sorts correctly in a file manager.
    const part = String(position + 1).padStart(2, "0");
    files.push(await saveVerified(output, `${stem}-${part}.pdf`, indices.length));
    total += indices.length;
  }

  return { files, pageCount: total };
}

/** Every page as its own document. */
export function eachPageRange(pageCount: number): number[][] {
  return Array.from({ length: pageCount }, (_, index) => [index]);
}

/** Fixed-size groups: 10 pages by 4 gives 4+4+2. */
export function fixedSizeRanges(pageCount: number, size: number): number[][] {
  if (!Number.isInteger(size) || size < 1) throw new PdfToolError("selection_invalid");
  const ranges: number[][] = [];
  for (let start = 0; start < pageCount; start += size) {
    ranges.push(
      Array.from({ length: Math.min(size, pageCount - start) }, (_, offset) => start + offset),
    );
  }
  return ranges;
}

/* ------------------------------------------------------------------ */
/* Rotate                                                              */
/* ------------------------------------------------------------------ */

/**
 * Turns pages by a quarter, a half or three quarters.
 *
 * Added to whatever rotation the page already carries rather than replacing it,
 * so rotating a page that a scanner already turned lands where the visitor
 * expects instead of snapping to an absolute angle.
 */
export async function rotatePages(
  bytes: Uint8Array,
  filename: string,
  indices: number[],
  angle: RotationAngle,
): Promise<{ file: OutputFile; pageCount: number; rotated: string }> {
  const source = await load(bytes);
  if (indices.length === 0) throw new PdfToolError("selection_empty");

  const pages = source.getPages();
  for (const index of indices) {
    const page = pages[index];
    if (!page) throw new PdfToolError("selection_out_of_range");
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }

  const file = await saveVerified(source, `${baseName(filename)}-rotated.pdf`, pages.length);
  return { file, pageCount: pages.length, rotated: formatPageSelection(indices) };
}

/* ------------------------------------------------------------------ */
/* Crop                                                                */
/* ------------------------------------------------------------------ */

export type CropMargins = { top: number; right: number; bottom: number; left: number };

/**
 * Trims the visible area by a margin on each edge, in points.
 *
 * Sets the crop box and leaves the media box alone, which is what makes this
 * reversible: the content is still there, the reader is simply told to show
 * less of it. Refuses a crop that would leave nothing, because a zero-area page
 * renders blank in some readers and errors in others.
 */
export async function cropPages(
  bytes: Uint8Array,
  filename: string,
  indices: number[],
  margins: CropMargins,
): Promise<{ file: OutputFile; pageCount: number; cropped: string }> {
  const source = await load(bytes);
  if (indices.length === 0) throw new PdfToolError("selection_empty");

  for (const value of Object.values(margins)) {
    if (!Number.isFinite(value) || value < 0) throw new PdfToolError("crop_invalid");
  }

  const pages = source.getPages();
  for (const index of indices) {
    const page = pages[index];
    if (!page) throw new PdfToolError("selection_out_of_range");

    const box = page.getMediaBox();
    const width = box.width - margins.left - margins.right;
    const height = box.height - margins.top - margins.bottom;
    if (width <= 1 || height <= 1) throw new PdfToolError("crop_too_large");

    page.setCropBox(box.x + margins.left, box.y + margins.bottom, width, height);
  }

  const file = await saveVerified(source, `${baseName(filename)}-cropped.pdf`, pages.length);
  return { file, pageCount: pages.length, cropped: formatPageSelection(indices) };
}

/* ------------------------------------------------------------------ */
/* Page numbers                                                        */
/* ------------------------------------------------------------------ */

export type PageNumberOptions = {
  position: PagePosition;
  /** The number printed on the first selected page. */
  startAt: number;
  fontSize: number;
  /** "{n}" becomes the number, "{total}" the count. */
  format: string;
  /** Bytes of a font that covers the digits being drawn. */
  fontBytes?: Uint8Array | undefined;
};

/** Arabic-Indic digits, for documents numbered in Arabic. */
export function toArabicIndicDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/**
 * Stamps a number onto each selected page.
 *
 * The standard PDF fonts cover Latin only. Drawing a character they do not have
 * makes pdf-lib throw, so an Arabic-Indic numeral needs a font embedded through
 * fontkit — the caller passes the bytes and this refuses rather than silently
 * printing Western digits on an Arabic document.
 */
export async function addPageNumbers(
  bytes: Uint8Array,
  filename: string,
  indices: number[],
  options: PageNumberOptions,
): Promise<{ file: OutputFile; pageCount: number; numbered: number }> {
  const source = await load(bytes);
  if (indices.length === 0) throw new PdfToolError("selection_empty");
  if (!Number.isInteger(options.startAt)) throw new PdfToolError("selection_invalid");
  if (!Number.isFinite(options.fontSize) || options.fontSize < 4 || options.fontSize > 96) {
    throw new PdfToolError("font_size_invalid");
  }

  let font;
  if (options.fontBytes && options.fontBytes.length > 0) {
    const fontkit = (await import("@pdf-lib/fontkit")).default;
    source.registerFontkit(fontkit);
    try {
      font = await source.embedFont(options.fontBytes, { subset: true });
    } catch {
      throw new PdfToolError("font_invalid");
    }
  } else {
    font = await source.embedFont(StandardFonts.Helvetica);
  }

  const pages = source.getPages();
  const total = pages.length;

  for (const [offset, index] of indices.entries()) {
    const page = pages[index];
    if (!page) throw new PdfToolError("selection_out_of_range");

    const label = options.format
      .replace(/\{n\}/g, String(options.startAt + offset))
      .replace(/\{total\}/g, String(total));

    let width: number;
    try {
      width = font.widthOfTextAtSize(label, options.fontSize);
    } catch {
      // The font has no glyph for something in the label.
      throw new PdfToolError("font_missing_glyphs");
    }

    const { width: pageWidth, height: pageHeight } = page.getSize();
    const margin = 24;
    const x = options.position.endsWith("left")
      ? margin
      : options.position.endsWith("right")
        ? pageWidth - margin - width
        : (pageWidth - width) / 2;
    const y = options.position.startsWith("top") ? pageHeight - margin - options.fontSize : margin;

    try {
      page.drawText(label, { x, y, size: options.fontSize, font, color: rgb(0.2, 0.2, 0.2) });
    } catch {
      throw new PdfToolError("font_missing_glyphs");
    }
  }

  const file = await saveVerified(source, `${baseName(filename)}-numbered.pdf`, total);
  return { file, pageCount: total, numbered: indices.length };
}

/* ------------------------------------------------------------------ */
/* Reading a document without changing it                              */
/* ------------------------------------------------------------------ */

/** Page count and sizes, for the interface to show before anything is done. */
export async function inspectPdf(bytes: Uint8Array): Promise<{
  pageCount: number;
  pages: { width: number; height: number; rotation: number }[];
}> {
  const document = await load(bytes);
  return {
    pageCount: document.getPageCount(),
    pages: document.getPages().map((page) => ({
      width: Math.round(page.getWidth()),
      height: Math.round(page.getHeight()),
      rotation: page.getRotation().angle,
    })),
  };
}
