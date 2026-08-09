import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { AdSlot } from "@/components/site/AdSlot";
import { AppLink } from "@/components/site/AppLink";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { blogCategories, blogPosts } from "@/content/blog";
import { path } from "@/config/nav";
import { asLocale, formatDate, type Locale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

/** Index metadata, written per locale rather than translated from English. */
const indexCopy = {
  en: {
    title: "Blog — invoice OCR, receipts and document workflows — EasyInvoiceOCR",
    description:
      "Practical writing on invoice OCR accuracy, monthly receipt routines, multilingual extraction, document privacy and evaluating an OCR API.",
    lede: "Notes from building a document extraction product: what accuracy really measures, how to run a monthly receipt routine, and what to check before trusting any OCR vendor.",
  },
  fr: {
    title: "Blog — OCR de factures, reçus et flux documentaires — EasyInvoiceOCR",
    description:
      "Articles pratiques sur la précision de l'OCR de factures, la gestion mensuelle des reçus, l'extraction multilingue, la confidentialité des documents et le choix d'une API d'OCR.",
    lede: "Notes prises en construisant un outil d'extraction documentaire : ce que mesure vraiment la précision, comment tenir une routine mensuelle de reçus, et ce qu'il faut vérifier avant de faire confiance à un éditeur d'OCR.",
  },
  ar: {
    title: "المدونة — استخراج بيانات الفواتير والإيصالات وسير العمل المستندي — EasyInvoiceOCR",
    description:
      "مقالات عملية عن دقة استخراج بيانات الفواتير، والروتين الشهري للإيصالات، والاستخراج متعدد اللغات، وخصوصية المستندات، وتقييم واجهات OCR البرمجية.",
    lede: "ملاحظات من بناء أداة لاستخراج بيانات المستندات: ما الذي تقيسه الدقة فعليًا، وكيف تلتزم بروتين شهري للإيصالات، وما ينبغي التحقق منه قبل الوثوق بأي مزوّد OCR.",
  },
} as const;

export const Route = createFileRoute("/$locale/blog/")({
  component: BlogIndex,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const copy = indexCopy[locale];
    return {
      meta: [
        robotsMeta("blog"),
        { title: copy.title },
        { name: "description", content: copy.description },
        { property: "og:title", content: copy.title },
        { property: "og:description", content: copy.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks("blog", locale),
      scripts: [{ type: "application/ld+json", children: breadcrumbJsonLd([{ label: "Blog" }]) }],
    };
  },
});

function BlogIndex() {
  const t = useT();
  const locale = useLocale() as Locale;
  const copy = indexCopy[locale];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const posts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return blogPosts
      .filter((post) => {
        const c = post.content[locale];
        // Search and filter run against the locale the reader is in, so an
        // Arabic query matches Arabic titles rather than the English source.
        return (
          (!category || c.category === category) &&
          (!needle || `${c.heading} ${c.description}`.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [query, category, locale]);

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <PageLayout breadcrumbs={[{ label: t("link.blog") }]}>
      <PageHero eyebrow={t("nav.resources")} title={t("link.blog")} lede={copy.lede}>
        <div className="relative max-w-[420px]">
          <Search
            className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("blog.searchPlaceholder")}
            aria-label={t("blog.searchPlaceholder")}
            className="h-12 ps-10"
          />
        </div>
      </PageHero>

      <Section>
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
          {blogCategories(locale).map((c) => (
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
              {c}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium text-navy">{t("state.noResults")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("state.noResultsHint")}</p>
          </div>
        ) : (
          <>
            {featured && (
              <AppLink
                href={`${path("blog", locale)}/${featured.slug}`}
                className="mt-8 block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full">{t("blog.featured")}</Badge>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {featured.content[locale].category}
                  </span>
                </div>
                <h2 className="mt-4 text-[24px] font-bold leading-snug tracking-tight text-navy">
                  {featured.content[locale].heading}
                </h2>
                <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-muted-foreground">
                  {featured.content[locale].description}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {formatDate(featured.date, locale)} · {featured.readingMinutes[locale]}{" "}
                  {t("blog.readingTime")}
                </p>
              </AppLink>
            )}

            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <li key={post.slug}>
                  <AppLink
                    href={`${path("blog", locale)}/${post.slug}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">
                      {post.content[locale].category}
                    </span>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-navy">
                      {post.content[locale].heading}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {post.content[locale].description}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {formatDate(post.date, locale)} · {post.readingMinutes[locale]}{" "}
                      {t("blog.readingTime")}
                    </p>
                  </AppLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      {/* Between content sections, well away from any product control. */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <AdSlot name="blog_list" variant="banner" />
      </div>
    </PageLayout>
  );
}
