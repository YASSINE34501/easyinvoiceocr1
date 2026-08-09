/**
 * Product page registry.
 *
 * Replaces the old single-locale src/content/products.ts. The three locale
 * files are separate so a translator can work on one without merge conflicts
 * in the other two, and so a missing locale is a type error rather than a page
 * that silently falls back to English.
 */

import { path } from "@/config/routing";
import type { Locale } from "@/i18n";
import type { Product, ProductAvailability, ProductContent } from "./types";
import { productsEn } from "./en";
import { productsFr } from "./fr";
import { productsAr } from "./ar";

export type { Product, ProductContent, ProductFaq, ProductLink } from "./types";

/**
 * Slug order, and whether each product actually works.
 *
 * `ocr-api` is coming-soon: the endpoints do not exist. It stays reachable
 * because a published page that quietly disappears is worse than one that says
 * "not yet" — but it is noindex and absent from the sitemap, because ranking
 * for "OCR API" and then telling the visitor there is no API wastes their time
 * and earns a bounce.
 */
const REGISTRY: { slug: string; availability: ProductAvailability }[] = [
  { slug: "invoice-ocr", availability: "live" },
  { slug: "receipt-to-excel", availability: "live" },
  { slug: "pdf-invoice-parser", availability: "live" },
  { slug: "image-to-excel", availability: "live" },
  { slug: "ocr-api", availability: "coming-soon" },
];

function contentFor(slug: string): Record<Locale, ProductContent> {
  const en = productsEn[slug];
  const fr = productsFr[slug];
  const ar = productsAr[slug];
  if (!en || !fr || !ar) {
    throw new Error(`Product "${slug}" is missing content in one or more locales`);
  }
  return { en, fr, ar };
}

export const products: Product[] = REGISTRY.map(({ slug, availability }) => ({
  slug,
  route: path(slug),
  availability,
  content: contentFor(slug),
}));

export const productBySlug: Record<string, Product | undefined> = Object.fromEntries(
  products.map((product) => [product.slug, product]),
);

/**
 * Slugs that must not be indexed or listed in the sitemap.
 *
 * Derived from availability rather than hand-maintained, so a product becomes
 * indexable the moment it is marked live and cannot be forgotten in a second
 * list.
 */
export const comingSoonProductSlugs: string[] = products
  .filter((product) => product.availability === "coming-soon")
  .map((product) => product.slug);

export function isComingSoonProduct(slug: string): boolean {
  return comingSoonProductSlugs.includes(slug.replace(/^\/+/, ""));
}
