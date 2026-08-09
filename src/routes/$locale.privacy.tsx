import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/privacy")({
  component: PrivacyPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "Privacy Policy — EasyInvoiceOCR",
      fr: "Politique de Confidentialité — EasyInvoiceOCR",
      ar: "سياسة الخصوصية — EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Learn how EasyInvoiceOCR collects, uses, and protects your personal data.",
      fr: "Découvrez comment EasyInvoiceOCR collecte, utilise et protège vos données personnelles.",
      ar: "تعرف على كيفية جمع وتخزين وحماية بياناتك الشخصية.",
    };
    const title = titles[locale];
    const description = descriptions[locale];

    return {
      meta: [
        robotsMeta("privacy"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "robots", content: "index, follow" },
      ],
      links: seoLinks("privacy", locale),
      scripts: [
        { type: "application/ld+json", children: breadcrumbJsonLd([{ label: "Privacy" }]) },
      ],
    };
  },
});

function PrivacyPage() {
  const t = useT();
  const locale = useLocale();

  const content = {
    en: {
      title: "Privacy Policy",
      note: "Internal note: this text is a good-faith draft written for a pre-launch product. It requires review by a qualified lawyer before commercial launch.",
      sections: [
        {
          heading: "1. Information We Collect",
          body: `We collect information you provide directly to us:

• Account Information: Your name, email, company, and password (hashed and salted by Supabase Auth).
• Profile Information: Preferred language and any settings you configure.
• Usage Information: Technical logs including IP address, browser type, pages visited, and time spent.
• Payment Information: Processed through PayPal. We never directly access your credit card or bank details.
• Messages: If you contact us, we store your message and our reply.
• Document Metadata: Filename, file size, and upload timestamp. The documents themselves are processed client-side and not stored on our servers unless you opt into a cloud service.`,
        },
        {
          heading: "2. How We Use Your Information",
          body: `We use your information to:

• Provide and improve the service
• Process your subscription and payments
• Send you transactional emails (password reset, receipt confirmation, trial reminders)
• Respond to your messages and support requests
• Analyze usage patterns to improve product quality
• Detect and prevent fraud or abuse
• Comply with legal obligations`,
        },
        {
          heading: "3. Client-Side Processing",
          body: `Most conversions (PDF/Image to Word, Image to PDF) run entirely in your browser. Your files are not uploaded to us. Only your browser processes them.

Text recognition (OCR) uses Tesseract.js, which also runs in your browser. The recognition engine and language files are downloaded from a public CDN, but your document is never sent to anyone else.`,
        },
        {
          heading: "4. Data Storage and Security",
          body: `Your data is stored in Supabase, a PostgreSQL database with:

• Encryption at rest
• Row-level security policies that prevent other users from accessing your data
• Automated daily backups
• All communication over HTTPS

We follow industry best practices for data protection, including the principle of data minimization—we only store what is necessary to provide the service.`,
        },
        {
          heading: "5. Sharing of Information",
          body: `We do not sell or rent your personal data to third parties. We share data only as necessary to:

• Provide the service (e.g., PayPal for payment processing, Supabase for data storage)
• Comply with legal requests from authorities
• Protect against fraud or security threats

All service providers we use are contractually bound to keep your data confidential and use it only for the purposes we specify.`,
        },
        {
          heading: "6. Your Rights",
          body: `Depending on your location, you may have rights to:

• Access: Request a copy of the data we hold about you
• Correction: Request that we correct inaccurate data
• Deletion: Request that we delete your data (right to be forgotten)
• Portability: Request your data in a portable format
• Withdrawal of Consent: Opt out of marketing communications at any time

To exercise these rights, contact us using the contact form on this website.`,
        },
        {
          heading: "7. Cookies and Tracking",
          body: `We use cookies for:

• Essential: Session management, security, and remembering your login
• Preferences: Remembering your language choice and interface preferences
• Analytics (optional): Anonymous usage statistics to help us improve the product

You can manage cookie preferences through the banner on this website. Essential cookies cannot be disabled as they are required for the service to function.`,
        },
        {
          heading: "8. Retention",
          body: `We retain your account data for as long as you maintain an active account. When you delete your account, all associated data is deleted within 30 days, except where we are legally required to retain it (e.g., for tax purposes).

Uploaded documents are kept for 24 hours after conversion, then automatically deleted. Contact messages are kept indefinitely to provide a record of your correspondence with us.`,
        },
        {
          heading: "9. Third-Party Links",
          body: `This website contains links to third-party websites. We are not responsible for their privacy practices. We encourage you to review their privacy policies before providing any information.`,
        },
        {
          heading: "10. Changes to This Policy",
          body: `We may update this privacy policy from time to time. Changes are effective immediately upon posting. We will notify you of significant changes via email or a prominent notice on the website.`,
        },
        {
          heading: "11. Contact Us",
          body: `If you have questions about this privacy policy or how we handle your data, please contact us using the contact form with the subject "Privacy".`,
        },
      ],
    },
    fr: {
      title: "Politique de Confidentialité",
      note: "Note interne : ce texte est un projet de bonne foi écrit pour un produit en pré-lancement. Il nécessite un examen par un avocat qualifié avant le lancement commercial.",
      sections: [
        {
          heading: "1. Informations que Nous Collectons",
          body: `Nous collectons les informations que vous nous fournissez directement :

• Informations de Compte : Votre nom, e-mail, entreprise et mot de passe (hachés et salés par Supabase Auth).
• Informations de Profil : Langue préférée et tous les paramètres que vous configurez.
• Informations d'Utilisation : Journaux techniques incluant l'adresse IP, le type de navigateur, les pages visitées et le temps passé.
• Informations de Paiement : Traitées via PayPal. Nous n'accédons jamais directement à votre carte de crédit ou aux détails de votre compte bancaire.
• Messages : Si vous nous contactez, nous stockons votre message et notre réponse.
• Métadonnées de Document : Nom de fichier, taille de fichier et horodatage de téléchargement. Les documents eux-mêmes sont traités côté client et ne sont pas stockés sur nos serveurs à moins que vous n'optiez pour un service cloud.`,
        },
        {
          heading: "2. Comment Nous Utilisons Vos Informations",
          body: `Nous utilisons vos informations pour :

• Fournir et améliorer le service
• Traiter votre abonnement et vos paiements
• Vous envoyer des e-mails transactionnels (réinitialisation de mot de passe, confirmation de reçu, rappels d'essai)
• Répondre à vos messages et demandes d'assistance
• Analyser les tendances d'utilisation pour améliorer la qualité du produit
• Détecter et prévenir la fraude ou les abus
• Respecter les obligations légales`,
        },
        {
          heading: "3. Traitement Côté Client",
          body: `La plupart des conversions (PDF/Image vers Word, Image vers PDF) s'exécutent entièrement dans votre navigateur. Vos fichiers ne sont pas téléchargés vers nous. Seul votre navigateur les traite.

La reconnaissance de texte (OCR) utilise Tesseract.js, qui s'exécute également dans votre navigateur. Le moteur de reconnaissance et les fichiers de langue sont téléchargés à partir d'un CDN public, mais votre document n'est jamais envoyé à quelqu'un d'autre.`,
        },
        {
          heading: "4. Stockage et Sécurité des Données",
          body: `Vos données sont stockées dans Supabase, une base de données PostgreSQL avec :

• Chiffrement au repos
• Politiques de sécurité au niveau des lignes qui empêchent les autres utilisateurs d'accéder à vos données
• Sauvegardes automatiques quotidiennes
• Toutes les communications sur HTTPS

Nous suivons les meilleures pratiques de l'industrie pour la protection des données, y compris le principe de minimisation des données—nous ne stockons que ce qui est nécessaire pour fournir le service.`,
        },
        {
          heading: "5. Partage d'Informations",
          body: `Nous ne vendons ni ne louons vos données personnelles à des tiers. Nous partageons les données uniquement si nécessaire pour :

• Fournir le service (par exemple, PayPal pour le traitement des paiements, Supabase pour le stockage de données)
• Respecter les demandes légales des autorités
• Protéger contre la fraude ou les menaces de sécurité

Tous les fournisseurs de services que nous utilisons sont contractuellement tenus de garder vos données confidentielles et de ne les utiliser que selon les fins que nous spécifions.`,
        },
        {
          heading: "6. Vos Droits",
          body: `Selon votre localisation, vous pouvez avoir les droits de :

• Accès : Demander une copie des données que nous détenons à votre sujet
• Correction : Demander que nous corrigions les données inexactes
• Suppression : Demander que nous supprimions vos données (droit à l'oubli)
• Portabilité : Demander vos données dans un format portable
• Retrait du Consentement : Refuser les communications marketing à tout moment

Pour exercer ces droits, contactez-nous en utilisant le formulaire de contact sur ce site.`,
        },
        {
          heading: "7. Cookies et Suivi",
          body: `Nous utilisons des cookies pour :

• Essentiels : Gestion de session, sécurité et mémorisation de votre connexion
• Préférences : Mémorisation de votre choix de langue et des préférences d'interface
• Analyse (facultatif) : Statistiques d'utilisation anonymes pour nous aider à améliorer le produit

Vous pouvez gérer vos préférences de cookies via la bannière de ce site. Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires au fonctionnement du service.`,
        },
        {
          heading: "8. Rétention",
          body: `Nous conservons vos données de compte aussi longtemps que vous maintenez un compte actif. Lorsque vous supprimez votre compte, toutes les données associées sont supprimées dans les 30 jours, sauf si nous sommes légalement tenus de les conserver (par exemple, à des fins fiscales).

Les documents téléchargés sont conservés pendant 24 heures après la conversion, puis automatiquement supprimés. Les messages de contact sont conservés indéfiniment pour fournir un enregistrement de votre correspondance avec nous.`,
        },
        {
          heading: "9. Liens Tiers",
          body: `Ce site contient des liens vers des sites Web tiers. Nous ne sommes pas responsables de leurs pratiques de confidentialité. Nous vous encourageons à vérifier leurs politiques de confidentialité avant de fournir toute information.`,
        },
        {
          heading: "10. Modifications de Cette Politique",
          body: `Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Les modifications entrent en vigueur immédiatement après publication. Nous vous notifierons des changements importants par e-mail ou un avis important sur le site.`,
        },
        {
          heading: "11. Nous Contacter",
          body: `Si vous avez des questions sur cette politique de confidentialité ou sur la façon dont nous traitons vos données, veuillez nous contacter en utilisant le formulaire de contact avec le sujet "Confidentialité".`,
        },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      note: "ملاحظة داخلية: هذا النص عبارة عن مسودة حسنة النية مكتوبة لمنتج في مرحلة ما قبل الإطلاق. يتطلب مراجعة من محام مؤهل قبل الإطلاق التجاري.",
      sections: [
        {
          heading: "1. المعلومات التي نجمعها",
          body: `نجمع المعلومات التي تقدمها لنا مباشرة :

• معلومات الحساب : اسمك وبريدك الإلكتروني وشركتك وكلمة المرور الخاصة بك (مشفرة ومملحة بواسطة Supabase Auth).
• معلومات الملف الشخصي : اللغة المفضلة وأي إعدادات تقوم بتكوينها.
• معلومات الاستخدام : السجلات التقنية بما في ذلك عنوان IP ونوع المتصفح والصفحات التي تمت زيارتها والوقت المستغرق.
• معلومات الدفع : معالجة عبر PayPal. لا نوصل أبداً إلى بطاقتك الائتمانية أو تفاصيل حسابك المصرفي.
• الرسائل : إذا اتصلت بنا، نخزن رسالتك وردنا.
• بيانات وصفية للمستند : اسم الملف وحجم الملف وطابع زمني للتحميل. يتم معالجة المستندات نفسها من جانب العميل ولا يتم تخزينها على خوادمنا إلا إذا اخترت خدمة سحابية.`,
        },
        {
          heading: "2. كيف نستخدم معلوماتك",
          body: `نستخدم معلوماتك لـ :

• توفير وتحسين الخدمة
• معالجة اشتراكك والدفعات الخاصة بك
• إرسال رسائل بريد إلكتروني مرحلية لك (إعادة تعيين كلمة المرور وتأكيد الإيصال وتذكيرات الاختبار)
• الرد على رسائلك وطلبات الدعم
• تحليل أنماط الاستخدام لتحسين جودة المنتج
• الكشف والوقاية من الاحتيال أو الإساءة
• الامتثال للالتزامات القانونية`,
        },
        {
          heading: "3. معالجة من جانب العميل",
          body: `معظم التحويلات (PDF/صورة إلى Word، صورة إلى PDF) تعمل بالكامل في متصفحك. لا يتم تحميل ملفاتك إلينا. فقط متصفحك يعالجها.

يستخدم التعرف على النص (OCR) Tesseract.js، والذي يعمل أيضاً في متصفحك. يتم تحميل محرك الاستخراج وملفات اللغة من CDN عام، لكن مستندك لا يتم إرساله أبداً إلى أي شخص آخر.`,
        },
        {
          heading: "4. تخزين وأمان البيانات",
          body: `يتم تخزين بياناتك في Supabase، وهي قاعدة بيانات PostgreSQL بـ :

• التشفير في الراحة
• سياسات الأمان على مستوى الصفوف التي تمنع المستخدمين الآخرين من الوصول إلى بياناتك
• النسخ الاحتياطية اليومية الآلية
• جميع الاتصالات على HTTPS

نتبع أفضل الممارسات في الصناعة لحماية البيانات، بما في ذلك مبدأ تقليل البيانات—نخزن فقط ما هو ضروري لتقديم الخدمة.`,
        },
        {
          heading: "5. مشاركة المعلومات",
          body: `نحن لا نبيع أو نستأجر بياناتك الشخصية لأطراف ثالثة. نشارك البيانات فقط عند الحاجة لـ :

• توفير الخدمة (على سبيل المثال، PayPal لمعالجة الدفع، Supabase لتخزين البيانات)
• الامتثال لطلبات قانونية من السلطات
• الحماية من الاحتيال أو تهديدات الأمان

جميع مقدمي الخدمات الذين نستخدمهم ملزمون تعاقدياً بالحفاظ على سرية بياناتك واستخدامها فقط وفقاً للأغراض التي نحددها.`,
        },
        {
          heading: "6. حقوقك",
          body: `اعتماداً على موقعك، قد يكون لديك الحقوق في :

• الوصول : طلب نسخة من البيانات التي نملكها عنك
• التصحيح : طلب أن نصحح البيانات غير الدقيقة
• الحذف : طلب حذف بياناتك (الحق في النسيان)
• القابلية للنقل : طلب بياناتك بصيغة قابلة للنقل
• سحب الموافقة : عدم المشاركة في الاتصالات التسويقية في أي وقت

لممارسة هذه الحقوق، اتصل بنا باستخدام نموذج الاتصال على هذا الموقع.`,
        },
        {
          heading: "7. ملفات تعريف الارتباط والتتبع",
          body: `نستخدم ملفات تعريف الارتباط لـ :

• الضروري : إدارة الجلسة والأمان وتذكر تسجيل دخولك
• التفضيلات : تذكر اختيار اللغة وتفضيلات الواجهة
• التحليلات (اختياري) : إحصائيات الاستخدام المجهولة لمساعدتنا في تحسين المنتج

يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال اللافتة على هذا الموقع. لا يمكن تعطيل ملفات تعريف الارتباط الأساسية لأنها مطلوبة لعمل الخدمة.`,
        },
        {
          heading: "8. الاحتفاظ",
          body: `نحتفظ ببيانات حسابك طالما تحتفظ بحساب نشط. عند حذف حسابك، يتم حذف جميع البيانات المرتبطة به في غضون 30 يوماً، ما لم يكن لدينا متطلب قانوني للاحتفاظ به (على سبيل المثال، لأغراض ضريبية).

يتم الاحتفاظ بالمستندات المحملة لمدة 24 ساعة بعد التحويل، ثم يتم حذفها تلقائياً. يتم الاحتفاظ برسائل الاتصال بشكل دائم لتوفير سجل بمراسلتك معنا.`,
        },
        {
          heading: "9. روابط الطرف الثالث",
          body: `يحتوي هذا الموقع على روابط إلى مواقع الويب التابعة لجهات خارجية. نحن لسنا مسؤولين عن ممارسات الخصوصية الخاصة بهم. نشجعك على مراجعة سياسات الخصوصية الخاصة بهم قبل تقديم أي معلومات.`,
        },
        {
          heading: "10. التغييرات على هذه السياسة",
          body: `قد نحدث هذه السياسة من وقت لآخر. التغييرات سارية المفعول فوراً عند النشر. سنخطرك بالتغييرات المهمة عبر البريد الإلكتروني أو إشعار بارز على الموقع.`,
        },
        {
          heading: "11. اتصل بنا",
          body: `إذا كان لديك أسئلة حول سياسة الخصوصية هذه أو كيفية التعامل مع بياناتك، يرجى الاتصال بنا باستخدام نموذج الاتصال مع الموضوع "الخصوصية".`,
        },
      ],
    },
  };

  const c = content[locale];

  return (
    <PageLayout breadcrumbs={[{ label: t("link.privacy") }]}>
      <Section title={c.title}>
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{c.note}</p>
        </div>

        <div className="space-y-8 max-w-3xl">
          {c.sections.map((section, i) => (
            <div key={i}>
              <h2 className="mb-3 font-semibold text-navy">{section.heading}</h2>
              <div className="prose prose-sm text-muted-foreground">
                {section.body.split("\n\n").map((para, j) => (
                  <p key={j} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </PageLayout>
  );
}
