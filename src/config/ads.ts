/**
 * Advertising configuration and route eligibility.
 *
 * Ads are off unless every condition is met: the feature flag is on, a
 * publisher id is configured, the build is not a development build, the route
 * is on the eligible list, the visitor has given advertising consent, and the
 * account is not on a paid plan. Anything less renders nothing (or, in
 * development, a visible placeholder).
 */

import { locales } from "@/i18n";
import { sortedProducts } from "@/config/products";

const env = import.meta.env as Record<string, string | undefined>;

export type AdSlotName =
  | "home_below_hero"
  | "home_mid_content"
  | "product_mid_content"
  | "converter_below_content"
  | "docs_in_article"
  | "help_in_article"
  | "blog_list"
  | "blog_in_article"
  | "resource_in_article";

function slotId(name: AdSlotName): string | null {
  const key = `VITE_ADSENSE_SLOT_${name.toUpperCase()}`;
  const value = env[key];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export const adsConfig = {
  /** Master switch. Stays false until the AdSense account and site are approved. */
  enabled: env["VITE_ADSENSE_ENABLED"] === "true",
  /** Publisher id, e.g. ca-pub-0000000000000000. */
  clientId: env["VITE_ADSENSE_CLIENT_ID"]?.trim() ?? "",
  /**
   * Whether to serve non-personalised ads when advertising consent has not
   * been given. Off by default: without consent, nothing loads at all.
   */
  allowNonPersonalisedWithoutConsent: env["VITE_ADSENSE_NPA_WITHOUT_CONSENT"] === "true",
  isDevelopment: Boolean(import.meta.env.DEV),
  slotId,
};

/** True when a real ad could ever be requested in this build. */
export function adsRuntimeReady(): boolean {
  return adsConfig.enabled && adsConfig.clientId.startsWith("ca-pub-") && !adsConfig.isDevelopment;
}

/** Routes that never carry advertising, whatever else is configured. */
const DENIED_PREFIXES = [
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "verify-email",
  "choose-plan",
  "app",
  "billing",
  "checkout",
  "contact",
  "terms",
  "privacy",
  "cookies",
  "security",
  "admin",
];

/** Public pages with substantial original content. */
const ALLOWED_EXACT = new Set<string>([
  "", // homepage
  "documentation",
  "help",
  "blog",
  "api-reference",
  ...sortedProducts.map((product) => product.slug),
]);

const ALLOWED_PREFIXES = ["blog/", "solutions/", "help/", "documentation/"];

/** Strips the locale segment: "/fr/pdf-to-word" → "pdf-to-word". */
export function slugFromPath(pathname: string): string {
  const parts = pathname.split("?")[0]!.split("#")[0]!.split("/").filter(Boolean);
  if (parts.length > 0 && (locales as readonly string[]).includes(parts[0]!)) parts.shift();
  return parts.join("/");
}

export function isAdEligiblePath(pathname: string): boolean {
  const slug = slugFromPath(pathname);
  const first = slug.split("/")[0] ?? "";

  if (DENIED_PREFIXES.includes(first)) return false;
  if (ALLOWED_EXACT.has(slug)) return true;
  return ALLOWED_PREFIXES.some((prefix) => slug.startsWith(prefix));
}
