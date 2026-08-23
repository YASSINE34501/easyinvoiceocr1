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

/** Header dropdowns, in display order. */
export const headerMenus: NavGroup[] = [
  { titleKey: "nav.product", items: productLinks },
  { titleKey: "nav.solutions", items: solutionLinks },
  { titleKey: "nav.resources", items: resourceLinks },
  { titleKey: "nav.company", items: companyLinks },
];

/**
 * Footer columns, in display order.
 *
 * A column may hold more than one titled group. The footer used to give every
 * header menu a column of its own, which put eight products beside a column of
 * three and left the row visibly lopsided. Splitting the products by the kind
 * the registry already records, and pairing the shorter menus, evens the
 * columns without dropping a single link — the footer is the site-wide internal
 * link surface, so a link removed here is removed from every page.
 *
 * The product split is derived rather than listed: a new extraction tool joins
 * the first column and a new converter the second, with no edit here.
 */
export type FooterColumn = { groups: NavGroup[] };

const productsOfKind = (kind: ProductDefinition["kind"]): NavLink[] =>
  navProducts
    .filter((product) => product.kind === kind)
    .map((product) => ({ labelKey: productLabelKey(product.slug), slug: product.slug }));

export const footerColumns: FooterColumn[] = [
  { groups: [{ titleKey: "nav.extract", items: productsOfKind("extraction") }] },
  {
    groups: [
      // The API sits with the converters rather than alone: one link is not a
      // column, and it is the other thing the site turns a document into.
      {
        titleKey: "nav.convert",
        items: [...productsOfKind("converter"), ...productsOfKind("api")],
      },
    ],
  },
  {
    groups: [
      { titleKey: "nav.solutions", items: solutionLinks },
      { titleKey: "nav.resources", items: resourceLinks },
    ],
  },
  {
    groups: [
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
