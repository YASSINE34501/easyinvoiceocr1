import { createFileRoute } from "@tanstack/react-router";
import {
  PageHero,
  PageLayout,
  Section,
  breadcrumbJsonLd,
  Container,
} from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { translate, asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/about")({
  component: AboutPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "About EasyInvoiceOCR",
      fr: "À propos d'EasyInvoiceOCR",
      ar: "حول EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Learn about EasyInvoiceOCR, how we help businesses extract invoice and receipt data, and our commitment to security and privacy.",
      fr: "Découvrez EasyInvoiceOCR, comment nous aidons les entreprises à extraire les données de factures et de reçus, et notre engagement envers la sécurité et la confidentialité.",
      ar: "تعرف على EasyInvoiceOCR وكيف نساعد الشركات على استخراج بيانات الفواتير والإيصالات والتزامنا بالأمان والخصوصية.",
    };
    const title = `${titles[locale]} — EasyInvoiceOCR`;
    const description = descriptions[locale];

    return {
      meta: [
        robotsMeta("about"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("about", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: translate(locale, "link.about") }]),
        },
        // No Organization block here any more. It used to be declared on this
        // page alone, which left the other 111 pages asserting nothing about
        // who publishes them. It now lives in the root graph with a stable
        // @id, so this page inherits it like every other page and there is
        // exactly one definition of the entity site-wide.
      ],
    };
  },
});

function AboutPage() {
  const t = useT();
  const locale = useLocale();

  const content = {
    en: {
      hero: "About EasyInvoiceOCR",
      heroLede:
        "Making invoice and receipt processing fast, accurate, and accessible to businesses of all sizes.",
      mission: "Our Mission",
      missionBody: `We built EasyInvoiceOCR to solve a real problem: spending hours manually typing invoice and receipt data is expensive and error-prone. Our platform uses optical character recognition (OCR) to extract data automatically, turning paper and digital documents into structured data that flows straight into your accounting software, spreadsheets, or database.

We're committed to keeping the process simple and transparent—no complicated configurations, no proprietary integrations, and no vendor lock-in.`,
      features: "Why Choose EasyInvoiceOCR",
      privacy: "Privacy First",
      privacyBody:
        "Your documents stay on your device. Client-side processing means we never see your files unless you explicitly choose to use cloud services.",
      security: "Enterprise Security",
      securityBody:
        "Row-level security isolates user data. All passwords are handled by Supabase Auth, and any stored data is encrypted at rest.",
      accuracy: "Checked, not guessed",
      accuryBody:
        "Recognition covers scanned documents and photographs in English, French and Arabic. Every extracted field carries a confidence score, and anything uncertain is flagged for review rather than guessed.",
      technology: "Technology",
      technologyBody: `EasyInvoiceOCR runs primarily on your computer:

• Conversions (PDF/Image to Word, Image to PDF) use client-side libraries.
• Text recognition uses Tesseract.js, an open-source OCR engine compiled to WebAssembly.
• Invoice and receipt extraction uses those same readers: a PDF's own text layer when it has one, Tesseract when it does not.

All subscription and user data is stored in Supabase, a PostgreSQL-based platform with row-level security policies enforced at the database level. Payment processing is handled through PayPal, and all webhook signatures are verified server-side.`,
      team: "The Team",
      teamBody:
        "EasyInvoiceOCR is a small, focused team building this tool to solve a problem we've experienced firsthand. We're committed to shipping working software and iterating based on real user feedback.",
    },
    fr: {
      hero: "À propos d'EasyInvoiceOCR",
      heroLede:
        "Simplifier le traitement des factures et des reçus pour les entreprises de toutes tailles.",
      mission: "Notre Mission",
      missionBody: `Nous avons créé EasyInvoiceOCR pour résoudre un vrai problème : passer des heures à saisir manuellement les données des factures et des reçus est coûteux et sujet aux erreurs. Notre plateforme utilise la reconnaissance optique de caractères (OCR) pour extraire les données automatiquement, transformant les documents papier et numériques en données structurées qui peuvent être intégrées directement dans votre logiciel comptable, vos feuilles de calcul ou votre base de données.

Nous sommes attachés à maintenir le processus simple et transparent—pas de configurations compliquées, pas d'intégrations propriétaires, et pas de dépendance vis-à-vis d'un seul fournisseur.`,
      features: "Pourquoi Choisir EasyInvoiceOCR",
      privacy: "Confidentialité d'Abord",
      privacyBody:
        "Vos documents restent sur votre appareil. Le traitement côté client signifie que nous ne voyons jamais vos fichiers à moins que vous choisissiez explicitement d'utiliser des services cloud.",
      security: "Sécurité Professionnelle",
      securityBody:
        "La sécurité au niveau des lignes isole les données utilisateur. Tous les mots de passe sont gérés par Supabase Auth, et toutes les données stockées sont chiffrées au repos.",
      accuracy: "Vérifié, pas deviné",
      accuryBody:
        "La reconnaissance couvre les documents numérisés et les photos, en anglais, en français et en arabe. Chaque champ extrait est accompagné d'un indice de confiance, et tout élément incertain est signalé pour vérification plutôt que deviné.",
      technology: "Technologie",
      technologyBody: `EasyInvoiceOCR s'exécute principalement sur votre ordinateur :

• Les conversions (PDF/Image vers Word, Image vers PDF) utilisent des bibliothèques côté client.
• La reconnaissance de texte utilise Tesseract.js, un moteur OCR open-source compilé en WebAssembly.
• L'extraction des factures et des reçus utilise les mêmes lecteurs : la couche de texte du PDF lorsqu'elle existe, Tesseract dans le cas contraire.

Toutes les données d'abonnement et d'utilisateur sont stockées dans Supabase, une plateforme basée sur PostgreSQL avec des politiques de sécurité au niveau des lignes appliquées au niveau de la base de données. Le traitement des paiements est effectué via PayPal, et toutes les signatures de webhook sont vérifiées côté serveur.`,
      team: "L'Équipe",
      teamBody:
        "EasyInvoiceOCR est une petite équipe focalisée qui construit cet outil pour résoudre un problème que nous avons expérimenté nous-mêmes. Nous sommes attachés à livrer un logiciel fonctionnel et à itérer en fonction des commentaires réels des utilisateurs.",
    },
    ar: {
      hero: "حول EasyInvoiceOCR",
      heroLede: "جعل معالجة الفواتير والإيصالات سريعة وآمنة وسهلة الوصول للشركات من جميع الأحجام.",
      mission: "مهمتنا",
      missionBody: `قمنا بإنشاء EasyInvoiceOCR لحل مشكلة حقيقية: قضاء ساعات في كتابة بيانات الفواتير والإيصالات يدويًا مكلف وعرضة للأخطاء. تستخدم منصتنا التعرف الضوئي على الأحرف (OCR) لاستخراج البيانات تلقائيًا، مما يحول المستندات الورقية والرقمية إلى بيانات منظمة يمكن نقلها مباشرة إلى برنامج المحاسبة أو جداول البيانات أو قاعدة البيانات لديك.

نحن ملتزمون بالحفاظ على العملية بسيطة وشفافة—بدون تكوينات معقدة، بدون تكاملات ملكية، وبدون حبس البائع.`,
      features: "لماذا تختار EasyInvoiceOCR",
      privacy: "الخصوصية أولاً",
      privacyBody:
        "تبقى مستنداتك على جهازك. معالجة من جانب العميل تعني أننا لا نرى ملفاتك إلا إذا اخترت بصراحة استخدام الخدمات السحابية.",
      security: "الأمان على مستوى المؤسسة",
      securityBody:
        "الأمان على مستوى الصفوف يعزل بيانات المستخدم. جميع كلمات المرور يتم التعامل معها من خلال Supabase Auth، وجميع البيانات المخزنة مشفرة أثناء الراحة.",
      accuracy: "مراجَع لا مخمَّن",
      accuryBody:
        "يشمل التعرّف المستندات الممسوحة والصور بالإنجليزية والفرنسية والعربية. ولكل حقل مستخرَج درجة ثقة، وأي عنصر غير مؤكد يُعلَّم للمراجعة بدل تخمينه.",
      technology: "التكنولوجيا",
      technologyBody: `يعمل EasyInvoiceOCR بشكل أساسي على جهاز الكمبيوتر الخاص بك:

• التحويلات (PDF/صورة إلى Word، صورة إلى PDF) تستخدم مكتبات من جانب العميل.
• يستخدم التعرف على النص Tesseract.js، وهو محرك OCR مفتوح المصدر مترجم إلى WebAssembly.
• يستخدم استخراج الفواتير والإيصالات القارئات نفسها: طبقة النص الأصلية في ملف PDF إن وُجدت، وTesseract إن لم توجد.

يتم تخزين جميع بيانات الاشتراك والمستخدم في Supabase، وهي منصة قائمة على PostgreSQL مع سياسات الأمان على مستوى الصفوف المفروضة على مستوى قاعدة البيانات. يتم التعامل مع معالجة الدفع من خلال PayPal، وتتم التحقق من جميع توقيعات webhook على جانب الخادم.`,
      team: "الفريق",
      teamBody:
        "EasyInvoiceOCR فريق صغير ومركز يبني هذه الأداة لحل مشكلة واجهناها بأنفسنا. نحن ملتزمون بشحن البرامج العاملة والتكرار بناءً على تعليقات المستخدمين الحقيقية.",
    },
  };

  const c = content[locale];

  return (
    <PageLayout breadcrumbs={[{ label: t("link.about") }]}>
      <PageHero title={c.hero} lede={c.heroLede} />

      <Section title={c.mission}>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.missionBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.features} muted>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold text-navy">{c.privacy}</h3>
            <p className="text-sm text-muted-foreground">{c.privacyBody}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold text-navy">{c.security}</h3>
            <p className="text-sm text-muted-foreground">{c.securityBody}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-3 font-semibold text-navy">{c.accuracy}</h3>
            <p className="text-sm text-muted-foreground">{c.accuryBody}</p>
          </div>
        </div>
      </Section>

      <Section title={c.technology}>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.technologyBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.team} muted>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.teamBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>
    </PageLayout>
  );
}
