/**
 * Handing produced files back to the visitor.
 *
 * One file is downloaded directly. Several are zipped first, because a browser
 * will not reliably start more than one download from a single gesture — the
 * second and third are silently blocked in most of them, which looks to the
 * visitor like the tool half-worked.
 */

import type { OutputFile } from "@/lib/pdftools/types";
import { downloadBlob } from "@/components/convert/parts";

/** A zip of the produced files, built in the tab. JSZip is loaded on demand. */
export async function zipOutputs(files: OutputFile[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) {
    // No compression: a PDF is already compressed, so deflating it costs
    // seconds of main-thread time and saves almost nothing.
    zip.file(file.name, file.bytes, { compression: "STORE" });
  }
  return zip.generateAsync({ type: "blob" });
}

function blobOf(file: OutputFile): Blob {
  // A fresh ArrayBuffer copy: the bytes pdf-lib returns may be a view onto a
  // larger buffer, and Blob would otherwise take the whole of it.
  return new Blob([file.bytes.slice().buffer as ArrayBuffer], { type: file.mime });
}

/**
 * Downloads the result: the file itself when there is one, a zip when there
 * are several. `zipName` is used only in the second case.
 */
export async function downloadOutputs(files: OutputFile[], zipName: string): Promise<void> {
  const only = files[0];
  if (!only) return;
  if (files.length === 1) {
    downloadBlob(blobOf(only), only.name);
    return;
  }
  downloadBlob(await zipOutputs(files), zipName);
}

/** Downloads one file out of a multi-file result. */
export function downloadOne(file: OutputFile): void {
  downloadBlob(blobOf(file), file.name);
}

export function totalBytes(files: OutputFile[]): number {
  return files.reduce((sum, file) => sum + file.bytes.length, 0);
}
