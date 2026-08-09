import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/site/AppLink";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { solutionBySlug, type Solution } from "@/content/solutions";
import { path } from "@/config/nav";
import { asLocale, type Locale } from "@/i18n";
import { useDir, useLocale } from "@/i18n/useLocale";
import { SITE_NAME, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

/**
 * /:locale/solutions/:slug — one audience page, in the requested locale.
 *
 * The previous version read a single-locale record, so /ar/solutions/accountants
 * rendered Arabic navigation and correct RTL around an entirely English body.
 * Content now comes from `solution.content[locale]`.
 */
export const Route = createFileRoute("/$locale/solutions/$slug")({
  loader: ({ params }): { solution: Solution } => {
    const solution = solutionBySlug[params.slug];
    if (!solution) throw notFound();
    return { solution };
  },
  head: ({ params, loaderData }) => {
    const locale = asLocale(params.locale);
    const solution = loaderData?.solution as Solution | undefined;
    if (!solution) {
      return {
        meta: [
          { title: `Solution not found — ${SITE_NAME}` },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }

    const content = solution.content[locale];
    const url = canonicalUrl(`solutions/${solution.slug}`, locale);

    return {
      meta: [
        { title: content.title },
        robotsMeta(`solutions/${solution.slug}`),
        { name: "description", content: content.description },
        { property: "og:title", content: content.title },
        { property: "og:description", content: content.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks(`solutions/${solution.slug}`, locale),
      scripts: [
        {
          // Mirrors the visible trail: home → Solutions → this audience.
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: canonicalUrl("", locale) },
              {
                "@type": "ListItem",
                position: 2,
                name: content.labels.breadcrumb,
                item: canonicalUrl("solutions/accountants", locale),
              },
              { "@type": "ListItem", position: 3, name: content.name, item: url },
            ],
          }),
        },
        {
          // Only because the accordion below renders these same questions.
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: locale,
            mainEntity: content.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        },
      ],
    };
  },
  component: SolutionPage,
});

function SolutionPage() {
  const { solution } = Route.useLoaderData() as { solution: Solution };
  const locale = useLocale() as Locale;
  const content = solution.content[locale];
  const Arrow = useDir() === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <PageLayout
      breadcrumbs={[
        { label: content.labels.breadcrumb, href: path("solutions/accountants", locale) },
        { label: content.name },
      ]}
    >
      <PageHero eyebrow={content.eyebrow} title={content.heading} lede={content.lede}>
        <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
          <AppLink href={content.cta.href}>{content.cta.label}</AppLink>
        </Button>
        <p className="mt-3 max-w-[560px] text-sm text-muted-foreground">{content.cta.note}</p>
      </PageHero>

      <Section title={content.labels.intro} muted>
        <div className="grid max-w-[900px] gap-5 md:grid-cols-2">
          {content.intro.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className="text-[15px] leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      <Section title={content.labels.blocks}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {content.blocks.map((block) => (
            <div
              key={block.title}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="text-sm font-semibold text-navy">{block.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{block.body}</p>
              {block.points && (
                <ul className="mt-3 space-y-1.5">
                  {block.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title={content.labels.faqs} muted>
        <Accordion type="single" collapsible className="max-w-[820px]">
          {content.faqs.map((faq, index) => (
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

      <Section>
        <nav aria-label={content.a11y.navLabel} className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-navy">
              {content.labels.products}
            </h2>
            <ul className="mt-4 space-y-2">
              {content.productLinks.map((link) => (
                <li key={link.href}>
                  <AppLink
                    href={link.href}
                    className="inline-flex items-start gap-2 text-[15px] font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <Arrow className="mt-1 size-4 shrink-0" aria-hidden="true" />
                    <span>{link.label}</span>
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-navy">
              {content.labels.guides}
            </h2>
            <ul className="mt-4 space-y-2">
              {content.blogLinks.map((link) => (
                <li key={link.href}>
                  <AppLink
                    href={link.href}
                    className="inline-flex items-start gap-2 text-[15px] text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
                  >
                    <Arrow className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{link.label}</span>
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </Section>
    </PageLayout>
  );
}
