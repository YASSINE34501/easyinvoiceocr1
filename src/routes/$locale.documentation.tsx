import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { AdSlot } from "@/components/site/AdSlot";
import { AppLink } from "@/components/site/AppLink";
import { Input } from "@/components/ui/input";
import { docChapters } from "@/content/resources";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

const title = "Documentation — EasyInvoiceOCR";
const description =
  "How to upload invoices and receipts, review confidence scores, export to Excel, CSV or JSON, and understand how your documents are stored.";

export const Route = createFileRoute("/$locale/documentation")({
  component: DocumentationPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: `/${locale}/documentation` },
        { rel: "alternate", hrefLang: "en", href: "/en/documentation" },
        { rel: "alternate", hrefLang: "fr", href: "/fr/documentation" },
        { rel: "alternate", hrefLang: "ar", href: "/ar/documentation" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: "Documentation" }]),
        },
      ],
    };
  },
});

function DocumentationPage() {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const chapters = needle
    ? docChapters
        .map((chapter) => ({
          ...chapter,
          sections: chapter.sections.filter((s) =>
            (s.title + " " + s.body.join(" ") + " " + (s.list ?? []).join(" "))
              .toLowerCase()
              .includes(needle),
          ),
        }))
        .filter((c) => c.sections.length > 0 || c.title.toLowerCase().includes(needle))
    : docChapters;

  return (
    <PageLayout breadcrumbs={[{ label: t("link.documentation") }]}>
      <PageHero
        eyebrow={t("nav.resources")}
        title={t("link.documentation")}
        lede="Everything you need to move from a stack of invoices to a clean spreadsheet: supported formats, accuracy handling, exports and data retention."
      >
        <div className="relative max-w-[420px]">
          <Search
            className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("docs.searchPlaceholder")}
            aria-label={t("docs.searchPlaceholder")}
            className="h-12 ps-10"
          />
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label={t("docs.menu")} className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("docs.sections")}
            </h2>
            <ul className="mt-3 space-y-2">
              {docChapters.map((c) => (
                <li key={c.slug}>
                  <a
                    href={`#${c.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-navy"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              <AppLink
                href={path("api-reference", locale)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("link.api-reference")}
              </AppLink>
            </p>
          </nav>

          <div className="min-w-0 space-y-12">
            {chapters.length === 0 && (
              <div>
                <p className="text-sm font-medium text-navy">{t("state.noResults")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("state.noResultsHint")}</p>
              </div>
            )}
            {chapters.map((chapter) => (
              <article key={chapter.slug} id={chapter.slug} className="scroll-mt-24">
                <h2 className="text-[22px] font-bold tracking-tight text-navy">{chapter.title}</h2>
                <p className="mt-2 text-[15px] text-muted-foreground">{chapter.summary}</p>
                <div className="mt-6 space-y-8">
                  {chapter.sections.map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-24">
                      <h3 className="text-base font-semibold text-navy">{section.title}</h3>
                      {section.body.map((para) => (
                        <p
                          key={para.slice(0, 24)}
                          className="mt-3 text-[15px] leading-relaxed text-muted-foreground"
                        >
                          {para}
                        </p>
                      ))}
                      {section.list && (
                        <ul className="mt-3 space-y-2">
                          {section.list.map((item) => (
                            <li key={item} className="flex gap-2 text-[15px] text-muted-foreground">
                              <span
                                aria-hidden="true"
                                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      {/* Between content sections, well away from any product control. */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <AdSlot name="docs_in_article" variant="in-article" />
      </div>
    </PageLayout>
  );
}
