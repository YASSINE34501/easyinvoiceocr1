/**
 * The conversion pipelines themselves.
 *
 * Each one walks the same path — read, recognise when needed, analyse layout,
 * build the document model — and reports the stage it is in so the interface
 * can say "Reading PDF" or "Running OCR" instead of showing an opaque bar.
 *
 * Everything runs in the visitor's browser. A conversion job row is still
 * written server-side (see conversions.functions.ts) because quota and
 * entitlement decisions are never made here.
 */

import { openPdf, pageNeedsOcr } from "./pdf";
import { blocksFromLines, blocksFromPdfPage, detectDirection, dominantDirection } from "./layout";
import { createOcrEngine, type OcrEngine, type OcrLanguage } from "./ocr";
import { decodeImage, drawToCanvas, encodeCanvas, type Rotation } from "./images";
import { safeBaseName } from "./validation";
import {
  ConversionError,
  countTextBlocks,
  type DocBlock,
  type DocumentModel,
  type ProgressReporter,
} from "./types";

/** A single page of recognised text, reviewable and correctable before export. */
export type RecognisedPage = {
  /** 1-based position in the final document. */
  index: number;
  blocks: DocBlock[];
  /** Plain text shown in the review panel. */
  text: string;
  /** 0–100 as reported by the OCR engine, or null when no OCR ran. */
  confidence: number | null;
  usedOcr: boolean;
};

export type PipelineOptions = {
  ocrLanguage: OcrLanguage;
  onProgress?: ProgressReporter;
  signal?: AbortSignal;
  /** Per-page ceiling; a stuck page fails the job instead of hanging forever. */
  pageTimeoutMs?: number;
};

const DEFAULT_PAGE_TIMEOUT_MS = 120_000;

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

/* ------------------------------------------------------------------ */
/* PDF to Word                                                         */
/* ------------------------------------------------------------------ */

export async function pdfToRecognisedPages(
  file: File,
  options: PipelineOptions,
): Promise<{ pages: RecognisedPage[]; pageCount: number; usedOcr: boolean }> {
  const { onProgress, signal } = options;
  const timeout = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;

  onProgress?.({ stage: "reading", percent: 5 });
  const buffer = await file.arrayBuffer();
  throwIfAborted(signal);

  const pdf = await openPdf(buffer);
  let engine: OcrEngine | null = null;
  const pages: RecognisedPage[] = [];
  let usedOcr = false;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.pageCount; pageNumber += 1) {
      throwIfAborted(signal);

      const pageText = await withTimeout(pdf.getPageText(pageNumber), timeout);
      const needsOcr = pageNeedsOcr(pageText);

      if (!needsOcr) {
        onProgress?.({
          stage: "reading",
          percent: 5 + Math.round((pageNumber / pdf.pageCount) * 85),
          page: pageNumber,
          pageCount: pdf.pageCount,
        });
        const blocks = blocksFromPdfPage(pageText);
        pages.push({
          index: pageNumber,
          blocks,
          text: blocksToText(blocks),
          confidence: null,
          usedOcr: false,
        });
        continue;
      }

      usedOcr = true;
      onProgress?.({
        stage: "ocr",
        percent: 5 + Math.round((pageNumber / pdf.pageCount) * 85),
        page: pageNumber,
        pageCount: pdf.pageCount,
      });

      if (!engine) engine = await createOcrEngine(options.ocrLanguage);
      // 1700 px wide is around 200 dpi for A4 — enough for reliable recognition
      // without spending memory on a 4000 px canvas per page.
      const canvas = await withTimeout(pdf.renderPage(pageNumber, 1700), timeout);
      const result = await withTimeout(engine.recognize(canvas), timeout);
      canvas.width = 0;
      canvas.height = 0;

      const blocks = blocksFromLines(result.lines);
      pages.push({
        index: pageNumber,
        blocks,
        text: result.text.trim() || blocksToText(blocks),
        confidence: result.confidence,
        usedOcr: true,
      });
    }
  } finally {
    await engine?.terminate();
    await pdf.destroy();
  }

  return { pages, pageCount: pdf.pageCount, usedOcr };
}

/* ------------------------------------------------------------------ */
/* Image to Word                                                       */
/* ------------------------------------------------------------------ */

export type SourceImage = { id: string; file: File; rotation: Rotation };

export async function imagesToRecognisedPages(
  images: SourceImage[],
  options: PipelineOptions,
): Promise<{ pages: RecognisedPage[]; pageCount: number; usedOcr: boolean }> {
  const { onProgress, signal } = options;
  const timeout = options.pageTimeoutMs ?? DEFAULT_PAGE_TIMEOUT_MS;

  if (images.length === 0) throw new ConversionError("empty_result", "empty_result");

  onProgress?.({ stage: "ocr", percent: 5, pageCount: images.length });
  const engine = await createOcrEngine(options.ocrLanguage, (fraction) =>
    onProgress?.({ stage: "ocr", percent: 5 + Math.round(fraction * 10) }),
  );

  const pages: RecognisedPage[] = [];
  try {
    for (const [position, image] of images.entries()) {
      throwIfAborted(signal);
      onProgress?.({
        stage: "ocr",
        percent: 15 + Math.round((position / images.length) * 70),
        page: position + 1,
        pageCount: images.length,
      });

      const decoded = await decodeImage(image.file);
      let canvas: HTMLCanvasElement;
      try {
        canvas = drawToCanvas(decoded, image.rotation, 2200);
      } finally {
        decoded.close();
      }

      const result = await withTimeout(engine.recognize(canvas), timeout);
      canvas.width = 0;
      canvas.height = 0;

      const blocks = blocksFromLines(result.lines);
      pages.push({
        index: position + 1,
        blocks,
        text: result.text.trim() || blocksToText(blocks),
        confidence: result.confidence,
        usedOcr: true,
      });
    }
  } finally {
    await engine.terminate();
  }

  return { pages, pageCount: images.length, usedOcr: true };
}

/** Places the original images into a Word document, in the chosen order. */
export async function imagesToPictureModel(
  images: SourceImage[],
  baseName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<DocumentModel> {
  const blocks: DocBlock[] = [];

  for (const [position, image] of images.entries()) {
    const decoded = await decodeImage(image.file);
    try {
      const canvas = drawToCanvas(decoded, image.rotation, 2000);
      const encoded = await encodeCanvas(canvas, 0.9);
      if (position > 0) blocks.push({ kind: "pageBreak" });
      blocks.push({
        kind: "image",
        data: encoded.data,
        type: encoded.type,
        widthPx: encoded.width,
        heightPx: encoded.height,
      });
      canvas.width = 0;
      canvas.height = 0;
    } finally {
      decoded.close();
    }
    onProgress?.(position + 1, images.length);
  }

  return {
    baseName: safeBaseName(baseName),
    blocks,
    pageCount: images.length,
    usedOcr: false,
    dir: "ltr",
  };
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

/**
 * Assembles reviewed pages into the final model. Pages the user edited are
 * rebuilt from their corrected text so what they saw is what gets written.
 */
export function pagesToModel(
  pages: RecognisedPage[],
  baseName: string,
  edits: Record<number, string> = {},
): DocumentModel {
  const blocks: DocBlock[] = [];
  let usedOcr = false;

  for (const [position, page] of pages.entries()) {
    if (position > 0) blocks.push({ kind: "pageBreak" });
    if (page.usedOcr) usedOcr = true;

    const edited = edits[page.index];
    if (edited !== undefined && edited !== page.text) {
      blocks.push(...textToBlocks(edited));
    } else {
      blocks.push(...page.blocks);
    }
  }

  const model: DocumentModel = {
    baseName: safeBaseName(baseName),
    blocks,
    pageCount: pages.length,
    usedOcr,
    dir: dominantDirection(blocks),
  };

  if (countTextBlocks(model.blocks) === 0) {
    throw new ConversionError("empty_result", "empty_result");
  }
  return model;
}

/** Turns corrected plain text back into paragraphs, one per non-empty line run. */
export function textToBlocks(text: string): DocBlock[] {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\s*\n\s*/g, " ").trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({ kind: "paragraph", text: chunk, dir: detectDirection(chunk) }) as DocBlock);
}

export function blocksToText(blocks: DocBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "heading":
      case "paragraph":
        parts.push(block.text);
        break;
      case "list":
        parts.push(block.items.map((item) => `• ${item}`).join("\n"));
        break;
      case "table":
        parts.push(block.rows.map((row) => row.join(" | ")).join("\n"));
        break;
      default:
        break;
    }
  }
  return parts.join("\n\n").trim();
}

/** Counts what was detected, for the honest "what we found" summary. */
export function summarise(model: DocumentModel) {
  const counts = { headings: 0, paragraphs: 0, lists: 0, tables: 0, images: 0, characters: 0 };
  for (const block of model.blocks) {
    switch (block.kind) {
      case "heading":
        counts.headings += 1;
        counts.characters += block.text.length;
        break;
      case "paragraph":
        counts.paragraphs += 1;
        counts.characters += block.text.length;
        break;
      case "list":
        counts.lists += 1;
        counts.characters += block.items.join("").length;
        break;
      case "table":
        counts.tables += 1;
        counts.characters += block.rows.flat().join("").length;
        break;
      case "image":
        counts.images += 1;
        break;
      default:
        break;
    }
  }
  return counts;
}
