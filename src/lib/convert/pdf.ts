/**
 * PDF reading for the converters, on top of pdf.js.
 *
 * Browser-only: pdf.js needs a Worker and a canvas, so every entry point here
 * is reached through a dynamic import from a client component. Failures are
 * translated into ConversionError codes so the UI can say what actually went
 * wrong (encrypted, corrupt, no pages) instead of "something failed".
 */

import { ConversionError } from "./types";

export type PdfTextItem = {
  str: string;
  /** Left edge in PDF user space (origin bottom-left). */
  x: number;
  /** Baseline y in PDF user space. */
  y: number;
  width: number;
  height: number;
  /** Approximate glyph height, used to detect headings. */
  fontSize: number;
  fontName: string;
  dir: string;
  hasEOL: boolean;
};

export type PdfPageText = {
  pageNumber: number;
  items: PdfTextItem[];
  width: number;
  height: number;
};

export type PdfHandle = {
  pageCount: number;
  getPageText(pageNumber: number): Promise<PdfPageText>;
  renderPage(pageNumber: number, targetWidthPx: number): Promise<HTMLCanvasElement>;
  destroy(): Promise<void>;
};

type PdfjsModule = typeof import("pdfjs-dist");

let modulePromise: Promise<PdfjsModule> | null = null;

async function loadPdfjs(): Promise<PdfjsModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // Bundled worker URL — no CDN, so the converter keeps working offline and
      // no third party sees that a document is being opened.
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return modulePromise;
}

function translate(error: unknown): ConversionError {
  const name = (error as { name?: string } | null)?.name ?? "";
  const message = (error as { message?: string } | null)?.message ?? "";
  if (name === "PasswordException") {
    return new ConversionError("pdf_encrypted", "pdf_encrypted");
  }
  if (name === "InvalidPDFException" || /invalid pdf|corrupt/i.test(message)) {
    return new ConversionError("pdf_corrupt", "pdf_corrupt");
  }
  return new ConversionError("pdf_corrupt", "pdf_corrupt");
}

export async function openPdf(data: ArrayBuffer): Promise<PdfHandle> {
  const pdfjs = await loadPdfjs();

  let document: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    // A copy is passed because pdf.js transfers (and therefore detaches) the
    // buffer, and the caller may still need the original bytes for a preview.
    document = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  } catch (error) {
    throw translate(error);
  }

  if (document.numPages === 0) {
    await document.loadingTask.destroy();
    throw new ConversionError("pdf_no_pages", "pdf_no_pages");
  }

  return {
    pageCount: document.numPages,

    async getPageText(pageNumber) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const items: PdfTextItem[] = [];
      for (const raw of content.items) {
        if (!("str" in raw)) continue; // marked-content markers carry no text
        const transform = raw.transform as number[];
        const scaleX = Math.hypot(transform[0] ?? 1, transform[1] ?? 0);
        const scaleY = Math.hypot(transform[2] ?? 0, transform[3] ?? 1);
        items.push({
          str: raw.str,
          x: transform[4] ?? 0,
          y: transform[5] ?? 0,
          width: raw.width,
          height: raw.height || scaleY,
          fontSize: Math.max(scaleY, scaleX) || raw.height,
          fontName: raw.fontName,
          dir: raw.dir,
          hasEOL: Boolean(raw.hasEOL),
        });
      }

      page.cleanup();
      return { pageNumber, items, width: viewport.width, height: viewport.height };
    },

    async renderPage(pageNumber, targetWidthPx) {
      const page = await document.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(4, Math.max(1, targetWidthPx / base.width));
      const viewport = page.getViewport({ scale });

      const canvas = window.document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new ConversionError("internal_error", "internal_error");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      page.cleanup();
      return canvas;
    },

    async destroy() {
      await document.loadingTask.destroy();
    },
  };
}

/**
 * A page is treated as scanned when its text layer is essentially empty.
 * Some scanners embed a handful of stray glyphs, so a small non-zero amount of
 * text still counts as "no usable text layer".
 */
export function pageNeedsOcr(page: PdfPageText): boolean {
  const characters = page.items.reduce((total, item) => total + item.str.trim().length, 0);
  return characters < 20;
}
