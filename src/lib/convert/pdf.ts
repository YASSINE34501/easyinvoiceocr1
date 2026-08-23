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

export type PdfPageImage = {
  data: Uint8Array;
  type: "png";
  widthPx: number;
  heightPx: number;
};

export type PdfHandle = {
  pageCount: number;
  getPageText(pageNumber: number): Promise<PdfPageText>;
  getPageImages(pageNumber: number): Promise<PdfPageImage[]>;
  renderPage(pageNumber: number, targetWidthPx: number): Promise<HTMLCanvasElement>;
  destroy(): Promise<void>;
};

/**
 * Anything smaller than this on either side is a rule, a bullet or a spacer
 * rather than a picture, and carrying them into the document adds clutter
 * without adding information.
 */
const MIN_IMAGE_PX = 32;

/**
 * A ceiling per page. A PDF can paint the same tiny logo hundreds of times, and
 * a document that quietly grows to fifty megabytes is its own kind of failure.
 */
const MAX_IMAGES_PER_PAGE = 12;

/** Guards against one absurd image exhausting memory. */
const MAX_IMAGE_PIXELS = 40_000_000;

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

    /**
     * Pulls the pictures painted on a page out of the file.
     *
     * PDF -> Word used to read the text layer and nothing else, so a report
     * converted cleanly and arrived in Word with its figures missing and no
     * indication anything had gone. The writer could always place images; it
     * was never given any.
     *
     * pdf.js exposes them only through the operator list, and only after the
     * worker has decoded the object — hence the callback form of objs.get,
     * which fires once decoding finishes. Each one is drawn onto a canvas and
     * re-encoded as PNG, because the decoded object is raw RGB(A) rather than
     * any format Word would accept.
     *
     * Failure here is deliberately not fatal. A picture that cannot be decoded
     * must not cost the visitor the text of the whole document, so a bad image
     * is skipped and the conversion continues.
     */
    async getPageImages(pageNumber) {
      const page = await document.getPage(pageNumber);
      const images: PdfPageImage[] = [];

      try {
        const operators = await page.getOperatorList();
        const names: string[] = [];
        for (let i = 0; i < operators.fnArray.length; i += 1) {
          const fn = operators.fnArray[i];
          // paintImageXObject covers both JPEG and raster XObjects in this
          // version; the Repeat variant is the same object tiled, and it names
          // the object in the same argument.
          if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintImageXObjectRepeat) {
            const name = operators.argsArray[i]?.[0];
            // The same object painted twice is one picture, not two.
            if (typeof name === "string" && !names.includes(name)) names.push(name);
          }
        }

        for (const name of names) {
          if (images.length >= MAX_IMAGES_PER_PAGE) break;
          try {
            const object = await resolveImageObject(page, name);
            const encoded = await encodeImageObject(object);
            if (encoded) images.push(encoded);
          } catch {
            // Skipped on purpose — see above.
          }
        }
      } catch {
        // An operator list that cannot be read costs the pictures, never the
        // text: the caller has already collected that separately.
      }

      page.cleanup();
      return images;
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

/* ------------------------------------------------------------------ */
/* Image extraction helpers                                            */
/* ------------------------------------------------------------------ */

type PdfImageObject = {
  width?: number;
  height?: number;
  data?: Uint8ClampedArray | Uint8Array;
  bitmap?: ImageBitmap;
  kind?: number;
};

/**
 * pdf.js resolves an image asynchronously in its worker. objs.get takes a
 * callback that fires when the object is ready; a bounded wait keeps one
 * undecodable object from stalling the conversion.
 */
function resolveImageObject(
  page: { objs: { get(name: string, callback: (value: unknown) => void): void } },
  name: string,
): Promise<PdfImageObject> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("image_timeout")), 10_000);
    try {
      page.objs.get(name, (value) => {
        clearTimeout(timer);
        resolve(value as PdfImageObject);
      });
    } catch (error) {
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error("image_unavailable"));
    }
  });
}

/**
 * Turns a decoded pdf.js image into PNG bytes.
 *
 * Recent pdf.js hands back an ImageBitmap where it can and a raw pixel buffer
 * otherwise, so both are handled. The raw buffer is RGBA in current versions;
 * a three-byte-per-pixel buffer is widened rather than rejected, because
 * getting that wrong shows up as a picture with its colours shifted rather
 * than as an error.
 */
async function encodeImageObject(object: PdfImageObject): Promise<PdfPageImage | null> {
  const width = object.width ?? 0;
  const height = object.height ?? 0;
  if (width < MIN_IMAGE_PX || height < MIN_IMAGE_PX) return null;
  if (width * height > MAX_IMAGE_PIXELS) return null;

  const canvas = window.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  if (object.bitmap) {
    context.drawImage(object.bitmap, 0, 0);
  } else if (object.data) {
    const source = object.data;
    const expected = width * height * 4;
    let rgba: Uint8ClampedArray<ArrayBuffer>;
    if (source.length >= expected) {
      // Copied rather than viewed: the worker buffer may be shared, which the
      // ImageData constructor will not accept.
      rgba = new Uint8ClampedArray(expected);
      rgba.set(source.subarray(0, expected));
    } else if (source.length >= width * height * 3) {
      rgba = new Uint8ClampedArray(expected);
      for (let i = 0, j = 0; i < width * height; i += 1, j += 3) {
        rgba[i * 4] = source[j] ?? 0;
        rgba[i * 4 + 1] = source[j + 1] ?? 0;
        rgba[i * 4 + 2] = source[j + 2] ?? 0;
        rgba[i * 4 + 3] = 255;
      }
    } else {
      return null;
    }
    context.putImageData(new ImageData(rgba, width, height), 0, 0);
  } else {
    return null;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob || blob.size === 0) return null;

  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    type: "png",
    widthPx: width,
    heightPx: height,
  };
}
