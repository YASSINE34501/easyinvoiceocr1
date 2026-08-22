import { createFileRoute, redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { defaultLocale, isLocale } from "@/i18n";
import { seoLinks } from "@/config/seo";

/**
 * "/" carries no locale, so it resolves the visitor's preferred language and
 * redirects to the matching locale root.
 *
 * The two runtimes need different sources, and getting this wrong is silent:
 * `navigator` is defined on both server runtimes we deploy to (Node on Vercel
 * exposes navigator.language since v21, workerd exposes it too) but it reflects
 * the *server's* locale, not the visitor's. Reading it during SSR sent every
 * visitor to whichever language the machine happened to run in. On the server
 * the only honest source is the Accept-Language header; in the browser it is
 * navigator.languages.
 *
 * Locale-prefixed URLs never reach this route, so a visitor who picks a
 * language keeps it — this only ever resolves the bare "/".
 */
function pickLocale(header: string | null | undefined): string {
  const candidates = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.split(";");
      // Accept-Language is usually already in preference order, but q-values are
      // allowed to reorder it ("en;q=0.5,fr;q=0.9" prefers fr). Honour them.
      const q = params
        .map((p) => /^\s*q=([0-9.]+)\s*$/.exec(p))
        .find((m): m is RegExpExecArray => m !== null);
      return {
        code: (tag ?? "").trim().slice(0, 2).toLowerCase(),
        q: q?.[1] ? Number.parseFloat(q[1]) : 1,
      };
    })
    .filter((c) => c.code.length > 0 && Number.isFinite(c.q))
    .sort((a, b) => b.q - a.q);
  return candidates.find((c) => isLocale(c.code))?.code ?? defaultLocale;
}

/**
 * The two runtimes carry the visitor's languages in different places, and
 * createIsomorphicFn is what keeps the server branch out of the browser bundle
 * — a plain dynamic import of the server entry is refused by import-protection.
 */
const preferredLanguages = createIsomorphicFn()
  .client(() => (navigator.languages ?? [navigator.language]).join(","))
  .server(() => getRequest().headers.get("accept-language"));

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/$locale",
      params: { locale: pickLocale(preferredLanguages()) },
      search: location.search as Record<string, unknown>,
      replace: true,
    });
  },
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
    links: seoLinks("", defaultLocale),
  }),
});
