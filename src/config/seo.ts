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
/* Entity graph                                                        */
/* ------------------------------------------------------------------ */

/**
 * Stable node ids for the two site-level entities.
 *
 * Every page already declared what it was — WebApplication, BlogPosting,
 * BreadcrumbList — but nothing declared what it belonged to, so a search
 * engine saw a valid graph with no edges. A fragment id on the site origin is
 * the conventional way to name these: it is stable, it is not a page, and it
 * lets every other node point at one organisation instead of restating it.
 */
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization` as const;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website` as const;

/** The brand logo, raster because Google does not accept SVG for this. */
export const ORGANIZATION_LOGO = `${SITE_ORIGIN}/icons/logo-512.png` as const;

/**
 * The one Organization definition. Emitted from the root so it reaches every
 * page; anything else that needs it references publisherRef() rather than
 * declaring a second copy.
 *
 * No sameAs: the project has no verified official profiles, and an invented
 * one would be worse than none.
 */
export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: ORGANIZATION_LOGO,
  };
}

/** A reference to the organisation above, never a second definition of it. */
export function publisherRef() {
  return { "@id": ORGANIZATION_ID };
}

/* ------------------------------------------------------------------ */
/* Social cards                                                        */
/* ------------------------------------------------------------------ */

/** Shared social image. A real asset in public/, not a placeholder service. */
/**
 * PNG, not the SVG beside it. Open Graph and the X card spec accept JPG, PNG,
 * WEBP and GIF; an SVG is simply not rendered, so every share of every page
 * previewed with no image at all while twitter:card promised a large one.
 *
 * The PNG is rasterised from easyinvoiceocr-card.svg, which stays the source
 * of truth for the design. Regenerating it needs Inter available to the
 * rasteriser — without it the text silently reflows into a fallback face.
 */
export const SOCIAL_IMAGE = "/og/easyinvoiceocr-card.png" as const;

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

/**
 * Search-engine ownership verification, as meta tags.
 *
 * Two things Google accepts are easy to confuse. The HTML-file method issues a
 * token shaped `google` + 16 hex characters and asks for a file of that name at
 * the site root; the HTML-tag method issues a longer opaque string and asks for
 * a meta tag. They are not interchangeable — putting a file token into a meta
 * tag produces a tag Google reads and rejects, which is worse than no tag,
 * because the property then sits unverified with nothing obviously wrong.
 *
 * So the token is read from the environment rather than compiled in, and the
 * tag is emitted only when one is set. An unset variable renders nothing.
 */
export function verificationMeta(): MetaTag[] {
  const tags: MetaTag[] = [];

  const google = import.meta.env["VITE_GOOGLE_SITE_VERIFICATION"];
  // A file token in this variable would be silently wrong, so it is refused
  // here rather than shipped as a tag that cannot verify.
  if (typeof google === "string" && google.trim() !== "" && !/^google[0-9a-f]{16}$/i.test(google)) {
    tags.push({ name: "google-site-verification", content: google.trim() });
  }

  const bing = import.meta.env["VITE_BING_SITE_VERIFICATION"];
  if (typeof bing === "string" && bing.trim() !== "") {
    tags.push({ name: "msvalidate.01", content: bing.trim() });
  }

  return tags;
}
