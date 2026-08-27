/**
 * Single source of truth for every navigation link in the app.
 * Header, mobile menu, footer and sitemap all read from here, so a link can
 * never point at a route that does not exist without this file changing.
 *
 * Every href is locale-prefixed: /:locale/<slug>. Labels are message keys
 * resolved through the dictionary in src/i18n.
 */

import { type MessageKey } from "@/i18n";
import { navProducts, productLabelKey, type ProductDefinition } from "@/config/products";

export { locales, defaultLocale, localeLabels, type Locale } from "@/i18n";
export { path } from "@/config/routing";

export type NavLink = { labelKey: MessageKey; slug: string; description?: string };
export type NavGroup = { titleKey: MessageKey; items: NavLink[] };

/** Derived from the product registry, so a new product appears here for free. */
export const productLinks: NavLink[] = navProducts.map((product) => ({
  labelKey: productLabelKey(product.slug),
  slug: product.slug,
}));

export const solutionLinks: NavLink[] = [
  { labelKey: "link.accountants", slug: "solutions/accountants" },
  { labelKey: "link.small-businesses", slug: "solutions/small-businesses" },
  { labelKey: "link.freelancers", slug: "solutions/freelancers" },
  { labelKey: "link.developers", slug: "solutions/developers" },
];

export const resourceLinks: NavLink[] = [
  { labelKey: "link.documentation", slug: "documentation" },
  // The free PDF tools index. It sits with the resources rather than with the
  // products: nothing here is sold, and putting it among the eight products
  // would blur what the plans actually pay for.
  { labelKey: "link.pdf-tools", slug: "pdf-tools" },
  { labelKey: "link.api-reference", slug: "api-reference" },
  { labelKey: "link.help", slug: "help" },
  { labelKey: "link.blog", slug: "blog" },
];

export const companyLinks: NavLink[] = [
  { labelKey: "link.about", slug: "about" },
  { labelKey: "link.contact", slug: "contact" },
  { labelKey: "link.security", slug: "security" },
];

export const legalLinks: NavLink[] = [
  { labelKey: "link.terms", slug: "terms" },
  { labelKey: "link.privacy", slug: "privacy" },
  { labelKey: "link.cookies", slug: "cookies" },
];

/** Products that read a document and return data. The specialisation. */
export const invoiceOcrLinks: NavLink[] = navProducts
  .filter((product) => product.kind === "extraction" || product.kind === "api")
  .map((product) => ({ labelKey: productLabelKey(product.slug), slug: product.slug }));

/** Products that turn one file format into another. */
export const converterLinks: NavLink[] = navProducts
  .filter((product) => product.kind === "converter")
  .map((product) => ({ labelKey: productLabelKey(product.slug), slug: product.slug }));

/** A menu column. A title is optional: a single-column menu needs no heading. */
export type NavColumn = { titleKey?: MessageKey; items: NavLink[] };

export type HeaderMenu = { titleKey: MessageKey; columns: NavColumn[] };

/**
 * Header dropdowns, in display order.
 *
 * The PDF tools menu is not here — it is built from the tools registry by
 * components/pdftools/PdfMegaMenu, so a tool added there appears in the header
 * without an edit to this file. The header renders it between the first and
 * second entries below.
 */
export const headerMenus: HeaderMenu[] = [
  { titleKey: "nav.invoiceOcr", columns: [{ items: invoiceOcrLinks }] },
  { titleKey: "nav.converters", columns: [{ items: converterLinks }] },
  {
    titleKey: "nav.resources",
    columns: [
      { titleKey: "nav.learn", items: resourceLinks },
      { titleKey: "nav.solutions", items: solutionLinks },
      { titleKey: "nav.company", items: companyLinks },
    ],
  },
];

/**
 * Footer columns, in display order.
 *
 * A column may hold more than one titled group. The footer is the site-wide
 * internal link surface, so a link removed here is removed from every page —
 * nothing is dropped, only regrouped to match the header.
 *
 * Three columns here, not four: the footer renders the PDF tools column
 * itself, between the first and second of these, because those names come
 * from the tools content rather than the message dictionary. With the brand
 * column that keeps the grid at five.
 *
 * The lists are derived rather than listed out, so a new product joins the
 * right column with no edit here.
 */
export type FooterColumn = { groups: NavGroup[] };

export const footerColumns: FooterColumn[] = [
  // The OCR API sits with the extraction products rather than with the
  // converters: it is an OCR endpoint, not a file conversion, and grouping it
  // here matches the header.
  { groups: [{ titleKey: "nav.invoiceOcr", items: invoiceOcrLinks }] },
  {
    groups: [
      { titleKey: "nav.converters", items: converterLinks },
      { titleKey: "nav.resources", items: resourceLinks },
    ],
  },
  {
    groups: [
      { titleKey: "nav.solutions", items: solutionLinks },
      { titleKey: "nav.company", items: companyLinks },
      { titleKey: "nav.legal", items: legalLinks },
    ],
  },
];

export const authSlugs = {
  login: "login",
  signup: "signup",
  forgot: "forgot-password",
  reset: "reset-password",
  verify: "verify-email",
  app: "app",
  settings: "app/settings",
  choosePlan: "choose-plan",
  billing: "app/billing",
  admin: "app/admin",
} as const;

/** Every public slug the site links to — used by the broken-link scan test. */
export const allPublicSlugs: string[] = [
  ...productLinks,
  ...solutionLinks,
  ...resourceLinks,
  ...companyLinks,
  ...legalLinks,
].map((l) => l.slug);
