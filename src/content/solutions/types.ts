/**
 * Shape of a solution (audience) page in one locale.
 *
 * Split by locale for the same reason the products were: the single-locale
 * model meant /ar/solutions/accountants rendered Arabic navigation, Arabic
 * chrome and an English body. That is the regression this restructure exists
 * to fix.
 *
 * Everything here is rendered. `faqs` in particular is only present because the
 * page shows them — FAQPage structured data must describe visible content.
 */

export type SolutionLink = { label: string; href: string };

export type SolutionBlock = {
  title: string;
  body: string;
  points?: string[];
};

export type SolutionContent = {
  /** Short audience name, used in breadcrumbs and the solutions index. */
  name: string;
  /** <title>. */
  title: string;
  /** Meta description. */
  description: string;
  /** Label above the H1. */
  eyebrow: string;
  /** The single H1. */
  heading: string;
  /** Standfirst under the H1. */
  lede: string;
  /** The problem, in the reader's own terms. */
  intro: string[];
  /** Feature cards / workflow steps. */
  blocks: SolutionBlock[];
  /** Rendered on the page, so FAQPage matches what a reader sees. */
  faqs: { q: string; a: string }[];
  cta: { label: string; href: string; note: string };
  /** Products this audience actually uses. */
  productLinks: SolutionLink[];
  /** Blog articles genuinely relevant to this audience. */
  blogLinks: SolutionLink[];
  /** Section headings, phrased naturally per language. */
  labels: {
    intro: string;
    blocks: string;
    faqs: string;
    products: string;
    guides: string;
    breadcrumb: string;
  };
  /** Accessible names and non-happy-path copy. */
  a11y: { navLabel: string };
  emptyState: string;
  errorState: string;
};

export type Solution = {
  slug: string;
  route: string;
  content: Record<"en" | "fr" | "ar", SolutionContent>;
};
