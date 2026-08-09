/**
 * Documentation and Help Center content, one locale at a time.
 *
 * The previous single-locale file meant /fr/documentation and /ar/help served
 * English bodies inside a translated shell — the same defect the blog, the
 * products and the solutions had.
 *
 * Several claims in the English source were also wrong and are corrected here
 * rather than translated. They are listed in en.ts.
 */

export type DocSection = {
  id: string;
  title: string;
  body: string[];
  list?: string[];
};

export type DocChapter = {
  slug: string;
  title: string;
  summary: string;
  sections: DocSection[];
};

export type HelpArticle = {
  slug: string;
  /** Must be one of the locale's `helpCategories`. */
  category: string;
  question: string;
  answer: string[];
};

/** Chrome around the two pages: headings, controls and non-happy-path copy. */
export type ResourcesUi = {
  docTitle: string;
  docDescription: string;
  docHeading: string;
  docLede: string;
  docEyebrow: string;
  docBreadcrumb: string;
  onThisPage: string;

  helpTitle: string;
  helpDescription: string;
  helpHeading: string;
  helpLede: string;
  helpEyebrow: string;
  helpBreadcrumb: string;
  searchLabel: string;
  searchPlaceholder: string;
  allCategories: string;
  noResults: string;
  noResultsHint: string;
  errorState: string;

  relatedTitle: string;
  relatedLinks: { label: string; href: string }[];
  ctaLabel: string;
  ctaHref: string;
  ctaNote: string;
};

export type ResourcesContent = {
  docChapters: DocChapter[];
  helpCategories: string[];
  helpArticles: HelpArticle[];
  ui: ResourcesUi;
};
