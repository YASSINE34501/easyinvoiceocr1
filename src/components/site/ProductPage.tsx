import { ArrowLeft, ArrowRight, Check, Lock, TriangleAlert } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLink } from "./AppLink";
import { PageHero, PageLayout, Section, type Crumb } from "./PageLayout";
import { ExtractionWorkspace, type ExtractionKind } from "@/components/extract/ExtractionWorkspace";
import { QUOTA_TOOLS } from "@/lib/convert/validation";
import type { Product } from "@/content/products";
import { productUi, withName } from "@/content/products/ui";
import type { Locale } from "@/i18n";
import { authSlugs, path } from "@/config/nav";
import { useDir, useLocale, useT } from "@/i18n/useLocale";
import {
  SITE_NAME,
  canonicalUrl,
  pageNodeId,
  publisherRef,
  robotsMeta,
  seoLinks,
  webPageNode,
  webPageRef,
} from "@/config/seo";

/**
 * The shared template for the five extraction product pages.
 *
 * Everything visible is read from `product.content[locale]`, so a French URL
 * renders French copy rather than an English body under a translated header —
 * the defect this component previously had, because the content registry was
 * single-locale.
 *
 * A coming-soon product renders the same structure with the workspace removed
 * and an explicit notice. It is not hidden and it is not redirected: a page
 * that vanishes is worse for someone who linked to it than a page that says
 * "not yet".
 */
export function ProductPage({
  product,
  kind,
  breadcrumbs,
  extra,
}: {
  product: Product;
  kind: ExtractionKind;
  /** Overrides the default trail. Omit it and the localised name is used. */
  breadcrumbs?: Crumb[];
  extra?: React.ReactNode;
}) {
  const locale = useLocale() as Locale;
  const t = useT();
  const content = product.content[locale];
  const ui = productUi[locale];
  const comingSoon = product.availability === "coming-soon";
  const Arrow = useDir() === "rtl" ? ArrowLeft : ArrowRight;
  // Built here rather than in each route: the label is locale-dependent, and a
  // route cannot read the locale from module scope.
  const trail: Crumb[] = breadcrumbs ?? [
    { label: t("nav.product"), href: path(product.slug, locale) },
    { label: content.name },
  ];

  return (
    <PageLayout breadcrumbs={trail}>
      <PageHero eyebrow={content.eyebrow} title={content.heading} lede={content.lede}>
        {comingSoon ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
              {ui.comingSoonBadge}
            </Badge>
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
              <AppLink href={content.cta.href}>{content.cta.label}</AppLink>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
              <AppLink href="#demo">{ui.tryCta}</AppLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6 font-semibold text-navy"
            >
              <AppLink href={path(authSlugs.signup, locale)}>{ui.signupCta}</AppLink>
            </Button>
          </div>
        )}
      </PageHero>

      {comingSoon ? (
        <Section>
          <p
            className="flex max-w-[820px] items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-destructive"
            role="note"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>{ui.comingSoonNotice}</span>
          </p>
        </Section>
      ) : (
        <Section title={ui.tryTitle} lede={ui.tryLede}>
          <ExtractionWorkspace
            kind={kind}
            // The product slug is the quota tool: every extraction product draws
            // on the same shared allowance.
            tool={QUOTA_TOOLS.find((slug) => slug === product.slug)}
            id="demo"
          />
        </Section>
      )}

      <Section title={withName(ui.whatTitle, content.name)} muted>
        <div className="grid gap-5 md:grid-cols-3">
          {content.what.map((para) => (
            <p
              key={para.slice(0, 30)}
              className="text-[15px] leading-relaxed text-muted-foreground"
            >
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={content.labels.fields}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.fields.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="text-sm font-semibold text-navy">{group.group}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title={ui.practiceTitle} muted>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.capabilities.map((capability) => (
            <div
              key={capability.title}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="text-sm font-semibold text-navy">{capability.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {capability.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {extra}

      <Section title={content.labels.audience}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.audience.map((entry) => (
            <div key={entry.title} className="rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy">{entry.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={content.labels.formats} muted>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.formats.map((format) => (
            <li
              key={format}
              className="flex gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{format}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={content.labels.security}>
        <ul className="space-y-3">
          {content.security.map((line) => (
            <li
              key={line.slice(0, 32)}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          {ui.securityMore}{" "}
          <AppLink
            href={path("security", locale)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {ui.securityLink}
          </AppLink>
          .
        </p>
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

      {/* Reciprocal links. The blog links back to the products; without these
          the relationship was one-directional. Anchor text is written per
          product in the content file rather than reused. */}
      <Section title={content.labels.relatedGuides}>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ul className="space-y-2">
              {content.relatedGuides.map((link) => (
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
              <li>
                <AppLink
                  href={content.solutionLink.href}
                  className="inline-flex items-start gap-2 text-[15px] font-medium text-primary underline-offset-4 hover:underline"
                >
                  <Arrow className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span>{content.solutionLink.label}</span>
                </AppLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy">{content.labels.relatedTools}</h3>
            <ul className="mt-3 space-y-2">
              {content.relatedTools.map((link) => (
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
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy px-6 py-10 sm:px-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-[22px] font-bold text-background sm:text-[26px]">
              {withName(ui.closingTitle, content.name)}
            </h2>
            <p className="mt-2 max-w-[540px] text-sm leading-relaxed text-background/70">
              {comingSoon ? content.cta.note : ui.closingBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
              <AppLink href={comingSoon ? content.cta.href : "#demo"}>
                {comingSoon ? content.cta.label : ui.closingUpload}
              </AppLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-background/30 bg-transparent px-6 font-semibold text-background hover:bg-background/10 hover:text-background"
            >
              <AppLink href={path("documentation", locale)}>
                {ui.closingDocs || t("link.documentation")}
              </AppLink>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}

/**
 * head() payload for a product route.
 *
 * FAQPage is emitted only because the FAQs are rendered on the page — the
 * accordion above uses the same array. BreadcrumbList mirrors the visible
 * trail. Neither describes anything a reader cannot see, which is the line
 * between structured data and misrepresentation.
 */
export function productHead(product: Product, locale: Locale) {
  const content = product.content[locale];
  const url = canonicalUrl(product.slug, locale);

  return {
    meta: [
      { title: content.title },
      // A coming-soon product is noindex regardless of deployment: there is
      // nothing to rank for yet.
      product.availability === "coming-soon"
        ? { name: "robots", content: "noindex, nofollow" }
        : robotsMeta(product.slug),
      { name: "description", content: content.description },
      { property: "og:title", content: content.title },
      { property: "og:description", content: content.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks(product.slug, locale),
    scripts: [
      // One @graph rather than four loose blocks. The extraction products are
      // the ones the brand is named after, and until now they were the only
      // tools with no application node at all — merge-pdf described itself as
      // software while invoice-ocr did not. The nodes below carry stable @ids
      // so each says which page it belongs to; Organization and WebSite are
      // referenced from the root, never redeclared here.
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            webPageNode({
              slug: product.slug,
              locale,
              name: content.title,
              description: content.description,
            }),
            {
              "@type": "WebApplication",
              "@id": pageNodeId(product.slug, locale, "webapplication"),
              name: content.name,
              url,
              description: content.description,
              applicationCategory: "BusinessApplication",
              // Factual: recognition runs in the visitor's browser, so the
              // browser is the platform. The converter pages already say this.
              operatingSystem: "Any modern web browser",
              inLanguage: locale,
              isPartOf: webPageRef(product.slug, locale),
              publisher: publisherRef(),
              // Drawn from the rendered "what you get" groups, so the list
              // describes something a reader can see on the page.
              featureList: content.fields.flatMap((group) => group.items).slice(0, 8),
            },
            {
              "@type": "FAQPage",
              "@id": pageNodeId(product.slug, locale, "faq"),
              inLanguage: locale,
              isPartOf: webPageRef(product.slug, locale),
              mainEntity: content.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            },
            {
              "@type": "BreadcrumbList",
              "@id": pageNodeId(product.slug, locale, "breadcrumb"),
              isPartOf: webPageRef(product.slug, locale),
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: SITE_NAME,
                  item: canonicalUrl("", locale),
                },
                { "@type": "ListItem", position: 2, name: content.name, item: url },
              ],
            },
          ],
        }),
      },
    ],
  };
}
