/**
 * Public pricing.
 *
 * This page exists because the prices were previously unreadable by anything
 * that does not run JavaScript. /choose-plan is noindex, and both it and the
 * homepage pricing band fetch plans through react-query after hydration, so the
 * initial HTML contained no price at all — and the only Offer any crawler could
 * see declared the product free.
 *
 * So the plans are loaded in the route loader rather than in a hook. The loader
 * runs on the server during SSR, which puts real prices in the first byte of
 * HTML and lets head() build Offer nodes from the same values the page renders.
 * One fetch, one source, no second copy of a price anywhere in this file.
 *
 * The source is getPublicPlans(), the same server function /choose-plan uses.
 * Nothing about billing, PayPal or the plan rows is touched: this is a read.
 *
 * If that read fails the page still renders. It says so plainly and emits no
 * Offer, because a pricing page that invents a number when the database is
 * unreachable is worse than one that admits it cannot tell you right now.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container, PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { getPublicPlans } from "@/lib/billing/billing.functions";
import type { PublicPlan } from "@/lib/billing/types";
import { asLocale, type Locale, type MessageKey } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { path } from "@/config/routing";
import {
  OG_LOCALE,
  SITE_NAME,
  canonicalUrl,
  pageNodeId,
  publisherRef,
  robotsMeta,
  seoLinks,
  webPageNode,
  webPageRef,
} from "@/config/seo";

const SLUG = "pricing";

/** Route metadata. Local to the route, as on the other top-level pages. */
const meta = {
  en: {
    title: "Pricing — EasyInvoiceOCR",
    description:
      "What EasyInvoiceOCR costs. Five conversions free on every account, then a modest monthly or yearly plan. Prices are read from our billing records, not written here.",
  },
  fr: {
    title: "Tarifs — EasyInvoiceOCR",
    description:
      "Ce que coûte EasyInvoiceOCR. Cinq conversions gratuites par compte, puis un abonnement mensuel ou annuel modeste. Les tarifs proviennent de nos enregistrements de facturation.",
  },
  ar: {
    title: "الأسعار — EasyInvoiceOCR",
    description:
      "تكلفة EasyInvoiceOCR: خمس عمليات تحويل مجانية لكل حساب، ثم اشتراك شهري أو سنوي متواضع. تُقرأ الأسعار من سجلات الفوترة لدينا.",
  },
} as const satisfies Record<Locale, { title: string; description: string }>;

type LoaderData = { plans: PublicPlan[] | null };

/** Paid plans only. The trial has no price and is described in prose instead. */
function paidPlans(plans: PublicPlan[]): PublicPlan[] {
  return plans.filter((plan) => plan.monthlyPrice > 0);
}

/**
 * Offer nodes, built from the same rows the page renders.
 *
 * A plan produces up to two offers — monthly and yearly — because they are
 * different prices for different billing periods, and collapsing them into one
 * number would misstate both. Nothing is emitted when the load failed.
 */
function offerNodes(plans: PublicPlan[] | null) {
  if (!plans) return [];
  return paidPlans(plans).flatMap((plan) => {
    const offers = [
      {
        "@type": "Offer" as const,
        name: `${plan.name} — monthly`,
        price: plan.monthlyPrice.toFixed(2),
        priceCurrency: plan.currency,
        availability: "https://schema.org/InStock",
        category: "subscription",
        eligibleDuration: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    ];
    if (plan.yearlyPrice !== null && plan.yearlyPrice > 0) {
      offers.push({
        "@type": "Offer" as const,
        name: `${plan.name} — yearly`,
        price: plan.yearlyPrice.toFixed(2),
        priceCurrency: plan.currency,
        availability: "https://schema.org/InStock",
        category: "subscription",
        eligibleDuration: { "@type": "QuantitativeValue", value: 1, unitCode: "ANN" },
      });
    }
    return offers;
  });
}

export const Route = createFileRoute("/$locale/pricing")({
  /**
   * Runs on the server for the first render, so the prices below are in the
   * HTML a crawler receives rather than appearing after hydration.
   *
   * A failure is caught rather than thrown: a database that is briefly
   * unreachable should cost the visitor the price table, not the page.
   */
  loader: async (): Promise<LoaderData> => {
    try {
      return { plans: await getPublicPlans() };
    } catch {
      return { plans: null };
    }
  },

  head: ({ params, loaderData }) => {
    const locale = asLocale(params.locale);
    const { title, description } = meta[locale];
    const url = canonicalUrl(SLUG, locale);
    const offers = offerNodes(loaderData?.plans ?? null);

    return {
      meta: [
        { title },
        robotsMeta(SLUG),
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
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
            "@graph": [
              webPageNode({ slug: SLUG, locale, name: title, description }),
              {
                "@type": "Product",
                "@id": pageNodeId(SLUG, locale, "product"),
                name: SITE_NAME,
                description,
                url,
                brand: publisherRef(),
                isPartOf: webPageRef(SLUG, locale),
                // Present only when the plans actually loaded. An empty
                // offers array would say "no plans", which is a different
                // and untrue claim from "we could not read them".
                ...(offers.length > 0 ? { offers } : {}),
              },
              {
                "@type": "BreadcrumbList",
                "@id": pageNodeId(SLUG, locale, "breadcrumb"),
                isPartOf: webPageRef(SLUG, locale),
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: SITE_NAME,
                    item: canonicalUrl("", locale),
                  },
                  { "@type": "ListItem", position: 2, name: title, item: url },
                ],
              },
            ],
          }),
        },
      ],
    };
  },

  component: PricingPage,
});

function PlanCard({ plan, popular }: { plan: PublicPlan; popular: boolean }) {
  const t = useT();
  const locale = useLocale();
  const money = (value: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar" : locale, {
      style: "currency",
      currency: plan.currency,
      maximumFractionDigits: 2,
    }).format(value);

  const name = t(`plan.name_${plan.code}` as MessageKey, {}) || plan.name;
  const blurb = t(`plan.blurb_${plan.code}` as MessageKey, {}) || plan.description;

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        popular ? "border-primary bg-pale-green/30" : "border-border bg-surface"
      }`}
    >
      {popular && (
        <span className="mb-3 self-start rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
          {t("plan.mostPopular")}
        </span>
      )}
      <h3 className="text-[20px] font-bold tracking-tight text-navy">{name}</h3>
      <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">{blurb}</p>

      <p className="mt-5 text-[28px] font-bold text-navy">
        {money(plan.monthlyPrice)}
        <span className="text-[15px] font-medium text-muted-foreground">{t("plan.perMonth")}</span>
      </p>
      {plan.yearlyPrice !== null && plan.yearlyPrice > 0 && (
        <p className="mt-1 text-[14px] text-muted-foreground">
          {money(plan.yearlyPrice)}
          {t("plan.perYear")}
        </p>
      )}

      <ul className="mt-5 space-y-2">
        <li className="flex gap-2 text-[14px] leading-[1.6] text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {t("plan.pagesPerPeriod", { pages: plan.monthlyPageLimit })}
        </li>
        <li className="flex gap-2 text-[14px] leading-[1.6] text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          {t("plan.maxFile", { mb: Math.round(plan.maxFileSize / (1024 * 1024)) })}
        </li>
        {plan.batchEnabled && (
          <li className="flex gap-2 text-[14px] leading-[1.6] text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("plan.batchFiles", { files: plan.batchMaxFiles })}
          </li>
        )}
        {!plan.adsEnabled && (
          <li className="flex gap-2 text-[14px] leading-[1.6] text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("plan.noAds")}
          </li>
        )}
      </ul>

      <div className="mt-6">
        <Button asChild className="min-h-11 w-full rounded-lg font-semibold">
          <AppLink href={path("choose-plan", locale)}>{t("plan.choose", { plan: name })}</AppLink>
        </Button>
      </div>
    </div>
  );
}

function PricingPage() {
  const { plans } = Route.useLoaderData();
  const t = useT();
  const locale = useLocale();
  const { title, description } = meta[locale];
  const paid = plans ? paidPlans(plans) : [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />
      <main id="main">
        <PageLayout breadcrumbs={[{ label: title }]}>
          <PageHero title={title} lede={description} />
          <Section>
            <Container>
              {paid.length === 0 ? (
                // No invented figures. If the read failed, the page says so.
                <p className="max-w-[640px] text-[16px] leading-[1.75] text-muted-foreground">
                  {t("plan.unavailable")}
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {paid.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} popular={plan.code === "pro"} />
                  ))}
                </div>
              )}
              <p className="mt-8 max-w-[720px] text-[15px] leading-[1.75] text-muted-foreground">
                {t("pricing.note")}
              </p>
            </Container>
          </Section>
        </PageLayout>
      </main>
      <Footer />
    </div>
  );
}
