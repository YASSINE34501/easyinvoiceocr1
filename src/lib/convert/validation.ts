/**
 * File validation shared by the browser and the server.
 *
 * The browser copy exists so a user gets an instant, specific message; the
 * server runs exactly the same rules again before a job is created, because a
 * client-side check is a convenience, never a control.
 */

import { z } from "zod";
import { ConversionError, type ErrorCode } from "./types";
import type { ConverterTool } from "@/config/products";

/**
 * Every tool that consumes quota: the three file converters plus the four
 * extraction products. They share one allowance, so they must share one
 * registry — a tool missing here cannot open a job and would silently bypass
 * the gate.
 */
export type QuotaTool =
  ConverterTool | "invoice-ocr" | "receipt-to-excel" | "pdf-invoice-parser" | "image-to-excel";

export const QUOTA_TOOLS = [
  "pdf-to-word",
  "image-to-word",
  "image-to-pdf",
  "invoice-ocr",
  "receipt-to-excel",
  "pdf-invoice-parser",
  "image-to-excel",
] as const satisfies readonly QuotaTool[];

export const TOOL_ACCEPT: Record<
  QuotaTool,
  { mime: string[]; extensions: string[]; multiple: boolean; maxFiles: number }
> = {
  "pdf-to-word": {
    mime: ["application/pdf"],
    extensions: [".pdf"],
    multiple: false,
    maxFiles: 1,
  },
  "image-to-word": {
    mime: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    multiple: true,
    maxFiles: 40,
  },
  "image-to-pdf": {
    mime: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    multiple: true,
    maxFiles: 60,
  },
  "invoice-ocr": {
    mime: ["application/pdf", "image/jpeg", "image/png"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png"],
    multiple: false,
    maxFiles: 1,
  },
  "receipt-to-excel": {
    mime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
    multiple: false,
    maxFiles: 1,
  },
  "pdf-invoice-parser": {
    mime: ["application/pdf"],
    extensions: [".pdf"],
    multiple: false,
    maxFiles: 1,
  },
  "image-to-excel": {
    mime: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    multiple: false,
    maxFiles: 1,
  },
};

/** Fallback ceiling used before a plan's own limit is known. */
export const DEFAULT_MAX_FILE_BYTES = 20 * 1024 * 1024;

export function acceptAttribute(tool: ConverterTool): string {
  return TOOL_ACCEPT[tool].extensions.join(",");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type FileDescriptor = { name: string; type: string; size: number };

/**
 * Validates one file against a tool's accepted types and the caller's size
 * limit. Throws a ConversionError whose code the UI maps to a localized string.
 */
export function validateFile(
  file: FileDescriptor,
  tool: ConverterTool,
  maxBytes: number = DEFAULT_MAX_FILE_BYTES,
): void {
  const accept = TOOL_ACCEPT[tool];
  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";

  // Both are checked: some browsers report an empty type for a dragged file,
  // and an extension alone is trivially spoofed. The bytes are verified again
  // when the file is actually parsed.
  const mimeOk = accept.mime.includes(file.type);
  const extensionOk = accept.extensions.includes(extension);
  if (!mimeOk && !extensionOk) throw fail("unsupported_type");
  if (file.type && !mimeOk) throw fail("unsupported_type");

  if (file.size === 0) throw fail("file_empty");
  if (file.size > maxBytes) {
    throw fail("file_too_large", { limit: formatBytes(maxBytes), actual: formatBytes(file.size) });
  }
}

export function validateFileList(
  files: FileDescriptor[],
  tool: ConverterTool,
  maxBytes: number = DEFAULT_MAX_FILE_BYTES,
): void {
  const accept = TOOL_ACCEPT[tool];
  if (files.length === 0) throw fail("file_empty");
  if (files.length > accept.maxFiles) {
    throw fail("too_many_files", { limit: accept.maxFiles });
  }
  for (const file of files) validateFile(file, tool, maxBytes);
}

function fail(code: ErrorCode, detail?: Record<string, string | number>) {
  return new ConversionError(code, code, detail);
}

/** Server-side payload schema for creating a conversion job. */
export const conversionJobInput = z.object({
  tool: z.enum(QUOTA_TOOLS),
  originalFilename: z.string().trim().min(1).max(255),
  inputMimeType: z.string().trim().min(1).max(120),
  inputSize: z
    .number()
    .int()
    .nonnegative()
    .max(1024 * 1024 * 1024),
  pageCount: z.number().int().min(0).max(5000).default(0),
  /** Caller-generated, stable across retries of the same conversion. */
  idempotencyKey: z.string().trim().min(8).max(120),
});

export type ConversionJobInput = z.infer<typeof conversionJobInput>;

const PATH_UNSAFE = /[\\/:*?"<>|]/g;
// C0 control characters and DEL. Built from escape sequences so no literal
// control byte is ever stored in this source file. Matching control characters
// is the intent here — they are exactly what must not reach a filename or a
// Content-Disposition header.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]", "g");

/**
 * Filenames are echoed back to the user, so strip anything that could be used
 * to break out of a storage path or smuggle control characters into a
 * download header. Letters in any script — including Arabic — are kept.
 */
export function safeBaseName(filename: string): string {
  const cleaned = filename
    .replace(/\.[^.]+$/, "")
    .replace(PATH_UNSAFE, "")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    // Stripped after trim, not before: " .. .pdf" leaves a leading space, so a
    // leading-dot strip running first sees no dot and the name survived as "..".
    // Nothing is written server-side, so this was a nonsense download name
    // rather than a traversal, but it was still wrong.
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 80);
  return cleaned || "document";
}
