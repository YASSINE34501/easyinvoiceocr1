import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppLink, Container } from "./AppLink";
import { ChevronRight } from "lucide-react";
import { path } from "@/config/routing";
import { useLocale, useT } from "@/i18n/useLocale";
import { absoluteUrl } from "@/config/seo";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <nav aria-label={t("nav.breadcrumb")} className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          {/* Locale-preserving: the trail should not drop a visitor onto the
              English site from an Arabic page. */}
          <AppLink href={path("", locale)} className="transition-colors hover:text-navy">
            {t("nav.home")}
          </AppLink>
        </li>
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
            {c.href && i < items.length - 1 ? (
              <AppLink href={c.href} className="transition-colors hover:text-navy">
                {c.label}
              </AppLink>
            ) : (
              <span aria-current="page" className="text-navy">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** JSON-LD BreadcrumbList for a route's head() scripts array. */
export function breadcrumbJsonLd(items: Crumb[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Home", item: absoluteUrl("/") },
      ...items.map((c) => ({ name: c.label, item: c.href ?? undefined })),
    ].map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      ...(entry.item ? { item: absoluteUrl(entry.item) } : {}),
    })),
  });
}

/**
 * The keyboard skip link. Split into its own component because PageLayout
 * itself does not otherwise need the translator hook.
 */
function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
    >
      {t("nav.skip")}
    </a>
  );
}

export function PageLayout({
  children,
  breadcrumbs,
}: {
  children: ReactNode;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background">
      {/* The nav.skip key was already translated in all three dictionaries;
          this element was hard-coding English, so screen-reader users on the
          French and Arabic sites met the one untranslated string on the page.
          focus:start-4 rather than focus:left-4, so the panel appears on the
          correct side in Arabic. */}
      <SkipLink />
      <Header />
      <main id="main" className="flex-1">
        {breadcrumbs && (
          <Container className="pt-6">
            <Breadcrumbs items={breadcrumbs} />
          </Container>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="hero-glow border-b border-border/70">
      <Container className="py-10 sm:py-14">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 max-w-[820px] text-[30px] font-extrabold leading-[1.12] tracking-tight text-navy sm:text-[40px]">
          {title}
        </h1>
        {lede && (
          <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
            {lede}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </Container>
    </section>
  );
}

export function Section({
  title,
  lede,
  id,
  children,
  muted,
}: {
  title?: string;
  lede?: string;
  id?: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={muted ? "border-b border-border/70 bg-surface/50" : "border-b border-border/70"}
    >
      <Container className="py-12 sm:py-14">
        {title && (
          <h2 className="text-[22px] font-bold tracking-tight text-navy sm:text-[26px]">{title}</h2>
        )}
        {lede && (
          <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
            {lede}
          </p>
        )}
        <div className={title || lede ? "mt-7" : ""}>{children}</div>
      </Container>
    </section>
  );
}

export { Container };
