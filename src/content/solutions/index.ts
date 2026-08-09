/**
 * Solution page registry.
 *
 * Replaces the single-locale src/content/solutions.ts, which was the cause of
 * the /ar/solutions/accountants regression: Arabic chrome, correct RTL, English
 * body. A missing locale is now a type error rather than a silent fallback.
 */

import { path } from "@/config/routing";
import type { Locale } from "@/i18n";
import type { Solution, SolutionContent } from "./types";
import { solutionsEn } from "./en";
import { solutionsFr } from "./fr";
import { solutionsAr } from "./ar";

export type { Solution, SolutionContent, SolutionBlock, SolutionLink } from "./types";

/** Order shown on the solutions index and in navigation. */
export const SOLUTION_SLUGS = [
  "accountants",
  "small-businesses",
  "freelancers",
  "developers",
] as const;

function contentFor(slug: string): Record<Locale, SolutionContent> {
  const en = solutionsEn[slug];
  const fr = solutionsFr[slug];
  const ar = solutionsAr[slug];
  if (!en || !fr || !ar) {
    throw new Error(`Solution "${slug}" is missing content in one or more locales`);
  }
  return { en, fr, ar };
}

export const solutions: Solution[] = SOLUTION_SLUGS.map((slug) => ({
  slug,
  route: path(`solutions/${slug}`),
  content: contentFor(slug),
}));

export const solutionBySlug: Record<string, Solution | undefined> = Object.fromEntries(
  solutions.map((solution) => [solution.slug, solution]),
);
