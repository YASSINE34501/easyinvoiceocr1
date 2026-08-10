import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { translate, asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/cookies")({
  component: CookiesPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "Cookie Policy — EasyInvoiceOCR",
      fr: "Politique Relative aux Cookies — EasyInvoiceOCR",
      ar: "سياسة ملفات تعريف الارتباط — EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Learn about the cookies and tracking technologies used by EasyInvoiceOCR.",
      fr: "Découvrez les cookies et les technologies de suivi utilisés par EasyInvoiceOCR.",
      ar: "تعرف على ملفات تعريف الارتباط وتقنيات التتبع المستخدمة بواسطة EasyInvoiceOCR.",
    };
    const title = titles[locale];
    const description = descriptions[locale];

    return {
      meta: [
        robotsMeta("cookies"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("cookies", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: translate(locale, "link.cookies") }]),
        },
      ],
    };
  },
});

function CookiesPage() {
  const t = useT();
  const locale = useLocale();

  const content = {
    en: {
      title: "Cookie Policy",
      intro:
        "This page explains what cookies are, how EasyInvoiceOCR uses them, and how you can manage your preferences.",
      whatAre: "What Are Cookies?",
      whatAreBody: `Cookies are small text files stored on your device by your web browser when you visit a website. They store information about your browsing behavior and preferences. Most cookies have an expiration date and are deleted automatically. Some cookies are deleted when you close your browser (session cookies), while others persist for months or years (persistent cookies).

Cookies are not programs or viruses—they are inert text files that cannot execute code on your device.`,
      whyUse: "Why We Use Cookies",
      whyUseBody: `EasyInvoiceOCR uses cookies to:

• Keep you logged in across pages (session management)
• Remember your language preference and interface settings
• Protect your account from unauthorized access
• Analyze how users interact with the site (analytics)
• Improve the product based on usage patterns`,
      types: "Types of Cookies We Use",
      essential: "Essential Cookies",
      essentialBody: `These cookies are required for EasyInvoiceOCR to function. They are always active and cannot be disabled:

• Session ID: Maintains your login status while you browse
• CSRF Token: Protects against cross-site request forgery attacks
• Security Flags: Signal security settings to your browser`,
      preferences: "Preference Cookies",
      preferencesBody: `These cookies remember your choices so you don't have to make them again:

• Language: Your preferred language (en, fr, ar)
• Theme: Whether you prefer light or dark mode (if available)
• Cookie Consent: Your cookie preference settings`,
      analytics: "Analytics Cookies (Optional)",
      analyticsBody: `These cookies collect anonymous information about how you use the site:

• Page Views: Which pages you visit
• Time Spent: How long you spend on each page
• Click Behavior: Which buttons and links you click
• Device Type: Whether you're using mobile or desktop

Analytics cookies are disabled by default. They only load if you explicitly consent through the cookie banner.

EasyInvoiceOCR does not use third-party analytics services that track users across multiple websites. Any analytics we collect are stored internally and not shared with external advertising networks.`,
      thirdParty: "Third-Party Cookies",
      thirdPartyBody: `EasyInvoiceOCR does not use third-party cookies from advertisers or data brokers. The only external service that may set cookies is PayPal during payment processing, which is governed by their privacy policy.`,
      manage: "How to Manage Cookies",
      manageBody: `You can control cookies in several ways:

1. Cookie Banner: Use the banner at the bottom of this website to accept or reject analytics cookies. Your preference is saved immediately.

2. Browser Settings: Most browsers allow you to manage cookies directly:
   • Chrome: Settings > Privacy and Security > Cookies and other site data
   • Firefox: Preferences > Privacy & Security > Cookies and Site Data
   • Safari: Preferences > Privacy > Manage Website Data
   • Edge: Settings > Privacy > Cookies and other site data

3. Clearing Cookies: You can delete all cookies stored on your device from your browser settings. Note that this may log you out of your account and require you to re-enter preferences.

4. Do Not Track: You can enable "Do Not Track" in your browser settings. EasyInvoiceOCR respects this signal and will not load analytics cookies if it's enabled.`,
      important: "Important Notes",
      importantBody: `• Disabling essential cookies will prevent EasyInvoiceOCR from working. Your login will not persist across pages, and your account will not be secure.
• Disabling preference cookies means you'll need to set your language and preferences each time you visit.
• You can enable or disable analytics cookies at any time—your choice is saved immediately.
• When you delete your account, all cookies associated with it are invalidated.`,
      contact: "Questions or Concerns?",
      contactBody: `If you have questions about our cookie policy or how we use cookies, contact us using the contact form on this website.`,
    },
    fr: {
      title: "Politique Relative aux Cookies",
      intro:
        "Cette page explique ce que sont les cookies, comment EasyInvoiceOCR les utilise et comment vous pouvez gérer vos préférences.",
      whatAre: "Que Sont les Cookies ?",
      whatAreBody: `Les cookies sont de petits fichiers texte stockés sur votre appareil par votre navigateur web lorsque vous visitez un site. Ils stockent des informations sur votre comportement de navigation et vos préférences. La plupart des cookies ont une date d'expiration et sont supprimés automatiquement. Certains cookies sont supprimés lorsque vous fermez votre navigateur (cookies de session), tandis que d'autres persistent pendant des mois ou des années (cookies persistants).

Les cookies ne sont pas des programmes ou des virus—ils sont des fichiers texte inactifs qui ne peuvent pas exécuter de code sur votre appareil.`,
      whyUse: "Pourquoi Nous Utilisons les Cookies",
      whyUseBody: `EasyInvoiceOCR utilise des cookies pour :

• Vous maintenir connecté sur les pages (gestion de session)
• Mémoriser votre préférence de langue et vos paramètres d'interface
• Protéger votre compte contre l'accès non autorisé
• Analyser comment les utilisateurs interagissent avec le site (analytique)
• Améliorer le produit en fonction des tendances d'utilisation`,
      types: "Types de Cookies Que Nous Utilisons",
      essential: "Cookies Essentiels",
      essentialBody: `Ces cookies sont nécessaires pour qu'EasyInvoiceOCR fonctionne. Ils sont toujours actifs et ne peuvent pas être désactivés :

• ID de Session : Maintient votre statut de connexion pendant que vous naviguez
• Jeton CSRF : Protège contre les attaques de falsification de requête intersite
• Drapeaux de Sécurité : Signal des paramètres de sécurité à votre navigateur`,
      preferences: "Cookies de Préférences",
      preferencesBody: `Ces cookies mémorisent vos choix afin que vous n'ayez pas à les refaire :

• Langue : Votre langue préférée (en, fr, ar)
• Thème : Si vous préférez le mode clair ou sombre (si disponible)
• Consentement aux Cookies : Vos paramètres de préférence aux cookies`,
      analytics: "Cookies d'Analytique (Facultatif)",
      analyticsBody: `Ces cookies collectent des informations anonymes sur la façon dont vous utilisez le site :

• Pages Vues : Quelles pages vous visitez
• Temps Passé : Combien de temps vous passez sur chaque page
• Comportement de Clic : Quels boutons et liens vous cliquez
• Type d'Appareil : Si vous utilisez le mobile ou le bureau

Les cookies d'analytique sont désactivés par défaut. Ils ne se chargent que si vous y consentez explicitement via la bannière de cookies.

EasyInvoiceOCR n'utilise pas de services d'analytique tiers qui suivent les utilisateurs sur plusieurs sites. Tout analytique que nous collectons est stocké en interne et non partagé avec des réseaux publicitaires externes.`,
      thirdParty: "Cookies de Tiers",
      thirdPartyBody: `EasyInvoiceOCR n'utilise pas les cookies de tiers des annonceurs ou des courtiers de données. Le seul service externe qui peut définir des cookies est PayPal lors du traitement des paiements, qui est régi par sa politique de confidentialité.`,
      manage: "Comment Gérer les Cookies",
      manageBody: `Vous pouvez contrôler les cookies de plusieurs façons :

1. Bannière de Cookies : Utilisez la bannière en bas de ce site pour accepter ou rejeter les cookies d'analytique. Votre préférence est enregistrée immédiatement.

2. Paramètres du Navigateur : La plupart des navigateurs vous permettent de gérer les cookies directement :
   • Chrome : Paramètres > Confidentialité et sécurité > Cookies et autres données du site
   • Firefox : Préférences > Confidentialité et sécurité > Cookies et données du site
   • Safari : Préférences > Confidentialité > Gérer les données du site
   • Edge : Paramètres > Confidentialité > Cookies et autres données du site

3. Effacer les Cookies : Vous pouvez supprimer tous les cookies stockés sur votre appareil à partir des paramètres de votre navigateur. Notez que cela peut vous déconnecter de votre compte et vous obliger à re-entrer vos préférences.

4. Ne pas Suivre : Vous pouvez activer "Ne pas Suivre" dans les paramètres de votre navigateur. EasyInvoiceOCR respecte ce signal et ne chargera pas les cookies d'analytique s'il est activé.`,
      important: "Remarques Importantes",
      importantBody: `• La désactivation des cookies essentiels empêchera EasyInvoiceOCR de fonctionner. Votre connexion ne persistera pas sur les pages, et votre compte ne sera pas sécurisé.
• La désactivation des cookies de préférences signifie que vous devrez définir votre langue et vos préférences à chaque visite.
• Vous pouvez activer ou désactiver les cookies d'analytique à tout moment—votre choix est enregistré immédiatement.
• Lorsque vous supprimez votre compte, tous les cookies associés sont invalidés.`,
      contact: "Des Questions ou des Préoccupations ?",
      contactBody: `Si vous avez des questions sur notre politique relative aux cookies ou sur la façon dont nous utilisons les cookies, contactez-nous en utilisant le formulaire de contact sur ce site.`,
    },
    ar: {
      title: "سياسة ملفات تعريف الارتباط",
      intro:
        "تشرح هذه الصفحة ما هي ملفات تعريف الارتباط وكيف يستخدمها EasyInvoiceOCR وكيف يمكنك إدارة تفضيلاتك.",
      whatAre: "ما هي ملفات تعريف الارتباط؟",
      whatAreBody: `ملفات تعريف الارتباط عبارة عن ملفات نصية صغيرة يتم تخزينها على جهازك من قبل متصفح الويب الخاص بك عند زيارة موقع ويب. تخزن معلومات حول سلوك التصفح والتفضيلات الخاصة بك. تحتوي معظم ملفات تعريف الارتباط على تاريخ انتهاء الصلاحية ويتم حذفها تلقائياً. يتم حذف بعض ملفات تعريف الارتباط عند إغلاق متصفحك (ملفات تعريف جلسة العمل)، بينما يستمر الآخرون لأشهر أو سنوات (ملفات تعريف دائمة).

ملفات تعريف الارتباط ليست برامج أو فيروسات—فهي ملفات نصية خاملة لا يمكنها تنفيذ رمز على جهازك.`,
      whyUse: "لماذا نستخدم ملفات تعريف الارتباط",
      whyUseBody: `يستخدم EasyInvoiceOCR ملفات تعريف الارتباط لـ :

• إبقاؤك مسجلاً الدخول عبر الصفحات (إدارة الجلسة)
• تذكر تفضيل اللغة والإعدادات الخاصة بك
• حماية حسابك من الوصول غير المصرح به
• تحليل كيفية تفاعل المستخدمين مع الموقع (التحليلات)
• تحسين المنتج بناءً على أنماط الاستخدام`,
      types: "أنواع ملفات تعريف الارتباط التي نستخدمها",
      essential: "ملفات تعريف الارتباط الأساسية",
      essentialBody: `هذه ملفات تعريف الارتباط مطلوبة لـ EasyInvoiceOCR للعمل. هي دائماً نشطة ولا يمكن تعطيلها :

• معرف الجلسة : يحافظ على حالة تسجيل الدخول الخاص بك أثناء التصفح
• رمز CSRF : يحمي من هجمات تزييف الطلب عبر الموقع
• أعلام الأمان : تشير إلى إعدادات الأمان لمتصفحك`,
      preferences: "ملفات تعريف الارتباط للتفضيلات",
      preferencesBody: `هذه ملفات تعريف الارتباط تتذكر اختياراتك حتى لا تضطر إلى القيام بها مرة أخرى :

• اللغة : اللغة المفضلة لديك (en، fr، ar)
• المظهر : ما إذا كنت تفضل الوضع الفاتح أو الداكن (إن أمكن)
• موافقة ملفات تعريف الارتباط : إعدادات تفضيل ملفات تعريف الارتباط الخاصة بك`,
      analytics: "ملفات تعريف الارتباط للتحليلات (اختياري)",
      analyticsBody: `تجمع هذه ملفات تعريف الارتباط معلومات مجهولة الهوية حول كيفية استخدامك للموقع :

• عرض الصفحات : الصفحات التي تزورها
• الوقت المستغرق : كم من الوقت تقضيه على كل صفحة
• سلوك النقر : أي أزرار وروابط تنقر عليها
• نوع الجهاز : ما إذا كنت تستخدم الهاتف المحمول أو سطح المكتب

يتم تعطيل ملفات تعريف الارتباط للتحليلات افتراضياً. تحميلها فقط إذا وافقت بصراحة من خلال لافتة ملفات تعريف الارتباط.

لا يستخدم EasyInvoiceOCR خدمات تحليلية تابعة لجهات خارجية تتتبع المستخدمين عبر مواقع ويب متعددة. أي تحليل نجمعه يتم تخزينه داخلياً ولا يتم مشاركته مع شبكات إعلانية خارجية.`,
      thirdParty: "ملفات تعريف الارتباط الخاصة بالطرف الثالث",
      thirdPartyBody: `لا يستخدم EasyInvoiceOCR ملفات تعريف الارتباط الخاصة بالطرف الثالث من المعلنين أو الوسطاء للبيانات. الخدمة الخارجية الوحيدة التي قد تعيين ملفات تعريف الارتباط هي PayPal أثناء معالجة الدفع، والذي تحكمه سياسة الخصوصية الخاصة به.`,
      manage: "كيفية إدارة ملفات تعريف الارتباط",
      manageBody: `يمكنك التحكم في ملفات تعريف الارتباط بعدة طرق :

1. لافتة ملفات تعريف الارتباط : استخدم اللافتة في أسفل هذا الموقع لقبول أو رفض ملفات تعريف الارتباط للتحليلات. يتم حفظ تفضيلك على الفور.

2. إعدادات المتصفح : تسمح معظم المتصفحات بإدارة ملفات تعريف الارتباط مباشرة :
   • Chrome : الإعدادات > الخصوصية والأمان > ملفات تعريف الارتباط والبيانات الأخرى للموقع
   • Firefox : التفضيلات > الخصوصية والأمان > ملفات تعريف الارتباط وبيانات الموقع
   • Safari : التفضيلات > الخصوصية > إدارة بيانات الموقع
   • Edge : الإعدادات > الخصوصية > ملفات تعريف الارتباط والبيانات الأخرى للموقع

3. مسح ملفات تعريف الارتباط : يمكنك حذف جميع ملفات تعريف الارتباط المخزنة على جهازك من إعدادات المتصفح. لاحظ أن هذا قد يسجلك خارج حسابك ويتطلب منك إعادة إدخال التفضيلات.

4. عدم التتبع : يمكنك تمكين "عدم التتبع" في إعدادات المتصفح. يحترم EasyInvoiceOCR هذا الإشارة ولن يحمل ملفات تعريف الارتباط للتحليلات إذا تم تفعيله.`,
      important: "ملاحظات مهمة",
      importantBody: `• سيؤدي تعطيل ملفات تعريف الارتباط الأساسية إلى منع EasyInvoiceOCR من العمل. لن تستمر تسجيل الدخول الخاص بك عبر الصفحات، وحسابك لن يكون آمناً.
• يعني تعطيل ملفات تعريف الارتباط للتفضيلات أنه يتعين عليك تعيين اللغة والتفضيلات الخاصة بك في كل مرة تزور فيها.
• يمكنك تمكين أو تعطيل ملفات تعريف الارتباط للتحليلات في أي وقت—يتم حفظ اختيارك على الفور.
• عند حذف حسابك، يتم إبطال جميع ملفات تعريف الارتباط المرتبطة به.`,
      contact: "أسئلة أو مخاوف؟",
      contactBody: `إذا كان لديك أسئلة حول سياسة ملفات تعريف الارتباط الخاصة بنا أو كيفية استخدامنا لملفات تعريف الارتباط، فيرجى الاتصال بنا باستخدام نموذج الاتصال على هذا الموقع.`,
    },
  };

  const c = content[locale];

  return (
    <PageLayout breadcrumbs={[{ label: t("link.cookies") }]}>
      <PageHero title={c.title} />
      <Section>
        <p className="mb-8 text-muted-foreground">{c.intro}</p>

        <div className="space-y-8 max-w-3xl">
          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.whatAre}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.whatAreBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.whyUse}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.whyUseBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.types}</h2>

            <div className="mb-6">
              <h3 className="mb-2 font-medium text-navy">{c.essential}</h3>
              <div className="prose prose-sm text-muted-foreground">
                {c.essentialBody.split("\n\n").map((para, i) => (
                  <p key={i} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 font-medium text-navy">{c.preferences}</h3>
              <div className="prose prose-sm text-muted-foreground">
                {c.preferencesBody.split("\n\n").map((para, i) => (
                  <p key={i} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 font-medium text-navy">{c.analytics}</h3>
              <div className="prose prose-sm text-muted-foreground">
                {c.analyticsBody.split("\n\n").map((para, i) => (
                  <p key={i} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.thirdParty}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.thirdPartyBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.manage}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.manageBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.important}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.importantBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-navy">{c.contact}</h2>
            <div className="prose prose-sm text-muted-foreground">
              {c.contactBody.split("\n\n").map((para, i) => (
                <p key={i} className="leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}
