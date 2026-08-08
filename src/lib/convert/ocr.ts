/**
 * Optical character recognition for the converters.
 *
 * Recognition runs inside the visitor's browser through a WebAssembly build of
 * Tesseract: the page image itself is never uploaded anywhere. The engine
 * binary and the language models are static files; by default they come from a
 * public CDN, and every path is overridable so a deployment can self-host them.
 * That download is disclosed in the privacy note on each converter page.
 */

import { ConversionError } from "./types";
import type { Line, Fragment } from "./layout";

/** Tesseract language codes offered in the interface. */
export const OCR_LANGUAGES = ["eng", "fra", "ara", "eng+ara", "eng+fra", "deu", "spa"] as const;
export type OcrLanguage = (typeof OCR_LANGUAGES)[number];

/** Default recognition language for a given interface locale. */
export function defaultOcrLanguage(locale: string): OcrLanguage {
  if (locale === "ar") return "eng+ara";
  if (locale === "fr") return "eng+fra";
  return "eng";
}

const env = import.meta.env as Record<string, string | undefined>;

/**
 * Self-hosted asset locations, served from our own origin.
 *
 * These are the defaults rather than a fallback: recognition must never depend
 * on a third-party CDN being reachable. A CDN failure used to surface as
 * `TypeError: Failed to fetch` deep inside the worker, wedging a conversion
 * that had already reserved quota.
 *
 * `scripts/vendor-tesseract.mjs` populates public/tesseract/. The env vars stay
 * supported so a deployment can move the assets to its own CDN if it wants to,
 * but leaving them unset is the safe, offline-capable path.
 */
const LOCAL_WORKER_PATH = "/tesseract/worker.min.js";
/** Directory: tesseract.js appends the core variant its browser supports. */
const LOCAL_CORE_PATH = "/tesseract";
const LOCAL_LANG_PATH = "/tesseract/lang";

function workerOptions() {
  return {
    workerPath: env["VITE_TESSERACT_WORKER_PATH"] || LOCAL_WORKER_PATH,
    corePath: env["VITE_TESSERACT_CORE_PATH"] || LOCAL_CORE_PATH,
    langPath: env["VITE_TESSERACT_LANG_PATH"] || LOCAL_LANG_PATH,
  } satisfies Record<string, string>;
}

export type OcrEngine = {
  /** Recognises one image and returns positioned lines for layout analysis. */
  recognize(
    image: HTMLCanvasElement | Blob,
    onProgress?: (fraction: number) => void,
  ): Promise<{ lines: Line[]; confidence: number; text: string }>;
  terminate(): Promise<void>;
};

/**
 * Creates a recognition engine for one conversion. Loading the language model
 * is the slow part, so a multi-page document should create one engine and
 * reuse it for every page.
 */
export async function createOcrEngine(
  language: OcrLanguage,
  onLoad?: (fraction: number) => void,
): Promise<OcrEngine> {
  let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>>;
  try {
    const { createWorker } = await import("tesseract.js");
    worker = await createWorker(language.split("+"), undefined, {
      ...workerOptions(),
      logger: (message) => {
        if (
          message.status === "loading language traineddata" ||
          message.status === "initializing tesseract"
        ) {
          onLoad?.(message.progress);
        }
      },
    });
  } catch (error) {
    console.error("[ocr] engine failed to start", error);
    throw new ConversionError("ocr_unavailable", "ocr_unavailable");
  }

  return {
    async recognize(image, onProgress) {
      let result;
      try {
        result = await worker.recognize(image, undefined, { blocks: true, text: true });
      } catch (error) {
        console.error("[ocr] recognition failed", error);
        throw new ConversionError("ocr_failed", "ocr_failed");
      }
      onProgress?.(1);
      return {
        lines: linesFromOcr(result.data.blocks ?? []),
        confidence: result.data.confidence ?? 0,
        text: result.data.text ?? "",
      };
    },
    async terminate() {
      try {
        await worker.terminate();
      } catch {
        /* the worker is going away anyway */
      }
    },
  };
}

type OcrBox = { x0: number; y0: number; x1: number; y1: number };
type OcrWord = { text: string; bbox: OcrBox };
type OcrLine = { text: string; bbox: OcrBox; words: OcrWord[] };
type OcrParagraph = { lines: OcrLine[] };
type OcrBlock = { paragraphs: OcrParagraph[] };

/**
 * Converts Tesseract's nested result into the same positioned-line shape the
 * PDF reader produces, so both go through one layout analyser.
 *
 * Image coordinates already run top-down, which is the direction the layout
 * analyser expects.
 */
export function linesFromOcr(blocks: OcrBlock[]): Line[] {
  const lines: Line[] = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        const words = (line.words ?? []).filter((word) => word.text.trim().length > 0);
        if (words.length === 0) continue;

        const height = Math.max(1, line.bbox.y1 - line.bbox.y0);
        const fragments: Fragment[] = words.map((word) => ({
          text: word.text,
          x: word.bbox.x0,
          width: Math.max(1, word.bbox.x1 - word.bbox.x0),
          size: Math.max(1, word.bbox.y1 - word.bbox.y0),
        }));

        lines.push({
          fragments,
          text: words
            .map((word) => word.text)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
          top: line.bbox.y0,
          height,
          size: height,
          x0: line.bbox.x0,
          x1: line.bbox.x1,
        });
      }
    }
  }

  return lines.sort((a, b) => a.top - b.top || a.x0 - b.x0);
}
