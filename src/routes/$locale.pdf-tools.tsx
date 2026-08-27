/**
 * The PDF tools index — the front page of the section.
 *
 * Laid out as a tool directory rather than a marketing page: a short greeting,
 * the category filter, then the grid. Someone who lands here from a search for
 * "merge pdf" wants the tool within one screen, so nothing argues the product
 * above the fold. The explanatory bands follow the grid, for the reader who
 * scrolls.
 *
 * The grid is derived from the two registries (see components/pdftools/surface),
 * so a tool added to either appears here with no edit to this file.
 */

import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/site/AppLink";
import { Container, PageLayout, Section } from "@/components/site/PageLayout";
import { ToolGrid } from "@/components/pdftools/ToolGrid";
import { pdfToolsCopy } from "@/content/pdftools";
import { authSlugs, path } from "@/config/nav";
import { useAuth } from "@/auth/AuthProvider";
import { asLocale, type Locale } from "@/i18n";
import { useLocale } from "@/i18n/useLocale";
import { OG_LOCALE, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

const SLUG = "pdf-tools";

export const Route = createFileRoute("/$locale/pdf-tools")({
  component: PdfToolsIndexPage,
  head: ({ params }) => head(asLocale(params.locale)),
});

/**
 * The greeting, with a name when we have one.
 *
 * Read-only: this looks at the session the auth provider already holds and
 * changes nothing about it. Signed out, the plain greeting renders — and it is
 * what the server renders too, so the page never flashes a name that is not
 * there yet.
 */
function useGreeting(): string {
  const locale = useLocale();
  const landing = pdfToolsCopy(locale).landing;
  const { user, loading } = useAuth();

  if (loading || !user) return landing.greeting;

  const metadata = user.user_metadata as { full_name?: unknown } | undefined;
  const fullName = typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";
  const name = fullName || (user.email ?? "").split("@")[0] || "";
  if (!name) return landing.greeting;

  return landing.greetingNamed.replace("{name}", name);
}

function PdfToolsIndexPage() {
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const landing = copy.landing;
  const greeting = useGreeting();

  return (
    <PageLayout breadcrumbs={[{ label: copy.index.eyebrow }]}>
      {/* Greeting and filter share one block: the filter is part of the
          heading here, not a separate section. */}
      <section className="hero-glow border-b border-border/70">
        <Container className="py-9 sm:py-12">
          <h1 className="text-center text-[22px] font-bold tracking-[-0.01em] text-navy sm:text-[28px]">
            {greeting}
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-center text-[14px] leading-relaxed text-ink-soft">
            {landing.lede}
          </p>

          <div className="mt-8">
            <ToolGrid />
          </div>
        </Container>
      </section>

      <Section title={landing.waysTitle} lede={landing.waysLede}>
        <div className="grid gap-4 md:grid-cols-3">
          {landing.ways.map((way) => (
            <div
              key={way.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <h3 className="text-[16px] font-bold text-navy">{way.title}</h3>
              <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                {way.body}
              </p>
              <ArrowUpRight
                className="mt-5 size-5 self-end text-primary rtl:-scale-x-100"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* The band the reference gives to a premium tier. There is no premium
          tier for these tools — they are free and need no account — so it
          carries the offer that genuinely exists: the extraction products and
          the five free conversions every account starts with. */}
      <Section>
        <div className="grid gap-8 rounded-3xl border border-primary/20 bg-pale-green/50 p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-[24px] font-bold leading-tight tracking-[-0.01em] text-navy sm:text-[28px]">
              {landing.ctaTitle}
            </h2>
            <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-ink-soft">
              {landing.ctaBody}
            </p>
            <ul className="mt-6 space-y-3">
              {landing.features.slice(0, 3).map((feature) => (
                <li key={feature.title} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-[13px] leading-relaxed text-navy">{feature.title}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-xl px-6 font-semibold">
                <AppLink href={path(authSlugs.signup, locale)}>{landing.ctaPrimary}</AppLink>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-border bg-card px-6 font-semibold text-navy"
              >
                <AppLink href={path(authSlugs.choosePlan, locale)}>{landing.ctaSecondary}</AppLink>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{landing.ctaNote}</p>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            {landing.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-[26px] font-extrabold leading-none tracking-[-0.02em] text-navy">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-[11px] leading-snug text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Only claims the code backs. No certifications, no memberships, no
          badges we have not earned. */}
      <Section title={landing.trustTitle} muted>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="flex gap-4 rounded-2xl border border-primary/25 bg-card p-6 shadow-card">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <ul className="space-y-2.5">
                {landing.trust.map((claim) => (
                  <li
                    key={claim.slice(0, 24)}
                    className="text-[13px] leading-relaxed text-accent-foreground"
                  >
                    {claim}
                  </li>
                ))}
              </ul>
              <AppLink
                href={path("security", locale)}
                className="mt-4 inline-block text-[13px] font-semibold text-primary hover:underline"
              >
                {landing.trustLink}
              </AppLink>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {landing.features.map((feature) => (
              <div key={feature.title}>
                <h3 className="text-[14px] font-semibold text-navy">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title={copy.ui.faqTitle}>
        <Accordion type="single" collapsible className="mx-auto max-w-[820px]">
          {copy.index.faqs.map((faq, index) => (
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
    </PageLayout>
  );
}

function head(locale: Locale) {
  const copy = pdfToolsCopy(locale).index;
  const url = canonicalUrl(SLUG, locale);

  return {
    meta: [
      { title: copy.title },
      robotsMeta(SLUG),
      { name: "description", content: copy.description },
      { property: "og:title", content: copy.title },
      { property: "og:description", content: copy.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:locale", content: OG_LOCALE[locale] },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks(SLUG, locale),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: copy.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
    ],
  };
}
