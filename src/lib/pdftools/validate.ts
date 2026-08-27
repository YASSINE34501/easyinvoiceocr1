/**
 * What a file has to be before any of the operations touch it.
 *
 * The extension is the weakest signal there is — renaming invoice.exe to
 * invoice.pdf takes a second — so the bytes themselves are checked. Everything
 * here runs before pdf-lib sees the file, which keeps a malformed upload from
 * reaching a parser at all.
 */

import { PdfToolError } from "./types";

/**
 * 100 MB. Large enough for a long scanned document, small enough that a browser
 * tab can hold it, decode it and hold the output at the same time. Past this a
 * conversion tends not to fail cleanly — the tab dies, which looks to the
 * visitor like the site is broken.
 */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

/** Beyond this the archive step, not the PDF work, becomes the bottleneck. */
export const MAX_FILES = 20;

const PDF_MIMES = ["application/pdf", "application/x-pdf", "application/acrobat"];

export type FileLike = { name: string; size: number; type: string };

/**
 * Checks name, declared type and size. The signature is checked separately,
 * once the bytes are in hand — this runs at selection time, when only metadata
 * is available.
 */
export function validatePdfFile(file: FileLike, maxBytes = MAX_FILE_BYTES): void {
  if (file.size === 0) throw new PdfToolError("file_empty");
  if (file.size > maxBytes) throw new PdfToolError("file_too_large");

  const looksLikePdf =
    /\.pdf$/i.test(file.name) || (file.type !== "" && PDF_MIMES.includes(file.type.toLowerCase()));
  if (!looksLikePdf) throw new PdfToolError("not_a_pdf");

  // A browser that reports a type at all should report the right one. An empty
  // type is normal for a dragged file and is not held against it.
  if (file.type !== "" && !PDF_MIMES.includes(file.type.toLowerCase())) {
    throw new PdfToolError("not_a_pdf");
  }
}

export function validatePdfFiles(files: FileLike[], maxFiles = MAX_FILES): void {
  if (files.length === 0) throw new PdfToolError("no_files");
  if (files.length > maxFiles) throw new PdfToolError("too_many_files");
  for (const file of files) validatePdfFile(file);
}

/**
 * The check the extension cannot fake: every PDF begins %PDF-.
 *
 * Some files carry junk before the header — a stray byte-order mark, a mail
 * gateway's preamble — and readers tolerate it, so a short window is searched
 * rather than only the first five bytes.
 */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const window = bytes.subarray(0, Math.min(bytes.length, 1024));
  const text = String.fromCharCode(...window);
  return text.includes("%PDF-");
}

/** Signature check with the error the interface knows how to translate. */
export function assertPdfSignature(bytes: Uint8Array): void {
  if (bytes.length === 0) throw new PdfToolError("file_empty");
  if (!hasPdfSignature(bytes)) throw new PdfToolError("not_a_pdf");
}

/** Bytes as a human-readable size, for summaries and error messages. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
