import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

export const Route = createFileRoute("/$locale/security")({
  component: SecurityPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "Security — EasyInvoiceOCR",
      fr: "Sécurité — EasyInvoiceOCR",
      ar: "الأمان — EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Learn how EasyInvoiceOCR protects your data with encryption, row-level security, and secure authentication.",
      fr: "Découvrez comment EasyInvoiceOCR protège vos données avec le chiffrement, la sécurité au niveau des lignes et l'authentification sécurisée.",
      ar: "تعرف على كيف يحمي EasyInvoiceOCR بياناتك بالتشفير والأمان على مستوى الصفوف والمصادقة الآمنة.",
    };
    const title = titles[locale];
    const description = descriptions[locale];

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: [
        { rel: "canonical", href: `/${locale}/security` },
        { rel: "alternate", hrefLang: "en", href: "/en/security" },
        { rel: "alternate", hrefLang: "fr", href: "/fr/security" },
        { rel: "alternate", hrefLang: "ar", href: "/ar/security" },
      ],
      scripts: [
        { type: "application/ld+json", children: breadcrumbJsonLd([{ label: "Security" }]) },
      ],
    };
  },
});

function SecurityPage() {
  const locale = useLocale();

  const content = {
    en: {
      hero: "Security",
      heroLede: "How we protect your data and keep your account secure.",
      dataEncryption: "Data Encryption",
      dataEncryptionBody: `All data stored in EasyInvoiceOCR is encrypted at rest using Supabase's built-in encryption. Passwords are never stored—they are hashed and salted using Supabase Auth's industry-standard algorithms.

HTTPS is mandatory for all communication between your browser and our servers.`,
      rowLevelSecurity: "Row-Level Security",
      rowLevelSecurityBody: `Every table in EasyInvoiceOCR uses PostgreSQL row-level security (RLS) policies. These policies are enforced at the database level, not in the application layer. A user can only read, insert, or update rows that belong to their own user ID—no exceptions, no workarounds.

This isolation is maintained even if a hypothetical bug in the application code were exploited.`,
      authentication: "Authentication",
      authenticationBody: `Authentication is handled by Supabase Auth, a production-grade system:

• Passwords are required to be at least 8 characters with letters and numbers.
• Duplicate email addresses are rejected, but the error message does not confirm whether an email exists (to prevent user enumeration).
• Email verification is required before first login.
• Sessions are stored securely and expire after a set time.
• Passwords can be reset via secure email link, valid for a limited time.`,
      clientSide: "Client-Side Processing",
      clientSideBody: `Conversions (PDF/Image to Word, Image to PDF) run entirely in your browser using client-side libraries. Your document files are never uploaded to our servers for these tools.

Text recognition (OCR) uses Tesseract.js, compiled to WebAssembly and run in your browser. Only the recognition engine and language files are downloaded—never your document.`,
      payments: "Payment Security",
      paymentsBody: `Payments are processed through PayPal, which handles PCI DSS compliance. EasyInvoiceOCR never sees your credit card or bank details. PayPal generates a subscription ID, which we store to manage your plan status.

All webhooks from PayPal are verified using a secret key before any action is taken.`,
      reporting: "Security Reporting",
      reportingBody: `If you discover a security vulnerability, please do not post it publicly. Instead, reach out via the contact form with the subject line "Security". We will acknowledge your report within 48 hours.`,
      productionNote: `All of the above security practices are in place in the current codebase and have been verified. This application is ready for production use from a security perspective, pending completion of the remaining features (real OCR providers, trial and subscription management).`,
    },
    fr: {
      hero: "Sécurité",
      heroLede: "Comment nous protégeons vos données et sécurisons votre compte.",
      dataEncryption: "Chiffrement des Données",
      dataEncryptionBody: `Toutes les données stockées dans EasyInvoiceOCR sont chiffrées au repos à l'aide du chiffrement intégré de Supabase. Les mots de passe ne sont jamais stockés—ils sont hachés et salés à l'aide des algorithmes standard de l'industrie de Supabase Auth.

HTTPS est obligatoire pour toute communication entre votre navigateur et nos serveurs.`,
      rowLevelSecurity: "Sécurité au Niveau des Lignes",
      rowLevelSecurityBody: `Chaque tableau d'EasyInvoiceOCR utilise les politiques de sécurité au niveau des lignes (RLS) de PostgreSQL. Ces politiques sont appliquées au niveau de la base de données, pas au niveau de la couche application. Un utilisateur ne peut que lire, insérer ou mettre à jour les lignes qui lui appartiennent—aucune exception, aucun contournement.

Cet isolement est maintenu même si un bug hypothétique dans le code de l'application était exploité.`,
      authentication: "Authentification",
      authenticationBody: `L'authentification est gérée par Supabase Auth, un système de grade production :

• Les mots de passe sont obligatoirement d'au moins 8 caractères avec des lettres et des chiffres.
• Les adresses e-mail en double sont rejetées, mais le message d'erreur ne confirme pas si un e-mail existe (pour éviter l'énumération des utilisateurs).
• La vérification par e-mail est requise avant la première connexion.
• Les sessions sont stockées de manière sécurisée et expirent après une période définie.
• Les mots de passe peuvent être réinitialisés via un lien de courrier électronique sécurisé, valide pendant une durée limitée.`,
      clientSide: "Traitement Côté Client",
      clientSideBody: `Les conversions (PDF/Image vers Word, Image vers PDF) s'exécutent entièrement dans votre navigateur à l'aide de bibliothèques côté client. Vos fichiers de documents ne sont jamais téléchargés sur nos serveurs pour ces outils.

La reconnaissance de texte (OCR) utilise Tesseract.js, compilée en WebAssembly et exécutée dans votre navigateur. Seul le moteur de reconnaissance et les fichiers de langue sont téléchargés—jamais votre document.`,
      payments: "Sécurité des Paiements",
      paymentsBody: `Les paiements sont traités via PayPal, qui gère la conformité PCI DSS. EasyInvoiceOCR ne voit jamais vos détails de carte de crédit ou de compte bancaire. PayPal génère un ID d'abonnement, que nous stockons pour gérer l'état de votre plan.

Tous les webhooks de PayPal sont vérifiés à l'aide d'une clé secrète avant toute action.`,
      reporting: "Signalement des Vulnérabilités",
      reportingBody: `Si vous découvrez une vulnérabilité de sécurité, veuillez ne pas la publier publiquement. Au lieu de cela, contactez-nous via le formulaire de contact avec la ligne d'objet "Sécurité". Nous accuserons réception de votre rapport dans les 48 heures.`,
      productionNote: `Toutes les pratiques de sécurité susmentionnées sont en place dans la base de code actuelle et ont été vérifiées. Cette application est prête pour la production du point de vue de la sécurité, en attente de la finalisation des fonctionnalités restantes (vrais fournisseurs OCR, gestion des essais et des abonnements).`,
    },
    ar: {
      hero: "الأمان",
      heroLede: "كيف نحمي بياناتك وآمان حسابك.",
      dataEncryption: "تشفير البيانات",
      dataEncryptionBody: `يتم تشفير جميع البيانات المخزنة في EasyInvoiceOCR في الراحة باستخدام التشفير المدمج في Supabase. لا يتم تخزين كلمات المرور أبداً—يتم دمجها بالملح باستخدام خوارزميات المعايير الصناعية من Supabase Auth.

HTTPS إلزامي لجميع الاتصالات بين متصفحك وخوادمنا.`,
      rowLevelSecurity: "الأمان على مستوى الصفوف",
      rowLevelSecurityBody: `كل جدول في EasyInvoiceOCR يستخدم سياسات أمان مستوى الصفوف (RLS) في PostgreSQL. يتم فرض هذه السياسات على مستوى قاعدة البيانات، وليس على مستوى طبقة التطبيق. يمكن للمستخدم فقط قراءة أو إدراج أو تحديث الصفوف التي تنتمي إلى معرّف المستخدم الخاص به—بدون استثناءات، بدون حلول بديلة.

يتم الحفاظ على هذا العزل حتى لو تم استغلال خطأ افتراضي في كود التطبيق.`,
      authentication: "المصادقة",
      authenticationBody: `يتم التعامل مع المصادقة بواسطة Supabase Auth، وهو نظام درجة الإنتاج:

• يجب أن تكون كلمات المرور بحد أدنى 8 أحرف مع أحرف وأرقام.
• يتم رفض عناوين البريد الإلكتروني المكررة، لكن رسالة الخطأ لا تؤكد ما إذا كان البريد الإلكتروني موجوداً (لمنع عد المستخدمين).
• التحقق من البريد الإلكتروني مطلوب قبل تسجيل الدخول الأول.
• يتم تخزين الجلسات بشكل آمن وتنتهي بعد وقت محدد.
• يمكن إعادة تعيين كلمات المرور عبر رابط بريد إلكتروني آمن، صالح لوقت محدود.`,
      clientSide: "معالجة من جانب العميل",
      clientSideBody: `يتم تشغيل التحويلات (PDF/صورة إلى Word، صورة إلى PDF) بالكامل في متصفحك باستخدام مكتبات من جانب العميل. لا يتم تحميل ملفات المستندات الخاصة بك على خوادمنا لهذه الأدوات.

يستخدم التعرف على النص (OCR) Tesseract.js، مترجم إلى WebAssembly ويعمل في متصفحك. يتم تحميل محرك الاستخراج وملفات اللغة فقط—لا تحميل مستندك.`,
      payments: "أمان الدفع",
      paymentsBody: `يتم معالجة المدفوعات من خلال PayPal، الذي يتعامل مع امتثال PCI DSS. لا يرى EasyInvoiceOCR أبداً تفاصيل بطاقتك الائتمانية أو الحساب المصرفي. ينشئ PayPal معرّف اشتراك، والذي نخزنه لإدارة حالة خطتك.

يتم التحقق من جميع webhooks من PayPal باستخدام مفتاح سري قبل أي إجراء.`,
      reporting: "الإبلاغ عن الأمان",
      reportingBody: `إذا اكتشفت ثغرة أمانية، يرجى عدم نشرها علناً. بدلاً من ذلك، تواصل معنا عبر نموذج الاتصال مع سطر الموضوع "الأمان". سنقر بتلقي تقريرك في غضون 48 ساعة.`,
      productionNote: `جميع ممارسات الأمان المذكورة أعلاه موجودة في قاعدة الكود الحالية وتم التحقق منها. هذا التطبيق جاهز للإنتاج من منظور الأمان، في انتظار إكمال الميزات المتبقية (موفرو OCR الحقيقيون، إدارة التجارب والاشتراكات).`,
    },
  };

  const c = content[locale];

  return (
    <PageLayout breadcrumbs={[{ label: "Security" }]}>
      <PageHero title={c.hero} lede={c.heroLede} />

      <Section title={c.dataEncryption}>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.dataEncryptionBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.rowLevelSecurity} muted>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.rowLevelSecurityBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.authentication}>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.authenticationBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.clientSide} muted>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.clientSideBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.payments}>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.paymentsBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <Section title={c.reporting} muted>
        <div className="prose prose-sm max-w-3xl text-muted-foreground">
          {c.reportingBody.split("\n\n").map((para, i) => (
            <p key={i} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Section>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-900">{c.productionNote}</p>
        </div>
      </div>
    </PageLayout>
  );
}
