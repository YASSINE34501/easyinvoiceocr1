import { useMemo } from "react";
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

/**
 * The translator for the current locale.
 *
 * Memoised on the locale, so the same function comes back on every render until
 * the language actually changes. It used to build a new closure each time,
 * which is invisible almost everywhere — a translated string is a translated
 * string — and quietly poisonous in the one place it matters: a dependency
 * array. Any effect listing `t`, or a `useCallback` derived from it, re-ran on
 * every single render. For an effect that owns a third-party widget and tears
 * it down on cleanup, that means the widget is destroyed and rebuilt whenever
 * the component renders for any reason at all.
 */
export function useT() {
  const locale = useLocale();
  return useMemo(
    () => (key: MessageKey, params?: MessageParams) => translate(locale, key, params),
    [locale],
  );
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
