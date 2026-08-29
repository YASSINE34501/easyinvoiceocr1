/**
 * Shape of the PDF Tools copy, in one locale.
 *
 * Kept out of src/i18n/index.ts deliberately. That dictionary holds the site
 * chrome — navigation, forms, validation — and is already ~1.6k lines; folding
 * eight tool pages plus their FAQs into it would triple it and make every copy
 * change a merge conflict in a file three translators share. This follows the
 * pattern src/content/products uses instead: one file per locale, assembled by
 * an index that will not compile if a locale is missing.
 *
 * Every string here is rendered. Nothing is written for search engines that a
 * reader does not also see, which is what keeps the FAQPage structured data on
 * these pages honest.
 */

import type { PdfErrorCode, PdfToolSlug, ToolCategory } from "@/lib/pdftools/types";

export type PdfFaq = { q: string; a: string };

export type PdfToolCopy = {
  /** Short name: cards, breadcrumbs, the <title>. */
  name: string;
  /** <title>. */
  title: string;
  /** Meta description. */
  description: string;
  /** The single H1. */
  h1: string;
  /** Standfirst under the H1. */
  lede: string;
  /** One line on the tools index card. */
  card: string;
  /** Three steps, describing what the tool actually does. */
  steps: { title: string; body: string }[];
  /** Rendered on the page, so the FAQ schema describes visible content. */
  faqs: PdfFaq[];
  /** What the tool cannot do. Stated rather than discovered mid-task. */
  limits: string[];
};

/**
 * Controls and messages shared by every tool page.
 *
 * The drop zone itself reuses the converter's `conv.*` keys, which are already
 * translated; only what is new to these tools lives here.
 */
export type PdfToolsUi = {
  /** Drop-zone heading. The converter default says "images". */
  dropTitle: string;
  /** Drop-zone button. Same reason. */
  chooseFiles: string;
  run: string;
  running: string;
  reading: string;
  done: string;
  download: string;
  downloadAll: string;
  startOver: string;
  addFiles: string;
  removeFile: string;
  moveUp: string;
  moveDown: string;
  duplicate: string;
  restore: string;
  files: string;
  orderHint: string;
  pageCount: string;
  pagesLabel: string;
  pagesHint: string;
  pagesAll: string;
  selectedPages: string;
  angle: string;
  angle90: string;
  angle180: string;
  angle270: string;
  splitMode: string;
  splitEach: string;
  splitFixed: string;
  groupSize: string;
  position: string;
  positionBottomCenter: string;
  positionBottomLeft: string;
  positionBottomRight: string;
  positionTopCenter: string;
  positionTopLeft: string;
  positionTopRight: string;
  startAt: string;
  fontSize: string;
  numberFormat: string;
  numberFormatHint: string;
  margins: string;
  marginsHint: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  page: string;
  outputFiles: string;
  outputSize: string;
  pagesIn: string;
  pagesOut: string;
  privacyTitle: string;
  privacyBody: string;
  errorTitle: string;
  howItWorks: string;
  /** Shown once a run succeeds: the one step worth offering next. */
  nextTitle: string;
  nextCta: string;
  /** Crawlable pointer from the PDF tools to the PDF invoice extractor. */
  pdfInvoiceNote: string;
  pdfInvoiceCta: string;
  limitsTitle: string;
  faqTitle: string;
  otherTools: string;
  allTools: string;
};

export type PdfToolsIndexCopy = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lede: string;
  categories: Record<ToolCategory, { title: string; lede: string }>;
  privacy: { title: string; body: string[] };
  faqs: PdfFaq[];
};

export type PdfToolsContent = {
  index: PdfToolsIndexCopy;
  ui: PdfToolsUi;
  /** One sentence per failure the operations can raise. Exhaustive by type. */
  errors: Record<PdfErrorCode, string>;
  /** One entry per tool in the registry. Exhaustive by type. */
  tools: Record<PdfToolSlug, PdfToolCopy>;
  /** The landing page. */
  landing: PdfToolsLanding;
};

/* ------------------------------------------------------------------ */
/* The tools landing page                                              */
/* ------------------------------------------------------------------ */

/**
 * How the tools are grouped on the index.
 *
 * Wider than the lib registry's ToolCategory, because the index also surfaces
 * the existing commercial products — a visitor looking for "PDF to Word" does
 * not care which registry it came from.
 *
 * Deliberately absent: compression, security and workflow groups. There is no
 * compressor, no encryption and no workflow engine in this application, and a
 * filter chip that reveals nothing is worse than no chip at all.
 */
export type SurfaceCategory = "organise" | "edit" | "convert" | "intelligence";

/**
 * The badge on a card. Every value is derived from something real:
 * `new` from the Phase 1 tool set, `account` from a product's minPlan
 * requiring a signed-in account and quota, `soon` from the availability
 * registry. There is no "premium" badge because no shipping product is
 * premium-gated — every working product sits on the free allowance.
 */
export type SurfaceBadge = "new" | "account" | "soon";

export type PdfToolsLanding = {
  /** The greeting. Warm, not a slogan. */
  greeting: string;
  /** Same, once we know who is signed in. {name} is the display name. */
  greetingNamed: string;
  /** What this section is, in two sentences. */
  lede: string;
  /** Figures on the hero. Every one must be checkable against the code. */
  stats: { value: string; label: string }[];
  /** Accessible name for the category filter. */
  filterLabel: string;
  categoryAll: string;
  categories: Record<SurfaceCategory, string>;
  badges: Record<SurfaceBadge, string>;
  /** "{count} tools", under the filter. */
  count: string;
  /** Shown when a filter matches nothing. */
  empty: string;
  /** "Work your way" — only things this application actually does. */
  waysTitle: string;
  waysLede: string;
  ways: { title: string; body: string }[];
  featuresTitle: string;
  featuresLede: string;
  features: { title: string; body: string }[];
  trustTitle: string;
  trust: string[];
  trustLink: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaNote: string;
};
