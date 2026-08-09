import { Check, Lock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AppLink } from "./AppLink";
import { PageHero, PageLayout, Section, type Crumb } from "./PageLayout";
import { ExtractionWorkspace, type ExtractionKind } from "@/components/extract/ExtractionWorkspace";
import { QUOTA_TOOLS } from "@/lib/convert/validation";
import type { Product } from "@/content/products";
import type { Locale } from "@/i18n";
import { authSlugs, path } from "@/config/nav";
import { useLocale } from "@/i18n/useLocale";
import { absoluteUrl, robotsMeta, seoLinks } from "@/config/seo";

export function ProductPage({
  product,
  kind,
  breadcrumbs,
  extra,
}: {
  product: Product;
  kind: ExtractionKind;
  breadcrumbs: Crumb[];
  extra?: React.ReactNode;
}) {
  const locale = useLocale();
  return (
    <PageLayout breadcrumbs={breadcrumbs}>
      <PageHero eyebrow={product.eyebrow} title={product.heading} lede={product.lede}>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
            <AppLink href="#demo">Try it with your own file</AppLink>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-xl px-6 font-semibold text-navy"
          >
            <AppLink href={path(authSlugs.signup, locale)}>Create a free account</AppLink>
          </Button>
        </div>
      </PageHero>

      <Section
        title="Try it now"
        lede="Upload your own file. Text is recognised in your browser with Tesseract and nothing is uploaded. Complex layouts may need manual review before you export."
      >
        <ExtractionWorkspace
          kind={kind}
          // The product slug is the quota tool: every extraction product draws
          // on the same shared allowance.
          tool={QUOTA_TOOLS.find((slug) => slug === product.slug)}
          id="demo"
        />
      </Section>

      <Section title={`What ${product.name} does`} muted>
        <div className="grid gap-5 md:grid-cols-3">
          {product.what.map((para) => (
            <p
              key={para.slice(0, 30)}
              className="text-[15px] leading-relaxed text-muted-foreground"
            >
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title="Fields extracted">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {product.fields.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <h3 className="text-sm font-semibold text-navy">{group.group}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How it works in practice" muted>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {product.capabilities.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="text-sm font-semibold text-navy">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {extra}

      <Section title="Who uses it">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {product.audience.map((a) => (
            <div key={a.title} className="rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Supported formats" muted>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {product.formats.map((f) => (
            <li
              key={f}
              className="flex gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Security and privacy">
        <ul className="space-y-3">
          {product.security.map((s) => (
            <li key={s} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          Full detail, including what we deliberately do not claim, is on the{" "}
          <AppLink
            href={path("security")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Security page
          </AppLink>
          .
        </p>
      </Section>

      <Section title="Frequently asked questions" muted>
        <Accordion type="single" collapsible className="max-w-[820px]">
          {product.faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold text-navy">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section>
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy px-6 py-10 sm:px-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-[22px] font-bold text-background sm:text-[26px]">
              Ready to try {product.name}?
            </h2>
            <p className="mt-2 max-w-[540px] text-sm leading-relaxed text-background/70">
              Upload a file above, or read the documentation to see how the full workflow fits
              together.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
              <AppLink href="#demo">Upload a file</AppLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-background/30 bg-transparent px-6 font-semibold text-background hover:bg-background/10 hover:text-background"
            >
              <AppLink href={path("documentation")}>Read the docs</AppLink>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}

export function productHead(product: Product, locale: Locale) {
  return {
    meta: [
      { title: product.title },
      robotsMeta(product.slug),
      { name: "description", content: product.description },
      { property: "og:title", content: product.title },
      { property: "og:description", content: product.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl(product.route) },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: seoLinks(product.slug, locale),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: product.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  };
}
