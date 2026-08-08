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
  LanguageStrip,
  Pricing,
  ProductCards,
  Workflows,
} from "@/components/site/sections";
import { faqs } from "@/config/site";
import { asLocale } from "@/i18n";

const meta = {
  en: {
    title: "EasyInvoiceOCR — Invoice & Receipt OCR to Excel, CSV, JSON",
    description:
      "AI-powered invoice and receipt OCR. Extract vendors, dates, taxes, totals and line items from PDFs, scans and photos, then export to Excel, CSV or JSON.",
  },
  fr: {
    title: "EasyInvoiceOCR — OCR de factures et reçus vers Excel, CSV, JSON",
    description:
      "OCR de factures et de reçus par IA. Extrayez fournisseurs, dates, taxes, totaux et lignes depuis vos PDF, scans et photos, puis exportez vers Excel, CSV ou JSON.",
  },
  ar: {
    title: "EasyInvoiceOCR — تحويل الفواتير والإيصالات إلى Excel وCSV وJSON",
    description:
      "استخراج بيانات الفواتير والإيصالات بالذكاء الاصطناعي: المورد والتواريخ والضرائب والإجماليات وبنود الفاتورة، مع تصدير إلى Excel أو CSV أو JSON.",
  },
} as const;

export const Route = createFileRoute("/$locale/")({
  component: Index,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const { title, description } = meta[locale];
    const url = `/${locale}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:locale", content: locale },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en", href: "/en" },
        { rel: "alternate", hrefLang: "fr", href: "/fr" },
        { rel: "alternate", hrefLang: "ar", href: "/ar" },
        { rel: "alternate", hrefLang: "x-default", href: "/en" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "EasyInvoiceOCR",
            applicationCategory: "BusinessApplication",
            description,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
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
        <AudienceStrip />
        <ProductCards />
        {/* Below the hero and the upload card, never inside them. */}
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <AdSlot name="home_below_hero" variant="banner" />
        </div>
        <LanguageStrip />
        <HowItWorks />
        <ExtractSection />
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
