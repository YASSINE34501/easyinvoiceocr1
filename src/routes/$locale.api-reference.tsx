import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { asLocale, type Locale } from "@/i18n";
import { useDir, useLocale } from "@/i18n/useLocale";
import { SITE_NAME, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

/**
 * /:locale/api-reference — an honest placeholder, not a reference.
 *
 * This page previously published a base URL, an Authorization header, five
 * endpoints with parameters, request and response examples in cURL, JavaScript
 * and Python, an error envelope and rate-limit headers — a complete reference
 * for a service that accepts no requests. Someone reading it could reasonably
 * have started an integration.
 *
 * All of it is removed rather than qualified with a banner. The page stays
 * reachable and returns 200 so existing links still resolve, but it is
 * `noindex, nofollow` and excluded from the sitemap, both derived from
 * NOINDEX_SLUGS in config/seo.ts. It is deliberately not redirected and does
 * not fake a 404.
 *
 * Conditions for restoring a real reference are in OCR_API_STATUS.md.
 *
 * It also fixes a bug introduced when canonicals were made absolute: this route
 * called seoLinks("api-reference", "en") with a hard-coded locale, so /fr and
 * /ar both advertised the /en URL as canonical.
 */

type ReferenceCopy = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  noticeTitle: string;
  notice: string;
  whatTitle: string;
  what: string[];
  insteadTitle: string;
  instead: string;
  ctaLabel: string;
  ctaNote: string;
  linksTitle: string;
  links: { label: string; href: string }[];
};

const copy: Record<Locale, ReferenceCopy> = {
  en: {
    title: "API Reference — not yet available (Coming Soon) — EasyInvoiceOCR",
    description:
      "The EasyInvoiceOCR API accepts no requests and issues no keys. There is no reference to publish yet; this page explains the current status and what to use instead.",
    eyebrow: "Coming soon",
    heading: "There is no API reference to publish yet",
    lede: "A reference describes something you can call. Nothing here can be called, so there is nothing to document.",
    noticeTitle: "The API is not operational",
    notice:
      "No endpoint accepts requests, no key is issued, and API access is not included in any active plan. This page is not a beta gate or a waiting list.",
    whatTitle: "Why this page is almost empty",
    what: [
      "It used to carry a base URL, an authentication header, five endpoints, request and response examples and rate-limit headers. All of it described a service that does not exist, and a reader could reasonably have begun an integration against it.",
      "Publishing a plausible reference for something unbuilt is worse than publishing nothing: it costs the reader real work before they discover the gap. The examples were removed rather than qualified with a warning.",
      "When the service exists and has been tested, a real reference will replace this page. Until then there is no date, because a date given before the work is done is a guess.",
    ],
    insteadTitle: "What works today",
    instead:
      "Extraction runs in the browser. Invoice OCR, the PDF invoice parser, Receipt to Excel and Image to Excel all work now and export Excel, CSV or JSON — as a user-facing workflow rather than a service you can call from your own code.",
    ctaLabel: "See the planned interface",
    ctaNote: "The OCR API page describes what is being designed. It accepts no requests.",
    linksTitle: "Related",
    links: [
      { label: "OCR API — coming soon", href: "/en/ocr-api" },
      { label: "Notes for developers", href: "/en/solutions/developers" },
      { label: "A checklist for choosing an OCR API", href: "/en/blog/choosing-ocr-api" },
      { label: "Extraction that works today", href: "/en/invoice-ocr" },
    ],
  },
  fr: {
    title: "Référence d'API — pas encore disponible (bientôt) — EasyInvoiceOCR",
    description:
      "L'API EasyInvoiceOCR n'accepte aucune requête et ne délivre aucune clé. Il n'y a pas encore de référence à publier ; cette page expose le statut actuel et les alternatives.",
    eyebrow: "Bientôt disponible",
    heading: "Il n'y a pas encore de référence d'API à publier",
    lede: "Une référence décrit quelque chose que l'on peut appeler. Rien ici ne peut l'être : il n'y a donc rien à documenter.",
    noticeTitle: "L'API n'est pas opérationnelle",
    notice:
      "Aucun point d'entrée n'accepte de requête, aucune clé n'est délivrée, et l'accès API n'est inclus dans aucune formule active. Cette page n'est ni une bêta fermée ni une liste d'attente.",
    whatTitle: "Pourquoi cette page est presque vide",
    what: [
      "Elle comportait auparavant une URL de base, un en-tête d'authentification, cinq points d'entrée, des exemples de requêtes et de réponses ainsi que des en-têtes de limitation. Tout cela décrivait un service inexistant, et un lecteur pouvait raisonnablement engager une intégration sur cette base.",
      "Publier une référence crédible pour un service non construit est pire que ne rien publier : cela coûte au lecteur un travail réel avant qu'il ne découvre l'écart. Les exemples ont été retirés plutôt qu'assortis d'un avertissement.",
      "Lorsque le service existera et aura été testé, une véritable référence remplacera cette page. D'ici là aucune date n'est avancée, car une date donnée avant que le travail soit fait n'est qu'une conjecture.",
    ],
    insteadTitle: "Ce qui fonctionne aujourd'hui",
    instead:
      "L'extraction s'exécute dans le navigateur. L'OCR de factures, l'analyseur de factures PDF, Reçus vers Excel et Image vers Excel fonctionnent dès maintenant et exportent en Excel, CSV ou JSON — sous forme de parcours utilisateur, non de service appelable depuis votre code.",
    ctaLabel: "Voir l'interface prévue",
    ctaNote:
      "La page API OCR décrit ce qui est en cours de conception. Elle n'accepte aucune requête.",
    linksTitle: "À consulter",
    links: [
      { label: "API OCR — bientôt disponible", href: "/fr/ocr-api" },
      { label: "Repères pour les développeurs", href: "/fr/solutions/developers" },
      {
        label: "Une liste de contrôle pour choisir une API d'OCR",
        href: "/fr/blog/choosing-ocr-api",
      },
      { label: "L'extraction qui fonctionne aujourd'hui", href: "/fr/invoice-ocr" },
    ],
  },
  ar: {
    title: "مرجع الواجهة البرمجية — غير متاح بعد (قريبًا) — EasyInvoiceOCR",
    description:
      "واجهة EasyInvoiceOCR البرمجية لا تستقبل أي طلبات ولا تصدر أي مفاتيح. لا يوجد مرجع لنشره بعد؛ توضّح هذه الصفحة الوضع الحالي والبدائل المتاحة.",
    eyebrow: "قريبًا",
    heading: "لا يوجد مرجع للواجهة البرمجية لنشره بعد",
    lede: "المرجع يصف شيئًا يمكن استدعاؤه. ولا شيء هنا قابل للاستدعاء، فلا شيء إذن لتوثيقه.",
    noticeTitle: "الواجهة البرمجية ليست تشغيلية",
    notice:
      "لا نقطة وصول تستقبل الطلبات، ولا مفتاح يُصدَر، والوصول البرمجي غير مشمول في أي باقة فعّالة. وهذه الصفحة ليست بوابة نسخة تجريبية ولا قائمة انتظار.",
    whatTitle: "لماذا هذه الصفحة شبه فارغة",
    what: [
      "كانت تتضمن عنوانًا أساسيًا وترويسة مصادقة وخمس نقاط وصول وأمثلة طلبات واستجابات وترويسات لحدود المعدل. وكل ذلك كان يصف خدمة غير موجودة، وكان بوسع القارئ أن يبدأ تكاملًا برمجيًا اعتمادًا عليها.",
      "نشر مرجع مقنع لخدمة لم تُبنَ أسوأ من عدم النشر أصلًا: فهو يكلّف القارئ عملًا حقيقيًا قبل أن يكتشف الفجوة. ولذلك أُزيلت الأمثلة بدل أن يُكتفى بتحذير فوقها.",
      "وحين توجد الخدمة ويجري اختبارها، سيحلّ مرجع حقيقي محل هذه الصفحة. وإلى ذلك الحين لا يُذكر أي موعد، لأن الموعد الذي يُعطى قبل إنجاز العمل تخمين.",
    ],
    insteadTitle: "ما الذي يعمل اليوم",
    instead:
      "الاستخراج يجري داخل المتصفح. فأداة استخراج بيانات الفواتير، ومحلّل فواتير PDF، والإيصالات إلى Excel، والصورة إلى Excel تعمل جميعها الآن وتصدّر إلى Excel أو CSV أو JSON — بوصفها مسار استخدام بشريًا لا خدمة تُستدعى من شيفرتك.",
    ctaLabel: "اطّلع على الواجهة المخطط لها",
    ctaNote: "صفحة واجهة OCR البرمجية تصف ما يجري تصميمه. وهي لا تستقبل أي طلبات.",
    linksTitle: "ذات صلة",
    links: [
      { label: "واجهة OCR البرمجية — قريبًا", href: "/ar/ocr-api" },
      { label: "ملاحظات للمطوّرين", href: "/ar/solutions/developers" },
      { label: "قائمة تحقق لاختيار واجهة OCR", href: "/ar/blog/choosing-ocr-api" },
      { label: "الاستخراج الذي يعمل اليوم", href: "/ar/invoice-ocr" },
    ],
  },
};

export const Route = createFileRoute("/$locale/api-reference")({
  component: ApiReferencePage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const c = copy[locale];
    return {
      meta: [
        { title: c.title },
        // Always noindex: api-reference is in NOINDEX_SLUGS.
        robotsMeta("api-reference"),
        { name: "description", content: c.description },
        { property: "og:title", content: c.title },
        { property: "og:description", content: c.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl("api-reference", locale) },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      // Locale-correct, not hard-coded "en" as it previously was.
      links: seoLinks("api-reference", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: canonicalUrl("", locale) },
              {
                "@type": "ListItem",
                position: 2,
                name: c.eyebrow,
                item: canonicalUrl("api-reference", locale),
              },
            ],
          }),
        },
      ],
    };
  },
});

function ApiReferencePage() {
  const locale = useLocale() as Locale;
  const c = copy[locale];
  const Arrow = useDir() === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <PageLayout breadcrumbs={[{ label: c.eyebrow }]}>
      <PageHero eyebrow={c.eyebrow} title={c.heading} lede={c.lede}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
            {c.eyebrow}
          </Badge>
          <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
            <AppLink href={c.links[0]!.href}>{c.ctaLabel}</AppLink>
          </Button>
        </div>
        <p className="mt-3 max-w-[560px] text-sm text-muted-foreground">{c.ctaNote}</p>
      </PageHero>

      <Section>
        <p
          role="note"
          className="flex max-w-[820px] items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm leading-relaxed text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">{c.noticeTitle}.</strong> {c.notice}
          </span>
        </p>
      </Section>

      <Section title={c.whatTitle} muted>
        <div className="max-w-[760px] space-y-4">
          {c.what.map((paragraph) => (
            <p
              key={paragraph.slice(0, 28)}
              className="text-[15px] leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.insteadTitle}>
        <p className="max-w-[760px] text-[15px] leading-relaxed text-muted-foreground">
          {c.instead}
        </p>
      </Section>

      <Section title={c.linksTitle} muted>
        <ul className="space-y-2">
          {c.links.map((link) => (
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
      </Section>
    </PageLayout>
  );
}
