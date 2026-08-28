/**
 * What the tools index shows.
 *
 * The index is the one place where the two registries meet: the eight
 * page-level PDF tools from src/lib/pdftools, and the commercial products from
 * src/config/products. A visitor looking for "PDF to Word" does not care which
 * registry it lives in, so the grid lists both.
 *
 * The join is done *here*, in the components layer, deliberately. src/lib/pdftools
 * still imports nothing from the product registry, the billing code or the
 * auth code — that isolation is what keeps a change to the commercial products
 * from reaching into the PDF operations, and it is worth more than the small
 * convenience of merging the two lists a layer lower.
 *
 * Nothing is invented. Every entry points at a route that exists and a tool
 * that runs; the one entry that does not work yet carries the "soon" badge and
 * says so, because a card that opens onto "unavailable" wastes the click.
 */

import type { LucideIcon } from "lucide-react";
import { PDF_TOOLS, pdfToolPath, pdfToolsIndexPath } from "@/lib/pdftools/registry";
import { pdfToolsCopy } from "@/content/pdftools";
import type { SurfaceBadge, SurfaceCategory } from "@/content/pdftools/types";
import { products } from "@/config/products";
import { isComingSoonProduct } from "@/content/products";
import { path } from "@/config/routing";
import type { Locale } from "@/i18n";

export type SurfaceEntry = {
  /** Stable key: the slug, which is unique across both registries. */
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: SurfaceCategory;
  badge: SurfaceBadge | undefined;
  /** False only for a product the availability registry marks coming-soon. */
  available: boolean;
  /** Which registry it came from — the grid styles the two slightly apart. */
  origin: "tool" | "product";
};

/**
 * Where each commercial product sits in the index's grouping.
 *
 * The products registry groups by *kind* (extraction / converter / api), which
 * is about which shell renders them. A visitor groups by what they want done,
 * so the mapping is written out rather than derived from `kind`.
 */
const PRODUCT_CATEGORY: Record<string, SurfaceCategory> = {
  "pdf-to-word": "convert",
  "image-to-word": "convert",
  "image-to-pdf": "convert",
  "image-to-excel": "intelligence",
  "invoice-ocr": "intelligence",
  "receipt-to-excel": "intelligence",
  "pdf-invoice-parser": "intelligence",
  "ocr-api": "intelligence",
};

/** The whole grid, in display order, for one locale. */
export function surfaceEntries(locale: Locale): SurfaceEntry[] {
  const copy = pdfToolsCopy(locale);

  // The eight browser tools first: they are the subject of this section, they
  // are new, and they are the only ones that need nothing from the visitor.
  const tools: SurfaceEntry[] = [...PDF_TOOLS]
    .sort((a, b) => a.order - b.order)
    .map((tool) => ({
      id: tool.slug,
      name: copy.tools[tool.slug].name,
      description: copy.tools[tool.slug].card,
      href: pdfToolPath(tool.slug, locale),
      icon: tool.icon,
      category: tool.category satisfies SurfaceCategory,
      badge: "new" as const,
      available: true,
      origin: "tool" as const,
    }));

  const productEntries: SurfaceEntry[] = [...products]
    .sort((a, b) => a.order - b.order)
    .flatMap((product) => {
      const category = PRODUCT_CATEGORY[product.slug];
      if (!category) return [];
      const soon = isComingSoonProduct(product.slug);
      return [
        {
          id: product.slug,
          name: product.copy[locale].name,
          description: product.copy[locale].card,
          href: path(product.slug, locale),
          icon: product.icon,
          category,
          // "account", not "premium": every working product sits on the free
          // five-conversion allowance, so nothing here is behind a paid tier.
          // A Premium badge would describe a gate the entitlement code does
          // not have.
          badge: soon ? ("soon" as const) : ("account" as const),
          available: !soon,
          origin: "product" as const,
        },
      ];
    });

  return [...tools, ...productEntries];
}

/**
 * The accent for a family, as Tailwind classes.
 *
 * Kept at a similar chroma and lightness so sixteen tools still read as one
 * family, and the brand's emerald stays with the page tools. Contrast of the
 * glyph on its tile was measured: 3.9–4.9:1, above the 3:1 that non-text
 * graphics need.
 */
export const TOOL_ACCENT: Record<SurfaceCategory, { tile: string; glyph: string }> = {
  organise: { tile: "bg-tool-organise-soft", glyph: "text-tool-organise" },
  edit: { tile: "bg-tool-edit-soft", glyph: "text-tool-edit" },
  convert: { tile: "bg-tool-convert-soft", glyph: "text-tool-convert" },
  intelligence: { tile: "bg-tool-intelligence-soft", glyph: "text-tool-intelligence" },
};

/** Which family a slug belongs to, across both registries. */
export function categoryOf(slug: string): SurfaceCategory | undefined {
  const tool = PDF_TOOLS.find((entry) => entry.slug === slug);
  if (tool) return tool.category;
  return PRODUCT_CATEGORY[slug];
}

/**
 * The accent for any tool slug. Falls back to the brand tint for a slug we do
 * not know, so an unrecognised link still renders rather than losing its icon.
 */
export function toolAccent(slug: string): { tile: string; glyph: string } {
  const category = categoryOf(slug);
  return category ? TOOL_ACCENT[category] : { tile: "bg-pale-green", glyph: "text-primary" };
}

/** The icon for any tool slug, from whichever registry owns it. */
export function toolIcon(slug: string): LucideIcon | undefined {
  return (
    PDF_TOOLS.find((entry) => entry.slug === slug)?.icon ??
    products.find((product) => product.slug === slug)?.icon
  );
}

/** Categories that actually contain something, in display order. */
export const SURFACE_CATEGORIES: SurfaceCategory[] = [
  "organise",
  "edit",
  "convert",
  "intelligence",
];

export { pdfToolsIndexPath };
