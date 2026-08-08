import { useRouterState } from "@tanstack/react-router";
import {
  asLocale,
  translate,
  localeDir,
  type Locale,
  type MessageKey,
  type MessageParams,
} from "./index";
import { path } from "@/config/nav";

/** Current locale, derived from the first path segment (defaults to en). */
export function useLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return asLocale(pathname.split("/")[1]);
}

export function useT() {
  const locale = useLocale();
  return (key: MessageKey, params?: MessageParams) => translate(locale, key, params);
}

export type Translator = ReturnType<typeof useT>;

/** Builds a locale-preserving href from a slug. */
export function useLocalePath() {
  const locale = useLocale();
  return (slug: string) => path(slug, locale);
}

export function useDir(): "ltr" | "rtl" {
  return localeDir[useLocale()];
}

/** Swaps the locale segment of the current path, preserving the rest. */
export function swapLocale(pathname: string, next: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${next}`;
  parts[0] = next;
  return `/${parts.join("/")}`;
}
