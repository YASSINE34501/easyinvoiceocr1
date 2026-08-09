/**
 * Shape of a product page's long-form content, in one locale.
 *
 * Split from the registry so each locale lives in its own file. The previous
 * single-locale model meant /fr/invoice-ocr and /ar/invoice-ocr rendered
 * English bodies under a translated header — the same defect the blog had.
 *
 * Every field here is visible on the page. Nothing is written for search
 * engines that a reader does not also see, which is what keeps FAQPage
 * structured data honest: the questions in `faqs` are the questions rendered.
 */

export type ProductFaq = { q: string; a: string };

export type ProductLink = { label: string; href: string };

export type ProductContent = {
  /** Short name, used in navigation and breadcrumbs. */
  name: string;
  /** <title>. */
  title: string;
  /** Meta description. */
  description: string;
  /** Small label above the H1. */
  eyebrow: string;
  /** The single H1. */
  heading: string;
  /** Standfirst under the H1. */
  lede: string;
  /** "What this is" — two or three paragraphs. */
  what: string[];
  /** Grouped list of what the page can extract or produce. */
  fields: { group: string; items: string[] }[];
  /** Who it is for. */
  audience: { title: string; body: string }[];
  /** Accepted inputs and limits. */
  formats: string[];
  /** Concrete capabilities. Only behaviour that exists. */
  capabilities: { title: string; body: string }[];
  /** How documents are handled. Must match what the code actually does. */
  security: string[];
  /** Rendered on the page, so FAQPage schema describes visible content. */
  faqs: ProductFaq[];
  /** Primary call to action. */
  cta: { label: string; href: string; note: string };
  /** Contextual links to blog articles that genuinely cover this product. */
  relatedGuides: ProductLink[];
  /** Sibling products a reader might actually want instead. */
  relatedTools: ProductLink[];
  /** The audience page for this product. */
  solutionLink: ProductLink;
  /** Section headings, so a locale can phrase them naturally. */
  labels: {
    what: string;
    fields: string;
    audience: string;
    formats: string;
    capabilities: string;
    security: string;
    faqs: string;
    relatedGuides: string;
    relatedTools: string;
  };
  /** Shown when a conversion returns nothing. */
  emptyState: string;
  /** Shown when a conversion fails. */
  errorState: string;
  /** Accessible names for controls that would otherwise be icon-only. */
  a11y: { uploadLabel: string; previewLabel: string };
};

/**
 * Whether the product actually works.
 *
 * "coming-soon" is not a marketing state. A coming-soon product is excluded
 * from the sitemap and rendered noindex, because publishing a page that ranks
 * for a capability the product does not have wastes the visit and earns a
 * bounce.
 */
export type ProductAvailability = "live" | "coming-soon";

export type Product = {
  slug: string;
  route: string;
  availability: ProductAvailability;
  content: Record<"en" | "fr" | "ar", ProductContent>;
};
