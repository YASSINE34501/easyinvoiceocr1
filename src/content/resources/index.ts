/**
 * Documentation and Help Center registry.
 *
 * Replaces the single-locale src/content/resources.ts. A missing locale is a
 * type error rather than a page that silently falls back to English.
 */

import type { Locale } from "@/i18n";
import type { DocChapter, HelpArticle, ResourcesContent, ResourcesUi } from "./types";
import { resourcesEn } from "./en";
import { resourcesFr } from "./fr";
import { resourcesAr } from "./ar";

export type { DocChapter, DocSection, HelpArticle, ResourcesContent, ResourcesUi } from "./types";

export const resources: Record<Locale, ResourcesContent> = {
  en: resourcesEn,
  fr: resourcesFr,
  ar: resourcesAr,
};

/** Chapter slugs, in reading order. Locale-independent, so URLs never move. */
export const docSlugs: string[] = resourcesEn.docChapters.map((chapter) => chapter.slug);

/** Help article slugs, locale-independent for the same reason. */
export const helpSlugs: string[] = resourcesEn.helpArticles.map((article) => article.slug);

export function docChaptersFor(locale: Locale): DocChapter[] {
  return resources[locale].docChapters;
}

export function helpArticlesFor(locale: Locale): HelpArticle[] {
  return resources[locale].helpArticles;
}

export function helpCategoriesFor(locale: Locale): string[] {
  return resources[locale].helpCategories;
}

export function resourcesUi(locale: Locale): ResourcesUi {
  return resources[locale].ui;
}
