import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/terms")({
  component: TermsPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "Terms of Service — EasyInvoiceOCR",
      fr: "Conditions d'Utilisation — EasyInvoiceOCR",
      ar: "شروط الخدمة — EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Read the terms and conditions that govern the use of EasyInvoiceOCR.",
      fr: "Lisez les conditions générales d'utilisation d'EasyInvoiceOCR.",
      ar: "اقرأ شروط الخدمة التي تحكم استخدام EasyInvoiceOCR.",
    };
    const title = titles[locale];
    const description = descriptions[locale];

    return {
      meta: [
        robotsMeta("terms"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("terms", locale),
      scripts: [{ type: "application/ld+json", children: breadcrumbJsonLd([{ label: "Terms" }]) }],
    };
  },
});

function TermsPage() {
  const t = useT();
  const locale = useLocale();

  const content = {
    en: {
      title: "Terms of Service",
      note: "Internal note: this text is a good-faith draft written for a pre-launch product. It requires review by a qualified lawyer before commercial launch.",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          body: `By accessing and using EasyInvoiceOCR, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
        },
        {
          heading: "2. Use License",
          body: `Permission is granted to temporarily download one copy of the materials (information or software) on EasyInvoiceOCR for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:

• Modify or copy the materials
• Use the materials for any commercial purpose or for any public display
• Attempt to decompile or reverse engineer any software contained on EasyInvoiceOCR
• Remove any copyright or other proprietary notations from the materials
• Transfer the materials to another person or "mirror" the materials on any other server
• Violate any applicable laws or regulations related to access to or use of EasyInvoiceOCR`,
        },
        {
          heading: "3. User Accounts",
          body: `If you create an account on EasyInvoiceOCR, you are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account. You agree not to use another user's account without their permission. You must be at least 18 years old to create an account.`,
        },
        {
          heading: "4. User Content and Documents",
          body: `You retain ownership of any documents you upload or create using EasyInvoiceOCR. By uploading documents, you grant EasyInvoiceOCR a non-exclusive license to process and store them for the purpose of providing the service.

You are solely responsible for the legality and accuracy of any documents you upload. You agree not to upload content that violates any applicable law or infringes on third-party rights.`,
        },
        {
          heading: "5. Subscription and Payment",
          body: `EasyInvoiceOCR offers free trials and paid subscription plans. All payments are processed through PayPal. By agreeing to a paid plan, you authorize PayPal to charge your selected payment method on the schedule specified.

Subscriptions renew automatically unless cancelled. You are responsible for cancelling your subscription if you no longer wish to be charged. Refunds are not issued for partial subscription periods unless required by applicable law.`,
        },
        {
          heading: "6. Acceptable Use",
          body: `You agree not to:

• Use EasyInvoiceOCR for any unlawful purpose or in violation of any applicable law or regulation
• Upload malware, viruses, or any code intended to harm or disrupt the service
• Attempt to gain unauthorized access to EasyInvoiceOCR or its systems
• Use automated tools, bots, or scripts to access or scrape EasyInvoiceOCR without permission
• Harass, threaten, or abuse other users
• Spam, phish, or engage in any form of fraudulent activity`,
        },
        {
          heading: "7. Limitation of Liability",
          body: `EasyInvoiceOCR is provided on an "as is" basis without any warranties, express or implied. To the fullest extent permitted by law, EasyInvoiceOCR disclaims all warranties, including but not limited to, any implied warranties of merchantability, fitness for a particular purpose, or non-infringement.

EasyInvoiceOCR shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the service, even if EasyInvoiceOCR has been advised of the possibility of such damages.`,
        },
        {
          heading: "8. Intellectual Property",
          body: `All content, functionality, and materials on EasyInvoiceOCR are owned by EasyInvoiceOCR or its content suppliers and are protected by international copyright, trademark, and other intellectual property laws. The compilation and arrangement of all content on EasyInvoiceOCR is the exclusive property of EasyInvoiceOCR.`,
        },
        {
          heading: "9. Termination",
          body: `EasyInvoiceOCR reserves the right to terminate or suspend your account and access to the service at any time, for any reason, without prior notice or liability, particularly if you violate these terms or engage in any conduct that EasyInvoiceOCR deems inappropriate, offensive, or unlawful.`,
        },
        {
          heading: "10. Amendments",
          body: `EasyInvoiceOCR reserves the right to amend these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of EasyInvoiceOCR following the posting of revised terms means that you accept and agree to the changes.`,
        },
        {
          heading: "11. Governing Law",
          body: `These terms are governed by and construed in accordance with the laws of the jurisdiction where EasyInvoiceOCR operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.`,
        },
      ],
    },
    fr: {
      title: "Conditions d'Utilisation",
      note: "Note interne : ce texte est un projet de bonne foi écrit pour un produit en pré-lancement. Il nécessite un examen par un avocat qualifié avant le lancement commercial.",
      sections: [
        {
          heading: "1. Acceptation des Conditions",
          body: `En accédant à EasyInvoiceOCR et en l'utilisant, vous acceptez et convenez d'être lié par les conditions et les dispositions de cet accord. Si vous n'acceptez pas de respecter ce qui précède, veuillez ne pas utiliser ce service.`,
        },
        {
          heading: "2. Licence d'Utilisation",
          body: `La permission est accordée de télécharger temporairement une copie des matériaux (informations ou logiciels) sur EasyInvoiceOCR pour une visualisation personnelle, non commerciale et transitoire uniquement. Ceci est l'octroi d'une licence, non un transfert de titre, et en vertu de cette licence, vous ne pouvez pas :

• Modifier ou copier les matériaux
• Utiliser les matériaux à des fins commerciales ou pour un affichage public
• Tenter de décompiler ou de rétro-ingénierie tout logiciel contenu sur EasyInvoiceOCR
• Supprimer tout avis de droit d'auteur ou autre notation de propriété des matériaux
• Transférer les matériaux à une autre personne ou "refléter" les matériaux sur un autre serveur
• Violer toute loi ou réglementation applicable relative à l'accès ou à l'utilisation d'EasyInvoiceOCR`,
        },
        {
          heading: "3. Comptes Utilisateur",
          body: `Si vous créez un compte sur EasyInvoiceOCR, vous êtes responsable du maintien de la confidentialité de votre mot de passe et de toute activité qui se produit sous votre compte. Vous acceptez de ne pas utiliser le compte d'un autre utilisateur sans sa permission. Vous devez avoir au moins 18 ans pour créer un compte.`,
        },
        {
          heading: "4. Contenu et Documents de l'Utilisateur",
          body: `Vous conservez la propriété de tous les documents que vous téléchargez ou créez à l'aide d'EasyInvoiceOCR. En téléchargeant des documents, vous accordez à EasyInvoiceOCR une licence non exclusive pour les traiter et les stocker dans le but de fournir le service.

Vous êtes seul responsable de la légalité et de l'exactitude de tous les documents que vous téléchargez. Vous acceptez de ne pas télécharger de contenu qui viole une loi applicable ou porte atteinte aux droits des tiers.`,
        },
        {
          heading: "5. Abonnement et Paiement",
          body: `EasyInvoiceOCR offre des essais gratuits et des plans d'abonnement payants. Tous les paiements sont traités via PayPal. En acceptant un plan payant, vous autorisez PayPal à facturer votre mode de paiement sélectionné selon le calendrier spécifié.

Les abonnements se renouvellent automatiquement sauf annulation. Vous êtes responsable de l'annulation de votre abonnement si vous ne souhaitez plus être facturé. Les remboursements ne sont pas émis pour les périodes d'abonnement partielles, sauf si la loi applicable l'exige.`,
        },
        {
          heading: "6. Utilisation Acceptable",
          body: `Vous acceptez de ne pas :

• Utiliser EasyInvoiceOCR pour un objectif illégal ou en violation de toute loi ou réglementation applicable
• Télécharger de malveillants, des virus ou tout code destiné à nuire ou à perturber le service
• Tenter d'accéder sans autorisation à EasyInvoiceOCR ou à ses systèmes
• Utiliser des outils automatisés, des robots ou des scripts pour accéder ou scraper EasyInvoiceOCR sans permission
• Harceler, menacer ou maltraiter d'autres utilisateurs
• Spammer, phishing ou s'engager dans une activité frauduleuse`,
        },
        {
          heading: "7. Limitation de Responsabilité",
          body: `EasyInvoiceOCR est fourni sur une base "telle quelle" sans aucune garantie, expresse ou implicite. Dans la mesure maximale permise par la loi, EasyInvoiceOCR refuse toutes les garanties, y compris, mais sans s'y limiter, toute garantie implicite de qualité marchande, d'adéquation à un usage particulier ou de non-contrefaçon.

EasyInvoiceOCR ne sera pas responsable de tout dommage indirect, accidentel, spécial, consécutif ou punitif découlant de ou en connexion avec votre utilisation du service, même si EasyInvoiceOCR a été informé de la possibilité de tels dommages.`,
        },
        {
          heading: "8. Propriété Intellectuelle",
          body: `Tous les contenus, fonctionnalités et matériaux sur EasyInvoiceOCR sont la propriété d'EasyInvoiceOCR ou de ses fournisseurs de contenu et sont protégés par les lois internationales sur le droit d'auteur, les marques et autres propriétés intellectuelles. La compilation et l'arrangement de tous les contenus sur EasyInvoiceOCR sont la propriété exclusive d'EasyInvoiceOCR.`,
        },
        {
          heading: "9. Résiliation",
          body: `EasyInvoiceOCR se réserve le droit de résilier ou de suspendre votre compte et votre accès au service à tout moment, pour quelque raison que ce soit, sans préavis ni responsabilité, en particulier si vous violez ces conditions ou vous engagez dans un comportement que EasyInvoiceOCR juge inapproprié, offensant ou illégal.`,
        },
        {
          heading: "10. Modifications",
          body: `EasyInvoiceOCR se réserve le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur immédiatement après leur publication sur le site. Votre utilisation continue d'EasyInvoiceOCR suite à la publication des conditions révisées signifie que vous acceptez les modifications.`,
        },
        {
          heading: "11. Droit Applicable",
          body: `Ces conditions sont régies par et construites conformément aux lois de la juridiction où EasyInvoiceOCR opère, et vous vous soumettez irrévocablement à la juridiction exclusive des tribunaux de ce lieu.`,
        },
      ],
    },
    ar: {
      title: "شروط الخدمة",
      note: "ملاحظة داخلية: هذا النص عبارة عن مسودة حسنة النية مكتوبة لمنتج في مرحلة ما قبل الإطلاق. يتطلب مراجعة من محام مؤهل قبل الإطلاق التجاري.",
      sections: [
        {
          heading: "1. قبول الشروط",
          body: `بالوصول إلى EasyInvoiceOCR واستخدامه، تقبل وتوافق على أن تكون ملزماً بشروط وأحكام هذا الاتفاق. إذا كنت لا تقبل الامتثال لما سبق، يرجى عدم استخدام هذه الخدمة.`,
        },
        {
          heading: "2. ترخيص الاستخدام",
          body: `يُمنح الإذن بتحميل نسخة واحدة مؤقتة من المواد (المعلومات أو البرامج) على EasyInvoiceOCR للعرض الشخصي وغير التجاري والعابر فقط. هذا هو منح الترخيص، وليس نقل الملكية، وبموجب هذا الترخيص، قد لا تقوم بـ:

• تعديل أو نسخ المواد
• استخدام المواد لأي غرض تجاري أو لأي عرض عام
• محاولة فك تجميع أو معاكسة هندسة أي برنامج موجود على EasyInvoiceOCR
• إزالة أي إشعار حقوق نشر أو أي علامات ملكية أخرى من المواد
• نقل المواد إلى شخص آخر أو "عكس" المواد على أي خادم آخر
• انتهاك أي قانون أو لائحة قابلة للتطبيق تتعلق بالوصول إلى استخدام EasyInvoiceOCR`,
        },
        {
          heading: "3. حسابات المستخدم",
          body: `إذا أنشأت حساباً على EasyInvoiceOCR، فأنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك وعن جميع الأنشطة التي تحدث تحت حسابك. توافق على عدم استخدام حساب مستخدم آخر دون إذنه. يجب أن تكون بعمر 18 سنة على الأقل لإنشاء حساب.`,
        },
        {
          heading: "4. محتوى وملفات المستخدم",
          body: `تحتفظ بملكية أي مستندات تحملها أو تنشئها باستخدام EasyInvoiceOCR. بتحميل المستندات، توافق على منح EasyInvoiceOCR ترخيصاً غير حصري لمعالجتها وتخزينها لغرض توفير الخدمة.

أنت وحدك المسؤول عن شرعية ودقة أي مستندات تحملها. توافق على عدم تحميل محتوى ينتهك أي قانون قابل للتطبيق أو ينتهك حقوق الغير.`,
        },
        {
          heading: "5. الاشتراك والدفع",
          body: `يوفر EasyInvoiceOCR تجارب مجانية وخطط اشتراك مدفوعة. يتم معالجة جميع المدفوعات من خلال PayPal. بالموافقة على خطة مدفوعة، أنت تفوض PayPal بفرض رسوم على طريقة الدفع المختارة وفقاً للجدول الزمني المحدد.

تتجدد الاشتراكات تلقائياً ما لم يتم إلغاؤها. أنت مسؤول عن إلغاء اشتراكك إذا كنت لا تريد أن يتم فرض رسوم عليك بعد الآن. لا يتم إصدار المبالغ المسترجعة لفترات الاشتراك الجزئية إلا إذا اقتضت الضرورة بموجب القانون المعمول به.`,
        },
        {
          heading: "6. الاستخدام المقبول",
          body: `توافق على عدم:

• استخدام EasyInvoiceOCR لأي غرض غير قانوني أو بالمخالفة لأي قانون أو لائحة قابلة للتطبيق
• تحميل البرامج الضارة أو الفيروسات أو أي رمز يهدف إلى إلحاق الضرر أو الإخلال بالخدمة
• محاولة الوصول غير المصرح به إلى EasyInvoiceOCR أو أنظمتها
• استخدام الأدوات الآلية أو الروبوتات أو البرامج النصية للوصول أو كشط EasyInvoiceOCR بدون إذن
• التحرش أو التهديد أو إساءة معاملة المستخدمين الآخرين
• البريد العشوائي أو التصيد أو الانخراط في أي شكل من أشكال الأنشطة الاحتيالية`,
        },
        {
          heading: "7. تحديد المسؤولية",
          body: `يتم توفير EasyInvoiceOCR على أساس "كما هو" بدون أي ضمانات، صريحة أو ضمنية. إلى أقصى حد يسمح به القانون، يرفض EasyInvoiceOCR جميع الضمانات، بما في ذلك على سبيل المثال لا الحصر، أي ضمانات ضمنية للقابلية للتسويق أو الملاءمة لغرض معين أو عدم الانتهاك.

لن تكون EasyInvoiceOCR مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية تنشأ عن أو في اتصال مع استخدامك للخدمة، حتى لو تم إخطار EasyInvoiceOCR بإمكانية حدوث مثل هذه الأضرار.`,
        },
        {
          heading: "8. الملكية الفكرية",
          body: `جميع المحتويات والوظائف والمواد على EasyInvoiceOCR مملوكة بواسطة EasyInvoiceOCR أو موردي المحتوى الخاص بها وهي محمية بموجب قوانين حقوق الطبع والنشر والعلامات التجارية والملكية الفكرية الدولية الأخرى. التجميع والترتيب لجميع المحتويات على EasyInvoiceOCR هي ملكية حصرية لـ EasyInvoiceOCR.`,
        },
        {
          heading: "9. الإنهاء",
          body: `تحتفظ EasyInvoiceOCR بالحق في إنهاء أو إيقاف حسابك والوصول إلى الخدمة في أي وقت، لأي سبب، دون إشعار مسبق أو مسؤولية، لا سيما إذا انتهكت هذه الشروط أو انخرطت في أي سلوك تعتبره EasyInvoiceOCR غير مناسب أو مسيء أو غير قانوني.`,
        },
        {
          heading: "10. التعديلات",
          body: `تحتفظ EasyInvoiceOCR بالحق في تعديل هذه الشروط في أي وقت. التغييرات سارية المفعول فوراً عند نشرها على الموقع. استمرارك في استخدام EasyInvoiceOCR بعد نشر الشروط المعدلة يعني أنك تقبل وتوافق على التغييرات.`,
        },
        {
          heading: "11. القانون الحاكم",
          body: `تحكم هذه الشروط وتُفسّر وفقاً لقوانين الولاية القضائية حيث تعمل EasyInvoiceOCR، وتخضع بشكل لا رجوع عنه للاختصاص الحصري لمحاكم تلك الموقع.`,
        },
      ],
    },
  };

  const c = content[locale];

  return (
    <PageLayout breadcrumbs={[{ label: t("link.terms") }]}>
      <PageHero title={c.title} />
      <Section>
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
