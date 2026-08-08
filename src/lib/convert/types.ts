/**
 * Shared vocabulary for every file converter.
 *
 * The same stage list, block model and error codes are used by the browser
 * converters, the conversion-job records written server-side and the progress
 * UI, so a job can never be in a state the interface cannot describe.
 */

/** Lifecycle of a single conversion, mirrored by conversion_jobs.status. */
export const CONVERSION_STAGES = [
  "waiting",
  "uploading",
  "reading",
  "ocr",
  "building",
  "completed",
  "failed",
] as const;

export type ConversionStage = (typeof CONVERSION_STAGES)[number];

/** Persisted job statuses (a superset of the client-visible stages). */
export const JOB_STATUSES = [
  "pending",
  "uploading",
  "processing",
  "completed",
  "failed",
  "expired",
  "deleted",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Machine-readable failure reasons. These are safe to log and to send to the
 * client; they never contain a filename or any document content.
 */
export const ERROR_CODES = [
  "unsupported_type",
  "file_too_large",
  "file_empty",
  "too_many_files",
  "pdf_encrypted",
  "pdf_corrupt",
  "pdf_no_pages",
  "image_decode_failed",
  "ocr_unavailable",
  "ocr_failed",
  "empty_result",
  "output_invalid",
  "timeout",
  "quota_exceeded",
  "not_entitled",
  "unauthorized",
  "internal_error",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class ConversionError extends Error {
  readonly code: ErrorCode;
  /** Extra numbers for the message, e.g. the size limit. Never file content. */
  readonly detail: Record<string, string | number> | undefined;

  constructor(code: ErrorCode, message: string, detail?: Record<string, string | number>) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
    this.detail = detail;
  }
}

export function isConversionError(value: unknown): value is ConversionError {
  return value instanceof ConversionError;
}

/** Text direction of a block, decided from its own characters. */
export type Direction = "ltr" | "rtl";

/**
 * Structured document model produced by every reader (PDF text layer, PDF page
 * OCR, image OCR) and consumed by the .docx writer. Keeping one model between
 * them is what lets a scanned PDF and a native PDF produce the same output
 * shape.
 */
export type DocBlock =
  | { kind: "heading"; level: 1 | 2 | 3; text: string; dir: Direction }
  | { kind: "paragraph"; text: string; dir: Direction }
  | { kind: "list"; ordered: boolean; items: string[]; dir: Direction }
  | { kind: "table"; rows: string[][]; dir: Direction }
  | {
      kind: "image";
      data: Uint8Array;
      type: "png" | "jpg";
      widthPx: number;
      heightPx: number;
    }
  | { kind: "pageBreak" };

export type DocumentModel = {
  /** Source filename without extension, used for the download name. */
  baseName: string;
  /** Number of source pages/images that produced this model. */
  pageCount: number;
  blocks: DocBlock[];
  /** True when at least one page needed OCR. */
  usedOcr: boolean;
  /** Dominant direction, used for the document default. */
  dir: Direction;
};

/** Progress callback shared by all converters. */
export type ProgressReporter = (update: {
  stage: ConversionStage;
  /** 0–100 across the whole conversion. */
  percent: number;
  /** Optional 1-based page being worked on. */
  page?: number | undefined;
  pageCount?: number | undefined;
}) => void;

export function countTextBlocks(blocks: DocBlock[]): number {
  return blocks.filter((b) => b.kind !== "pageBreak" && b.kind !== "image").length;
}

export function modelPlainText(model: DocumentModel): string {
  const parts: string[] = [];
  for (const block of model.blocks) {
    switch (block.kind) {
      case "heading":
      case "paragraph":
        parts.push(block.text);
        break;
      case "list":
        parts.push(block.items.join("\n"));
        break;
      case "table":
        parts.push(block.rows.map((r) => r.join("\t")).join("\n"));
        break;
      default:
        break;
    }
  }
  return parts.join("\n").trim();
}
