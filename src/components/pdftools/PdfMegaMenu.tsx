/**
 * The PDF tools entry in the site navigation.
 *
 * Added alongside the existing menus rather than replacing any of them: the
 * Product, Solutions, Resources and Company dropdowns still come from
 * config/nav and are untouched.
 *
 * Built on the same Radix DropdownMenu the other menus use, which means it
 * opens on click, Enter and Space, is arrow-key navigable, closes on Escape
 * and works under touch. Hover is not the only way in — a hover-only mega menu
 * is unreachable by keyboard and unusable on a phone.
 *
 * The columns are derived from the shared surface list, so a tool added to
 * either registry appears here without an edit.
 */

import { ChevronDown } from "lucide-react";
import { AppLink, useIsActive } from "@/components/site/AppLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/i18n/useLocale";
import { pdfToolsCopy } from "@/content/pdftools";
import { pdfToolsIndexPath } from "@/lib/pdftools/registry";
import { SURFACE_CATEGORIES, surfaceEntries, type SurfaceEntry } from "./surface";
import type { SurfaceCategory } from "@/content/pdftools/types";
import { cn } from "@/lib/utils";

/** The grid, grouped into the menu's columns. */
function usePdfMenuColumns(): {
  category: SurfaceCategory;
  title: string;
  items: SurfaceEntry[];
}[] {
  const locale = useLocale();
  const landing = pdfToolsCopy(locale).landing;
  const entries = surfaceEntries(locale);
  return SURFACE_CATEGORIES.map((category) => ({
    category,
    title: landing.categories[category],
    items: entries.filter((entry) => entry.category === category),
  })).filter((column) => column.items.length > 0);
}

export function PdfMegaMenu() {
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const columns = usePdfMenuColumns();
  const isActive = useIsActive();
  const indexHref = pdfToolsIndexPath(locale);
  const sectionActive = columns.some((c) => c.items.some((i) => isActive(i.href)));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-h-11 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium text-navy/80 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-navy",
          (sectionActive || isActive(indexHref)) && "text-navy",
        )}
      >
        {copy.index.eyebrow}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        // Wide, but never wider than the viewport on a small laptop.
        className="w-[min(92vw,860px)] rounded-xl p-5"
      >
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.category}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="mt-2.5 space-y-0.5">
                {column.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <AppLink
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-navy/85 transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive(item.href) && "font-semibold text-primary",
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="min-w-0 truncate">{item.name}</span>
                        {!item.available && (
                          <span className="ms-auto shrink-0 text-[10px] text-muted-foreground">
                            {copy.landing.badges.soon}
                          </span>
                        )}
                      </AppLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <AppLink
            href={indexHref}
            className="inline-block rounded-md px-2 py-1.5 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copy.ui.allTools}
          </AppLink>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same content for the mobile drawer, as a plain grouped list. */
export function PdfMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const columns = usePdfMenuColumns();

  return (
    <div className="space-y-4 pb-1">
      {columns.map((column) => (
        <div key={column.category}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {column.title}
          </p>
          <ul className="mt-1">
            {column.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <AppLink
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 py-2.5 text-sm text-muted-foreground"
                  >
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item.name}</span>
                    {!item.available && (
                      <span className="ms-auto shrink-0 text-[10px]">
                        {copy.landing.badges.soon}
                      </span>
                    )}
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <AppLink
        href={pdfToolsIndexPath(locale)}
        onClick={onNavigate}
        className="block py-2 text-sm font-semibold text-primary"
      >
        {copy.ui.allTools}
      </AppLink>
    </div>
  );
}
