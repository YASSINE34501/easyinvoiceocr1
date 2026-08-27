/**
 * /:locale/pdf/:tool — one PDF tool.
 *
 * The runner sits directly under the heading, because a visitor arriving from a
 * search for "merge pdf" wants the control, not an introduction. The
 * explanatory content, the limits and the FAQ follow it.
 *
 * An unknown slug is a 404 rather than a redirect to the index: a wrong URL
 * should say so, not quietly land somewhere else and look like it worked.
 */

import { createFileRoute, notFound } from "@tanstack/react-router";
import { Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppLink } from "@/components/site/AppLink";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { ToolRunner } from "@/components/pdftools/ToolRunner";
import {
  PDF_TOOLS,
  isPdfToolSlug,
  pdfTool,
  pdfToolPath,
  pdfToolsIndexPath,
} from "@/lib/pdftools/registry";
import { pdfToolsCopy } from "@/content/pdftools";
import type { PdfToolSlug } from "@/lib/pdftools/types";
import { asLocale, type Locale } from "@/i18n";
import { useLocale } from "@/i18n/useLocale";
import { OG_LOCALE, SITE_NAME, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/pdf/$tool")({
  loader: ({ params }): { tool: PdfToolSlug } => {
    if (!isPdfToolSlug(params.tool)) throw notFound();
    return { tool: params.tool };
  },
  component: PdfToolPage,
  head: ({ params }) =>
    isPdfToolSlug(params.tool)
      ? head(params.tool, asLocale(params.locale))
      : {
          meta: [
            { title: `Tool not found — ${SITE_NAME}` },
            { name: "robots", content: "noindex, nofollow" },
          ],
        },
});

function PdfToolPage() {
  const { tool } = Route.useLoaderData();
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const text = copy.tools[tool];
  const others = PDF_TOOLS.filter((entry) => entry.slug !== tool).slice(0, 6);

  return (
    <PageLayout
      breadcrumbs={[
        { label: copy.index.eyebrow, href: pdfToolsIndexPath(locale) },
        { label: text.name },
      ]}
    >
      <PageHero eyebrow={copy.index.eyebrow} title={text.h1} lede={text.lede} />

      <Section>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-6">
          <ToolRunner slug={tool} />
        </div>
      </Section>

      <Section title={copy.ui.howItWorks} muted>
        <div className="grid gap-5 md:grid-cols-3">
          {text.steps.map((step, index) => (
            <div key={step.title}>
              <span className="grid size-7 place-items-center rounded-full bg-pale-green text-xs font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={copy.ui.limitsTitle}>
        <ul className="max-w-[820px] space-y-3">
          {text.limits.map((limit) => (
            <li
              key={limit.slice(0, 32)}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={copy.ui.faqTitle} muted>
        <Accordion type="single" collapsible className="max-w-[820px]">
          {text.faqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={`faq-${index}`}>
              <AccordionTrigger className="text-start text-sm font-semibold text-navy">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section title={copy.ui.otherTools}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((entry) => {
            const Icon = entry.icon;
            const other = copy.tools[entry.slug];
            return (
              <AppLink
                key={entry.slug}
                href={pdfToolPath(entry.slug, locale)}
                className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-pale-green">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-navy">{other.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{other.card}</p>
              </AppLink>
            );
          })}
        </div>
        <p className="mt-6">
          <AppLink
            href={pdfToolsIndexPath(locale)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {copy.ui.allTools}
          </AppLink>
        </p>
      </Section>
    </PageLayout>
  );
}

function head(slug: PdfToolSlug, locale: Locale) {
  const copy = pdfToolsCopy(locale);
  const text = copy.tools[slug];
  const pageSlug = `pdf/${slug}`;
  const url = canonicalUrl(pageSlug, locale);
  const definition = pdfTool(slug);

  return {
    meta: [
      { title: text.title },
      robotsMeta(pageSlug),
      { name: "description", content: text.description },
      { property: "og:title", content: text.title },
      { property: "og:description", content: text.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:locale", content: OG_LOCALE[locale] },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks(pageSlug, locale),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: text.name,
          url,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any modern web browser",
          description: text.description,
          featureList: text.steps.map((step) => step.title),
          // Free, and genuinely so: no account, no quota, no watermark.
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          ...(definition ? { applicationSubCategory: definition.category } : {}),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: text.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: canonicalUrl("", locale) },
            {
              "@type": "ListItem",
              position: 2,
              name: copy.index.eyebrow,
              item: canonicalUrl("pdf-tools", locale),
            },
            { "@type": "ListItem", position: 3, name: text.name, item: url },
          ],
        }),
      },
    ],
  };
}
