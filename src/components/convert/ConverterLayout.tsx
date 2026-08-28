/**
 * The page every converter is rendered inside.
 *
 * One layout for all three tools: headline, description, the converter itself,
 * supported formats, privacy, the explanatory content, limitations, FAQ and
 * related tools — in that order, on every page. Advertising, where it appears
 * at all, sits between content sections well below the converter controls.
 */

import { Check, Info } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppLink } from "@/components/site/AppLink";
import { AdSlot } from "@/components/site/AdSlot";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { converterCopy } from "@/content/converters";
import { path } from "@/config/nav";
import { relatedProducts, type ProductDefinition } from "@/config/products";
import { locales, type Locale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { OG_LOCALE, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";
import { toolAccent } from "@/components/pdftools/surface";
import { cn } from "@/lib/utils";

export function ConverterLayout({
  product,
  children,
}: {
  product: ProductDefinition;
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const t = useT();
  const copy = product.copy[locale];
  const content = converterCopy(product.converter!, locale);
  const related = relatedProducts(product.slug);

  return (
    <PageLayout
      breadcrumbs={[
        { label: t("nav.product"), href: path(product.slug, locale) },
        { label: copy.name },
      ]}
    >
      <PageHero eyebrow={t("nav.product")} title={copy.h1} lede={copy.lede} />

      <Section>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-6">
          {children}
        </div>
      </Section>

      <Section title={t("conv.howItWorks")} muted>
        <div className="grid gap-5 md:grid-cols-3">
          {content.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-navy">{section.title}</h3>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="mt-2 text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Between two substantial content sections, far from the converter's
          upload, convert and download controls. */}
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <AdSlot name="converter_below_content" variant="in-article" label={t("ads.label")} />
      </div>

      <Section title={t("conv.formats")}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.formats.map((format) => (
            <li
              key={format}
              className="flex gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {format}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("conv.limitations")} muted>
        <ul className="space-y-3">
          {content.limitations.map((limitation) => (
            <li
              key={limitation.slice(0, 32)}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("conv.faq")}>
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

      <Section title={t("conv.related")} muted>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => {
            const Icon = item.icon;
            return (
              <AppLink
                key={item.slug}
                href={path(item.slug, locale)}
                className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl",
                    toolAccent(item.slug).tile,
                  )}
                >
                  <Icon className={cn("size-5", toolAccent(item.slug).glyph)} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-navy">{item.copy[locale].name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {item.copy[locale].card}
                </p>
              </AppLink>
            );
          })}
        </div>
      </Section>
    </PageLayout>
  );
}

/**
 * head() payload for a converter route: unique title, description, canonical,
 * hreflang for every locale, and WebApplication, FAQPage and BreadcrumbList
 * structured data.
 */
export function converterHead(product: ProductDefinition, locale: Locale) {
  const copy = product.copy[locale];
  const content = converterCopy(product.converter!, locale);
  const url = canonicalUrl(product.slug, locale);

  return {
    meta: [
      { title: copy.title },
      robotsMeta(product.slug),
      { name: "description", content: copy.description },
      { property: "og:title", content: copy.title },
      { property: "og:description", content: copy.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:locale", content: OG_LOCALE[locale] },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks(product.slug, locale),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: copy.name,
          url,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any modern web browser",
          description: copy.description,
          featureList: product.features,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((faq) => ({
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
            { "@type": "ListItem", position: 2, name: copy.name, item: url },
          ],
        }),
      },
    ],
  };
}
