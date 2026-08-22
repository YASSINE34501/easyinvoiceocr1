/**
 * File in, structured invoice or receipt out.
 *
 * Reuses the readers the converters already use: a PDF's own text layer when it
 * has one, Tesseract OCR when it does not, and Tesseract for every image. Both
 * paths end at the same positioned-line shape, so the parser does not care
 * which reader produced the page.
 *
 * Nothing is uploaded. Recognition happens in the visitor's browser, exactly as
 * it does for the file converters.
 */

import { openPdf, pageNeedsOcr } from "@/lib/convert/pdf";
import { DEFAULT_MAX_FILE_BYTES, formatBytes } from "@/lib/convert/validation";
import { linesFromPdfPage, type Line } from "@/lib/convert/layout";
import { createOcrEngine, type OcrEngine, type OcrLanguage } from "@/lib/convert/ocr";
import { decodeImage, drawToCanvas, type Rotation } from "@/lib/convert/images";
import { ConversionError, type ProgressReporter } from "@/lib/convert/types";
import { isEmptyExtraction, parseDocument, type ExtractedDocument } from "./parser";

export type ExtractOptions = {
  kind: "invoice" | "receipt";
  ocrLanguage: OcrLanguage;
  /** Locale convention for all-numeric dates. */
  dayFirst?: boolean | undefined;
  onProgress?: ProgressReporter | undefined;
  signal?: AbortSignal | undefined;
  pageTimeoutMs?: number | undefined;
  /** Overrides the shared upload ceiling; defaults to DEFAULT_MAX_FILE_BYTES. */
  maxBytes?: number | undefined;
  rotation?: Rotation | undefined;
};

const DEFAULT_PAGE_TIMEOUT_MS = 120_000;
/** A document longer than this is refused rather than left to grind. */
const MAX_PAGES = 30;

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new ConversionError("timeout", "cancelled");
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ConversionError("timeout", "timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Offsets each page's coordinates so a multi-page document parses as one
 * continuous document. Without this, page two's header sits at the same y as
 * page one's and the line ordering interleaves.
 */
function appendPage(all: Line[], pageLines: Line[], offset: number): number {
  let maxBottom = 0;
  for (const line of pageLines) {
    all.push({ ...line, top: line.top + offset });
    maxBottom = Math.max(maxBottom, line.top + line.height);
  }
  return offset + maxBottom + 100;
}

/** Reads a PDF, using its text layer where present and OCR only where needed. */
async function linesFromPdf(
  file: File,
  options: ExtractOptions,
): Promise<{ lines: Line[]; confidence: number | null; usedOcr: boolean; pageCount: number }> {
  const timeout = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;
  const buffer = await file.arrayBuffer();
  throwIfAborted(options.signal);

  const pdf = await openPdf(buffer);
  if (pdf.pageCount > MAX_PAGES) {
    await pdf.destroy();
    throw new ConversionError("file_too_large", "too_many_pages", { pages: pdf.pageCount });
  }

  const lines: Line[] = [];
  const confidences: number[] = [];
  let engine: OcrEngine | null = null;
  let usedOcr = false;
  let offset = 0;

  try {
    for (let page = 1; page <= pdf.pageCount; page += 1) {
      throwIfAborted(options.signal);
      const percent = 5 + Math.round((page / pdf.pageCount) * 80);

      const pageText = await withTimeout(pdf.getPageText(page), timeout);

      if (!pageNeedsOcr(pageText)) {
        options.onProgress?.({ stage: "reading", percent, page, pageCount: pdf.pageCount });
        offset = appendPage(lines, linesFromPdfPage(pageText), offset);
        continue;
      }

      usedOcr = true;
      options.onProgress?.({ stage: "ocr", percent, page, pageCount: pdf.pageCount });
      if (!engine) engine = await createOcrEngine(options.ocrLanguage);

      const canvas = await withTimeout(pdf.renderPage(page, 1700), timeout);
      try {
        const result = await withTimeout(engine.recognize(canvas), timeout);
        confidences.push(result.confidence);
        offset = appendPage(lines, result.lines, offset);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  } finally {
    await engine?.terminate();
    await pdf.destroy();
  }

  const confidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;

  return { lines, confidence, usedOcr, pageCount: pdf.pageCount };
}

/** Reads one image through OCR. */
async function linesFromImage(
  file: File,
  options: ExtractOptions,
): Promise<{ lines: Line[]; confidence: number | null }> {
  const timeout = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;

  options.onProgress?.({ stage: "ocr", percent: 5 });
  const engine = await createOcrEngine(options.ocrLanguage, (fraction) =>
    options.onProgress?.({ stage: "ocr", percent: 5 + Math.round(fraction * 15) }),
  );

  try {
    throwIfAborted(options.signal);
    const decoded = await decodeImage(file);
    let canvas: HTMLCanvasElement;
    try {
      canvas = drawToCanvas(decoded, options.rotation ?? 0, 2200);
    } finally {
      decoded.close();
    }

    options.onProgress?.({ stage: "ocr", percent: 30 });
    try {
      const result = await withTimeout(engine.recognize(canvas), timeout);
      return { lines: result.lines, confidence: result.confidence };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await engine.terminate();
  }
}

/**
 * Extracts a structured document from a real file.
 *
 * Throws `empty_result` when nothing usable was found, so a blank page can
 * never be presented as a successful extraction.
 */
export async function extractFromFile(
  file: File,
  options: ExtractOptions,
): Promise<ExtractedDocument> {
  if (file.size === 0) throw new ConversionError("file_empty", "file_empty");

  // The converters enforce this through validateFile, but the extraction
  // products never called it, so the "20 MB" the upload card advertises was not
  // actually a limit here — an arbitrarily large file went straight into the
  // reader. Nothing reaches a server either way, so this bounds the visitor's
  // own tab rather than ours.
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FILE_BYTES;
  if (file.size > maxBytes) {
    throw new ConversionError("file_too_large", "file_too_large", {
      limit: formatBytes(maxBytes),
      actual: formatBytes(file.size),
    });
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  const read = isPdf
    ? await linesFromPdf(file, options)
    : { ...(await linesFromImage(file, options)), usedOcr: true, pageCount: 1 };

  throwIfAborted(options.signal);
  options.onProgress?.({ stage: "building", percent: 90 });

  const document = parseDocument(read.lines, {
    kind: options.kind,
    dayFirst: options.dayFirst,
    ocrConfidence: read.confidence,
  });

  if (isEmptyExtraction(document)) {
    throw new ConversionError("empty_result", "empty_result");
  }

  options.onProgress?.({ stage: "completed", percent: 100 });
  return document;
}
