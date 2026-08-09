import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, LifeBuoy } from "lucide-react";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { AdSlot } from "@/components/site/AdSlot";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { helpArticles, helpCategories } from "@/content/resources";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

const title = "Help Center — EasyInvoiceOCR";
const description =
  "Answers to common questions about uploads, file formats, extraction accuracy, exports, account management and data privacy.";

export const Route = createFileRoute("/$locale/help")({
  component: HelpPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    return {
      meta: [
        robotsMeta("help"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks("help", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: helpArticles.map((a) => ({
              "@type": "Question",
              name: a.question,
              acceptedAnswer: { "@type": "Answer", text: a.answer.join(" ") },
            })),
          }),
        },
        { type: "application/ld+json", children: breadcrumbJsonLd([{ label: "Help Center" }]) },
      ],
    };
  },
});

function HelpPage() {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return helpArticles.filter((a) => {
      const matchesCategory = !category || a.category === category;
      const matchesQuery =
        !needle || (a.question + " " + a.answer.join(" ")).toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <PageLayout breadcrumbs={[{ label: t("link.help") }]}>
      <PageHero
        eyebrow={t("nav.resources")}
        title={t("link.help")}
        lede="Search the answers below, or contact us if your question isn't covered."
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
            placeholder={t("help.searchPlaceholder")}
            aria-label={t("help.searchPlaceholder")}
            className="h-12 ps-10"
          />
        </div>
      </PageHero>

      <Section title={t("help.categories")}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
              category === null
                ? "border-primary bg-primary/10 text-navy"
                : "border-border text-muted-foreground hover:text-navy"
            }`}
          >
            {t("blog.all")}
          </button>
          {helpCategories.map((c) => {
            const count = helpArticles.filter((a) => a.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c === category ? null : c)}
                aria-pressed={category === c}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                  category === c
                    ? "border-primary bg-primary/10 text-navy"
                    : "border-border text-muted-foreground hover:text-navy"
                }`}
              >
                {c} · {count}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-navy">{t("state.noResults")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("state.noResultsHint")}</p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="rounded-xl border border-border bg-card px-4"
            >
              {results.map((a) => (
                <AccordionItem key={a.slug} value={a.slug}>
                  <AccordionTrigger className="text-start text-sm font-semibold text-navy">
                    {a.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {a.answer.map((p) => (
                      <p
                        key={p.slice(0, 24)}
                        className="mb-2 text-[15px] leading-relaxed text-muted-foreground"
                      >
                        {p}
                      </p>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </Section>

      {/* Between content sections, well away from any product control. */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <AdSlot name="help_in_article" variant="in-article" />
      </div>

      <Section muted>
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-navy">{t("help.stillStuck")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("help.stillStuckBody")}</p>
            </div>
          </div>
          <Button asChild className="h-11 rounded-lg font-semibold">
            <AppLink href={path("contact", locale)}>{t("cta.contactSupport")}</AppLink>
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
}
