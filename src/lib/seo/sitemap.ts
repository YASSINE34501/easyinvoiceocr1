/**
 * Sitemap generation.
 *
 * The URL list is derived from the same navigation and product configuration
 * the site renders from, so a new product appears in the sitemap without a
 * second edit — and a removed one disappears. Private, authentication and
 * billing routes are never included.
 */

import { locales } from "@/i18n";
import { path } from "@/config/routing";
import { SITE_ORIGIN } from "@/config/seo";
import { sortedProducts } from "@/config/products";
import { solutionLinks, resourceLinks, companyLinks, legalLinks } from "@/config/nav";

export type SitemapEntry = { slug: string; changefreq: string; priority: string };

export function sitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [{ slug: "", changefreq: "weekly", priority: "1.0" }];

  for (const product of sortedProducts) {
    if (!product.inSitemap) continue;
    entries.push({ slug: product.slug, changefreq: "weekly", priority: "0.9" });
  }

  for (const link of solutionLinks) {
    entries.push({ slug: link.slug, changefreq: "monthly", priority: "0.7" });
  }
  for (const link of resourceLinks) {
    entries.push({ slug: link.slug, changefreq: "weekly", priority: "0.7" });
  }
  for (const link of companyLinks) {
    entries.push({ slug: link.slug, changefreq: "monthly", priority: "0.5" });
  }
  for (const link of legalLinks) {
    entries.push({ slug: link.slug, changefreq: "yearly", priority: "0.3" });
  }

  return entries;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the XML. Every URL carries an xhtml:link alternate for each locale,
 * which is what tells search engines the three language versions are the same
 * page rather than duplicates.
 */
export function buildSitemapXml(origin: string = SITE_ORIGIN): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  // Always the production origin. Deriving it from the request meant a preview
  // deployment published its own hostname as the canonical location of every
  // page on the site.
  const base = (origin || SITE_ORIGIN).replace(/\/+$/, "");

  const urls = sitemapEntries().flatMap((entry) =>
    locales.map((locale) => {
      const loc = `${base}${path(entry.slug, locale)}`;
      const alternates = [
        ...locales.map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${alternate}" href="${escapeXml(`${base}${path(entry.slug, alternate)}`)}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${base}${path(entry.slug, "en")}`)}"/>`,
      ].join("\n");

      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        alternates,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ].join("\n");
    }),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
