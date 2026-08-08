/**
 * Image handling shared by Image to Word and Image to PDF.
 *
 * Everything happens on a canvas in the browser: rotation is applied to the
 * pixels rather than recorded as metadata, and WebP is re-encoded to PNG or
 * JPEG because neither Word nor PDF accepts WebP.
 */

import { ConversionError } from "./types";

export type Rotation = 0 | 90 | 180 | 270;

export type DecodedImage = {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  close(): void;
};

export async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation: "from-image" applies the EXIF orientation so a photo
      // taken sideways is upright before the user rotates anything.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      /* fall through to the <img> path */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new ConversionError("image_decode_failed", "image_decode_failed"));
      element.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    if (error instanceof ConversionError) throw error;
    throw new ConversionError("image_decode_failed", "image_decode_failed");
  }
}

/** Draws a decoded image onto a canvas, applying rotation and an optional cap. */
export function drawToCanvas(
  image: DecodedImage,
  rotation: Rotation = 0,
  maxEdge = 4000,
): HTMLCanvasElement {
  const swapped = rotation === 90 || rotation === 270;
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const longest = Math.max(sourceWidth, sourceHeight);
  const scale = longest > maxEdge ? maxEdge / longest : 1;

  const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = swapped ? drawHeight : drawWidth;
  canvas.height = swapped ? drawWidth : drawHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new ConversionError("image_decode_failed", "image_decode_failed");

  // A white backdrop keeps transparent PNGs from turning black once flattened
  // into a JPEG or a PDF page.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image.source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return canvas;
}

export type EncodedImage = {
  data: Uint8Array;
  type: "png" | "jpg";
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
};

/**
 * Encodes a canvas. JPEG is used when a quality below 1 is requested — it is
 * dramatically smaller for photographs — and PNG when loss-free output is
 * wanted, e.g. for text-heavy scans.
 */
export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<EncodedImage> {
  const lossy = quality < 1;
  const mime: "image/png" | "image/jpeg" = lossy ? "image/jpeg" : "image/png";

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, lossy ? quality : undefined),
  );
  if (!blob || blob.size === 0) {
    throw new ConversionError("image_decode_failed", "image_decode_failed");
  }

  return {
    data: new Uint8Array(await blob.arrayBuffer()),
    type: lossy ? "jpg" : "png",
    mime,
    width: canvas.width,
    height: canvas.height,
  };
}

/** Small canvas preview used by the reorder/rotate strip, as an object URL. */
export async function thumbnailUrl(file: Blob, rotation: Rotation, maxEdge = 320): Promise<string> {
  const image = await decodeImage(file);
  try {
    const canvas = drawToCanvas(image, rotation, maxEdge);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.75),
    );
    if (!blob) throw new ConversionError("image_decode_failed", "image_decode_failed");
    return URL.createObjectURL(blob);
  } finally {
    image.close();
  }
}

export function rotateBy(current: Rotation, delta: 90 | -90): Rotation {
  return ((current + delta + 360) % 360) as Rotation;
}
