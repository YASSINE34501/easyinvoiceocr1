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
  related: ["line-item-extraction-hard", "multilingual-invoice-extraction"],
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
      title: "Précision d'un OCR de factures : ce que le chiffre signifie — EasyInvoiceOCR",
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
  related: ["invoice-ocr-accuracy-guide", "line-item-extraction-hard"],
  content: {
    en: {
      title: "Extracting invoice data in Arabic, French and mixed scripts — EasyInvoiceOCR",
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
      title: "Extraire des factures en arabe, en français et en écritures mixtes — EasyInvoiceOCR",
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
      title: "استخراج بيانات الفواتير بالعربية والفرنسية والنصوص المختلطة — EasyInvoiceOCR",
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
      title: "GDPR questions to ask before uploading invoices to an OCR service — EasyInvoiceOCR",
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
      title:
        "RGPD : les questions à poser avant de confier vos factures à un service OCR — EasyInvoiceOCR",
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
  related: ["invoice-ocr-accuracy-guide", "multilingual-invoice-extraction"],
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
      title: "Pourquoi extraire les lignes est plus difficile que lire le total — EasyInvoiceOCR",
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
      title: "Choisir une API d'OCR : la liste de contrôle du développeur — EasyInvoiceOCR",
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
