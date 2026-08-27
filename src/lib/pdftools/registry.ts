/**
 * The PDF Tools registry.
 *
 * Source of truth for the tools index, the tool pages and their metadata.
 * Isolated from src/config/products.ts on purpose: that registry drives the
 * commercial products through navigation, homepage cards, ad eligibility, plan
 * entitlements and the sitemap, and thirty utilities in it would bury eight
 * products the business sells.
 *
 * A tool appears here only once it genuinely works end to end. Anything that
 * cannot be done reliably in the browser is absent rather than present and
 * disabled — a tool a visitor can see is a promise, and one that opens to
 * "unavailable" is worse than one that was never listed.
 */

import type { LucideIcon } from "lucide-react";
import {
  Combine,
  Crop,
  FileOutput,
  Hash,
  LayoutGrid,
  RotateCw,
  Scissors,
  Trash2,
} from "lucide-react";
import type { PdfToolSlug, ToolCategory } from "./types";

export type PdfToolDefinition = {
  slug: PdfToolSlug;
  icon: LucideIcon;
  category: ToolCategory;
  /** How many files the tool takes at once. */
  input: "single" | "multiple";
  /** True when the tool can produce several files and may need an archive. */
  multiOutput: boolean;
  /** Display order within its category. */
  order: number;
};

/**
 * Every tool here runs entirely in the browser on pdf-lib. None of them upload
 * anything, which is what lets the tool pages repeat the promise the security
 * page makes.
 */
export const PDF_TOOLS: PdfToolDefinition[] = [
  {
    slug: "merge-pdf",
    icon: Combine,
    category: "organise",
    input: "multiple",
    multiOutput: false,
    order: 1,
  },
  {
    slug: "split-pdf",
    icon: Scissors,
    category: "organise",
    input: "single",
    multiOutput: true,
    order: 2,
  },
  {
    slug: "remove-pages",
    icon: Trash2,
    category: "organise",
    input: "single",
    multiOutput: false,
    order: 3,
  },
  {
    slug: "extract-pages",
    icon: FileOutput,
    category: "organise",
    input: "single",
    multiOutput: false,
    order: 4,
  },
  {
    slug: "organize-pdf",
    icon: LayoutGrid,
    category: "organise",
    input: "single",
    multiOutput: false,
    order: 5,
  },
  {
    slug: "rotate-pdf",
    icon: RotateCw,
    category: "edit",
    input: "single",
    multiOutput: false,
    order: 6,
  },
  { slug: "crop-pdf", icon: Crop, category: "edit", input: "single", multiOutput: false, order: 7 },
  {
    slug: "page-numbers",
    icon: Hash,
    category: "edit",
    input: "single",
    multiOutput: false,
    order: 8,
  },
];

export const PDF_TOOL_SLUGS: PdfToolSlug[] = PDF_TOOLS.map((tool) => tool.slug);

export const PDF_TOOL_CATEGORIES: ToolCategory[] = ["organise", "edit"];

export function pdfTool(slug: string): PdfToolDefinition | undefined {
  return PDF_TOOLS.find((tool) => tool.slug === slug);
}

export function isPdfToolSlug(slug: string): slug is PdfToolSlug {
  return PDF_TOOLS.some((tool) => tool.slug === slug);
}

export function pdfToolsInCategory(category: ToolCategory): PdfToolDefinition[] {
  return PDF_TOOLS.filter((tool) => tool.category === category).sort((a, b) => a.order - b.order);
}

/** The URL for a tool, locale-prefixed like every other page on the site. */
export function pdfToolPath(slug: PdfToolSlug, locale: string): string {
  return `/${locale}/pdf/${slug}`;
}

/** The tools index. */
export function pdfToolsIndexPath(locale: string): string {
  return `/${locale}/pdf-tools`;
}
