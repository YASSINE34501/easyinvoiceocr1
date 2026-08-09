/**
 * The one place the production origin is written down.
 *
 * Every canonical, hreflang, sitemap entry, JSON-LD `url` and social image on
 * the site resolves through here. Before this module existed the origin was
 * spelled three different ways — relative paths in most `head()` blocks, a
 * hard-coded non-www origin in the About page's structured data, and the
 * *request* origin in the sitemap, which meant a preview deployment published
 * its own hostname as canonical.
 *
 * Two ideas are kept deliberately separate:
 *
 *   * SITE_ORIGIN is a constant. A canonical URL must name the production page
 *     even when the code is running somewhere else, otherwise a preview build
 *     invites search engines to index the preview.
 *   * Indexability is environmental. It is decided by VITE_SITE_URL, and it
 *     fails closed: anything that is not demonstrably production is noindex.
 *
 * Kept apart from config/site.ts, which holds product copy and FAQs. This
 * module is about addresses and indexing rules and nothing else.
 */

import { defaultLocale, locales, type Locale } from "@/i18n";
import { path } from "@/config/routing";

/** Canonical production origin. www is the canonical host; the apex redirects. */
export const SITE_ORIGIN = "https://www.easyinvoiceocr.com" as const;

/** Legal/organisation name, used in structured data and Open Graph. */
export const SITE_NAME = "EasyInvoiceOCR" as const;

/**
 * Whether this deployment may be indexed.
 *
 * Fails closed. A preview, a branch deployment and a developer's laptop all
 * leave VITE_SITE_URL unset or different, and all three are noindex. Production
 * must set VITE_SITE_URL to exactly SITE_ORIGIN — if it is forgotten the site
 * is not indexed, which is recoverable, whereas indexing five copies of the
 * same content across preview hostnames is not.
 */
export function isIndexableDeployment(): boolean {
  const configured = import.meta.env["VITE_SITE_URL"];
  return typeof configured === "string" && configured.replace(/\/+$/, "") === SITE_ORIGIN;
}

/** Joins a root-relative path onto the production origin. */
export function absoluteUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_ORIGIN}${clean}`;
}

/** Absolute canonical for a locale-prefixed slug. `""` is the locale home. */
export function canonicalUrl(slug: string, locale: Locale = defaultLocale): string {
  return absoluteUrl(path(slug, locale));
}

export type HeadLink = { rel: string; href: string; hrefLang?: string };

/**
 * Canonical plus the full alternate set for one page.
 *
 * x-default points at English: it is the fallback for a visitor whose language
 * matches none of the three, not a fourth version of the page.
 */
export function seoLinks(slug: string, locale: Locale): HeadLink[] {
  return [
    { rel: "canonical", href: canonicalUrl(slug, locale) },
    ...locales.map((alternate) => ({
      rel: "alternate",
      hrefLang: alternate,
      href: canonicalUrl(slug, alternate),
    })),
    { rel: "alternate", hrefLang: "x-default", href: canonicalUrl(slug, "en") },
  ];
}

/* ------------------------------------------------------------------ */
/* Indexability                                                        */
/* ------------------------------------------------------------------ */

/**
 * Route slugs that must never be indexed.
 *
 * Authentication and account pages carry no content worth ranking and often
 * carry a token in the URL; the app area is per-user; checkout is
 * transactional. Matching is prefix-based so `app/settings` is covered by
 * `app`.
 */
export const NOINDEX_SLUGS: readonly string[] = [
  // Documents an API that accepts no requests. Reachable, but not offered to
  // search engines until the service exists. See OCR_API_STATUS.md.
  "api-reference",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "verify-email",
  "choose-plan",
  "app",
];

export function isNoindexSlug(slug: string): boolean {
  const clean = slug.replace(/^\/+/, "");
  return NOINDEX_SLUGS.some((entry) => clean === entry || clean.startsWith(`${entry}/`));
}

export type MetaTag = { name?: string; property?: string; content: string };

/**
 * The robots directive for a page.
 *
 * Private routes are always `noindex, nofollow`. Public routes are indexable
 * only on the production deployment; anywhere else they are `noindex, nofollow`
 * too, which is what keeps preview builds out of the index.
 */
export function robotsMeta(slug: string): MetaTag {
  if (isNoindexSlug(slug) || !isIndexableDeployment()) {
    return { name: "robots", content: "noindex, nofollow" };
  }
  return { name: "robots", content: "index, follow" };
}

/* ------------------------------------------------------------------ */
/* Social cards                                                        */
/* ------------------------------------------------------------------ */

/** Shared social image. A real asset in public/, not a placeholder service. */
export const SOCIAL_IMAGE = "/og/easyinvoiceocr-card.svg" as const;

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_AR",
};

/**
 * Open Graph and Twitter tags for a page.
 *
 * og:url is absolute and equal to the canonical, so a shared link and an
 * indexed link are the same URL rather than two addresses for one page.
 */
export function socialMeta(input: {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  type?: "website" | "article";
  image?: string;
}): MetaTag[] {
  const url = canonicalUrl(input.slug, input.locale);
  return [
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OG_LOCALE[input.locale] },
    { property: "og:image", content: absoluteUrl(input.image ?? SOCIAL_IMAGE) },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: absoluteUrl(input.image ?? SOCIAL_IMAGE) },
  ];
}
