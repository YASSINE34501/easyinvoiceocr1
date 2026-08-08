/**
 * Locale-prefixed URL builder.
 *
 * Lives in its own module so both the navigation config and the product
 * registry can use it without importing each other (they reference each other
 * in the other direction).
 */

import { defaultLocale, type Locale } from "@/i18n";

export function path(slug: string, locale: Locale = defaultLocale): string {
  const clean = slug.replace(/^\/+/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}
