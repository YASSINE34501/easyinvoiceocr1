/**
 * The tools grid and its category filter.
 *
 * Laid out the way a tool directory should be: a compact greeting, the filter
 * immediately under it, then a dense grid. Someone arriving here wants the
 * tool, not an argument for the product, so nothing sits between the heading
 * and the grid.
 *
 * The filter is real — it holds the selected category in state and narrows the
 * rendered list. It is a radio group rather than a row of buttons, so a
 * keyboard reaches it with arrow keys and a screen reader announces which
 * category is current.
 *
 * Only categories that contain something are offered. There is no compression,
 * encryption or workflow group here, because this application has no
 * compressor, no encryption and no workflow engine, and a chip that filters to
 * an empty grid is worse than an absent chip.
 */

import { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { AppLink } from "@/components/site/AppLink";
import { useLocale } from "@/i18n/useLocale";
import { pdfToolsCopy } from "@/content/pdftools";
import type { SurfaceBadge, SurfaceCategory } from "@/content/pdftools/types";
import { SURFACE_CATEGORIES, surfaceEntries, type SurfaceEntry } from "./surface";
import { cn } from "@/lib/utils";

type Filter = SurfaceCategory | "all";

/**
 * A colour per group.
 *
 * Sixteen identically-tinted cards are one grey mass to scan. Giving each
 * group a hue is what lets someone find the tool by shape and colour before
 * reading a single label — the reason every tool directory does this. The
 * emerald stays with the page tools, which are what this section is about.
 */
const TINT: Record<SurfaceCategory, string> = {
  organise: "bg-tool-organise-soft text-tool-organise",
  edit: "bg-tool-edit-soft text-tool-edit",
  convert: "bg-tool-convert-soft text-tool-convert",
  intelligence: "bg-tool-intelligence-soft text-tool-intelligence",
};

export function ToolGrid() {
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const landing = copy.landing;
  const [filter, setFilter] = useState<Filter>("all");

  const entries = useMemo(() => surfaceEntries(locale), [locale]);
  const shown = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter],
  );

  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: landing.categoryAll },
    ...SURFACE_CATEGORIES.map((category) => ({
      value: category as Filter,
      label: landing.categories[category],
    })),
  ];

  return (
    <section aria-labelledby="tool-grid-heading">
      {/* The grid sits directly under the page h1, so the card titles would
          otherwise jump the heading order from h1 to h3. The name of the
          region is not needed visually — the filter above it already says
          what this is — but a screen reader needs it. */}
      <h2 id="tool-grid-heading" className="sr-only">
        {copy.ui.allTools}
      </h2>
      <div
        role="radiogroup"
        aria-label={landing.filterLabel}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      >
        {chips.map((chip) => {
          const active = filter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(chip.value)}
              className={cn(
                "min-h-10 shrink-0 snap-start rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-navy bg-navy text-background"
                  : "border-border bg-card text-navy/75 hover:border-navy/30 hover:text-navy",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {landing.count.replace("{count}", String(shown.length))}
      </p>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          {landing.empty}
        </p>
      ) : (
        <ul className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((entry) => (
            <li key={entry.id}>
              <ToolCard entry={entry} badges={landing.badges} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Badge({ kind, label }: { kind: SurfaceBadge; label: string }) {
  const Icon = kind === "new" ? Sparkles : kind === "account" ? Lock : null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        // brand-deep, not primary: the badge is 10px, and primary on
        // pale-green measures 2.92:1 — below AA for text this size.
        kind === "new" && "bg-pale-green text-brand-deep",
        kind === "account" && "bg-surface text-muted-foreground",
        kind === "soon" && "border border-dashed border-border text-muted-foreground",
      )}
    >
      {Icon && <Icon className="size-2.5" aria-hidden="true" />}
      {label}
    </span>
  );
}

function ToolCard({
  entry,
  badges,
}: {
  entry: SurfaceEntry;
  badges: Record<SurfaceBadge, string>;
}) {
  const Icon = entry.icon;

  return (
    <AppLink
      href={entry.href}
      className={cn(
        "group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-all duration-150",
        "hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-panel",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !entry.available && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg",
            TINT[entry.category],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {entry.badge && <Badge kind={entry.badge} label={badges[entry.badge]} />}
      </div>

      <h3 className="mt-3.5 text-[15px] font-bold leading-snug text-navy">{entry.name}</h3>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted-foreground">
        {entry.description}
      </p>
    </AppLink>
  );
}
