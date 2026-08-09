import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultLocale, isLocale, locales } from "@/i18n";
import { seoLinks } from "@/config/seo";

/**
 * "/" carries no locale, so it resolves the visitor's preferred language
 * (Accept-Language on the server, navigator.languages in the browser) and
 * redirects to the matching locale root.
 */
function pickLocale(header: string | null | undefined): string {
  const candidates = (header ?? "")
    .split(",")
    .map((part) => part.split(";")[0]!.trim().slice(0, 2).toLowerCase())
    .filter(Boolean);
  return candidates.find((c) => isLocale(c)) ?? defaultLocale;
}

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    let preferred: string = defaultLocale;
    if (typeof navigator !== "undefined") {
      preferred = pickLocale((navigator.languages ?? [navigator.language]).join(","));
    }
    throw redirect({
      to: "/$locale",
      params: { locale: preferred },
      search: location.search as Record<string, unknown>,
      replace: true,
    });
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
    links: seoLinks("", defaultLocale),
  }),
});
