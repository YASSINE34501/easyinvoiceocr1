/**
 * Image to PDF, entirely in the browser.
 *
 * pdf-lib assembles the document from JPEG/PNG bytes produced on a canvas, so
 * private photos never leave the device. Quality is a real trade-off the user
 * controls: the pixel cap and the JPEG quality together decide file size.
 */

import { ConversionError } from "./types";
import { decodeImage, drawToCanvas, encodeCanvas, type Rotation } from "./images";

export const PAGE_SIZES = {
  auto: null,
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;
export type Orientation = "portrait" | "landscape";
export type MarginKey = "none" | "small" | "normal";
export type FitMode = "fit" | "fill" | "original";
export type QualityKey = "high" | "balanced" | "small";

const MARGINS: Record<MarginKey, number> = { none: 0, small: 18, normal: 42 };

const QUALITY: Record<QualityKey, { maxEdge: number; jpegQuality: number }> = {
  high: { maxEdge: 3000, jpegQuality: 0.94 },
  balanced: { maxEdge: 2000, jpegQuality: 0.82 },
  small: { maxEdge: 1400, jpegQuality: 0.68 },
};

export type ImagePdfOptions = {
  pageSize: PageSizeKey;
  orientation: Orientation;
  margin: MarginKey;
  fit: FitMode;
  quality: QualityKey;
};

export const DEFAULT_IMAGE_PDF_OPTIONS: ImagePdfOptions = {
  pageSize: "a4",
  orientation: "portrait",
  margin: "normal",
  fit: "fit",
  quality: "balanced",
};

export type SourceImage = { file: Blob; rotation: Rotation };

/** Page geometry for one image, exported so the preview can show it. */
export function pageGeometry(
  imageWidth: number,
  imageHeight: number,
  options: ImagePdfOptions,
): {
  pageWidth: number;
  pageHeight: number;
  drawWidth: number;
  drawHeight: number;
  x: number;
  y: number;
} {
  const margin = MARGINS[options.margin];

  let pageWidth: number;
  let pageHeight: number;

  if (options.pageSize === "auto") {
    // The page takes the image's own proportions, so nothing is cropped and no
    // white band appears around it.
    pageWidth = imageWidth * 0.75 + margin * 2;
    pageHeight = imageHeight * 0.75 + margin * 2;
  } else {
    const size = PAGE_SIZES[options.pageSize]!;
    const portrait = options.orientation === "portrait";
    pageWidth = portrait ? size.width : size.height;
    pageHeight = portrait ? size.height : size.width;
  }

  const boxWidth = Math.max(1, pageWidth - margin * 2);
  const boxHeight = Math.max(1, pageHeight - margin * 2);

  let drawWidth: number;
  let drawHeight: number;

  if (options.fit === "original") {
    // 96 dpi pixels to 72 dpi points, clamped so a large image still fits.
    const scale = Math.min(1, boxWidth / (imageWidth * 0.75), boxHeight / (imageHeight * 0.75));
    drawWidth = imageWidth * 0.75 * scale;
    drawHeight = imageHeight * 0.75 * scale;
  } else if (options.fit === "fill") {
    const scale = Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
    drawWidth = Math.min(boxWidth, imageWidth * scale);
    drawHeight = Math.min(boxHeight, imageHeight * scale);
  } else {
    const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
    drawWidth = imageWidth * scale;
    drawHeight = imageHeight * scale;
  }

  return {
    pageWidth,
    pageHeight,
    drawWidth,
    drawHeight,
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
  };
}

export async function buildImagePdf(
  images: SourceImage[],
  options: ImagePdfOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  if (images.length === 0) throw new ConversionError("empty_result", "empty_result");

  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setProducer("EasyInvoiceOCR");
  pdf.setCreator("EasyInvoiceOCR");

  const { maxEdge, jpegQuality } = QUALITY[options.quality];

  for (const [index, item] of images.entries()) {
    const decoded = await decodeImage(item.file);
    let encoded;
    try {
      const canvas = drawToCanvas(decoded, item.rotation, maxEdge);
      encoded = await encodeCanvas(canvas, jpegQuality);
    } finally {
      decoded.close();
    }

    const embedded =
      encoded.type === "jpg" ? await pdf.embedJpg(encoded.data) : await pdf.embedPng(encoded.data);

    const geometry = pageGeometry(encoded.width, encoded.height, options);
    const page = pdf.addPage([geometry.pageWidth, geometry.pageHeight]);
    page.drawImage(embedded, {
      x: geometry.x,
      y: geometry.y,
      width: geometry.drawWidth,
      height: geometry.drawHeight,
    });

    onProgress?.(index + 1, images.length);
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  await assertValidPdf(blob, images.length);
  return blob;
}

/**
 * Confirms the bytes really are a PDF before the download is offered — the
 * header and a size floor proportional to the page count.
 */
export async function assertValidPdf(blob: Blob, pageCount: number): Promise<void> {
  if (blob.size < 500 || blob.size < pageCount * 200) {
    throw new ConversionError("output_invalid", "output_invalid");
  }
  const header = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer());
  if (!header.startsWith("%PDF-")) throw new ConversionError("output_invalid", "output_invalid");
}
