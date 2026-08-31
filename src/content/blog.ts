/**
 * Blog content, written three times.
 *
 * The previous model held one title, one description and one body per article,
 * so /fr/blog/… and /ar/blog/… served English prose under a translated shell.
 * That is worse than having no French page at all: it wastes the visit and
 * tells a search engine the three URLs are duplicates.
 *
 * Each article now carries a complete BlogLocaleContent per locale. The French
 * and Arabic versions are written for their own readers rather than translated
 * word for word — headings, examples and emphasis differ where the language or
 * the search intent differs — while the technical claims stay identical,
 * because an article that says something different about the product in one
 * language is a bug, not a localisation.
 *
 * Editorial rules that constrain everything below:
 *
 *   * No invented statistics, customers, testimonials, research findings,
 *     integrations or capabilities. Where a number would be persuasive but is
 *     not measured, there is no number.
 *   * The author is the organisation. No fictional person is credited.
 *   * The OCR API is not operational. The developer article evaluates OCR APIs
 *     in general and labels ours "Coming soon" in every locale.
 */

import type { Locale } from "@/i18n";

export type BlogBlock = {
  heading?: string;
  paragraphs: string[];
  list?: string[];
};

export type BlogLink = { label: string; href: string };

/**
 * An outbound reference to a primary source.
 *
 * Kept separate from BlogLink because these leave the site: they render as
 * real anchors rather than router links, and they are only ever added where
 * the article genuinely leans on the source. A references list assembled for
 * its own sake would be link decoration, which is the opposite of the point.
 */
export type BlogSource = { label: string; href: string; note: string };

export type BlogLocaleContent = {
  /** <title>. Written for the result page, so it carries the brand. */
  title: string;
  /** Meta description. One sentence of promise, one of substance. */
  description: string;
  /** The single H1. Deliberately allowed to differ from the SEO title. */
  heading: string;
  /** Localised category label, also used by the index filter chips. */
  category: string;
  /** Standfirst under the H1. */
  lede: string;
  body: BlogBlock[];
  /** Descriptive alt text for the card artwork. */
  imageAlt: string;
  /** Heading above the internal-link block. */
  linksTitle: string;
  /**
   * Internal links: the product the article supports, a solution page, and a
   * documentation or help page. Anchor text is written per article so the same
   * phrase is not repeated across the blog.
   */
  links: BlogLink[];
  /** Heading above the outbound sources block. Present only when sources are. */
  sourcesTitle?: string;
  /** Primary sources the article actually relies on. Optional by design. */
  sources?: BlogSource[];
  cta: { label: string; href: string; note: string };
};

export type BlogPost = {
  slug: string;
  /** ISO date. Used verbatim in Article JSON-LD. */
  date: string;
  updated?: string;
  /** Reading time differs by language, so it is measured per locale. */
  readingMinutes: Record<Locale, number>;
  featured?: boolean;
  /** Slugs of related articles, in preference order. */
  related: string[];
  content: Record<Locale, BlogLocaleContent>;
};

/* ------------------------------------------------------------------ */
/* 1. Invoice OCR accuracy                                             */
/* ------------------------------------------------------------------ */

const accuracyGuide: BlogPost = {
  slug: "invoice-ocr-accuracy-guide",
  date: "2026-06-18",
  readingMinutes: { en: 7, fr: 8, ar: 7 },
  featured: true,
  related: ["line-item-extraction-hard", "what-is-browser-ocr"],
  content: {
    en: {
      title: "What invoice OCR accuracy actually means — EasyInvoiceOCR",
      description:
        "Vendor accuracy claims are rarely comparable. How field-level accuracy is measured, why confidence scores matter more than averages, and how to test on your own invoices.",
      heading: "What invoice OCR accuracy actually means",
      category: "Accuracy",
      lede: "Every OCR vendor publishes an accuracy figure and almost none describe how it was measured. Here is how to read those numbers, and how to produce one you can trust.",
      imageAlt: "An invoice with the vendor, date, tax and total fields highlighted for review",
      body: [
        {
          paragraphs: [
            "A 99% character accuracy rate sounds excellent until you realise that a single wrong digit in a total makes the whole invoice unusable. Accuracy is only meaningful once you know what was counted, and almost every published figure counts the easiest thing.",
          ],
        },
        {
          heading: "Character accuracy versus field accuracy",
          paragraphs: [
            "Character accuracy counts individual glyphs. Field accuracy asks a stricter question: is the extracted total exactly equal to the total printed on the page? For accounts payable only field accuracy matters, and it is always the lower of the two numbers.",
            "When you compare tools, insist on field-level figures for the fields you actually post to your ledger — vendor, invoice number, date, tax and total. A tool that will not give you those has told you something.",
          ],
        },
        {
          heading: "Why confidence scores matter more than averages",
          paragraphs: [
            "A model that is right 92% of the time and knows when it is unsure beats a model that is right 96% of the time and is confidently wrong. Confidence turns extraction into a review queue: you check the flagged minority and trust the rest.",
          ],
          list: [
            "Above 0.95 — accept without review in most workflows.",
            "0.85 to 0.95 — spot-check on high-value invoices.",
            "Below 0.85 — always review before posting.",
          ],
        },
        {
          heading: "Arithmetic is a better test than confidence",
          paragraphs: [
            "The strongest evidence that an extraction is correct is not the model's own opinion of itself. It is whether the numbers reconcile: line items summing to the subtotal, subtotal plus tax equalling the stated total. A parse that balances is almost certainly right, whatever the confidence score says.",
          ],
        },
        {
          heading: "Measure on your own documents",
          paragraphs: [
            "Take twenty invoices that represent your real mix of suppliers, formats and languages, and run them through any tool you are evaluating. Count the fields you would have had to correct. Twenty documents from your own inbox tell you more than any published benchmark, because they contain your suppliers' templates rather than someone else's.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "Extract data from a PDF or scanned invoice", href: "/en/invoice-ocr" },
        { label: "How accounting teams run a review queue", href: "/en/solutions/accountants" },
        { label: "Confidence scores and correcting a field", href: "/en/documentation" },
      ],
      cta: {
        label: "Test it on your own invoice",
        href: "/en/invoice-ocr",
        note: "Five conversions are free. Processing runs in your browser.",
      },
    },
    fr: {
      title: "Ce que signifie la précision d'un OCR de factures — EasyInvoiceOCR",
      description:
        "Les taux annoncés sont rarement comparables. Comment se mesure la précision par champ, et comment la tester sur vos propres factures.",
      heading: "Précision d'un OCR de factures : ce que le chiffre signifie vraiment",
      category: "Précision",
      lede: "Chaque éditeur affiche un taux de précision, presque aucun n'explique comment il a été calculé. Voici comment lire ces chiffres — et comment en obtenir un qui vous soit utile.",
      imageAlt:
        "Une facture dont les champs fournisseur, date, TVA et total sont mis en évidence pour vérification",
      body: [
        {
          paragraphs: [
            "Un taux de 99 % au niveau des caractères paraît excellent, jusqu'au moment où l'on réalise qu'un seul chiffre erroné dans un total rend la facture entière inexploitable. Un taux de précision n'a de sens que si l'on sait ce qui a été compté, et la plupart des chiffres publiés comptent ce qu'il y a de plus simple à réussir.",
          ],
        },
        {
          heading: "Précision par caractère et précision par champ",
          paragraphs: [
            "La précision par caractère compte les glyphes un à un. La précision par champ pose une question plus exigeante : le total extrait est-il rigoureusement égal au total imprimé sur la page ? Pour la comptabilité fournisseurs, seule cette seconde mesure compte, et elle est toujours la plus basse des deux.",
            "Lors d'une comparaison, exigez des chiffres champ par champ pour les données que vous saisissez réellement en comptabilité : fournisseur, numéro de facture, date, TVA et total. Un éditeur qui refuse de les communiquer vient de vous répondre.",
          ],
        },
        {
          heading: "L'indice de confiance vaut mieux qu'une moyenne",
          paragraphs: [
            "Un modèle juste à 92 % qui sait reconnaître ses hésitations est préférable à un modèle juste à 96 % qui se trompe avec aplomb. L'indice de confiance transforme l'extraction en file de relecture : vous contrôlez la minorité signalée et vous faites confiance au reste.",
          ],
          list: [
            "Au-dessus de 0,95 — acceptation directe dans la plupart des cas.",
            "Entre 0,85 et 0,95 — contrôle ponctuel sur les factures à fort montant.",
            "En dessous de 0,85 — vérification systématique avant comptabilisation.",
          ],
        },
        {
          heading: "L'arithmétique est un meilleur juge que la confiance",
          paragraphs: [
            "La meilleure preuve qu'une extraction est correcte n'est pas l'opinion que le modèle a de lui-même : c'est la cohérence des montants. Les lignes s'additionnent-elles au sous-total ? Le sous-total augmenté de la TVA donne-t-il le total annoncé ? Une extraction qui s'équilibre est presque certainement juste, quel que soit l'indice affiché.",
          ],
        },
        {
          heading: "Mesurez sur vos propres documents",
          paragraphs: [
            "Prenez vingt factures représentatives de vos fournisseurs, de vos formats et de vos langues, puis passez-les dans l'outil que vous évaluez. Comptez les champs que vous auriez dû corriger. Vingt documents issus de votre propre messagerie vous en apprendront davantage que n'importe quel comparatif publié, parce qu'ils contiennent les modèles de vos fournisseurs et non ceux d'un autre.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "Extraire les données d'une facture PDF ou scannée", href: "/fr/invoice-ocr" },
        { label: "Organiser une file de relecture en cabinet", href: "/fr/solutions/accountants" },
        { label: "Indices de confiance et correction d'un champ", href: "/fr/documentation" },
      ],
      cta: {
        label: "Testez sur votre propre facture",
        href: "/fr/invoice-ocr",
        note: "Cinq conversions offertes. Le traitement s'effectue dans votre navigateur.",
      },
    },
    ar: {
      title: "ماذا تعني دقة استخراج بيانات الفواتير فعليًا — EasyInvoiceOCR",
      description:
        "نسب الدقة المُعلَنة نادرًا ما تكون قابلة للمقارنة. كيف تُقاس الدقة على مستوى الحقل، ولماذا تتفوق درجات الثقة على المتوسطات، وكيف تختبر الأداة على فواتيرك أنت.",
      heading: "ماذا تعني دقة استخراج بيانات الفواتير فعليًا؟",
      category: "الدقة",
      lede: "كل مزوّد يعلن نسبة دقة، ولا يكاد أحد يوضّح كيف قاسها. إليك كيف تقرأ هذه الأرقام، وكيف تحصل على رقم يمكنك الاعتماد عليه.",
      imageAlt: "فاتورة مع إبراز حقول المورّد والتاريخ والضريبة والإجمالي للمراجعة",
      body: [
        {
          paragraphs: [
            "تبدو نسبة 99٪ على مستوى الأحرف ممتازة، حتى تدرك أن رقمًا واحدًا خاطئًا في المبلغ الإجمالي يجعل الفاتورة كلها غير صالحة للاستخدام. لا معنى لنسبة الدقة ما لم تعرف ما الذي جرى عدّه، ومعظم الأرقام المنشورة تعدّ أسهل ما يمكن عدّه.",
          ],
        },
        {
          heading: "دقة الأحرف مقابل دقة الحقول",
          paragraphs: [
            "دقة الأحرف تحصي الرموز واحدًا واحدًا. أما دقة الحقول فتطرح سؤالًا أكثر صرامة: هل المبلغ الإجمالي المستخرج مطابق تمامًا للمبلغ المطبوع على الصفحة؟ في حسابات الموردين، لا يهم سوى المقياس الثاني، وهو دائمًا الأقل بين الاثنين.",
            "عند المقارنة بين الأدوات، اطلب أرقامًا لكل حقل على حدة، وتحديدًا للحقول التي تُدخلها فعلًا في دفاترك: المورّد ورقم الفاتورة والتاريخ والضريبة والإجمالي. والمزوّد الذي يمتنع عن تقديمها يكون قد أجابك بالفعل.",
          ],
        },
        {
          heading: "درجة الثقة أهم من المتوسط",
          paragraphs: [
            "النموذج الذي يصيب في 92٪ من الحالات ويعرف متى يتردد أفضل من نموذج يصيب في 96٪ ويخطئ بثقة تامة. درجة الثقة تحوّل الاستخراج إلى قائمة مراجعة: تتحقق من الأقلية المُعلَّمة وتثق بالباقي.",
          ],
          list: [
            "أعلى من 0.95 — قبول مباشر في معظم سير العمل.",
            "بين 0.85 و0.95 — تدقيق انتقائي للفواتير عالية القيمة.",
            "أقل من 0.85 — مراجعة إلزامية قبل الترحيل المحاسبي.",
          ],
        },
        {
          heading: "الحساب الرقمي اختبار أفضل من الثقة",
          paragraphs: [
            "أقوى دليل على صحة الاستخراج ليس رأي النموذج في نفسه، بل اتساق الأرقام: هل مجموع البنود يساوي المجموع الفرعي؟ وهل المجموع الفرعي مضافًا إليه الضريبة يساوي الإجمالي المعلن؟ الاستخراج المتوازن حسابيًا صحيح على الأرجح، مهما كانت درجة الثقة المعروضة.",
          ],
        },
        {
          heading: "اختبر على مستنداتك أنت",
          paragraphs: [
            "خذ عشرين فاتورة تمثّل مورّديك وصيغك ولغاتك الفعلية، ومرّرها في الأداة التي تقيّمها، ثم أحصِ الحقول التي كنت ستضطر إلى تصحيحها. عشرون مستندًا من بريدك أنت تخبرك أكثر من أي معيار منشور، لأنها تحتوي نماذج مورّديك لا نماذج غيرك.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "استخراج البيانات من فاتورة PDF أو ممسوحة ضوئيًا", href: "/ar/invoice-ocr" },
        { label: "كيف تنظّم فرق المحاسبة قائمة المراجعة", href: "/ar/solutions/accountants" },
        { label: "درجات الثقة وتصحيح الحقول", href: "/ar/documentation" },
      ],
      cta: {
        label: "جرّبها على فاتورتك",
        href: "/ar/invoice-ocr",
        note: "خمس عمليات تحويل مجانية. تتم المعالجة داخل متصفحك.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 2. Receipts to spreadsheet                                          */
/* ------------------------------------------------------------------ */

const receiptsWorkflow: BlogPost = {
  slug: "receipts-to-spreadsheet-workflow",
  date: "2026-05-02",
  readingMinutes: { en: 6, fr: 7, ar: 6 },
  related: ["invoice-ocr-accuracy-guide", "gdpr-document-processing"],
  content: {
    en: {
      title: "A monthly routine for turning receipts into a spreadsheet — EasyInvoiceOCR",
      description:
        "Capture, extract, review, archive. A repeatable monthly routine for freelancers and small teams that replaces the quarterly shoebox session.",
      heading: "A monthly routine for turning receipts into a spreadsheet",
      category: "Workflows",
      lede: "Receipt admin is unpleasant mainly because it is done all at once. Split into four small steps and run monthly, it stops being a task you dread.",
      imageAlt: "A stack of paper receipts beside a spreadsheet of extracted expense lines",
      body: [
        {
          paragraphs: [
            "The quarterly shoebox session is painful because every decision has gone cold. You are trying to remember what a faded café receipt from ten weeks ago was for, and whether it was billable. Doing the same work monthly costs less in total and far less in irritation.",
          ],
        },
        {
          heading: "1. Capture as you go",
          paragraphs: [
            "Photograph each receipt when it reaches you and drop it into one folder. Flat surface, decent light, all four corners in frame. This is the only step that has to happen throughout the month, and it takes seconds.",
          ],
        },
        {
          heading: "2. Extract in one batch",
          paragraphs: [
            "Once a month, run the whole folder through extraction and export a single spreadsheet. Dates, taxes, totals and line items arrive already typed as numbers and dates rather than as text that needs re-formatting before it will sum.",
          ],
        },
        {
          heading: "3. Review only what is flagged",
          paragraphs: [
            "Sort by confidence and correct the handful of fields that were uncertain. Faded thermal receipts are the usual culprits, along with anything that was folded through the total. Everything above the threshold you have chosen can be trusted without opening the image.",
          ],
        },
        {
          heading: "4. Archive the originals",
          paragraphs: [
            "Keep the images alongside the spreadsheet, named so a row can be traced back to a picture. Most tax authorities accept digital copies, and your future self will want the original the first time a line is queried.",
          ],
        },
        {
          heading: "What this does not solve",
          paragraphs: [
            "Extraction reads what is printed. It cannot tell you whether a lunch was billable, which project a taxi belongs to, or how an expense should be categorised in your chart of accounts. Those decisions stay yours — but you will be making them against typed data instead of a pile of paper.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "Turn a receipt into an Excel row", href: "/en/receipt-to-excel" },
        { label: "Expense routines for independent workers", href: "/en/solutions/freelancers" },
        { label: "What the exported workbook contains", href: "/en/documentation" },
      ],
      cta: {
        label: "Convert a receipt now",
        href: "/en/receipt-to-excel",
        note: "Five conversions are free. No card required.",
      },
    },
    fr: {
      title: "Transformer ses reçus en tableur : la routine mensuelle — EasyInvoiceOCR",
      description:
        "Photographier, extraire, vérifier, archiver. Une routine mensuelle reproductible pour indépendants et petites équipes, qui remplace la séance trimestrielle de rattrapage.",
      heading: "Transformer ses reçus en tableur : une routine mensuelle",
      category: "Méthodes",
      lede: "La gestion des reçus est pénible surtout parce qu'on la fait d'un seul bloc. Découpée en quatre gestes et répétée chaque mois, elle cesse d'être une corvée.",
      imageAlt: "Une pile de reçus papier à côté d'un tableur contenant les dépenses extraites",
      body: [
        {
          paragraphs: [
            "La séance de rattrapage trimestrielle est douloureuse parce que toutes les décisions ont refroidi. Vous essayez de vous rappeler à quoi correspondait un ticket de café délavé d'il y a dix semaines, et s'il était refacturable. Le même travail réparti mensuellement coûte moins de temps au total, et infiniment moins d'agacement.",
          ],
        },
        {
          heading: "1. Photographier au fil de l'eau",
          paragraphs: [
            "Prenez chaque reçu en photo dès que vous le recevez et déposez-le dans un dossier unique. Surface plane, lumière correcte, les quatre coins dans le cadre. C'est la seule étape qui doit se répéter tout au long du mois, et elle prend quelques secondes.",
          ],
        },
        {
          heading: "2. Extraire en une seule fois",
          paragraphs: [
            "Une fois par mois, passez le dossier entier en extraction et exportez un tableur unique. Les dates, les taxes, les totaux et les lignes arrivent déjà typés en nombres et en dates, et non sous forme de texte qu'il faudrait reformater avant de pouvoir l'additionner.",
          ],
        },
        {
          heading: "3. Ne vérifier que ce qui est signalé",
          paragraphs: [
            "Triez par indice de confiance et corrigez la poignée de champs incertains. Les tickets thermiques effacés sont les coupables habituels, avec tout ce qui a été plié en travers du montant. Au-dessus du seuil que vous avez fixé, inutile d'ouvrir l'image.",
          ],
        },
        {
          heading: "4. Archiver les originaux",
          paragraphs: [
            "Conservez les images à côté du tableur, nommées de façon qu'une ligne puisse être rattachée à sa photo. La plupart des administrations fiscales acceptent les copies numériques, et vous voudrez l'original dès la première ligne contestée.",
          ],
        },
        {
          heading: "Ce que cela ne règle pas",
          paragraphs: [
            "L'extraction lit ce qui est imprimé. Elle ne vous dira pas si un déjeuner était refacturable, à quel projet rattacher une course de taxi, ni comment ventiler une dépense dans votre plan comptable. Ces arbitrages restent les vôtres — mais vous les rendrez face à des données déjà saisies plutôt qu'à une pile de papier.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "Convertir un reçu en ligne de tableur", href: "/fr/receipt-to-excel" },
        { label: "Gérer ses notes de frais en indépendant", href: "/fr/solutions/freelancers" },
        { label: "Ce que contient le classeur exporté", href: "/fr/documentation" },
      ],
      cta: {
        label: "Convertir un reçu maintenant",
        href: "/fr/receipt-to-excel",
        note: "Cinq conversions offertes. Sans carte bancaire.",
      },
    },
    ar: {
      title: "روتين شهري لتحويل الإيصالات إلى جدول بيانات — EasyInvoiceOCR",
      description:
        "التقاط، استخراج، مراجعة، أرشفة. روتين شهري قابل للتكرار للعاملين المستقلين والفرق الصغيرة، يغني عن جلسة التدارك الفصلية.",
      heading: "روتين شهري لتحويل الإيصالات إلى جدول بيانات",
      category: "سير العمل",
      lede: "إدارة الإيصالات مرهقة أساسًا لأنها تُنجَز دفعة واحدة. وحين تُقسَّم إلى أربع خطوات صغيرة تتكرر شهريًا، تتوقف عن كونها مهمة تؤجلها.",
      imageAlt: "مجموعة إيصالات ورقية بجانب جدول بيانات يحتوي بنود المصروفات المستخرجة",
      body: [
        {
          paragraphs: [
            "جلسة التدارك الفصلية مؤلمة لأن كل قرار فيها قد برد. تحاول أن تتذكر سبب إيصال مقهى باهت يعود إلى عشرة أسابيع مضت، وهل كان قابلًا لإعادة الفوترة. العمل نفسه موزّعًا شهريًا يكلّف وقتًا أقل إجمالًا، وانزعاجًا أقل بكثير.",
          ],
        },
        {
          heading: "١. التقط الصور أولًا بأول",
          paragraphs: [
            "صوّر كل إيصال فور استلامه وضعه في مجلد واحد: سطح مستوٍ، وإضاءة كافية، والأركان الأربعة داخل الإطار. هذه هي الخطوة الوحيدة التي تتكرر طوال الشهر، ولا تستغرق سوى ثوانٍ.",
          ],
        },
        {
          heading: "٢. استخرج البيانات دفعة واحدة",
          paragraphs: [
            "مرّة كل شهر، مرّر المجلد كاملًا عبر الاستخراج وصدّر جدول بيانات واحدًا. تصل التواريخ والضرائب والإجماليات والبنود بأنواعها الصحيحة كأرقام وتواريخ، لا كنص يحتاج إعادة تنسيق قبل أن يقبل الجمع.",
          ],
        },
        {
          heading: "٣. راجع ما تم تعليمه فقط",
          paragraphs: [
            "رتّب النتائج حسب درجة الثقة وصحّح الحقول القليلة غير المؤكدة. الإيصالات الحرارية الباهتة هي المتهم المعتاد، ومعها كل ما طُوي عند موضع المبلغ. أما ما تجاوز الحد الذي اخترته فلا حاجة لفتح صورته.",
          ],
        },
        {
          heading: "٤. احتفظ بالأصول",
          paragraphs: [
            "احفظ الصور إلى جانب الجدول، بأسماء تتيح ربط كل سطر بصورته. تقبل معظم الجهات الضريبية النسخ الرقمية، وستحتاج إلى الأصل عند أول بند يُطلب توضيحه.",
          ],
        },
        {
          heading: "ما لا تحلّه هذه الطريقة",
          paragraphs: [
            "الاستخراج يقرأ ما هو مطبوع فقط. لن يخبرك إن كان غداء عمل قابلًا لإعادة الفوترة، ولا إلى أي مشروع تنتمي أجرة سيارة، ولا كيف تُصنَّف المصروف في دليل حساباتك. تبقى هذه القرارات لك — لكنك ستتخذها أمام بيانات مُدخَلة بالفعل بدل كومة من الورق.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "تحويل إيصال إلى صف في Excel", href: "/ar/receipt-to-excel" },
        { label: "تنظيم المصروفات للعاملين المستقلين", href: "/ar/solutions/freelancers" },
        { label: "محتويات ملف Excel المُصدَّر", href: "/ar/documentation" },
      ],
      cta: {
        label: "حوّل إيصالًا الآن",
        href: "/ar/receipt-to-excel",
        note: "خمس عمليات تحويل مجانية. دون بطاقة دفع.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 3. Multilingual extraction                                          */
/* ------------------------------------------------------------------ */

const multilingual: BlogPost = {
  slug: "multilingual-invoice-extraction",
  date: "2026-03-21",
  updated: "2026-06-01",
  readingMinutes: { en: 8, fr: 9, ar: 8 },
  related: ["invoice-ocr-accuracy-guide", "tesseract-js-browser-ocr"],
  content: {
    en: {
      title: "Extracting invoice data in Arabic and French — EasyInvoiceOCR",
      description:
        "Right-to-left layouts, Eastern Arabic numerals and bilingual invoices break parsers built for one script. What actually goes wrong, and how it is caught.",
      heading: "Extracting invoice data in Arabic, French and mixed scripts",
      category: "Product",
      lede: "A single invoice can carry Arabic vendor details, English item descriptions and two different numeral systems. Handling that is a layout problem before it is a character-recognition problem.",
      imageAlt:
        "A bilingual Arabic and English invoice showing right-to-left labels beside Western digits",
      body: [
        {
          paragraphs: [
            "An invoice issued in Riyadh may carry Arabic vendor details, English item descriptions, Eastern Arabic numerals in the header and Western digits in the totals table. Every one of those transitions is a place where a parser built for a single script quietly produces the wrong answer.",
          ],
        },
        {
          heading: "Reading order is not visual order",
          paragraphs: [
            "In a right-to-left document the label sits to the right of its value. A parser that assumes left-to-right pairing attaches every label to the wrong field and reports it confidently, because nothing about the character recognition failed — only the pairing did.",
            "This is why layout has to be resolved from coordinates rather than from reading order alone. The label nearest a value in the direction the document actually flows is the one that belongs to it.",
          ],
        },
        {
          heading: "Two numeral systems on one page",
          paragraphs: [
            "Eastern Arabic numerals must be normalised before any arithmetic check can run, and it is common to find both systems on the same invoice — one in the header, another in the table. Digits are normalised to Western form and dates to ISO 8601 before validation begins, so that a comparison is never made between two different notations.",
          ],
        },
        {
          heading: "Ambiguous dates are refused, not guessed",
          paragraphs: [
            "A date written 03/04/2026 is the third of April or the fourth of March depending on where the invoice was issued. Where the format cannot be established from the document itself, the field is flagged rather than resolved by assumption. A guessed date that happens to be wrong is more expensive than an empty one.",
          ],
        },
        {
          heading: "Validate with arithmetic, not with confidence",
          paragraphs: [
            "The strongest signal that a multilingual extraction is correct is not the recognition score — it is whether the numbers add up. When the line items sum to the subtotal and the subtotal plus tax equals the total, the parse is almost certainly right, whatever script it was read in.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "Read invoices in Arabic, French or English", href: "/en/invoice-ocr" },
        {
          label: "Multi-entity and multilingual accounting teams",
          href: "/en/solutions/accountants",
        },
        { label: "Languages, scripts and returned fields", href: "/en/documentation" },
      ],
      cta: {
        label: "Try a bilingual invoice",
        href: "/en/invoice-ocr",
        note: "Five conversions are free. Nothing leaves your browser during recognition.",
      },
    },
    fr: {
      title: "Extraire des factures en arabe et en français — EasyInvoiceOCR",
      description:
        "Mise en page de droite à gauche, chiffres arabes orientaux, factures bilingues : autant de pièges pour un analyseur conçu pour une seule écriture. Ce qui se casse, et comment on le détecte.",
      heading: "Extraire des factures en arabe, en français et en écritures mixtes",
      category: "Produit",
      lede: "Une même facture peut mêler un fournisseur en arabe, des libellés en anglais et deux systèmes de chiffres. C'est d'abord un problème de mise en page, avant d'être un problème de reconnaissance de caractères.",
      imageAlt:
        "Une facture bilingue arabe-anglais montrant des libellés de droite à gauche à côté de chiffres occidentaux",
      body: [
        {
          paragraphs: [
            "Une facture émise à Riyad peut comporter les coordonnées du fournisseur en arabe, les désignations d'articles en anglais, des chiffres arabes orientaux dans l'en-tête et des chiffres occidentaux dans le tableau des totaux. Chacune de ces ruptures est un endroit où un analyseur conçu pour une seule écriture se trompe sans le signaler.",
          ],
        },
        {
          heading: "L'ordre de lecture n'est pas l'ordre visuel",
          paragraphs: [
            "Dans un document de droite à gauche, le libellé se place à droite de sa valeur. Un analyseur qui suppose un appariement de gauche à droite rattache chaque libellé au mauvais champ — et l'affirme avec assurance, car la reconnaissance des caractères, elle, a parfaitement fonctionné. Seul l'appariement a échoué.",
            "C'est pourquoi la mise en page doit être résolue à partir des coordonnées, et non du seul ordre de lecture. Le bon libellé est celui qui est le plus proche de la valeur dans le sens où le document s'écrit réellement.",
          ],
        },
        {
          heading: "Deux systèmes de chiffres sur une même page",
          paragraphs: [
            "Les chiffres arabes orientaux doivent être normalisés avant tout contrôle arithmétique, et il est fréquent de rencontrer les deux systèmes sur une même facture : l'un dans l'en-tête, l'autre dans le tableau. Les chiffres sont ramenés à la forme occidentale et les dates au format ISO 8601 avant le début des vérifications, afin qu'aucune comparaison ne porte sur deux notations différentes.",
          ],
        },
        {
          heading: "Une date ambiguë est refusée, pas devinée",
          paragraphs: [
            "Une date notée 03/04/2026 désigne le 3 avril ou le 4 mars selon le pays d'émission. Lorsque le format ne peut pas être établi à partir du document lui-même, le champ est signalé plutôt que tranché par hypothèse. Une date devinée qui se révèle fausse coûte plus cher qu'une date laissée vide.",
          ],
        },
        {
          heading: "Valider par l'arithmétique plutôt que par la confiance",
          paragraphs: [
            "Le meilleur indice qu'une extraction multilingue est correcte n'est pas le score de reconnaissance, c'est la cohérence des montants. Quand les lignes s'additionnent au sous-total et que le sous-total augmenté de la taxe donne le total, l'extraction est presque certainement juste, quelle que soit l'écriture d'origine.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "Lire des factures en arabe, français ou anglais", href: "/fr/invoice-ocr" },
        { label: "Cabinets multilingues et multi-entités", href: "/fr/solutions/accountants" },
        { label: "Langues, écritures et champs restitués", href: "/fr/documentation" },
      ],
      cta: {
        label: "Essayer avec une facture bilingue",
        href: "/fr/invoice-ocr",
        note: "Cinq conversions offertes. Rien ne quitte votre navigateur pendant la reconnaissance.",
      },
    },
    ar: {
      title: "استخراج بيانات الفواتير بالعربية والفرنسية — EasyInvoiceOCR",
      description:
        "التخطيط من اليمين إلى اليسار، والأرقام العربية المشرقية، والفواتير ثنائية اللغة: عقبات أمام أي محلّل صُمِّم لكتابة واحدة. ما الذي يختلّ فعلًا، وكيف يُكتشف.",
      heading: "استخراج بيانات الفواتير بالعربية والفرنسية والنصوص المختلطة",
      category: "المنتج",
      lede: "قد تجمع فاتورة واحدة بيانات مورّد بالعربية وأوصاف أصناف بالإنجليزية ونظامي أرقام مختلفين. هذه مشكلة تخطيط قبل أن تكون مشكلة تعرّف على الحروف.",
      imageAlt:
        "فاتورة ثنائية اللغة بالعربية والإنجليزية تُظهر تسميات من اليمين إلى اليسار بجوار أرقام غربية",
      body: [
        {
          paragraphs: [
            "قد تحمل فاتورة صادرة في الرياض بيانات المورّد بالعربية، وأوصاف الأصناف بالإنجليزية، وأرقامًا عربية مشرقية في الترويسة، وأرقامًا غربية في جدول الإجماليات. كل انتقال من هذه الانتقالات موضعٌ يعطي فيه محلّلٌ مصمَّم لكتابة واحدة نتيجة خاطئة دون أن ينبّه إليها.",
          ],
        },
        {
          heading: "ترتيب القراءة ليس الترتيب البصري",
          paragraphs: [
            "في المستندات التي تُكتب من اليمين إلى اليسار، تقع التسمية على يمين قيمتها. والمحلّل الذي يفترض الاقتران من اليسار إلى اليمين يربط كل تسمية بالحقل الخطأ، ثم يعلن النتيجة بثقة، لأن التعرّف على الحروف لم يفشل أصلًا — الذي فشل هو الاقتران.",
            "لهذا يجب حلّ التخطيط انطلاقًا من الإحداثيات لا من ترتيب القراءة وحده. التسمية الصحيحة هي الأقرب إلى القيمة في الاتجاه الذي يسير فيه المستند فعليًا.",
          ],
        },
        {
          heading: "نظاما أرقام في صفحة واحدة",
          paragraphs: [
            "يجب توحيد الأرقام العربية المشرقية قبل إجراء أي تحقق حسابي، وكثيرًا ما يظهر النظامان معًا في الفاتورة ذاتها: أحدهما في الترويسة والآخر في الجدول. تُحوَّل الأرقام إلى الصيغة الغربية والتواريخ إلى معيار ISO 8601 قبل بدء التحقق، حتى لا تقع أي مقارنة بين ترميزين مختلفين.",
          ],
        },
        {
          heading: "التاريخ الملتبس يُرفض ولا يُخمَّن",
          paragraphs: [
            "التاريخ المكتوب 03/04/2026 يعني الثالث من أبريل أو الرابع من مارس بحسب بلد الإصدار. وحين يتعذّر تحديد الصيغة من المستند نفسه، يُعلَّم الحقل بدل أن يُحسَم بالافتراض. فالتاريخ المُخمَّن الذي يتضح خطؤه أغلى ثمنًا من حقل تُرك فارغًا.",
          ],
        },
        {
          heading: "التحقق بالحساب لا بالثقة",
          paragraphs: [
            "أقوى مؤشر على صحة استخراج متعدد اللغات ليس درجة التعرّف، بل اتساق الأرقام. فحين يساوي مجموع البنود المجموعَ الفرعي، ويساوي المجموع الفرعي مضافًا إليه الضريبة الإجماليَ المعلن، يكون الاستخراج صحيحًا على الأرجح مهما كانت الكتابة التي قُرئ بها.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "قراءة الفواتير بالعربية أو الفرنسية أو الإنجليزية", href: "/ar/invoice-ocr" },
        { label: "الفرق المحاسبية متعددة اللغات والكيانات", href: "/ar/solutions/accountants" },
        { label: "اللغات والكتابات والحقول المُستخرَجة", href: "/ar/documentation" },
      ],
      cta: {
        label: "جرّب فاتورة ثنائية اللغة",
        href: "/ar/invoice-ocr",
        note: "خمس عمليات تحويل مجانية. لا شيء يغادر متصفحك أثناء التعرّف.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 4. GDPR                                                             */
/* ------------------------------------------------------------------ */

const gdpr: BlogPost = {
  slug: "gdpr-document-processing",
  date: "2026-01-29",
  readingMinutes: { en: 5, fr: 6, ar: 5 },
  related: ["receipts-to-spreadsheet-workflow", "choosing-ocr-api"],
  content: {
    en: {
      title: "GDPR questions to ask an OCR service — EasyInvoiceOCR",
      description:
        "Supplier invoices contain personal data. Five questions to put to any document-processing vendor before your first upload, and what a good answer sounds like.",
      heading: "GDPR questions to ask before uploading invoices to an OCR service",
      category: "Security",
      lede: "Uploading a supplier invoice to a third party is processing personal data. It deserves the same scrutiny as any other processor relationship — here is the short version of that scrutiny.",
      imageAlt: "An invoice with personal details such as name, address and bank line obscured",
      body: [
        {
          paragraphs: [
            "Supplier invoices routinely contain names, postal addresses, bank details and sometimes signatures. That makes them personal data, and sending them to a vendor makes that vendor a processor acting on your instructions. None of this is exotic; it simply means the questions below have to be asked before the first upload rather than after an incident.",
            "This article is general information about what to ask, not legal advice. Where an obligation applies to your organisation specifically, take advice from someone qualified to give it.",
          ],
        },
        {
          heading: "The five questions",
          paragraphs: [
            "Ask these before your first upload, and get the answers in writing rather than from a sales call.",
          ],
          list: [
            "Where are documents stored, and under which jurisdictions?",
            "How long are they retained after processing, and can I force deletion on demand?",
            "Are my documents used to train models? If so, can I opt out, and is opting out the default?",
            "Who inside the vendor can read my documents, and is that access logged?",
            "Is there a data processing agreement, and does it name the sub-processors?",
          ],
        },
        {
          heading: "What a good answer sounds like",
          paragraphs: [
            "A specific retention window rather than 'as long as necessary'. Deletion on demand that you can trigger yourself. No training on customer documents by default. Access that is limited by role and logged. A data processing agreement written to be read rather than to be survived. Vagueness on any one of these is itself an answer.",
          ],
        },
        {
          heading: "The question behind the questions",
          paragraphs: [
            "Every item above is really asking the same thing: does the document need to leave your control at all? Where recognition can run locally in the browser, the upload never happens and most of the list stops applying. That is not a universal answer — some workloads genuinely need a server — but it is worth establishing before you accept the risk by default.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "How documents are handled and stored", href: "/en/security" },
        { label: "Data handling for small businesses", href: "/en/solutions/small-businesses" },
        { label: "Deleting your documents and account", href: "/en/documentation" },
      ],
      cta: {
        label: "Read our security page",
        href: "/en/security",
        note: "Recognition runs in your browser. Files are not uploaded to be read.",
      },
    },
    fr: {
      title: "RGPD : les questions à poser à un service OCR — EasyInvoiceOCR",
      description:
        "Les factures fournisseurs contiennent des données personnelles. Cinq questions à poser à tout prestataire de traitement documentaire avant le premier envoi, et à quoi ressemble une bonne réponse.",
      heading: "RGPD : les questions à poser avant de confier vos factures à un service OCR",
      category: "Sécurité",
      lede: "Envoyer une facture fournisseur à un tiers, c'est traiter des données personnelles. Cela mérite le même examen que toute autre relation de sous-traitance — en voici la version courte.",
      imageAlt: "Une facture dont le nom, l'adresse et la ligne bancaire sont masqués",
      body: [
        {
          paragraphs: [
            "Les factures fournisseurs contiennent couramment des noms, des adresses postales, des coordonnées bancaires et parfois des signatures. Ce sont donc des données personnelles, et les transmettre à un éditeur fait de celui-ci un sous-traitant agissant sur vos instructions. Rien d'exotique là-dedans : cela signifie simplement que les questions ci-dessous se posent avant le premier envoi, et non après un incident.",
            "Cet article donne des informations générales sur les questions à poser ; il ne constitue pas un conseil juridique. Pour ce qui relève de votre situation propre, adressez-vous à une personne qualifiée.",
          ],
        },
        {
          heading: "Les cinq questions",
          paragraphs: [
            "Posez-les avant le premier envoi, et obtenez les réponses par écrit plutôt qu'au téléphone avec un commercial.",
          ],
          list: [
            "Où les documents sont-ils hébergés, et sous quelles juridictions ?",
            "Combien de temps sont-ils conservés après traitement, et puis-je en exiger la suppression ?",
            "Mes documents servent-ils à entraîner des modèles ? Si oui, puis-je m'y opposer, et le refus est-il l'option par défaut ?",
            "Qui, chez le prestataire, peut lire mes documents, et ces accès sont-ils journalisés ?",
            "Existe-t-il un accord de sous-traitance, et nomme-t-il les sous-traitants ultérieurs ?",
          ],
        },
        {
          heading: "À quoi ressemble une bonne réponse",
          paragraphs: [
            "Une durée de conservation chiffrée plutôt qu'un « le temps nécessaire ». Une suppression que vous pouvez déclencher vous-même. Aucun entraînement sur les documents clients par défaut. Des accès limités par rôle et journalisés. Un accord de sous-traitance rédigé pour être lu et non pour être enduré. Le flou sur l'un de ces points constitue déjà une réponse.",
          ],
        },
        {
          heading: "La question derrière les questions",
          paragraphs: [
            "Tous ces points reviennent au fond à la même interrogation : le document doit-il seulement sortir de votre contrôle ? Lorsque la reconnaissance peut s'exécuter localement dans le navigateur, l'envoi n'a pas lieu et la majeure partie de la liste cesse de s'appliquer. Ce n'est pas une réponse universelle — certains traitements exigent réellement un serveur — mais cela vaut la peine d'être tranché avant d'accepter le risque par défaut.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "Comment les documents sont traités et conservés", href: "/fr/security" },
        {
          label: "Protection des données en petite entreprise",
          href: "/fr/solutions/small-businesses",
        },
        { label: "Supprimer vos documents et votre compte", href: "/fr/documentation" },
      ],
      cta: {
        label: "Consulter notre page sécurité",
        href: "/fr/security",
        note: "La reconnaissance s'exécute dans votre navigateur. Les fichiers ne sont pas envoyés pour être lus.",
      },
    },
    ar: {
      title: "أسئلة حماية البيانات قبل رفع فواتيرك إلى خدمة OCR — EasyInvoiceOCR",
      description:
        "فواتير المورّدين تتضمن بيانات شخصية. خمسة أسئلة اطرحها على أي مزوّد لمعالجة المستندات قبل أول عملية رفع، وكيف تبدو الإجابة الجيدة.",
      heading: "أسئلة حماية البيانات قبل رفع فواتيرك إلى خدمة OCR",
      category: "الأمان",
      lede: "رفع فاتورة مورّد إلى طرف ثالث هو معالجة لبيانات شخصية، ويستحق التدقيق نفسه الذي تمنحه لأي علاقة معالجة أخرى. إليك النسخة المختصرة من هذا التدقيق.",
      imageAlt: "فاتورة مع إخفاء الاسم والعنوان وسطر الحساب المصرفي",
      body: [
        {
          paragraphs: [
            "تتضمن فواتير المورّدين عادةً أسماءً وعناوين بريدية وبيانات مصرفية وأحيانًا توقيعات، وهي بذلك بيانات شخصية. وإرسالها إلى مزوّد يجعل منه جهة معالجة تعمل وفق تعليماتك. لا شيء غريب في ذلك؛ غاية ما في الأمر أن الأسئلة التالية يجب أن تُطرح قبل أول عملية رفع، لا بعد وقوع حادثة.",
            "هذه المقالة معلومات عامة عمّا ينبغي السؤال عنه، وليست استشارة قانونية. وحيثما ينطبق التزام بعينه على مؤسستك، فاستعن بمن يملك الصفة لتقديم المشورة.",
          ],
        },
        {
          heading: "الأسئلة الخمسة",
          paragraphs: ["اطرحها قبل أول عملية رفع، واحصل على الإجابات كتابةً لا في مكالمة مبيعات."],
          list: [
            "أين تُخزَّن المستندات، وتحت أي ولاية قضائية؟",
            "كم تبقى محفوظة بعد المعالجة، وهل يمكنني فرض حذفها عند الطلب؟",
            "هل تُستخدَم مستنداتي في تدريب النماذج؟ وإن كان كذلك، هل يمكنني الاعتراض، وهل الرفض هو الوضع الافتراضي؟",
            "من داخل الجهة المزوِّدة يستطيع قراءة مستنداتي، وهل يُسجَّل هذا الوصول؟",
            "هل هناك اتفاقية معالجة بيانات، وهل تذكر الجهات المعالِجة الفرعية بالاسم؟",
          ],
        },
        {
          heading: "كيف تبدو الإجابة الجيدة",
          paragraphs: [
            "مدة احتفاظ محددة بالأرقام بدل عبارة «المدة اللازمة». وحذف تستطيع تنفيذه بنفسك. وعدم التدريب على مستندات العملاء افتراضيًا. ووصول محدود بحسب الدور ومُسجَّل. واتفاقية معالجة مكتوبة لتُقرأ لا لتُحتمَل. والغموض في أي بند من هذه البنود هو في ذاته إجابة.",
          ],
        },
        {
          heading: "السؤال الكامن خلف الأسئلة",
          paragraphs: [
            "كل ما سبق يعود في جوهره إلى سؤال واحد: هل يحتاج المستند إلى مغادرة سيطرتك أصلًا؟ فحين يمكن تشغيل التعرّف محليًا داخل المتصفح، لا تحدث عملية الرفع من الأساس ويسقط معظم بنود القائمة. ليست هذه إجابة صالحة لكل حالة — فبعض أعباء العمل تحتاج خادمًا فعلًا — لكن يُستحسن حسمها قبل قبول المخاطرة تلقائيًا.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "كيف تُعالَج المستندات وتُحفَظ", href: "/ar/security" },
        { label: "حماية البيانات في الشركات الصغيرة", href: "/ar/solutions/small-businesses" },
        { label: "حذف مستنداتك وحسابك", href: "/ar/documentation" },
      ],
      cta: {
        label: "اطّلع على صفحة الأمان",
        href: "/ar/security",
        note: "يتم التعرّف داخل متصفحك. لا تُرفع الملفات لتُقرأ.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 5. Line items                                                       */
/* ------------------------------------------------------------------ */

const lineItems: BlogPost = {
  slug: "line-item-extraction-hard",
  date: "2025-11-14",
  readingMinutes: { en: 6, fr: 7, ar: 6 },
  related: ["what-is-browser-ocr", "multilingual-invoice-extraction"],
  content: {
    en: {
      title: "Why line-item extraction is harder than reading the total — EasyInvoiceOCR",
      description:
        "Totals sit in predictable places. Tables do not. Borderless columns, wrapped descriptions and page breaks are what actually separate a parser that works from one that demos well.",
      heading: "Why line-item extraction is harder than reading the total",
      category: "Accuracy",
      lede: "Finding the total on an invoice is close to a solved problem. Reconstructing a twenty-row table that wraps across two pages is not, and that is where parsers are really tested.",
      imageAlt:
        "An invoice table with no ruling lines, where columns are separated only by whitespace",
      body: [
        {
          paragraphs: [
            "The total is the largest number near the word 'total', usually at the bottom of the page. That is a shape a parser can learn. A table of twenty lines with wrapped descriptions, a continuation onto page two and a running subtotal in the middle is not a shape — it is a structure that has to be rebuilt.",
          ],
        },
        {
          heading: "Tables without borders",
          paragraphs: [
            "Many invoice templates separate columns with whitespace rather than rules. Column boundaries then have to be inferred from the alignment of the values themselves, and a single description that wraps onto a second line can shift every value on that row into the wrong column.",
          ],
        },
        {
          heading: "Page breaks and phantom rows",
          paragraphs: [
            "When a table continues onto a second page, the header may or may not repeat, and a carried-forward subtotal often appears that is not a line item at all. Treating it as one silently inflates the parse — and because the arithmetic still nearly works, it is exactly the kind of error that survives a quick review.",
          ],
        },
        {
          heading: "Arithmetic as a safety net",
          paragraphs: [
            "Two checks catch most of this. Quantity multiplied by unit price should equal the line total, and the lines should sum to the subtotal. Where either fails, the affected rows are flagged for review rather than exported as though nothing happened.",
            "This is why arithmetic validation matters more on line items than anywhere else on the document: it is the only place where the page contains enough redundancy to check itself.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "Parse a PDF invoice into structured lines", href: "/en/pdf-invoice-parser" },
        { label: "Line-item review in accounts payable", href: "/en/solutions/accountants" },
        { label: "Which fields and line items are returned", href: "/en/documentation" },
      ],
      cta: {
        label: "Parse an invoice with line items",
        href: "/en/pdf-invoice-parser",
        note: "Five conversions are free.",
      },
    },
    fr: {
      title: "Extraire les lignes est plus dur que lire le total — EasyInvoiceOCR",
      description:
        "Les totaux occupent des emplacements prévisibles, pas les tableaux. Colonnes sans filets, libellés qui débordent et sauts de page : le vrai test d'un analyseur.",
      heading: "Pourquoi extraire les lignes est plus difficile que lire le total",
      category: "Précision",
      lede: "Trouver le total d'une facture est un problème pratiquement résolu. Reconstituer un tableau de vingt lignes qui se poursuit sur une deuxième page ne l'est pas — et c'est là que les analyseurs sont réellement mis à l'épreuve.",
      imageAlt:
        "Un tableau de facture sans filets, dont les colonnes ne sont séparées que par des blancs",
      body: [
        {
          paragraphs: [
            "Le total, c'est le plus grand nombre situé près du mot « total », généralement en bas de page. C'est une forme qu'un analyseur peut apprendre. Un tableau de vingt lignes avec des libellés qui débordent, une suite en page deux et un sous-total intermédiaire n'est pas une forme : c'est une structure qu'il faut reconstruire.",
          ],
        },
        {
          heading: "Des tableaux sans filets",
          paragraphs: [
            "De nombreux modèles de facture séparent les colonnes par des espaces plutôt que par des traits. Les limites de colonnes doivent alors être déduites de l'alignement des valeurs elles-mêmes, et un seul libellé qui passe à la ligne suffit à décaler toutes les valeurs de la rangée dans la mauvaise colonne.",
          ],
        },
        {
          heading: "Sauts de page et lignes fantômes",
          paragraphs: [
            "Lorsqu'un tableau se poursuit sur une deuxième page, l'en-tête se répète ou non, et un report de sous-total apparaît souvent alors qu'il ne constitue pas une ligne de facture. Le compter comme telle gonfle silencieusement le résultat — et comme l'arithmétique tombe presque juste, c'est précisément le type d'erreur qui survit à une relecture rapide.",
          ],
        },
        {
          heading: "L'arithmétique comme filet de sécurité",
          paragraphs: [
            "Deux contrôles suffisent à intercepter l'essentiel. La quantité multipliée par le prix unitaire doit égaler le montant de la ligne, et la somme des lignes doit égaler le sous-total. Dès que l'un des deux échoue, les rangées concernées sont signalées pour vérification au lieu d'être exportées comme si de rien n'était.",
            "C'est là que la validation arithmétique compte le plus : les lignes de facture sont le seul endroit du document qui contient assez de redondance pour se contrôler lui-même.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "Analyser une facture PDF ligne par ligne", href: "/fr/pdf-invoice-parser" },
        {
          label: "Contrôle des lignes en comptabilité fournisseurs",
          href: "/fr/solutions/accountants",
        },
        { label: "Champs et lignes restitués", href: "/fr/documentation" },
      ],
      cta: {
        label: "Analyser une facture avec ses lignes",
        href: "/fr/pdf-invoice-parser",
        note: "Cinq conversions offertes.",
      },
    },
    ar: {
      title: "لماذا استخراج بنود الفاتورة أصعب من قراءة الإجمالي — EasyInvoiceOCR",
      description:
        "المبالغ الإجمالية تقع في مواضع متوقَّعة، أما الجداول فلا. الأعمدة بلا خطوط، والأوصاف التي تلتفّ على سطرين، وفواصل الصفحات: هذا ما يفصل محلّلًا يعمل عن محلّل يُحسِن العرض فقط.",
      heading: "لماذا استخراج بنود الفاتورة أصعب من قراءة الإجمالي؟",
      category: "الدقة",
      lede: "العثور على إجمالي الفاتورة مشكلة تكاد تكون محلولة، أما إعادة بناء جدول من عشرين بندًا يمتد إلى صفحة ثانية فلا. وهنا تُختبر المحلّلات فعليًا.",
      imageAlt: "جدول فاتورة بلا خطوط فاصلة، تفصل بين أعمدته المسافات البيضاء فقط",
      body: [
        {
          paragraphs: [
            "الإجمالي هو أكبر رقم قرب كلمة «الإجمالي»، وغالبًا في أسفل الصفحة، وهذا نمط يستطيع المحلّل تعلّمه. أما جدول من عشرين بندًا بأوصاف تمتد على أكثر من سطر، وامتداد إلى صفحة ثانية، ومجموع فرعي في المنتصف، فليس نمطًا: إنه بنية يجب إعادة بنائها.",
          ],
        },
        {
          heading: "جداول بلا خطوط",
          paragraphs: [
            "كثير من نماذج الفواتير تفصل الأعمدة بالمسافات البيضاء بدل الخطوط. عندها يجب استنتاج حدود الأعمدة من محاذاة القيم نفسها، ويكفي وصف واحد ينتقل إلى سطر ثانٍ لكي تنزاح كل قيم ذلك الصف إلى العمود الخطأ.",
          ],
        },
        {
          heading: "فواصل الصفحات والصفوف الوهمية",
          paragraphs: [
            "حين يمتد الجدول إلى صفحة ثانية، قد تتكرر الترويسة وقد لا تتكرر، وكثيرًا ما يظهر مجموع فرعي مُرحَّل ليس بندًا أصلًا. واحتسابه بندًا يضخّم النتيجة بصمت — ولأن الحساب يظل قريبًا من الصواب، فهو تحديدًا نوع الخطأ الذي ينجو من مراجعة سريعة.",
          ],
        },
        {
          heading: "الحساب شبكة أمان",
          paragraphs: [
            "يلتقط فحصان معظم هذه الأخطاء: الكمية مضروبة في سعر الوحدة يجب أن تساوي إجمالي البند، ومجموع البنود يجب أن يساوي المجموع الفرعي. وعند فشل أي منهما، تُعلَّم الصفوف المعنية للمراجعة بدل تصديرها وكأن شيئًا لم يكن.",
            "لهذا السبب يهمّ التحقق الحسابي في البنود أكثر من أي موضع آخر في المستند: فهي المكان الوحيد الذي يحتوي من التكرار ما يكفي ليراجع نفسه بنفسه.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "تحليل فاتورة PDF إلى بنود منظَّمة", href: "/ar/pdf-invoice-parser" },
        { label: "مراجعة البنود في حسابات الموردين", href: "/ar/solutions/accountants" },
        { label: "الحقول والبنود التي يتم إرجاعها", href: "/ar/documentation" },
      ],
      cta: {
        label: "حلّل فاتورة ببنودها",
        href: "/ar/pdf-invoice-parser",
        note: "خمس عمليات تحويل مجانية.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 6. Choosing an OCR API                                              */
/*                                                                     */
/* The EasyInvoiceOCR API is not operational. Every locale of this     */
/* article says so explicitly, and the internal link goes to the       */
/* product page rather than to documentation for something that does   */
/* not yet accept requests.                                            */
/* ------------------------------------------------------------------ */

const ocrApi: BlogPost = {
  slug: "choosing-ocr-api",
  date: "2025-09-08",
  readingMinutes: { en: 7, fr: 8, ar: 7 },
  related: ["gdpr-document-processing", "line-item-extraction-hard"],
  content: {
    en: {
      title: "Choosing an OCR API: a developer's checklist — EasyInvoiceOCR",
      description:
        "Latency, idempotency, error envelopes and versioning decide how much of your time an integration consumes. What to check in the documentation before you commit.",
      heading: "Choosing an OCR API: a developer's checklist",
      category: "Developers",
      lede: "Extraction quality gets the attention, but the operational details determine how much maintenance the integration costs you afterwards. This is what to read the docs for.",
      imageAlt: "A terminal window showing a JSON response from a document extraction request",
      body: [
        {
          paragraphs: [
            "Integrating a document API is a long-term commitment: it ends up in your retry logic, your alerting and your incident runbooks. The model's accuracy is what the marketing page discusses, and it is rarely what costs you a weekend.",
          ],
        },
        {
          heading: "The EasyInvoiceOCR API is coming soon",
          paragraphs: [
            "To be clear before you read further: our own API is not yet available. It is announced but not operational, it does not currently accept requests, and this article is not a pitch for it. The checklist below is what we would want you to hold any vendor to, ourselves included when the endpoint does open.",
          ],
        },
        {
          heading: "Look for these in the documentation",
          paragraphs: [
            "If any of these is absent from the public docs, assume it is absent from the product. Documentation omits features that exist far less often than vendors imply.",
          ],
          list: [
            "A stable error envelope with machine-readable codes, not prose messages that change between releases.",
            "Idempotency keys on upload, so that a retry after a timeout cannot create a duplicate document.",
            "Explicit rate-limit headers and a documented Retry-After, rather than an undocumented 429.",
            "Versioning via a header or a path segment, with a written deprecation policy.",
            "Cursor pagination on list endpoints; offset pagination silently skips and repeats rows under concurrent writes.",
          ],
        },
        {
          heading: "Test the failure paths first",
          paragraphs: [
            "Upload a corrupt PDF, a password-protected file, a zero-byte file and a blank page before you test the happy path. How an API fails tells you far more about the engineering behind it than how it succeeds, and you will spend more of your operational life in those branches than you expect.",
          ],
        },
        {
          heading: "Ask where the document goes",
          paragraphs: [
            "The operational checklist and the privacy checklist are the same conversation. Retention, training on customer data and sub-processors all belong in the integration decision, not in a later review.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        { label: "The OCR API — coming soon", href: "/en/ocr-api" },
        { label: "Building document workflows as a developer", href: "/en/solutions/developers" },
        { label: "Current API reference", href: "/en/api-reference" },
      ],
      cta: {
        label: "See what the API will offer",
        href: "/en/ocr-api",
        note: "Not yet accepting requests. The page describes the planned interface.",
      },
    },
    fr: {
      title: "Choisir une API d'OCR : la liste du développeur — EasyInvoiceOCR",
      description:
        "Latence, idempotence, format d'erreur et versionnage déterminent le coût de maintenance d'une intégration. Ce qu'il faut vérifier dans la documentation avant de s'engager.",
      heading: "Choisir une API d'OCR : la liste de contrôle du développeur",
      category: "Développeurs",
      lede: "La qualité d'extraction attire l'attention, mais ce sont les détails opérationnels qui déterminent le temps que l'intégration vous coûtera ensuite. Voilà ce qu'il faut aller chercher dans la documentation.",
      imageAlt: "Une fenêtre de terminal affichant une réponse JSON d'extraction documentaire",
      body: [
        {
          paragraphs: [
            "Intégrer une API documentaire est un engagement de longue durée : elle finit dans votre logique de reprise, vos alertes et vos procédures d'incident. La précision du modèle est ce dont parle la page marketing, et c'est rarement ce qui vous coûtera un week-end.",
          ],
        },
        {
          heading: "L'API EasyInvoiceOCR arrive prochainement",
          paragraphs: [
            "Soyons clairs avant d'aller plus loin : notre propre API n'est pas encore disponible. Elle est annoncée mais non opérationnelle, elle n'accepte aucune requête à ce jour, et cet article n'en fait pas la promotion. La liste ci-dessous est celle que nous vous invitons à opposer à n'importe quel éditeur — nous compris, le jour où le point d'entrée ouvrira.",
          ],
        },
        {
          heading: "Ce qu'il faut trouver dans la documentation",
          paragraphs: [
            "Si l'un de ces éléments est absent de la documentation publique, considérez qu'il est absent du produit. Il est bien plus rare qu'on ne le laisse entendre qu'une documentation omette une fonctionnalité réellement présente.",
          ],
          list: [
            "Un format d'erreur stable, avec des codes exploitables par la machine, et non des messages en prose qui changent d'une version à l'autre.",
            "Des clés d'idempotence à l'envoi, pour qu'une reprise après expiration ne crée pas un document en double.",
            "Des en-têtes de limitation explicites et un Retry-After documenté, plutôt qu'un 429 laissé sans explication.",
            "Un versionnage par en-tête ou par segment d'URL, assorti d'une politique de dépréciation écrite.",
            "Une pagination par curseur sur les listes ; la pagination par décalage saute et répète des lignes dès qu'il y a des écritures concurrentes.",
          ],
        },
        {
          heading: "Testez d'abord les chemins d'échec",
          paragraphs: [
            "Envoyez un PDF corrompu, un fichier protégé par mot de passe, un fichier vide et une page blanche avant de tester le cas nominal. La manière dont une API échoue en dit bien plus long sur l'ingénierie qui la porte que la manière dont elle réussit, et vous passerez plus de temps que prévu dans ces branches-là.",
          ],
        },
        {
          heading: "Demandez où va le document",
          paragraphs: [
            "La liste opérationnelle et la liste « protection des données » ne font qu'une. Durée de conservation, entraînement sur les données clients et sous-traitants ultérieurs relèvent de la décision d'intégration, pas d'une revue postérieure.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        { label: "L'API d'OCR — bientôt disponible", href: "/fr/ocr-api" },
        { label: "Construire des traitements documentaires", href: "/fr/solutions/developers" },
        { label: "Référence d'API actuelle", href: "/fr/api-reference" },
      ],
      cta: {
        label: "Découvrir ce que proposera l'API",
        href: "/fr/ocr-api",
        note: "N'accepte pas encore de requêtes. La page décrit l'interface prévue.",
      },
    },
    ar: {
      title: "اختيار واجهة برمجة OCR: قائمة تحقق للمطوّرين — EasyInvoiceOCR",
      description:
        "زمن الاستجابة، ومنع التكرار، وصيغة الأخطاء، وإدارة الإصدارات: هذه ما يحدد كلفة صيانة التكامل. ما الذي يجب التحقق منه في التوثيق قبل الالتزام.",
      heading: "اختيار واجهة برمجة OCR: قائمة تحقق للمطوّرين",
      category: "المطوّرون",
      lede: "جودة الاستخراج تستحوذ على الانتباه، لكن التفاصيل التشغيلية هي التي تحدد كم من وقتك سيستهلكه التكامل لاحقًا. هذا ما ينبغي البحث عنه في التوثيق.",
      imageAlt: "نافذة طرفية تعرض استجابة JSON لطلب استخراج بيانات من مستند",
      body: [
        {
          paragraphs: [
            "التكامل مع واجهة برمجة للمستندات التزام طويل الأمد: ينتهي بها المطاف في منطق إعادة المحاولة لديك، وفي تنبيهاتك، وفي إجراءات معالجة الأعطال. أما دقة النموذج فهي ما تتحدث عنه صفحة التسويق، ونادرًا ما تكون هي ما يكلّفك عطلة نهاية أسبوع.",
          ],
        },
        {
          heading: "واجهة EasyInvoiceOCR البرمجية قريبًا",
          paragraphs: [
            "لنكن واضحين قبل المتابعة: واجهتنا البرمجية غير متاحة بعد. أُعلن عنها لكنها ليست تشغيلية، ولا تستقبل أي طلبات حاليًا، وهذه المقالة ليست ترويجًا لها. القائمة أدناه هي ما ندعوك إلى مطالبة أي مزوّد بالالتزام به — بما في ذلك نحن، يوم تُفتح نقطة الوصول.",
          ],
        },
        {
          heading: "ما ينبغي أن تجده في التوثيق",
          paragraphs: [
            "إن غاب أي بند من هذه البنود عن التوثيق العلني، فافترض غيابه عن المنتج. فمن النادر — أندر بكثير مما يُلمَّح إليه — أن يُغفل التوثيق ميزة موجودة فعلًا.",
          ],
          list: [
            "صيغة أخطاء ثابتة برموز يقرؤها البرنامج، لا رسائل نصية تتبدل بين إصدار وآخر.",
            "مفاتيح منع التكرار عند الرفع، حتى لا تُنشئ إعادة المحاولة بعد انتهاء المهلة مستندًا مكررًا.",
            "ترويسات صريحة لحدود المعدل مع Retry-After موثَّق، بدل رمز 429 بلا تفسير.",
            "إدارة إصدارات عبر ترويسة أو مقطع في المسار، مع سياسة إيقاف مكتوبة.",
            "ترقيم صفحات بالمؤشر في نقاط القوائم؛ فالترقيم بالإزاحة يتخطى صفوفًا ويكررها عند وجود كتابات متزامنة.",
          ],
        },
        {
          heading: "اختبر مسارات الفشل أولًا",
          paragraphs: [
            "ارفع ملف PDF تالفًا، وملفًا محميًا بكلمة مرور، وملفًا فارغ الحجم، وصفحة بيضاء، قبل أن تختبر المسار الناجح. فطريقة فشل الواجهة تكشف عن الهندسة القائمة خلفها أكثر بكثير من طريقة نجاحها، وستقضي في هذه المسارات وقتًا أطول مما تتوقع.",
          ],
        },
        {
          heading: "اسأل إلى أين يذهب المستند",
          paragraphs: [
            "قائمة التحقق التشغيلية وقائمة حماية البيانات حديث واحد. فمدة الاحتفاظ، والتدريب على بيانات العملاء، والجهات المعالِجة الفرعية، كلها جزء من قرار التكامل نفسه، لا من مراجعة لاحقة.",
          ],
        },
      ],
      linksTitle: "لمعرفة المزيد",
      links: [
        { label: "واجهة OCR البرمجية — قريبًا", href: "/ar/ocr-api" },
        { label: "بناء تدفقات معالجة المستندات للمطوّرين", href: "/ar/solutions/developers" },
        { label: "مرجع الواجهة البرمجية الحالي", href: "/ar/api-reference" },
      ],
      cta: {
        label: "اطّلع على ما ستقدّمه الواجهة",
        href: "/ar/ocr-api",
        note: "لا تستقبل طلبات بعد. الصفحة تصف الواجهة المخطط لها.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 7. What browser OCR is                                              */
/* ------------------------------------------------------------------ */

const browserOcr: BlogPost = {
  slug: "what-is-browser-ocr",
  date: "2026-08-31",
  readingMinutes: { en: 9, fr: 10, ar: 9 },
  related: ["tesseract-js-browser-ocr", "gdpr-document-processing"],
  content: {
    en: {
      title: "What is browser OCR? — EasyInvoiceOCR",
      description:
        "Browser OCR reads text from images and PDFs inside the browser tab instead of on a server. How it works, how it compares to cloud OCR, and where each one is the better choice.",
      heading: "What is browser OCR?",
      category: "Browser OCR",
      lede: "Browser OCR runs text recognition inside the page you already have open, so the document itself never has to be uploaded. That single difference changes the privacy story, the failure modes and the performance profile.",
      imageAlt: "A document being read inside a browser window rather than sent to a server",
      body: [
        {
          paragraphs: [
            "Browser OCR is optical character recognition performed by code running in your web browser, rather than by a service running on someone else's machine. The recognition engine is compiled to WebAssembly and downloaded like any other page asset; the document is read from local memory; the extracted text is produced in the tab and never has to leave it.",
            "Conventional OCR works the other way around. You upload the file, a server recognises it, and JSON comes back. That is easier to build and usually more accurate, and it means a copy of your document exists on infrastructure you do not control.",
          ],
        },
        {
          heading: "How browser OCR works",
          paragraphs: [
            "A browser OCR pipeline has four stages, and only the third is recognition proper.",
          ],
          list: [
            "Read — the file is loaded into memory from the file input. No network request carries it.",
            "Decide — if the input is a PDF that already contains a text layer, the text is read directly and OCR is skipped entirely.",
            "Recognise — pages without usable text are rasterised and passed to a WebAssembly OCR engine running in a worker thread, so the interface stays responsive.",
            "Assemble — recognised words carry positions, which are used to rebuild lines, paragraphs, tables and reading order.",
          ],
        },
        {
          heading: "The PDF text layer comes first",
          paragraphs: [
            "This is the step most descriptions of OCR skip, and it matters more than the engine. A PDF exported from accounting software already contains the characters, with exact coordinates. Running OCR on it would be slower and less accurate than reading what is already there — you would be converting perfect text into pixels and then guessing at the pixels.",
            "A well-built pipeline therefore inspects each page and picks a route per page, so a printed contract with one scanned signature page is handled correctly rather than being forced down one path.",
          ],
        },
        {
          heading: "Browser OCR versus cloud OCR",
          paragraphs: [
            "Neither is universally better. They fail in different places, and the honest comparison is about which failure you can tolerate.",
          ],
          list: [
            "Accuracy on hard inputs — cloud wins. Server-side models are larger than anything you can reasonably ship to a browser, and handle poor photographs better.",
            "Privacy of the document — browser wins, decisively. The file bytes never leave the device, so there is no copy to secure, subpoena or breach.",
            "Speed on a single page — usually cloud, because the server hardware is dedicated and the model is already warm.",
            "Speed on a private network with no upload bandwidth — browser, because there is nothing to upload.",
            "Cost at volume — browser, because recognition runs on hardware you are not paying for.",
            "Predictability — cloud, because you control the machine; browser recognition depends on the visitor's device and available memory.",
            "Offline capability — browser, once the assets are cached.",
          ],
        },
        {
          heading: "Where cloud OCR is the better choice",
          paragraphs: [
            "If you are processing tens of thousands of documents a night, need the highest achievable accuracy on creased phone photographs, or require handwriting recognition, a server-side service is the right tool. Browser OCR is not a universal replacement and claiming otherwise would be dishonest.",
          ],
        },
        {
          heading: "Where browser OCR is the better choice",
          paragraphs: [
            "It suits documents people hesitate to upload: invoices with bank details, receipts tied to a personal card, contracts, identity documents, medical letters. It also suits anyone who would rather not take on the obligations that come with holding other people's documents — because the simplest way to protect a file is never to receive it.",
          ],
        },
        {
          heading: "What browser OCR does not mean",
          paragraphs: [
            "It does not mean the page makes no network requests. The engine and its language models are downloaded, and an application may still record that a conversion happened. In our case the server receives a short job record — filename, file type, size, page count and a key identifying the attempt — because a conversion allowance cannot be enforced by asking the browser to count honestly.",
            "The precise claim worth making is narrow and checkable: document bytes are processed locally in the browser and are never uploaded, while limited metadata is transmitted for quota and record-keeping. Anything broader than that is marketing.",
          ],
        },
        {
          heading: "Accuracy expectations",
          paragraphs: [
            "Recognition quality depends far more on the input than on the engine. A flat, sharp, well-lit scan of printed text reads well in any modern OCR. A creased receipt photographed at an angle in poor light does not, in the browser or on a server. Handwriting is a separate problem that general-purpose OCR does not solve reliably.",
            "The useful safeguard is not a higher accuracy claim but a confidence score attached to every extracted field, so uncertain values are flagged for review instead of being written silently into a spreadsheet.",
          ],
        },
        {
          heading: "How EasyInvoiceOCR implements it",
          paragraphs: [
            "Recognition runs client-side with Tesseract.js compiled to WebAssembly. PDFs with a text layer are read directly through PDF.js and OCR is skipped. Five base language models are available — English, French, Arabic, German and Spanish — plus two combined modes, English + Arabic and English + French, for bilingual documents. The engine and language models are served from our own origin rather than a third-party CDN.",
            "Extracted fields carry a confidence score and a review flag, both of which are written into the exported spreadsheet rather than shown once and discarded.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        {
          label: "How the engine and its models are put together",
          href: "/en/blog/tesseract-js-browser-ocr",
        },
        { label: "Read an invoice without uploading it", href: "/en/invoice-ocr" },
        { label: "Turn receipts into a spreadsheet", href: "/en/receipt-to-excel" },
        {
          label: "How accounting teams handle documents they cannot upload",
          href: "/en/solutions/accountants",
        },
        { label: "PDF tools that run in the same tab", href: "/en/pdf-tools" },
        { label: "What the service stores, and what it does not", href: "/en/security" },
      ],
      sourcesTitle: "Primary sources",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "the WebAssembly port of the Tesseract engine used for recognition in the browser.",
        },
        {
          label: "Tesseract OCR",
          href: "https://github.com/tesseract-ocr/tesseract",
          note: "the upstream C++ engine and its documentation on page segmentation and language data.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/en-US/docs/WebAssembly",
          note: "reference for the compilation target that lets a native engine run in a page.",
        },
        {
          label: "PDF.js",
          href: "https://mozilla.github.io/pdf.js/",
          note: "used to read the text layer of PDFs that already contain characters.",
        },
      ],
      cta: {
        label: "Try it on your own document",
        href: "/en/invoice-ocr",
        note: "Five conversions are free. Document bytes are processed in your browser.",
      },
    },
    fr: {
      title: "Qu'est-ce que l'OCR dans le navigateur ? — EasyInvoiceOCR",
      description:
        "L'OCR dans le navigateur lit le texte des images et des PDF dans l'onglet plutôt que sur un serveur. Fonctionnement, comparaison avec l'OCR cloud, et le bon choix selon le cas.",
      heading: "Qu'est-ce que l'OCR dans le navigateur ?",
      category: "OCR navigateur",
      lede: "L'OCR dans le navigateur exécute la reconnaissance de texte dans la page déjà ouverte : le document n'a jamais besoin d'être envoyé. Cette seule différence change la question de la confidentialité, les modes de défaillance et le profil de performance.",
      imageAlt: "Un document lu dans une fenêtre de navigateur plutôt qu'envoyé à un serveur",
      body: [
        {
          paragraphs: [
            "L'OCR dans le navigateur est une reconnaissance optique de caractères effectuée par du code exécuté dans votre navigateur, et non par un service tournant sur la machine d'un tiers. Le moteur est compilé en WebAssembly et téléchargé comme n'importe quelle ressource de page ; le document est lu depuis la mémoire locale ; le texte extrait est produit dans l'onglet et n'a jamais à en sortir.",
            "L'OCR classique fonctionne à l'inverse : vous envoyez le fichier, un serveur le reconnaît, du JSON revient. C'est plus simple à construire et généralement plus précis, et cela signifie qu'une copie de votre document existe sur une infrastructure que vous ne contrôlez pas.",
          ],
        },
        {
          heading: "Comment cela fonctionne",
          paragraphs: [
            "Un pipeline d'OCR navigateur comporte quatre étapes, et seule la troisième est la reconnaissance proprement dite.",
          ],
          list: [
            "Lire — le fichier est chargé en mémoire depuis le champ de fichier. Aucune requête réseau ne le transporte.",
            "Décider — si le PDF contient déjà une couche de texte, ce texte est lu directement et l'OCR est ignoré.",
            "Reconnaître — les pages sans texte exploitable sont rasterisées et confiées à un moteur WebAssembly dans un worker, pour que l'interface reste réactive.",
            "Assembler — les mots reconnus portent des positions, qui servent à reconstruire lignes, paragraphes, tableaux et ordre de lecture.",
          ],
        },
        {
          heading: "La couche de texte du PDF passe en premier",
          paragraphs: [
            "C'est l'étape que la plupart des descriptions de l'OCR passent sous silence, et elle compte davantage que le moteur. Un PDF exporté depuis un logiciel comptable contient déjà les caractères, avec leurs coordonnées exactes. Lui appliquer l'OCR serait plus lent et moins précis que lire ce qui est déjà là : vous convertiriez du texte parfait en pixels pour ensuite deviner ces pixels.",
            "Un pipeline bien construit inspecte donc chaque page et choisit une route page par page, si bien qu'un contrat imprimé avec une page de signature scannée est traité correctement.",
          ],
        },
        {
          heading: "Navigateur ou cloud",
          paragraphs: [
            "Aucun des deux n'est universellement meilleur. Ils échouent à des endroits différents, et la vraie question est de savoir quelle défaillance vous pouvez tolérer.",
          ],
          list: [
            "Précision sur les entrées difficiles — avantage cloud. Les modèles côté serveur sont plus gros que tout ce qu'on peut raisonnablement livrer à un navigateur.",
            "Confidentialité du document — avantage navigateur, nettement. Le fichier ne quitte pas l'appareil : il n'existe aucune copie à sécuriser ni à compromettre.",
            "Vitesse sur une page isolée — souvent le cloud, matériel dédié et modèle déjà chargé.",
            "Vitesse sans bande passante montante — le navigateur, puisqu'il n'y a rien à envoyer.",
            "Coût au volume — le navigateur, la reconnaissance tournant sur du matériel que vous ne payez pas.",
            "Prévisibilité — le cloud, car vous maîtrisez la machine ; dans le navigateur, tout dépend de l'appareil du visiteur.",
            "Fonctionnement hors ligne — le navigateur, une fois les ressources mises en cache.",
          ],
        },
        {
          heading: "Quand le cloud est préférable",
          paragraphs: [
            "Pour des dizaines de milliers de documents par nuit, pour la meilleure précision possible sur des photos froissées, ou pour la reconnaissance d'écriture manuscrite, un service côté serveur est le bon outil. L'OCR navigateur n'est pas un remplacement universel, et prétendre le contraire serait malhonnête.",
          ],
        },
        {
          heading: "Quand le navigateur est préférable",
          paragraphs: [
            "Il convient aux documents que l'on hésite à envoyer : factures avec coordonnées bancaires, reçus liés à une carte personnelle, contrats, pièces d'identité, courriers médicaux. Il convient aussi à qui préfère ne pas assumer les obligations liées à la détention des documents d'autrui — car le moyen le plus simple de protéger un fichier est de ne jamais le recevoir.",
          ],
        },
        {
          heading: "Ce que cela ne signifie pas",
          paragraphs: [
            "Cela ne signifie pas que la page n'effectue aucune requête réseau. Le moteur et ses modèles de langue sont téléchargés, et une application peut malgré tout enregistrer qu'une conversion a eu lieu. Chez nous, le serveur reçoit un bref enregistrement — nom du fichier, type, taille, nombre de pages et une clé identifiant la tentative — car un quota ne peut pas être appliqué en demandant au navigateur de compter honnêtement.",
            "La formulation juste est étroite et vérifiable : les octets du document sont traités localement dans le navigateur et ne sont jamais envoyés, tandis que des métadonnées limitées sont transmises à des fins de quota et de traçabilité. Tout ce qui va au-delà relève du marketing.",
          ],
        },
        {
          heading: "Ce qu'il faut attendre de la précision",
          paragraphs: [
            "La qualité dépend bien davantage de l'image que du moteur. Un scan net, à plat et bien éclairé d'un texte imprimé se lit bien avec n'importe quel OCR moderne. Un reçu froissé photographié de biais dans une lumière faible, non — dans le navigateur comme sur un serveur. L'écriture manuscrite est un problème distinct que l'OCR généraliste ne résout pas de façon fiable.",
            "La vraie protection n'est pas une promesse de précision plus élevée, mais un score de confiance attaché à chaque champ extrait, pour signaler les valeurs incertaines au lieu de les inscrire silencieusement dans un tableur.",
          ],
        },
        {
          heading: "Comment EasyInvoiceOCR le met en œuvre",
          paragraphs: [
            "La reconnaissance s'exécute côté client avec Tesseract.js compilé en WebAssembly. Les PDF dotés d'une couche de texte sont lus directement via PDF.js et l'OCR est ignoré. Cinq modèles de langue sont disponibles — anglais, français, arabe, allemand et espagnol — plus deux modes combinés, anglais + arabe et anglais + français, pour les documents bilingues. Le moteur et les modèles sont servis depuis notre propre domaine plutôt que par un CDN tiers.",
            "Chaque champ extrait porte un score de confiance et un indicateur de relecture, tous deux inscrits dans le tableur exporté plutôt qu'affichés une fois puis oubliés.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        {
          label: "Comment le moteur et ses modèles sont assemblés",
          href: "/fr/blog/tesseract-js-browser-ocr",
        },
        { label: "Lire une facture sans l'envoyer", href: "/fr/invoice-ocr" },
        { label: "Transformer des reçus en tableur", href: "/fr/receipt-to-excel" },
        {
          label: "Comment les cabinets traitent des documents qu'ils ne peuvent pas envoyer",
          href: "/fr/solutions/accountants",
        },
        { label: "Les outils PDF qui tournent dans le même onglet", href: "/fr/pdf-tools" },
        { label: "Ce que le service conserve, et ce qu'il ne conserve pas", href: "/fr/security" },
      ],
      sourcesTitle: "Sources primaires",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "le portage WebAssembly du moteur Tesseract utilisé pour la reconnaissance dans le navigateur.",
        },
        {
          label: "Tesseract OCR",
          href: "https://github.com/tesseract-ocr/tesseract",
          note: "le moteur C++ amont et sa documentation sur la segmentation de page et les données de langue.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/fr/docs/WebAssembly",
          note: "référence sur la cible de compilation qui permet d'exécuter un moteur natif dans une page.",
        },
        {
          label: "PDF.js",
          href: "https://mozilla.github.io/pdf.js/",
          note: "utilisé pour lire la couche de texte des PDF qui contiennent déjà des caractères.",
        },
      ],
      cta: {
        label: "Essayez sur votre propre document",
        href: "/fr/invoice-ocr",
        note: "Cinq conversions sont gratuites. Les octets du document sont traités dans votre navigateur.",
      },
    },
    ar: {
      title: "ما هو التعرف الضوئي داخل المتصفح؟ — EasyInvoiceOCR",
      description:
        "يقرأ التعرف الضوئي داخل المتصفح النص من الصور وملفات PDF داخل التبويب بدل خادم بعيد. كيف يعمل، ومقارنته بالتعرف السحابي، ومتى يناسب كل منهما.",
      heading: "ما هو التعرف الضوئي داخل المتصفح؟",
      category: "التعرف داخل المتصفح",
      lede: "يشغّل التعرف الضوئي داخل المتصفح عملية قراءة النص في الصفحة المفتوحة أمامك، فلا يحتاج المستند إلى الرفع أصلًا. هذا الفارق وحده يغيّر مسألة الخصوصية وأنماط الإخفاق وأداء المعالجة.",
      imageAlt: "مستند يُقرأ داخل نافذة المتصفح بدل إرساله إلى خادم",
      body: [
        {
          paragraphs: [
            "التعرف الضوئي داخل المتصفح هو تعرف على الحروف تنفّذه شيفرة تعمل في متصفحك، لا خدمة تعمل على جهاز طرف آخر. يُصرَّف المحرك إلى WebAssembly ويُنزَّل كأي مورد آخر في الصفحة، ويُقرأ المستند من الذاكرة المحلية، ويُنتَج النص المستخرج داخل التبويب دون حاجة إلى مغادرته.",
            "أما التعرف التقليدي فيعمل بالعكس: ترفع الملف، ويتعرف عليه خادم، ويعود إليك JSON. هذا أسهل في البناء وأدق عادةً، ويعني في الوقت نفسه وجود نسخة من مستندك على بنية تحتية لا تتحكم فيها.",
          ],
        },
        {
          heading: "كيف يعمل",
          paragraphs: ["يتكوّن المسار من أربع مراحل، والثالثة وحدها هي التعرف الفعلي."],
          list: [
            "القراءة — يُحمَّل الملف في الذاكرة من حقل الملفات، ولا ينقله أي طلب شبكة.",
            "القرار — إذا كان ملف PDF يحتوي أصلًا على طبقة نصية، يُقرأ النص مباشرة ويُتجاوز التعرف الضوئي.",
            "التعرف — تُحوَّل الصفحات التي لا تحتوي نصًا صالحًا إلى صور وتُمرَّر إلى محرك WebAssembly في خيط عامل، لتبقى الواجهة سريعة الاستجابة.",
            "التجميع — تحمل الكلمات المتعرَّف عليها مواضعها، وتُستخدم لإعادة بناء الأسطر والفقرات والجداول وترتيب القراءة.",
          ],
        },
        {
          heading: "طبقة النص في PDF أولًا",
          paragraphs: [
            "هذه هي الخطوة التي تغفلها أغلب الشروح، وهي أهم من المحرك نفسه. ملف PDF المُصدَّر من برنامج محاسبي يحتوي الحروف فعلًا بإحداثياتها الدقيقة، وتشغيل التعرف الضوئي عليه سيكون أبطأ وأقل دقة من قراءة الموجود: ستحوّل نصًا سليمًا إلى بكسلات ثم تخمّن تلك البكسلات.",
            "لذلك يفحص المسار الجيد كل صفحة ويختار لها مسارها، فيُعالَج عقد مطبوع فيه صفحة توقيع ممسوحة معالجة صحيحة بدل إجباره على مسار واحد.",
          ],
        },
        {
          heading: "المتصفح مقابل السحابة",
          paragraphs: [
            "لا أحدهما أفضل على الإطلاق. كل منهما يخفق في موضع مختلف، والسؤال الحقيقي هو أي إخفاق يمكنك احتماله.",
          ],
          list: [
            "الدقة على المدخلات الصعبة — تتفوق السحابة، فنماذج الخادم أكبر مما يمكن إرساله إلى متصفح.",
            "خصوصية المستند — يتفوق المتصفح بوضوح: لا يغادر الملف الجهاز، فلا توجد نسخة تحتاج إلى حماية أو قد تُخترق.",
            "سرعة صفحة واحدة — غالبًا السحابة، لعتاد مخصص ونموذج جاهز.",
            "السرعة عند ضعف سرعة الرفع — المتصفح، إذ لا شيء يُرفع.",
            "الكلفة عند الحجم الكبير — المتصفح، فالمعالجة تجري على عتاد لا تدفع ثمنه.",
            "إمكانية التنبؤ — السحابة، لأنك تتحكم في الجهاز؛ أما في المتصفح فكل شيء يعتمد على جهاز الزائر.",
            "العمل دون اتصال — المتصفح، بعد تخزين الموارد مؤقتًا.",
          ],
        },
        {
          heading: "متى تكون السحابة أنسب",
          paragraphs: [
            "إن كنت تعالج عشرات الآلاف من المستندات ليلًا، أو تحتاج أعلى دقة ممكنة على صور مجعّدة، أو تحتاج التعرف على خط اليد، فالخدمة على الخادم هي الأداة الصحيحة. التعرف داخل المتصفح ليس بديلًا شاملًا، وادعاء غير ذلك تضليل.",
          ],
        },
        {
          heading: "متى يكون المتصفح أنسب",
          paragraphs: [
            "يناسب المستندات التي يتردد الناس في رفعها: فواتير تحمل بيانات بنكية، وإيصالات مرتبطة ببطاقة شخصية، وعقود، ووثائق هوية، ورسائل طبية. ويناسب أيضًا من يفضّل ألا يتحمل التزامات حيازة مستندات الآخرين — فأبسط طريقة لحماية ملف هي ألا تستلمه أصلًا.",
          ],
        },
        {
          heading: "ما لا يعنيه ذلك",
          paragraphs: [
            "لا يعني أن الصفحة لا ترسل أي طلب شبكة. فالمحرك وملفات اللغة تُنزَّل، وقد يسجّل التطبيق مع ذلك أن عملية تحويل قد جرت. في حالتنا يستقبل الخادم سجلًا موجزًا — اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاحًا يعرّف المحاولة — لأن الرصيد لا يمكن فرضه بالطلب من المتصفح أن يحسب بأمانة.",
            "الصياغة الدقيقة ضيّقة وقابلة للتحقق: تُعالَج بيانات المستند محليًا داخل المتصفح ولا تُرفع أبدًا، بينما تُرسل بيانات وصفية محدودة لأغراض الرصيد وحفظ السجل. وما زاد على ذلك تسويق.",
          ],
        },
        {
          heading: "ما ينبغي توقعه من الدقة",
          paragraphs: [
            "تعتمد جودة التعرف على الصورة أكثر بكثير من اعتمادها على المحرك. النص المطبوع الممسوح بشكل مستوٍ وواضح ومضاء جيدًا يُقرأ جيدًا بأي محرك حديث، بخلاف إيصال مجعّد مصوَّر بزاوية في إضاءة ضعيفة — في المتصفح أو على الخادم سواء. وخط اليد مشكلة منفصلة لا يحلها التعرف العام بشكل موثوق.",
            "الضمانة المفيدة ليست وعدًا بدقة أعلى، بل درجة ثقة مرفقة بكل حقل مستخرج، لتُعلَّم القيم غير المؤكدة للمراجعة بدل كتابتها بصمت في جدول.",
          ],
        },
        {
          heading: "كيف ينفّذه EasyInvoiceOCR",
          paragraphs: [
            "يجري التعرف داخل المتصفح باستخدام Tesseract.js المصرَّف إلى WebAssembly. وتُقرأ ملفات PDF ذات الطبقة النصية مباشرة عبر PDF.js ويُتجاوز التعرف الضوئي. وتتوفر خمسة نماذج لغة أساسية — الإنجليزية والفرنسية والعربية والألمانية والإسبانية — إضافة إلى وضعين مركّبين، الإنجليزية + العربية والإنجليزية + الفرنسية، للمستندات ثنائية اللغة. ويُقدَّم المحرك وملفات اللغة من نطاقنا نفسه لا من شبكة توصيل خارجية.",
            "ويحمل كل حقل مستخرج درجة ثقة وعلامة مراجعة، وكلاهما يُكتب في الجدول المصدَّر بدل عرضه مرة ثم نسيانه.",
          ],
        },
      ],
      linksTitle: "للتعمق أكثر",
      links: [
        { label: "كيف يُجمَّع المحرك وملفات اللغة", href: "/ar/blog/tesseract-js-browser-ocr" },
        { label: "اقرأ فاتورة دون رفعها", href: "/ar/invoice-ocr" },
        { label: "حوّل الإيصالات إلى جدول", href: "/ar/receipt-to-excel" },
        {
          label: "كيف تتعامل فرق المحاسبة مع مستندات لا يمكن رفعها",
          href: "/ar/solutions/accountants",
        },
        { label: "أدوات PDF التي تعمل في التبويب نفسه", href: "/ar/pdf-tools" },
        { label: "ما الذي تحتفظ به الخدمة وما لا تحتفظ به", href: "/ar/security" },
      ],
      sourcesTitle: "المصادر الأساسية",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "نسخة WebAssembly من محرك Tesseract المستخدمة للتعرف داخل المتصفح.",
        },
        {
          label: "Tesseract OCR",
          href: "https://github.com/tesseract-ocr/tesseract",
          note: "المحرك الأصلي بلغة C++ وتوثيقه حول تقسيم الصفحة وبيانات اللغة.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/en-US/docs/WebAssembly",
          note: "مرجع هدف التصريف الذي يتيح تشغيل محرك أصلي داخل صفحة.",
        },
        {
          label: "PDF.js",
          href: "https://mozilla.github.io/pdf.js/",
          note: "يُستخدم لقراءة الطبقة النصية في ملفات PDF التي تحتوي حروفًا أصلًا.",
        },
      ],
      cta: {
        label: "جرّبه على مستندك",
        href: "/ar/invoice-ocr",
        note: "خمس عمليات تحويل مجانية. تُعالَج بيانات المستند داخل متصفحك.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* 8. Tesseract.js and the model assets                                */
/* ------------------------------------------------------------------ */

const tesseractJs: BlogPost = {
  slug: "tesseract-js-browser-ocr",
  date: "2026-08-31",
  readingMinutes: { en: 10, fr: 11, ar: 10 },
  related: ["what-is-browser-ocr", "multilingual-invoice-extraction"],
  content: {
    en: {
      title: "Tesseract.js in production: models and assets — EasyInvoiceOCR",
      description:
        "What Tesseract.js actually loads, why language models are the hard part, what happens when they come from a CDN, and the failure mode that self-hosting introduces.",
      heading: "Running Tesseract.js in production",
      category: "Engineering",
      lede: "Getting Tesseract.js to recognise a word takes ten minutes. Running it in production for years takes an understanding of what it downloads, when, and from where — because that is where it breaks.",
      imageAlt: "Language model files being served from an application's own origin",
      body: [
        {
          paragraphs: [
            "Tesseract.js is a JavaScript wrapper around Tesseract, the open-source OCR engine, compiled to WebAssembly so it can run in a browser. It is an independent community project; we use it, we contribute to its issue tracker, and we have no affiliation with it beyond that.",
            "What makes it interesting in production is not the recognition API, which is small. It is the asset story underneath.",
          ],
        },
        {
          heading: "What actually gets downloaded",
          paragraphs: [
            "A recognition run pulls three separate things, and confusing them is the source of most deployment problems.",
          ],
          list: [
            "The worker script — the JavaScript that runs recognition off the main thread.",
            "The WASM core — the compiled engine. Several variants exist (plain, SIMD, relaxed-SIMD, LSTM-only builds of each) and the browser gets the fastest one it can execute.",
            "The language data — one .traineddata file per language, and these are by far the largest component.",
          ],
        },
        {
          heading: "Language models are the expensive part",
          paragraphs: [
            "Each language is a separate multi-megabyte file. Our five base models total 32.75 MB: English 10.42 MB, Spanish 7.98 MB, German 6.77 MB, French 5.99 MB and Arabic 1.60 MB. Adding the WASM cores brings the vendored total to 76.00 MB.",
            "That figure alarms people until you note what it is not: none of it is in the initial page bundle. A model is fetched once, on demand, when someone actually runs recognition in that language, and then cached. A visitor who only merges two PDFs downloads none of it.",
          ],
        },
        {
          heading: "Combined language modes are not extra models",
          paragraphs: [
            "Tesseract accepts a language argument like eng+ara, which loads two models into a single recognition pass so a bilingual page can be read without choosing a side. It is worth being precise about the arithmetic: seven options in a language picker can mean five model files. We offer five base languages and two combined modes, not seven independent models.",
          ],
        },
        {
          heading: "The default is a CDN, and that has consequences",
          paragraphs: [
            "By default Tesseract.js fetches its language data from a public CDN at run time. That is convenient and it works — until it does not. A stalled asset request leaves a conversion hanging mid-flight, and because the failing request never touches your own servers, the outage is invisible to your monitoring while being entirely visible to your users.",
            "There is a second, quieter issue. The default asset path is not pinned to a published version, and the download is not integrity-checked, so the bytes fed to the recognizer can change without any consumer noticing. This is an open discussion in the project rather than a criticism of it — the same tension exists in any run-time asset fetch.",
          ],
        },
        {
          heading: "Self-hosting the assets",
          paragraphs: [
            "We now serve the worker, the cores and the language models from our own origin. A setup script copies the worker and cores out of node_modules — so they always match the installed version rather than drifting against whatever a CDN currently serves — and downloads the language data once at build time, never at run time.",
            "This removes the third-party dependency from the recognition path entirely. It also removes a subtler privacy leak: fetching the engine from a third-party CDN means that third party sees a request, with a referrer, every time someone starts a conversion. No document content, but a request pattern that maps to intent.",
          ],
        },
        {
          heading: "The failure mode self-hosting introduces",
          paragraphs: [
            "This is the part worth passing on, because we learned it the expensive way. When you vendor the models, the set of languages your interface offers and the set your build script downloads become two separate lists, in two different files, with nothing enforcing that they match.",
            "Ours drifted. Two languages were selectable in the picker whose model files had never been added to the download step. Because the asset path pointed at our own origin there was no CDN to quietly fall back to: the request 404'd and recognition failed for those two languages only. Nothing in the test suite caught it, because no test connected the two lists.",
            "The fix that mattered was not adding the two files. It was an invariant test that fails in both directions — a language offered but not vendored, and a model vendored but no longer offered — and that reads the build script as source text so it needs neither network access nor the downloaded assets to run.",
          ],
        },
        {
          heading: "Practical advice if you are doing this",
          paragraphs: ["Four things we would tell our past selves."],
          list: [
            "Pin an explicit version of the language data rather than relying on a path that resolves to whatever is current.",
            "If you self-host, add a test that every language your UI offers resolves to a file that exists.",
            "Check the network tab while the worker starts. A missing model looks like 'this language does not work', not like a missing file.",
            "Do not use a character whitelist with the LSTM engine, and do not request the legacy engine mode against data that has no legacy component. Both make output worse while looking like tuning.",
          ],
        },
        {
          heading: "What this does not change",
          paragraphs: [
            "Self-hosting moves where the bytes come from. It does not change what recognition does — we use the standard model set, byte-identical to what Tesseract.js fetches by default, deliberately, because a vendoring change that also silently altered output would be miserable to debug later.",
            "It also does not make the application network-free. Document bytes are processed locally in the browser and are never uploaded; a short job record — filename, file type, size, page count and a key identifying the attempt — is still transmitted so a conversion allowance can be enforced server-side.",
          ],
        },
      ],
      linksTitle: "Go further",
      links: [
        {
          label: "What browser OCR is, and how it compares to cloud OCR",
          href: "/en/blog/what-is-browser-ocr",
        },
        {
          label: "Reading invoices across Arabic, French and mixed scripts",
          href: "/en/blog/multilingual-invoice-extraction",
        },
        { label: "The extraction tool this engine powers", href: "/en/invoice-ocr" },
        { label: "Supported formats, languages and limits", href: "/en/documentation" },
        { label: "What the developer-facing side offers today", href: "/en/solutions/developers" },
      ],
      sourcesTitle: "Primary sources",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "the project itself, including the worker options that control asset paths.",
        },
        {
          label: "tessdata — Tesseract language data",
          href: "https://github.com/tesseract-ocr/tessdata",
          note: "the published .traineddata files, including the standard 4.0.0 set used here.",
        },
        {
          label: "Tesseract documentation on page segmentation and engine modes",
          href: "https://tesseract-ocr.github.io/tessdoc/",
          note: "reference for the PSM and OEM arguments discussed above.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/en-US/docs/WebAssembly",
          note: "background on the compilation target and on SIMD support in browsers.",
        },
      ],
      cta: {
        label: "See the engine read a document",
        href: "/en/invoice-ocr",
        note: "Five conversions are free. Document bytes are processed in your browser.",
      },
    },
    fr: {
      title: "Tesseract.js en production : modèles et ressources — EasyInvoiceOCR",
      description:
        "Ce que Tesseract.js télécharge réellement, pourquoi les modèles de langue sont la partie difficile, ce qui se passe quand ils viennent d'un CDN, et le défaut qu'introduit l'auto-hébergement.",
      heading: "Tesseract.js en production",
      category: "Ingénierie",
      lede: "Faire reconnaître un mot à Tesseract.js prend dix minutes. Le faire tourner en production pendant des années demande de comprendre ce qu'il télécharge, quand et depuis où — car c'est là qu'il casse.",
      imageAlt: "Des fichiers de modèles de langue servis depuis le domaine de l'application",
      body: [
        {
          paragraphs: [
            "Tesseract.js est une enveloppe JavaScript autour de Tesseract, le moteur d'OCR open source, compilé en WebAssembly pour tourner dans un navigateur. C'est un projet communautaire indépendant : nous l'utilisons, nous contribuons à son suivi de tickets, et nous n'avons aucune affiliation avec lui au-delà de cela.",
            "Ce qui le rend intéressant en production n'est pas l'API de reconnaissance, qui est réduite. C'est l'histoire des ressources qu'il y a en dessous.",
          ],
        },
        {
          heading: "Ce qui est réellement téléchargé",
          paragraphs: [
            "Une reconnaissance récupère trois choses distinctes, et les confondre est à l'origine de la plupart des problèmes de déploiement.",
          ],
          list: [
            "Le script worker — le JavaScript qui exécute la reconnaissance hors du fil principal.",
            "Le cœur WASM — le moteur compilé. Plusieurs variantes existent (simple, SIMD, SIMD relâché, versions LSTM de chacune) et le navigateur reçoit la plus rapide qu'il sache exécuter.",
            "Les données de langue — un fichier .traineddata par langue, de loin le composant le plus lourd.",
          ],
        },
        {
          heading: "Les modèles de langue sont la partie coûteuse",
          paragraphs: [
            "Chaque langue est un fichier distinct de plusieurs mégaoctets. Nos cinq modèles de base totalisent 32,75 Mo : anglais 10,42 Mo, espagnol 7,98 Mo, allemand 6,77 Mo, français 5,99 Mo et arabe 1,60 Mo. Avec les cœurs WASM, le total hébergé atteint 76,00 Mo.",
            "Ce chiffre inquiète tant qu'on n'a pas précisé ce qu'il n'est pas : rien de tout cela ne se trouve dans le bundle initial. Un modèle est récupéré une fois, à la demande, quand quelqu'un lance réellement une reconnaissance dans cette langue, puis mis en cache. Un visiteur qui fusionne seulement deux PDF n'en télécharge rien.",
          ],
        },
        {
          heading: "Les modes combinés ne sont pas des modèles supplémentaires",
          paragraphs: [
            "Tesseract accepte un argument de langue tel que eng+ara, qui charge deux modèles dans une même passe pour lire une page bilingue sans choisir un camp. L'arithmétique mérite d'être précise : sept options dans un sélecteur peuvent correspondre à cinq fichiers. Nous proposons cinq langues de base et deux modes combinés, non sept modèles indépendants.",
          ],
        },
        {
          heading: "Par défaut, c'est un CDN — et cela a des conséquences",
          paragraphs: [
            "Par défaut, Tesseract.js récupère ses données de langue depuis un CDN public à l'exécution. C'est pratique et cela fonctionne — jusqu'à ce que cela ne fonctionne plus. Une requête bloquée laisse une conversion suspendue en plein vol, et comme la requête défaillante ne touche jamais vos propres serveurs, la panne est invisible à votre supervision tout en étant parfaitement visible pour vos utilisateurs.",
            "Il existe un second problème, plus discret. Le chemin par défaut n'est pas figé sur une version publiée et le téléchargement n'est pas vérifié par empreinte, si bien que les octets fournis au moteur peuvent changer sans que personne s'en aperçoive. C'est une discussion ouverte dans le projet plutôt qu'une critique : la même tension existe dans toute récupération de ressource à l'exécution.",
          ],
        },
        {
          heading: "Héberger les ressources soi-même",
          paragraphs: [
            "Nous servons désormais le worker, les cœurs et les modèles depuis notre propre domaine. Un script de préparation copie le worker et les cœurs depuis node_modules — ils correspondent donc toujours à la version installée plutôt que de diverger de ce qu'un CDN sert à un instant donné — et télécharge les données de langue une fois, à la construction, jamais à l'exécution.",
            "Cela retire entièrement la dépendance tierce du chemin de reconnaissance. Cela supprime aussi une fuite plus subtile : récupérer le moteur depuis un CDN tiers signifie que ce tiers voit une requête, avec un référent, chaque fois qu'une conversion démarre. Aucun contenu de document, mais un motif de requête qui trahit l'intention.",
          ],
        },
        {
          heading: "Le défaut qu'introduit l'auto-hébergement",
          paragraphs: [
            "C'est la partie qui mérite d'être transmise, parce que nous l'avons apprise à nos dépens. Quand vous hébergez les modèles, la liste des langues que votre interface propose et celle que votre script télécharge deviennent deux listes distinctes, dans deux fichiers différents, sans rien qui garantisse leur correspondance.",
            "Les nôtres ont divergé. Deux langues étaient sélectionnables dans le sélecteur alors que leurs fichiers n'avaient jamais été ajoutés à l'étape de téléchargement. Comme le chemin pointait vers notre propre domaine, il n'y avait aucun CDN vers lequel retomber : la requête renvoyait 404 et la reconnaissance échouait pour ces deux langues seulement. Rien dans la suite de tests ne l'a détecté, car aucun test ne reliait les deux listes.",
            "Le vrai correctif n'a pas été d'ajouter les deux fichiers. C'est un test d'invariant qui échoue dans les deux sens — une langue proposée mais non hébergée, et un modèle hébergé mais plus proposé — et qui lit le script de construction comme du texte source, sans réseau ni ressources téléchargées.",
          ],
        },
        {
          heading: "Conseils pratiques",
          paragraphs: ["Quatre choses que nous dirions à nos versions passées."],
          list: [
            "Figez une version explicite des données de langue plutôt que de dépendre d'un chemin qui résout vers la version courante.",
            "Si vous auto-hébergez, ajoutez un test vérifiant que chaque langue proposée correspond à un fichier existant.",
            "Regardez l'onglet réseau au démarrage du worker. Un modèle manquant ressemble à « cette langue ne marche pas », pas à un fichier absent.",
            "N'utilisez pas de liste blanche de caractères avec le moteur LSTM, et ne demandez pas le mode moteur historique sur des données qui n'en contiennent pas. Les deux dégradent le résultat tout en ressemblant à du réglage fin.",
          ],
        },
        {
          heading: "Ce que cela ne change pas",
          paragraphs: [
            "L'auto-hébergement change l'origine des octets, pas ce que fait la reconnaissance : nous utilisons le jeu de modèles standard, identique octet pour octet à ce que Tesseract.js récupère par défaut, délibérément, car un changement d'hébergement qui modifierait aussi silencieusement le résultat serait pénible à déboguer.",
            "Cela ne rend pas non plus l'application exempte de réseau. Les octets du document sont traités localement dans le navigateur et ne sont jamais envoyés ; un bref enregistrement — nom du fichier, type, taille, nombre de pages et une clé identifiant la tentative — reste transmis pour que le quota puisse être appliqué côté serveur.",
          ],
        },
      ],
      linksTitle: "Pour aller plus loin",
      links: [
        {
          label: "Ce qu'est l'OCR navigateur, et sa comparaison au cloud",
          href: "/fr/blog/what-is-browser-ocr",
        },
        {
          label: "Lire des factures en arabe, en français et en écritures mixtes",
          href: "/fr/blog/multilingual-invoice-extraction",
        },
        { label: "L'outil d'extraction que ce moteur alimente", href: "/fr/invoice-ocr" },
        { label: "Formats, langues et limites pris en charge", href: "/fr/documentation" },
        {
          label: "Ce que propose aujourd'hui le volet développeurs",
          href: "/fr/solutions/developers",
        },
      ],
      sourcesTitle: "Sources primaires",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "le projet lui-même, avec les options de worker qui contrôlent les chemins de ressources.",
        },
        {
          label: "tessdata — données de langue Tesseract",
          href: "https://github.com/tesseract-ocr/tessdata",
          note: "les fichiers .traineddata publiés, dont le jeu standard 4.0.0 utilisé ici.",
        },
        {
          label: "Documentation Tesseract : segmentation de page et modes moteur",
          href: "https://tesseract-ocr.github.io/tessdoc/",
          note: "référence pour les arguments PSM et OEM évoqués plus haut.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/fr/docs/WebAssembly",
          note: "contexte sur la cible de compilation et la prise en charge SIMD dans les navigateurs.",
        },
      ],
      cta: {
        label: "Voir le moteur lire un document",
        href: "/fr/invoice-ocr",
        note: "Cinq conversions sont gratuites. Les octets du document sont traités dans votre navigateur.",
      },
    },
    ar: {
      title: "تشغيل Tesseract.js في الإنتاج: النماذج والموارد — EasyInvoiceOCR",
      description:
        "ما الذي ينزّله Tesseract.js فعلًا، ولماذا تمثّل ملفات اللغة الجزء الصعب، وماذا يحدث حين تأتي من شبكة توصيل خارجية، وأي خلل يُدخله الاستضافة الذاتية.",
      heading: "تشغيل Tesseract.js في الإنتاج",
      category: "هندسة",
      lede: "جعل Tesseract.js يتعرف على كلمة يستغرق عشر دقائق. أما تشغيله في الإنتاج لسنوات فيتطلب فهم ما ينزّله ومتى ومن أين — فهناك تحديدًا يقع العطب.",
      imageAlt: "ملفات نماذج اللغة تُقدَّم من نطاق التطبيق نفسه",
      body: [
        {
          paragraphs: [
            "Tesseract.js غلاف بلغة JavaScript حول محرك التعرف الضوئي مفتوح المصدر Tesseract، مصرَّف إلى WebAssembly ليعمل داخل المتصفح. وهو مشروع مجتمعي مستقل: نستخدمه ونساهم في متتبّع مشكلاته، ولا تربطنا به صلة أخرى.",
            "وما يجعله مثيرًا للاهتمام في الإنتاج ليس واجهة التعرف، فهي صغيرة، بل قصة الموارد التي تقوم تحتها.",
          ],
        },
        {
          heading: "ما الذي يُنزَّل فعلًا",
          paragraphs: ["تجلب عملية التعرف ثلاثة أشياء منفصلة، والخلط بينها سبب معظم مشكلات النشر."],
          list: [
            "سكربت العامل — شيفرة JavaScript التي تنفّذ التعرف خارج الخيط الرئيسي.",
            "نواة WASM — المحرك المصرَّف. توجد منه صيغ متعددة (عادية، SIMD، SIMD مرن، ونسخ LSTM من كل منها) ويحصل المتصفح على أسرع ما يستطيع تشغيله.",
            "بيانات اللغة — ملف ‎.traineddata‎ لكل لغة، وهي المكوّن الأكبر حجمًا بفارق واسع.",
          ],
        },
        {
          heading: "ملفات اللغة هي الجزء المكلف",
          paragraphs: [
            "كل لغة ملف مستقل بحجم عدة ميغابايت. مجموع نماذجنا الخمسة الأساسية 32.75 ميغابايت: الإنجليزية 10.42، والإسبانية 7.98، والألمانية 6.77، والفرنسية 5.99، والعربية 1.60. وبإضافة نوى WASM يصل المجموع المستضاف إلى 76.00 ميغابايت.",
            "يثير هذا الرقم القلق حتى تُذكر ما ليس هو: لا شيء منه ضمن حزمة الصفحة الأولية. يُجلب النموذج مرة واحدة عند الطلب، حين يشغّل أحدهم التعرف بتلك اللغة فعلًا، ثم يُخزَّن مؤقتًا. ومن يدمج ملفَّي PDF فقط لا ينزّل منه شيئًا.",
          ],
        },
        {
          heading: "الأوضاع المركّبة ليست نماذج إضافية",
          paragraphs: [
            "يقبل Tesseract وسيط لغة مثل eng+ara، فيحمّل نموذجين في تمريرة واحدة لقراءة صفحة ثنائية اللغة دون اختيار طرف. ويجدر ضبط الحساب: سبعة خيارات في قائمة قد تعني خمسة ملفات. نحن نوفّر خمس لغات أساسية ووضعين مركّبين، لا سبعة نماذج مستقلة.",
          ],
        },
        {
          heading: "الافتراضي شبكة توصيل خارجية، ولذلك تبعات",
          paragraphs: [
            "يجلب Tesseract.js افتراضيًا بيانات اللغة من شبكة توصيل عامة أثناء التشغيل. هذا مريح ويعمل — إلى أن يتوقف. فطلب متعثّر يترك عملية التحويل معلّقة في منتصفها، ولأن الطلب المتعثّر لا يمرّ بخوادمك أصلًا، يبقى العطل غير مرئي لمراقبتك ومرئيًا تمامًا لمستخدميك.",
            "وثمة مشكلة ثانية أهدأ: المسار الافتراضي غير مثبّت على إصدار منشور، ولا يُتحقق من سلامة الملف المنزَّل، فقد تتغير البايتات التي تُغذّى للمحرك دون أن يلاحظ أحد. وهذه مناقشة مفتوحة داخل المشروع لا انتقادًا له، فالتوتر نفسه قائم في أي جلب مورد أثناء التشغيل.",
          ],
        },
        {
          heading: "استضافة الموارد ذاتيًا",
          paragraphs: [
            "صرنا نقدّم العامل والنوى وملفات اللغة من نطاقنا نفسه. يَنسخ سكربت إعداد العاملَ والنوى من node_modules — فتطابق دائمًا النسخة المثبتة بدل أن تنحرف عمّا تقدّمه شبكة خارجية في لحظة ما — ويُنزّل بيانات اللغة مرة واحدة وقت البناء، لا وقت التشغيل.",
            "هذا يزيل الاعتماد على طرف ثالث من مسار التعرف تمامًا. ويزيل أيضًا تسربًا أدق: جلب المحرك من شبكة خارجية يعني أن ذلك الطرف يرى طلبًا، مع مرجع الصفحة، كلما بدأ أحدهم تحويلًا. لا محتوى مستند، لكن نمط طلبات يدل على النية.",
          ],
        },
        {
          heading: "الخلل الذي تُدخله الاستضافة الذاتية",
          paragraphs: [
            "هذا هو الجزء الجدير بالنقل، لأننا تعلمناه بثمن. حين تستضيف النماذج بنفسك، تصبح قائمة اللغات التي تعرضها واجهتك وقائمة ما ينزّله سكربت البناء قائمتين منفصلتين، في ملفين مختلفين، دون ما يضمن تطابقهما.",
            "وقد انحرفت قائمتانا. كانت لغتان قابلتين للاختيار في القائمة بينما لم تُضف ملفاتهما إلى خطوة التنزيل قط. ولأن المسار يشير إلى نطاقنا نفسه لم يكن هناك أي شبكة خارجية للرجوع إليها: عاد الطلب بخطأ 404 وأخفق التعرف لهاتين اللغتين وحدهما. ولم تلتقط ذلك أي اختبار، لأن أي اختبار لم يكن يربط القائمتين.",
            "ولم يكن الإصلاح الحقيقي إضافة الملفين، بل اختبار ثابت يفشل في الاتجاهين — لغة معروضة غير مستضافة، ونموذج مستضاف لم يعد معروضًا — ويقرأ سكربت البناء كنص مصدري، فلا يحتاج شبكة ولا موارد منزَّلة.",
          ],
        },
        {
          heading: "نصائح عملية",
          paragraphs: ["أربعة أمور كنا نتمنى لو قالها لنا أحد قبل أن نبدأ."],
          list: [
            "ثبّت إصدارًا صريحًا لبيانات اللغة بدل الاعتماد على مسار يشير إلى الأحدث.",
            "إن استضفت ذاتيًا، أضف اختبارًا يتحقق أن كل لغة معروضة تقابل ملفًا موجودًا.",
            "راقب تبويب الشبكة عند بدء العامل. النموذج المفقود يبدو كأن «هذه اللغة لا تعمل»، لا كملف ناقص.",
            "لا تستخدم قائمة حروف مسموحة مع محرك LSTM، ولا تطلب وضع المحرك القديم مع بيانات لا تتضمنه. كلاهما يُضعف النتيجة بينما يبدو ضبطًا دقيقًا.",
          ],
        },
        {
          heading: "ما لا يغيّره ذلك",
          paragraphs: [
            "تغيّر الاستضافة الذاتية مصدر البايتات لا ما يفعله التعرف: نستخدم مجموعة النماذج القياسية، مطابقة بايتًا ببايت لما يجلبه Tesseract.js افتراضيًا، عن قصد، لأن تغيير الاستضافة مع تغيير صامت في المخرجات كابوس في التنقيح لاحقًا.",
            "كما أنها لا تجعل التطبيق خاليًا من الشبكة. تُعالَج بيانات المستند محليًا داخل المتصفح ولا تُرفع أبدًا، ويبقى سجل موجز — اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاح يعرّف المحاولة — يُرسل ليتمكن الخادم من تطبيق الرصيد.",
          ],
        },
      ],
      linksTitle: "للتعمق أكثر",
      links: [
        {
          label: "ما التعرف داخل المتصفح، وكيف يقارَن بالسحابة",
          href: "/ar/blog/what-is-browser-ocr",
        },
        {
          label: "قراءة الفواتير بالعربية والفرنسية والنصوص المختلطة",
          href: "/ar/blog/multilingual-invoice-extraction",
        },
        { label: "أداة الاستخراج التي يشغّلها هذا المحرك", href: "/ar/invoice-ocr" },
        { label: "الصيغ واللغات والحدود المدعومة", href: "/ar/documentation" },
        { label: "ما الذي يقدّمه جانب المطوّرين اليوم", href: "/ar/solutions/developers" },
      ],
      sourcesTitle: "المصادر الأساسية",
      sources: [
        {
          label: "Tesseract.js",
          href: "https://github.com/naptha/tesseract.js",
          note: "المشروع نفسه، بما فيه خيارات العامل التي تتحكم في مسارات الموارد.",
        },
        {
          label: "tessdata — بيانات لغة Tesseract",
          href: "https://github.com/tesseract-ocr/tessdata",
          note: "ملفات ‎.traineddata‎ المنشورة، ومنها مجموعة 4.0.0 القياسية المستخدمة هنا.",
        },
        {
          label: "توثيق Tesseract حول تقسيم الصفحة وأوضاع المحرك",
          href: "https://tesseract-ocr.github.io/tessdoc/",
          note: "مرجع وسيطي PSM وOEM المذكورين أعلاه.",
        },
        {
          label: "WebAssembly — MDN",
          href: "https://developer.mozilla.org/en-US/docs/WebAssembly",
          note: "خلفية عن هدف التصريف ودعم SIMD في المتصفحات.",
        },
      ],
      cta: {
        label: "شاهد المحرك يقرأ مستندًا",
        href: "/ar/invoice-ocr",
        note: "خمس عمليات تحويل مجانية. تُعالَج بيانات المستند داخل متصفحك.",
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

/**
 * Published articles, newest first.
 *
 * Only real, complete articles belong here. There is no draft flag because
 * there are no drafts: an article that is not finished in all three languages
 * is not added, so nothing in this list can leak into the sitemap half-written.
 */
export const blogPosts: BlogPost[] = [
  accuracyGuide,
  receiptsWorkflow,
  multilingual,
  gdpr,
  lineItems,
  ocrApi,
  browserOcr,
  tesseractJs,
].sort((a, b) => (a.date < b.date ? 1 : -1));

export const blogBySlug: Record<string, BlogPost | undefined> = Object.fromEntries(
  blogPosts.map((post) => [post.slug, post]),
);

/** Slugs are locale-independent, so an article keeps one URL path per locale. */
export const blogSlugs: string[] = blogPosts.map((post) => post.slug);

/** Distinct category labels for one locale, in the order articles appear. */
export function blogCategories(locale: Locale): string[] {
  return Array.from(new Set(blogPosts.map((post) => post.content[locale].category)));
}

/** Resolves the related-article slugs into posts, skipping any that vanish. */
export function relatedPosts(post: BlogPost): BlogPost[] {
  return post.related
    .map((slug) => blogBySlug[slug])
    .filter((related): related is BlogPost => Boolean(related) && related !== post);
}
