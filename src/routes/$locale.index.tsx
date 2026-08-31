import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AdSlot } from "@/components/site/AdSlot";
import {
  AudienceStrip,
  ExtractSection,
  Faq,
  FinalCta,
  GlobalSection,
  Hero,
  HowItWorks,
  Pricing,
  ProductCards,
  Workflows,
} from "@/components/site/sections";
import { homeFor } from "@/content/home";
import { asLocale } from "@/i18n";
import {
  OG_LOCALE,
  canonicalUrl,
  pageNodeId,
  publisherRef,
  robotsMeta,
  seoLinks,
  webPageNode,
  webPageRef,
} from "@/config/seo";

const meta = {
  en: {
    title: "EasyInvoiceOCR — Invoice & Receipt OCR to Excel, CSV, JSON",
    description:
      "Read invoices and receipts with OCR in your browser. Extract vendor, dates, tax, totals and line items, then export to Excel, CSV or JSON.",
  },
  fr: {
    title: "EasyInvoiceOCR — OCR de factures et reçus vers Excel, CSV, JSON",
    description:
      "Lisez vos factures et reçus par OCR dans votre navigateur. Extrayez fournisseur, dates, TVA, totaux et lignes, puis exportez vers Excel, CSV ou JSON.",
  },
  ar: {
    title: "EasyInvoiceOCR — تحويل الفواتير والإيصالات إلى Excel وCSV وJSON",
    description:
      "اقرأ فواتيرك وإيصالاتك بتقنية OCR داخل متصفحك: المورّد والتواريخ والضريبة والإجماليات والبنود، ثم صدّرها إلى Excel أو CSV أو JSON.",
  },
} as const;

export const Route = createFileRoute("/$locale/")({
  component: Index,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const { title, description } = meta[locale];
    const home = homeFor(locale);
    const url = canonicalUrl("", locale);
    return {
      meta: [
        { title },
        robotsMeta(""),
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:locale", content: OG_LOCALE[locale] },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks("", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              webPageNode({ slug: "", locale, name: title, description }),
              {
                "@type": "WebApplication",
                "@id": pageNodeId("", locale, "webapplication"),
                name: "EasyInvoiceOCR",
                url,
                applicationCategory: "BusinessApplication",
                // The platform is the browser, which is the whole point of the
                // product. Every tool page already said this; the node that
                // represents the product as a whole did not.
                operatingSystem: "Any modern web browser",
                description,
                inLanguage: locale,
                isPartOf: webPageRef("", locale),
                // No Offer here. This node stands for the entire product, and
                // the product is not free — it has paid plans. Declaring
                // price 0 on it said otherwise. The real, database-backed
                // Offers live on /pricing, which is the one page that reads
                // them, so there is no second copy of a price to drift.
                publisher: publisherRef(),
              },
              {
                "@type": "FAQPage",
                "@id": pageNodeId("", locale, "faq"),
                inLanguage: locale,
                isPartOf: webPageRef("", locale),
                // The same questions the accordion renders, in the same locale.
                // It previously emitted the English config list on every locale,
                // so /fr and /ar published structured data that did not match the
                // page.
                mainEntity: home.faq.items.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          }),
        },
      ],
    };
  },
});

function Index() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />
      <main id="main">
        <Hero />
        {/* What the product does comes before who it is for: a visitor who
            has just read the headline wants the tools, not a positioning
            statement. The audience band follows as the answer to "is this
            for me". */}
        <ProductCards />
        <AudienceStrip />
        {/* Below the hero and the upload card, never inside them. */}
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <AdSlot name="home_below_hero" variant="banner" />
        </div>
        {/* Why before how. What the extractor actually pulls out of a
            document is the reason to care; the three steps are only worth
            reading once that reason has landed. */}
        <ExtractSection />
        <HowItWorks />
        <Workflows />
        {/* Between two substantial content sections. */}
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <AdSlot name="home_mid_content" variant="in-article" />
        </div>
        <GlobalSection />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
