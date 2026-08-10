/**
 * Homepage copy, in all three locales.
 *
 * The homepage was the last page still serving English to French and Arabic
 * visitors: the navigation, footer and pricing card were localised, and
 * everything between them was hard-coded in sections.tsx.
 *
 * Three claims are corrected here rather than translated, because translating
 * them would have produced the same falsehood in three languages:
 *
 *   1. The language strip listed six languages with flags — English, French,
 *      Arabic, Spanish, German and Portuguese. Only three recognition models
 *      are vendored (scripts/vendor-tesseract.mjs: eng, fra, ara), so half the
 *      list was unsupported. It now lists the three that ship.
 *   2. The Developers card promised a "Powerful API and SDKs". There is no API
 *      and no SDK; the endpoint accepts no requests. It now says so.
 *   3. The extraction preview is a made-up invoice. It is now labelled as an
 *      example in every locale, so a sample confidence figure cannot be read
 *      as a measured accuracy claim.
 */

import type { Locale } from "@/i18n";

export type HomeStep = { title: string; body: string };
export type HomeCard = { title: string; body: string };

export type HomeContent = {
  hero: {
    h1Line1: string;
    h1Line2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    /** Short factual badges under the CTAs. No unverifiable claims. */
    badges: [string, string, string];
  };
  audience: { heading: string };
  languages: {
    label: string;
    /** Exactly the recognition models that ship. */
    items: string[];
  };
  howItWorks: { heading: string; steps: [HomeStep, HomeStep, HomeStep] };
  extract: {
    heading: string;
    description: string;
    fields: string[];
    /** Marks the mock invoice as an illustration, not a measured result. */
    sampleLabel: string;
    panelTitle: string;
    confidenceLabel: string;
    previewAlt: string;
    /** Labels for the extracted-field panel. The sample values stay as-is:
        they are an English specimen invoice, which is a realistic input. */
    sampleFieldLabels: [string, string, string, string, string];
  };
  workflows: { heading: string; cards: HomeCard[] };
  global: { heading: string; description: string; cards: HomeCard[] };
  faq: { heading: string; items: { q: string; a: string }[] };
  finalCta: { heading: string; body: string; cta: string };
  a11y: { uploadRegion: string; sampleInvoice: string };
};

/* ------------------------------------------------------------------ */

const en: HomeContent = {
  hero: {
    h1Line1: "Convert any invoice or",
    h1Line2: "receipt into structured data",
    description:
      "Extract invoice and receipt data automatically with OCR, then convert PDFs and images into structured data you can export to Excel, CSV and JSON directly in your browser.",
    primaryCta: "Convert an invoice free",
    secondaryCta: "See how it works",
    badges: ["No credit card required", "English, French and Arabic", "Runs in your browser"],
  },
  audience: {
    heading: "Built for accountants, small businesses and finance teams",
  },
  languages: {
    label: "Recognition languages:",
    items: ["English", "Français", "العربية"],
  },
  howItWorks: {
    heading: "How it works",
    steps: [
      { title: "Upload", body: "Add an invoice or receipt as a PDF, JPG, PNG or WebP file." },
      {
        title: "Read and structure",
        body: "The engine reads the document in your browser and decides which text is which field.",
      },
      {
        title: "Review and export",
        body: "Correct anything flagged as uncertain, then export to Excel, CSV or JSON.",
      },
    ],
  },
  extract: {
    heading: "Every field, not just the total",
    description:
      "Invoice-level fields and the line-item table are returned together, so you review a filled-in record instead of retyping one.",
    fields: [
      "Vendor and company details",
      "Invoice number and dates",
      "Line items with quantity and unit price",
      "Tax, discounts and fees",
      "Total amount and currency",
      "Payment terms",
    ],
    sampleLabel: "Example",
    panelTitle: "Extracted fields",
    confidenceLabel: "Confidence",
    previewAlt: "A sample invoice beside the fields extracted from it",
    sampleFieldLabels: ["Vendor", "Invoice number", "Invoice date", "Total amount", "Currency"],
  },
  workflows: {
    heading: "Built for every workflow",
    cards: [
      {
        title: "Accountants",
        body: "Work through a month of supplier invoices without rekeying them into a ledger.",
      },
      {
        title: "Small businesses",
        body: "Keep invoices and receipts in one list, and export a period when you need it.",
      },
      {
        title: "Freelancers",
        body: "Photograph receipts as you get them and export the month to a spreadsheet.",
      },
      {
        title: "Developers",
        body: "The HTTP API is not available yet and accepts no requests. The browser tools do the same extraction today.",
      },
    ],
  },
  global: {
    heading: "Built for documents that are not all in one language",
    description:
      "Invoices arrive in more than one script, and the numbers on them are written more than one way. Both are handled before any check runs.",
    cards: [
      {
        title: "Three languages, including Arabic",
        body: "Recognition ships with English, French and Arabic models, and handles right-to-left layouts and invoices that mix scripts.",
      },
      {
        title: "Currencies preserved",
        body: "The printed currency is kept per document, so a mixed-currency batch does not quietly become one currency.",
      },
      {
        title: "Numbers and dates normalised",
        body: "Digits are converted to Western form and dates to ISO 8601 before totals are checked. A genuinely ambiguous date is flagged, not guessed.",
      },
    ],
  },
  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        q: "Which file types can I upload?",
        a: "PDF, JPG, PNG and WebP, up to 20 MB per file. A PDF may be native text or a scan, and may contain several pages.",
      },
      {
        q: "Is my invoice uploaded to a server?",
        a: "No. Recognition runs in your browser, so the document is not sent anywhere to be read. Only a conversion record — filename, size and page count — is stored against your account.",
      },
      {
        q: "Which languages are supported?",
        a: "English, French and Arabic, including right-to-left layouts and invoices that mix scripts. Those are the three recognition models that ship.",
      },
      {
        q: "What do I get for free?",
        a: "Five successful conversions per account, shared across every tool, with no payment card. Conversions that fail or are cancelled do not count against them.",
      },
      {
        q: "Can I export to Excel?",
        a: "Yes — an .xlsx workbook with a summary sheet and a line-item sheet, plus CSV and JSON. All three are generated in your browser.",
      },
      {
        q: "Is there an API?",
        a: "Not yet. The OCR API is being designed but accepts no requests, no keys are issued, and it is not part of any current plan.",
      },
    ],
  },
  finalCta: {
    heading: "Ready to stop retyping invoices?",
    body: "Convert your first document now. Five conversions are free.",
    cta: "Start free",
  },
  a11y: {
    uploadRegion: "Upload an invoice or receipt",
    sampleInvoice: "Example invoice used to illustrate extraction",
  },
};

/* ------------------------------------------------------------------ */

const fr: HomeContent = {
  hero: {
    h1Line1: "Transformez n'importe quelle facture",
    h1Line2: "ou reçu en données structurées",
    description:
      "Extrayez automatiquement les données de vos factures et reçus grâce à la technologie OCR, puis convertissez vos PDF et images en données structurées exportables vers Excel, CSV et JSON, directement dans votre navigateur.",
    primaryCta: "Convertir une facture gratuitement",
    secondaryCta: "Voir le fonctionnement",
    badges: [
      "Sans carte bancaire",
      "Anglais, français et arabe",
      "Traitement dans votre navigateur",
    ],
  },
  audience: {
    heading: "Conçu pour les cabinets comptables, les TPE et les équipes financières",
  },
  languages: {
    label: "Langues reconnues :",
    items: ["English", "Français", "العربية"],
  },
  howItWorks: {
    heading: "Comment ça marche",
    steps: [
      {
        title: "Déposer",
        body: "Ajoutez une facture ou un reçu au format PDF, JPG, PNG ou WebP.",
      },
      {
        title: "Lire et structurer",
        body: "Le moteur lit le document dans votre navigateur et détermine quel texte correspond à quel champ.",
      },
      {
        title: "Relire et exporter",
        body: "Corrigez ce qui est signalé comme incertain, puis exportez en Excel, CSV ou JSON.",
      },
    ],
  },
  extract: {
    heading: "Tous les champs, pas seulement le total",
    description:
      "Les champs de la facture et le tableau des lignes reviennent ensemble : vous relisez un enregistrement déjà rempli au lieu d'en ressaisir un.",
    fields: [
      "Fournisseur et coordonnées",
      "Numéro de facture et dates",
      "Lignes avec quantité et prix unitaire",
      "TVA, remises et frais",
      "Montant total et devise",
      "Conditions de règlement",
    ],
    sampleLabel: "Exemple",
    panelTitle: "Champs extraits",
    confidenceLabel: "Indice de confiance",
    previewAlt: "Un exemple de facture à côté des champs qui en ont été extraits",
    sampleFieldLabels: [
      "Fournisseur",
      "Numéro de facture",
      "Date de facture",
      "Montant total",
      "Devise",
    ],
  },
  workflows: {
    heading: "Adapté à chaque organisation",
    cards: [
      {
        title: "Cabinets comptables",
        body: "Traitez un mois de factures fournisseurs sans les ressaisir dans un logiciel comptable.",
      },
      {
        title: "Petites entreprises",
        body: "Regroupez factures et reçus dans une seule liste, et exportez une période au besoin.",
      },
      {
        title: "Indépendants",
        body: "Photographiez vos reçus au fil de l'eau et exportez le mois dans un tableur.",
      },
      {
        title: "Développeurs",
        body: "L'API HTTP n'est pas encore disponible et n'accepte aucune requête. Les outils du navigateur réalisent la même extraction dès aujourd'hui.",
      },
    ],
  },
  global: {
    heading: "Pensé pour des documents qui ne sont pas tous dans la même langue",
    description:
      "Les factures arrivent dans plusieurs écritures, et les montants qu'elles portent s'écrivent de plusieurs façons. Les deux sont traités avant tout contrôle.",
    cards: [
      {
        title: "Trois langues, dont l'arabe",
        body: "La reconnaissance est livrée avec les modèles anglais, français et arabe, et gère les mises en page de droite à gauche ainsi que les factures mêlant plusieurs écritures.",
      },
      {
        title: "Devises conservées",
        body: "La devise imprimée est conservée pour chaque document : un lot multidevise ne devient pas silencieusement monodevise.",
      },
      {
        title: "Nombres et dates normalisés",
        body: "Les chiffres sont ramenés à la forme occidentale et les dates au format ISO 8601 avant la vérification des totaux. Une date réellement ambiguë est signalée, pas devinée.",
      },
    ],
  },
  faq: {
    heading: "Questions fréquentes",
    items: [
      {
        q: "Quels types de fichiers puis-je envoyer ?",
        a: "PDF, JPG, PNG et WebP, jusqu'à 20 Mo par fichier. Un PDF peut être en texte natif ou numérisé, et comporter plusieurs pages.",
      },
      {
        q: "Ma facture est-elle envoyée sur un serveur ?",
        a: "Non. La reconnaissance s'exécute dans votre navigateur : le document n'est transmis nulle part pour être lu. Seul un enregistrement de conversion — nom du fichier, taille et nombre de pages — est conservé sur votre compte.",
      },
      {
        q: "Quelles langues sont prises en charge ?",
        a: "L'anglais, le français et l'arabe, y compris les mises en page de droite à gauche et les factures mêlant plusieurs écritures. Ce sont les trois modèles de reconnaissance livrés.",
      },
      {
        q: "Qu'obtient-on gratuitement ?",
        a: "Cinq conversions réussies par compte, communes à tous les outils, sans carte bancaire. Les conversions échouées ou annulées ne sont pas décomptées.",
      },
      {
        q: "Puis-je exporter vers Excel ?",
        a: "Oui — un classeur .xlsx avec une feuille de synthèse et une feuille de lignes, plus CSV et JSON. Les trois sont générés dans votre navigateur.",
      },
      {
        q: "Existe-t-il une API ?",
        a: "Pas encore. L'API OCR est en cours de conception mais n'accepte aucune requête, aucune clé n'est délivrée, et elle ne fait partie d'aucune formule actuelle.",
      },
    ],
  },
  finalCta: {
    heading: "Prêt à cesser de ressaisir vos factures ?",
    body: "Convertissez votre premier document dès maintenant. Cinq conversions sont offertes.",
    cta: "Commencer gratuitement",
  },
  a11y: {
    uploadRegion: "Envoyer une facture ou un reçu",
    sampleInvoice: "Exemple de facture illustrant l'extraction",
  },
};

/* ------------------------------------------------------------------ */

const ar: HomeContent = {
  hero: {
    h1Line1: "حوّل أي فاتورة أو إيصال",
    h1Line2: "إلى بيانات منظَّمة",
    description:
      "استخرج بيانات الفواتير والإيصالات تلقائياً باستخدام تقنية OCR، وحوّل ملفات PDF والصور إلى بيانات منظّمة قابلة للتصدير إلى Excel وCSV وJSON مباشرةً من متصفحك.",
    primaryCta: "حوّل فاتورة مجانًا",
    secondaryCta: "شاهد طريقة العمل",
    badges: ["دون بطاقة دفع", "الإنجليزية والفرنسية والعربية", "المعالجة داخل متصفحك"],
  },
  audience: {
    heading: "مصمَّم للمحاسبين والشركات الصغيرة وفرق المالية",
  },
  languages: {
    label: "لغات التعرّف:",
    items: ["English", "Français", "العربية"],
  },
  howItWorks: {
    heading: "كيف تعمل",
    steps: [
      { title: "الرفع", body: "أضِف فاتورة أو إيصالًا بصيغة PDF أو JPG أو PNG أو WebP." },
      {
        title: "القراءة والتنظيم",
        body: "يقرأ المحرّك المستند داخل متصفحك ويحدد أي نص يقابل أي حقل.",
      },
      {
        title: "المراجعة والتصدير",
        body: "صحّح ما جرى تعليمه بوصفه غير مؤكد، ثم صدّر إلى Excel أو CSV أو JSON.",
      },
    ],
  },
  extract: {
    heading: "كل الحقول، لا الإجمالي وحده",
    description:
      "تعود حقول الفاتورة وجدول البنود معًا، فتراجع سجلًا مملوءًا مسبقًا بدل أن تعيد كتابته من جديد.",
    fields: [
      "بيانات المورّد والشركة",
      "رقم الفاتورة والتواريخ",
      "البنود مع الكمية وسعر الوحدة",
      "الضريبة والخصومات والرسوم",
      "المبلغ الإجمالي والعملة",
      "شروط السداد",
    ],
    sampleLabel: "مثال",
    panelTitle: "الحقول المستخرَجة",
    confidenceLabel: "درجة الثقة",
    previewAlt: "نموذج فاتورة بجانب الحقول المستخرَجة منها",
    sampleFieldLabels: ["المورّد", "رقم الفاتورة", "تاريخ الفاتورة", "المبلغ الإجمالي", "العملة"],
  },
  workflows: {
    heading: "مناسب لكل طريقة عمل",
    cards: [
      {
        title: "المحاسبون",
        body: "أنجز فواتير موردي شهر كامل دون إعادة إدخالها في البرنامج المحاسبي.",
      },
      {
        title: "الشركات الصغيرة",
        body: "اجمع الفواتير والإيصالات في قائمة واحدة، وصدّر أي فترة عند الحاجة.",
      },
      {
        title: "العاملون المستقلون",
        body: "صوّر إيصالاتك أولًا بأول وصدّر الشهر إلى جدول بيانات.",
      },
      {
        title: "المطوّرون",
        body: "واجهة HTTP البرمجية غير متاحة بعد ولا تستقبل أي طلبات. وأدوات المتصفح تنفّذ الاستخراج نفسه اليوم.",
      },
    ],
  },
  global: {
    heading: "مبني لمستندات ليست كلها بلغة واحدة",
    description:
      "تصل الفواتير بأكثر من كتابة، وتُكتب أرقامها بأكثر من صورة. ويُعالَج الأمران قبل أي تحقق.",
    cards: [
      {
        title: "ثلاث لغات، منها العربية",
        body: "يأتي التعرّف بنماذج الإنجليزية والفرنسية والعربية، ويتعامل مع التخطيطات من اليمين إلى اليسار ومع الفواتير التي تخلط الكتابات.",
      },
      {
        title: "الحفاظ على العملات",
        body: "تُحفَظ العملة المطبوعة لكل مستند، فلا تتحول دفعة متعددة العملات إلى عملة واحدة بصمت.",
      },
      {
        title: "توحيد الأرقام والتواريخ",
        body: "تُحوَّل الأرقام إلى الصيغة الغربية والتواريخ إلى معيار ISO 8601 قبل التحقق من الإجماليات. والتاريخ الملتبس فعلًا يُعلَّم ولا يُخمَّن.",
      },
    ],
  },
  faq: {
    heading: "الأسئلة الشائعة",
    items: [
      {
        q: "ما أنواع الملفات التي يمكنني رفعها؟",
        a: "‏PDF و‏JPG و‏PNG و‏WebP، بحد أقصى 20 ميغابايت للملف. وقد يكون ملف PDF نصًا أصليًا أو ممسوحًا ضوئيًا، وقد يضم عدة صفحات.",
      },
      {
        q: "هل تُرفع فاتورتي إلى خادم؟",
        a: "لا. يجري التعرّف داخل متصفحك، فلا يُرسَل المستند إلى أي مكان ليُقرأ. ولا يُحفظ سوى سجل تحويل يضم اسم الملف وحجمه وعدد صفحاته.",
      },
      {
        q: "ما اللغات المدعومة؟",
        a: "الإنجليزية والفرنسية والعربية، بما في ذلك التخطيطات من اليمين إلى اليسار والفواتير التي تخلط الكتابات. وهذه هي نماذج التعرّف الثلاثة المتوفرة.",
      },
      {
        q: "ما الذي أحصل عليه مجانًا؟",
        a: "خمس عمليات تحويل ناجحة لكل حساب، مشتركة بين جميع الأدوات، دون بطاقة دفع. والعمليات الفاشلة أو الملغاة لا تُحتسب عليها.",
      },
      {
        q: "هل يمكنني التصدير إلى Excel؟",
        a: "نعم — ملف ‎.xlsx‎ بورقة ملخّص وورقة بنود، إضافة إلى CSV و‏JSON. وتُولَّد الثلاثة داخل متصفحك.",
      },
      {
        q: "هل توجد واجهة برمجية؟",
        a: "ليس بعد. واجهة OCR البرمجية قيد التصميم لكنها لا تستقبل أي طلبات، ولا تُصدَر مفاتيح، وهي ليست جزءًا من أي باقة حالية.",
      },
    ],
  },
  finalCta: {
    heading: "جاهز للتوقف عن إعادة كتابة الفواتير؟",
    body: "حوّل مستندك الأول الآن. خمس عمليات تحويل مجانية.",
    cta: "ابدأ مجانًا",
  },
  a11y: {
    uploadRegion: "رفع فاتورة أو إيصال",
    sampleInvoice: "نموذج فاتورة لتوضيح عملية الاستخراج",
  },
};

/* ------------------------------------------------------------------ */

export const homeContent: Record<Locale, HomeContent> = { en, fr, ar };

export function homeFor(locale: Locale): HomeContent {
  return homeContent[locale];
}
