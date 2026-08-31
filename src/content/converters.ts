/**
 * Long-form, localized content for the three converter pages.
 *
 * Each locale gets its own wording rather than a translated skeleton, so the
 * pages are not three keyword variations of the same text. Limitations are
 * stated plainly here — that is deliberate: the pages should not promise a
 * fidelity the converters do not deliver.
 */

import type { ConverterTool } from "@/config/products";
import type { Locale } from "@/i18n";

export type ConverterFaq = { q: string; a: string };

export type ConverterCopy = {
  /** Bullet list under "Supported formats". */
  formats: string[];
  /** Short sections rendered under the converter, for readers and for search. */
  sections: { title: string; body: string[] }[];
  /** Honest limits. Rendered with a distinct treatment, never buried. */
  limitations: string[];
  faqs: ConverterFaq[];
};

type ConverterContent = Record<Locale, ConverterCopy>;

const pdfToWord: ConverterContent = {
  en: {
    formats: [
      "PDF with a text layer — exported from Word, an accounting package or a browser",
      "Scanned PDF — pages that are images of paper, read with text recognition",
      "Multi-page documents, converted in page order",
      "Latin, Arabic and other Unicode scripts",
    ],
    sections: [
      {
        title: "Two kinds of PDF, one converter",
        body: [
          "A PDF exported from software contains real text: the characters are in the file and can be read directly, which is both fast and exact. A scanned PDF contains no text at all — each page is a picture of paper, and the words have to be recognised from the pixels.",
          "This converter inspects each page and picks the right route on its own. A document that mixes the two, such as a printed contract with a scanned signature page, is handled page by page.",
        ],
      },
      {
        title: "What ends up in the Word file",
        body: [
          "Paragraphs are rebuilt from the lines on the page, so a sentence that wrapped across three lines becomes one editable paragraph rather than three. Headings are detected from type size, bulleted and numbered lists keep their list formatting, and rows that share column positions are written as a real Word table.",
          "Page order is preserved and each source page starts a new page in the document, so the result lines up with the original when you read them side by side.",
        ],
      },
      {
        title: "Arabic and right-to-left text",
        body: [
          "Arabic paragraphs are marked as bidirectional and aligned to the right, which is what makes them read correctly in Word instead of appearing reversed or mixed up when a line contains both Arabic and Latin characters.",
          "Direction is decided per paragraph from the characters it actually contains, so a mostly-English document with an Arabic address block gets both right.",
        ],
      },
    ],
    limitations: [
      "Complex page layouts — multiple columns, sidebars, text flowing around images — are converted to a single reading order, not reproduced visually.",
      "Handwriting is not recognised reliably and often produces nothing usable.",
      "Decorative elements, logos, background images, headers and footers, and exact fonts, colours and spacing are not carried across.",
      "Table detection is based on column alignment. Tables without consistent columns, or with merged cells, may come through as ordinary paragraphs.",
      "Recognition accuracy on scans depends on the source. We have not measured it on your documents and do not publish an accuracy figure.",
    ],
    faqs: [
      {
        q: "Is my PDF uploaded to a server?",
        a: "No. The conversion runs in your browser and your document is never sent anywhere. The network is used for the recognition engine and its language files, which are static assets, and for a short record of the conversion — filename, file type, size, page count and a key identifying the attempt — which is how your allowance is counted. None of it contains your document.",
      },
      {
        q: "Will the Word file look exactly like the PDF?",
        a: "No, and it is not meant to. The goal is editable content in the right order: paragraphs, headings, lists and tables. Exact visual layout, fonts and decorative elements are not reproduced.",
      },
      {
        q: "What happens with a password-protected PDF?",
        a: "It is rejected with a message asking you to remove the password first. The file is not opened and nothing is stored.",
      },
      {
        q: "How long does a scanned document take?",
        a: "Text-layer PDFs convert in a second or two. Scanned pages need recognition, which typically takes a few seconds per page on a normal laptop and longer on a phone.",
      },
      {
        q: "Can I fix mistakes before downloading?",
        a: "Yes. The recognised text is shown for review, and any correction you make is what gets written into the .docx.",
      },
    ],
  },
  fr: {
    formats: [
      "PDF avec couche de texte — exporté depuis Word, un logiciel comptable ou un navigateur",
      "PDF scanné — pages qui sont des images de papier, lues par reconnaissance de texte",
      "Documents multipages, convertis dans l'ordre des pages",
      "Écritures latine, arabe et autres jeux Unicode",
    ],
    sections: [
      {
        title: "Deux sortes de PDF, un seul convertisseur",
        body: [
          "Un PDF exporté depuis un logiciel contient du vrai texte : les caractères sont dans le fichier et se lisent directement, ce qui est à la fois rapide et exact. Un PDF scanné ne contient aucun texte — chaque page est une image de papier et les mots doivent être reconnus à partir des pixels.",
          "Ce convertisseur examine chaque page et choisit lui-même la bonne voie. Un document mixte, par exemple un contrat imprimé avec une page de signature scannée, est traité page par page.",
        ],
      },
      {
        title: "Ce qui se retrouve dans le fichier Word",
        body: [
          "Les paragraphes sont reconstruits à partir des lignes de la page : une phrase répartie sur trois lignes devient un seul paragraphe modifiable. Les titres sont détectés d'après la taille des caractères, les listes à puces et numérotées conservent leur mise en forme, et les lignes partageant les mêmes colonnes deviennent un vrai tableau Word.",
          "L'ordre des pages est préservé et chaque page source commence une nouvelle page dans le document.",
        ],
      },
      {
        title: "Texte arabe et sens droite-à-gauche",
        body: [
          "Les paragraphes arabes sont marqués bidirectionnels et alignés à droite, ce qui les rend lisibles dans Word au lieu d'apparaître inversés lorsqu'une ligne mélange arabe et caractères latins.",
          "Le sens est déterminé paragraphe par paragraphe d'après les caractères réellement présents.",
        ],
      },
    ],
    limitations: [
      "Les mises en page complexes — colonnes multiples, encadrés, texte habillant une image — sont converties en un seul ordre de lecture, pas reproduites visuellement.",
      "L'écriture manuscrite n'est pas reconnue de façon fiable et ne donne souvent rien d'exploitable.",
      "Éléments décoratifs, logos, images de fond, en-têtes et pieds de page, polices, couleurs et espacements exacts ne sont pas repris.",
      "La détection des tableaux repose sur l'alignement des colonnes. Un tableau sans colonnes régulières, ou avec cellules fusionnées, peut ressortir en paragraphes ordinaires.",
      "La précision de la reconnaissance dépend de la qualité du scan. Nous ne l'avons pas mesurée sur vos documents et ne publions aucun chiffre de précision.",
    ],
    faqs: [
      {
        q: "Mon PDF est-il envoyé sur un serveur ?",
        a: "Non. La conversion s'effectue dans votre navigateur et votre document n'est jamais transmis. Le réseau sert au moteur de reconnaissance et à ses fichiers de langue, qui sont des ressources statiques, ainsi qu'à un bref enregistrement de la conversion — nom du fichier, type, taille, nombre de pages et une clé identifiant la tentative — servant à décompter votre quota. Rien de tout cela ne contient votre document.",
      },
      {
        q: "Le fichier Word ressemblera-t-il exactement au PDF ?",
        a: "Non, et ce n'est pas l'objectif. Le but est un contenu modifiable dans le bon ordre : paragraphes, titres, listes et tableaux. La mise en page visuelle exacte n'est pas reproduite.",
      },
      {
        q: "Que se passe-t-il avec un PDF protégé par mot de passe ?",
        a: "Il est refusé avec un message vous invitant à retirer le mot de passe. Le fichier n'est pas ouvert et rien n'est conservé.",
      },
      {
        q: "Combien de temps prend un document scanné ?",
        a: "Un PDF texte se convertit en une ou deux secondes. Les pages scannées demandent une reconnaissance, généralement quelques secondes par page sur un ordinateur portable, davantage sur un téléphone.",
      },
      {
        q: "Puis-je corriger avant de télécharger ?",
        a: "Oui. Le texte reconnu est affiché pour relecture, et vos corrections sont ce qui est écrit dans le .docx.",
      },
    ],
  },
  ar: {
    formats: [
      "ملف PDF يحتوي طبقة نصية — مُصدَّر من Word أو برنامج محاسبة أو متصفح",
      "ملف PDF ممسوح ضوئيًا — صفحات عبارة عن صور، تُقرأ عبر التعرف على النص",
      "مستندات متعددة الصفحات، تُحوَّل حسب ترتيب الصفحات",
      "النصوص اللاتينية والعربية وسائر كتابات Unicode",
    ],
    sections: [
      {
        title: "نوعان من PDF، محوّل واحد",
        body: [
          "ملف PDF المُصدَّر من برنامج يحتوي نصًا حقيقيًا: الحروف موجودة داخل الملف وتُقرأ مباشرة، وهو أسرع وأدق. أما ملف PDF الممسوح ضوئيًا فلا يحتوي نصًا إطلاقًا — كل صفحة صورة، ويجب التعرف على الكلمات من البكسلات.",
          "يفحص المحوّل كل صفحة ويختار المسار المناسب تلقائيًا. والمستند الذي يجمع بين النوعين، كعقد مطبوع مع صفحة توقيع ممسوحة، يُعالج صفحة بصفحة.",
        ],
      },
      {
        title: "ما الذي ينتهي في ملف Word",
        body: [
          "تُعاد بناء الفقرات من أسطر الصفحة، فتصبح الجملة الممتدة على ثلاثة أسطر فقرة واحدة قابلة للتعديل. وتُكتشف العناوين من حجم الخط، وتحتفظ القوائم النقطية والمرقّمة بتنسيقها، وتُكتب الصفوف المتوافقة في الأعمدة كجدول Word حقيقي.",
          "يُحفظ ترتيب الصفحات، وتبدأ كل صفحة مصدر صفحة جديدة في المستند.",
        ],
      },
      {
        title: "النص العربي والاتجاه من اليمين إلى اليسار",
        body: [
          "تُوسم الفقرات العربية بأنها ثنائية الاتجاه وتُحاذى إلى اليمين، وهو ما يجعلها تُقرأ بشكل صحيح في Word بدل أن تظهر معكوسة عندما يجمع السطر بين العربية والحروف اللاتينية.",
          "يُحدَّد الاتجاه لكل فقرة على حدة بحسب الحروف التي تحتويها فعلًا.",
        ],
      },
    ],
    limitations: [
      "التخطيطات المعقّدة — الأعمدة المتعددة والأشرطة الجانبية والنص الملتف حول الصور — تُحوَّل إلى ترتيب قراءة واحد ولا تُعاد بصريًا.",
      "الكتابة اليدوية لا يُتعرَّف عليها بشكل موثوق وغالبًا لا تعطي نتيجة صالحة.",
      "العناصر الزخرفية والشعارات وصور الخلفية والرؤوس والتذييلات والخطوط والألوان والتباعد الدقيق لا تُنقل.",
      "يعتمد اكتشاف الجداول على محاذاة الأعمدة. الجداول غير المنتظمة أو ذات الخلايا المدمجة قد تظهر كفقرات عادية.",
      "تعتمد دقة التعرف على جودة المصدر. لم نقس هذه الدقة على مستنداتك ولا ننشر رقمًا لها.",
    ],
    faqs: [
      {
        q: "هل يُرفع ملف PDF إلى خادم؟",
        a: "لا. تتم العملية داخل متصفحك ولا يُرسل مستندك إلى أي مكان. وتُستخدم الشبكة لمحرك التعرف وملفات اللغة، وهي ملفات ثابتة، ولسجل موجز للعملية — اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاح يعرّف المحاولة — يُستخدم لحساب رصيدك. ولا يحتوي أي منها على مستندك.",
      },
      {
        q: "هل سيبدو ملف Word مطابقًا لملف PDF؟",
        a: "لا، وليس هذا هو الهدف. الهدف محتوى قابل للتعديل بالترتيب الصحيح: فقرات وعناوين وقوائم وجداول. التخطيط البصري الدقيق لا يُعاد إنتاجه.",
      },
      {
        q: "ماذا يحدث مع ملف PDF محمي بكلمة مرور؟",
        a: "يُرفض مع رسالة تطلب إزالة كلمة المرور أولًا. لا يُفتح الملف ولا يُحفظ شيء.",
      },
      {
        q: "كم يستغرق المستند الممسوح ضوئيًا؟",
        a: "تُحوَّل ملفات PDF النصية خلال ثانية أو ثانيتين. أما الصفحات الممسوحة فتحتاج تعرفًا يستغرق عادةً بضع ثوانٍ لكل صفحة على حاسوب محمول، وأطول على الهاتف.",
      },
      {
        q: "هل يمكنني تصحيح الأخطاء قبل التنزيل؟",
        a: "نعم. يُعرض النص المتعرَّف عليه للمراجعة، وأي تصحيح تجريه هو ما يُكتب في ملف ‎.docx.",
      },
    ],
  },
};

const imageToWord: ConverterContent = {
  en: {
    formats: [
      "JPG / JPEG — photos and phone captures",
      "PNG — screenshots and exports",
      "WebP — modern web images",
      "One image or a batch, in the order you choose",
    ],
    sections: [
      {
        title: "Order the pages before you convert",
        body: [
          "Photographs of a document rarely arrive in the right order. Every image you add appears as a card you can drag, rotate or remove, and the order on screen is the order in the finished document.",
          "Rotation is applied to the pixels before recognition, so turning a sideways photo upright genuinely improves what the recogniser can read.",
        ],
      },
      {
        title: "Two ways to build the document",
        body: [
          "Editable recognised text produces a normal Word document: paragraphs, headings, lists and tables you can edit and search. This is the right choice when you need the content.",
          "Original images placed in Word writes each photo onto its own page instead. Nothing is recognised, so nothing can be misread — the right choice when the page itself is what matters, such as a signed form.",
        ],
      },
      {
        title: "Review before anything is written",
        body: [
          "Recognition is never perfect, so the text is shown to you first, page by page. Corrections you make replace what was read, and the document is built from the corrected version.",
          "If nothing readable is found, you are told so and no file is produced. An empty .docx is never downloaded.",
        ],
      },
    ],
    limitations: [
      "We do not publish an accuracy figure for recognised text, because we have not measured it on the kind of images you will upload. Review the text before you rely on it.",
      "Handwriting, stylised type, low-contrast photographs and heavy skew all reduce what can be read, sometimes to nothing.",
      "Column layouts, text wrapped around pictures and decorative styling are flattened into a single reading order.",
      "Tables are detected from column alignment only; irregular or merged-cell tables may come through as paragraphs.",
    ],
    faqs: [
      {
        q: "Are my photos uploaded?",
        a: "No. Both the recognition and the document are produced in your browser. What is downloaded is the recognition engine and its language files; what is sent back is a short record of the conversion — filename, file type, size, page count and a key identifying the attempt — used to count your allowance. Your photos are not part of either.",
      },
      {
        q: "How accurate is the text recognition?",
        a: "It depends entirely on the image, and we deliberately do not quote a percentage we have not measured. A flat, sharp, well-lit capture of printed text reads well; a creased receipt photographed at an angle does not.",
      },
      {
        q: "Can I mix languages in one document?",
        a: "Yes. Choose a combined language such as English + Arabic, and each paragraph is written with the direction its own characters call for.",
      },
      {
        q: "How many images can I convert at once?",
        a: "Up to 40 in a single document, subject to the page allowance on your plan. Each image counts as one page.",
      },
      {
        q: "Why would I choose to insert the images instead?",
        a: "When the visual page matters more than the text — a signed form, a stamped invoice, an ID document — inserting the original image guarantees nothing is misread.",
      },
    ],
  },
  fr: {
    formats: [
      "JPG / JPEG — photos et captures depuis un téléphone",
      "PNG — captures d'écran et exports",
      "WebP — images web modernes",
      "Une image ou un lot, dans l'ordre que vous choisissez",
    ],
    sections: [
      {
        title: "Ordonnez les pages avant de convertir",
        body: [
          "Les photos d'un document arrivent rarement dans le bon ordre. Chaque image ajoutée devient une vignette que vous pouvez déplacer, pivoter ou supprimer, et l'ordre affiché est celui du document final.",
          "La rotation est appliquée aux pixels avant la reconnaissance : redresser une photo améliore donc réellement la lecture.",
        ],
      },
      {
        title: "Deux façons de construire le document",
        body: [
          "Le texte reconnu et modifiable produit un document Word normal : paragraphes, titres, listes et tableaux modifiables et consultables. C'est le bon choix quand vous avez besoin du contenu.",
          "L'insertion des images d'origine place chaque photo sur sa propre page. Rien n'est reconnu, donc rien ne peut être mal lu — le bon choix quand c'est la page elle-même qui compte, par exemple un formulaire signé.",
        ],
      },
      {
        title: "Relecture avant écriture",
        body: [
          "La reconnaissance n'est jamais parfaite : le texte vous est donc présenté d'abord, page par page. Vos corrections remplacent ce qui a été lu et le document est construit à partir de la version corrigée.",
          "Si rien de lisible n'est trouvé, vous en êtes informé et aucun fichier n'est produit. Un .docx vide n'est jamais téléchargé.",
        ],
      },
    ],
    limitations: [
      "Nous ne publions pas de taux de précision pour le texte reconnu, faute de l'avoir mesuré sur le type d'images que vous importerez. Relisez le texte avant de vous y fier.",
      "Écriture manuscrite, typographies stylisées, photos peu contrastées et forte inclinaison réduisent fortement ce qui peut être lu.",
      "Les mises en page en colonnes, le texte habillant une image et les styles décoratifs sont aplatis en un seul ordre de lecture.",
      "Les tableaux sont détectés uniquement par alignement des colonnes ; les tableaux irréguliers ou à cellules fusionnées peuvent ressortir en paragraphes.",
    ],
    faqs: [
      {
        q: "Mes photos sont-elles envoyées ?",
        a: "Non. La reconnaissance et le document sont produits dans votre navigateur. Ce qui est téléchargé, c'est le moteur de reconnaissance et ses fichiers de langue ; ce qui est renvoyé, c'est un bref enregistrement de la conversion — nom du fichier, type, taille, nombre de pages et une clé identifiant la tentative — servant à décompter votre quota. Vos photos ne figurent ni dans l'un ni dans l'autre.",
      },
      {
        q: "Quelle est la précision de la reconnaissance ?",
        a: "Elle dépend entièrement de l'image, et nous ne citons délibérément aucun pourcentage que nous n'avons pas mesuré. Un texte imprimé photographié à plat, net et bien éclairé se lit bien ; un reçu froissé photographié de biais, non.",
      },
      {
        q: "Puis-je mélanger les langues dans un document ?",
        a: "Oui. Choisissez une langue combinée telle qu'anglais + arabe : chaque paragraphe est écrit dans le sens qu'imposent ses propres caractères.",
      },
      {
        q: "Combien d'images puis-je convertir en une fois ?",
        a: "Jusqu'à 40 dans un même document, dans la limite du quota de pages de votre offre. Chaque image compte pour une page.",
      },
      {
        q: "Pourquoi insérer les images plutôt que le texte ?",
        a: "Quand la page visuelle compte plus que le texte — formulaire signé, facture tamponnée, pièce d'identité — insérer l'image d'origine garantit qu'aucun mot n'est mal lu.",
      },
    ],
  },
  ar: {
    formats: [
      "JPG / JPEG — الصور ولقطات الهاتف",
      "PNG — لقطات الشاشة والملفات المُصدَّرة",
      "WebP — صور الويب الحديثة",
      "صورة واحدة أو مجموعة، بالترتيب الذي تختاره",
    ],
    sections: [
      {
        title: "رتّب الصفحات قبل التحويل",
        body: [
          "نادرًا ما تصل صور المستند بالترتيب الصحيح. تظهر كل صورة تضيفها كبطاقة يمكنك سحبها أو تدويرها أو حذفها، والترتيب الظاهر على الشاشة هو ترتيب المستند النهائي.",
          "يُطبَّق التدوير على البكسلات قبل التعرف، لذا فإن تعديل صورة مائلة يحسّن فعليًا ما يستطيع المحرك قراءته.",
        ],
      },
      {
        title: "طريقتان لبناء المستند",
        body: [
          "النص المتعرَّف عليه القابل للتعديل ينتج مستند Word عاديًا: فقرات وعناوين وقوائم وجداول قابلة للتحرير والبحث. وهو الخيار المناسب عندما تحتاج إلى المحتوى.",
          "إدراج الصور الأصلية يضع كل صورة في صفحة خاصة بها. لا يجري أي تعرف، وبالتالي لا يمكن أن يُقرأ شيء خطأً — وهو الخيار المناسب عندما تكون الصفحة نفسها هي المهمة، كنموذج موقّع.",
        ],
      },
      {
        title: "المراجعة قبل الكتابة",
        body: [
          "التعرف ليس مثاليًا أبدًا، لذلك يُعرض النص عليك أولًا صفحة بصفحة. تحلّ تصحيحاتك محل ما قُرئ، ويُبنى المستند من النسخة المصحّحة.",
          "وإن لم يُعثر على نص مقروء، تُبلَّغ بذلك ولا يُنتَج أي ملف. لا يُنزَّل ملف ‎.docx فارغ أبدًا.",
        ],
      },
    ],
    limitations: [
      "لا ننشر رقمًا لدقة النص المتعرَّف عليه لأننا لم نقسه على نوع الصور التي سترفعها. راجع النص قبل الاعتماد عليه.",
      "الكتابة اليدوية والخطوط المزخرفة والصور منخفضة التباين والميل الشديد تقلّل بشدة ما يمكن قراءته.",
      "تخطيطات الأعمدة والنص الملتف حول الصور والتنسيقات الزخرفية تُسطَّح إلى ترتيب قراءة واحد.",
      "تُكتشف الجداول من محاذاة الأعمدة فقط؛ وقد تظهر الجداول غير المنتظمة أو ذات الخلايا المدمجة كفقرات.",
    ],
    faqs: [
      {
        q: "هل تُرفع صوري؟",
        a: "لا. يجري التعرف وإنشاء المستند داخل متصفحك. وما يُنزَّل هو محرك التعرف وملفات اللغة، وما يُرسل هو سجل موجز للعملية — اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاح يعرّف المحاولة — لحساب رصيدك. وصورك ليست جزءًا من أي منهما.",
      },
      {
        q: "ما مدى دقة التعرف على النص؟",
        a: "تعتمد كليًا على الصورة، ونتعمّد عدم ذكر نسبة لم نقسها. النص المطبوع المصوَّر بشكل مستوٍ وواضح ومضاء جيدًا يُقرأ جيدًا، بخلاف إيصال مجعّد مصوَّر بزاوية مائلة.",
      },
      {
        q: "هل يمكن خلط اللغات في مستند واحد؟",
        a: "نعم. اختر لغة مركّبة مثل الإنجليزية + العربية، وتُكتب كل فقرة بالاتجاه الذي تفرضه حروفها.",
      },
      {
        q: "كم صورة يمكنني تحويلها دفعة واحدة؟",
        a: "حتى 40 صورة في مستند واحد، ضمن حدود الصفحات المتاحة في باقتك. وتُحتسب كل صورة صفحة واحدة.",
      },
      {
        q: "لماذا أختار إدراج الصور بدل النص؟",
        a: "عندما تكون الصفحة البصرية أهم من النص — نموذج موقّع أو فاتورة مختومة أو وثيقة هوية — يضمن إدراج الصورة الأصلية ألا يُقرأ شيء خطأً.",
      },
    ],
  },
};

const imageToPdf: ConverterContent = {
  en: {
    formats: [
      "JPG / JPEG, PNG and WebP",
      "Up to 60 images in one PDF",
      "A4, US Letter or a page sized to each image",
      "Portrait or landscape, with your choice of margins",
    ],
    sections: [
      {
        title: "Your images are assembled in the browser",
        body: [
          "The PDF is built in this tab from the images you choose and handed straight to your downloads. The image bytes are never uploaded, so photographs of identity documents, contracts, medical letters and anything else private stay on your device.",
          "The assembly itself needs no connection once the page has loaded, which is why it keeps working on a slow link. What does reach us is a short record of the conversion — filename, file type, size, page count and a key that stops a retry being counted twice — which is how your free allowance is counted.",
        ],
      },
      {
        title: "Page setup that behaves predictably",
        body: [
          "Fit places the whole image inside the page with its proportions intact. Fill uses as much of the page as possible. Original size keeps the image's own dimensions, scaled down only if it would not otherwise fit.",
          "Automatic page size gives each page the shape of its image, which is what you want for a set of photographs. A4 or Letter is what you want for something to be printed.",
        ],
      },
      {
        title: "Quality and file size",
        body: [
          "Quality controls both the pixel ceiling and the JPEG compression. High keeps detail for text-heavy scans; Balanced suits most documents; Smaller file is for sharing a long set of photographs by email.",
          "The result is checked before it is offered: a PDF that failed to assemble properly is never handed to you as a download.",
        ],
      },
    ],
    limitations: [
      "Images are placed as pictures. The text inside them is not recognised, so the PDF is not searchable — use Image to Word if you need the text.",
      "Very large images are scaled down to the selected quality ceiling to keep the file a sensible size.",
      "Transparent areas in PNG images are flattened onto white, because PDF pages have no transparency behind them.",
      "Converting dozens of high-resolution photographs at once is limited by your device's memory, particularly on phones.",
    ],
    faqs: [
      {
        q: "Is anything uploaded?",
        a: "Your images are not. They are read and assembled in this tab and never leave it. A short record of the conversion is sent so your allowance can be counted: filename, file type, file size, page count and a key that identifies the attempt. No image data is part of it.",
      },
      {
        q: "Can I reorder and rotate the pages?",
        a: "Yes. Drag the cards into the order you want, rotate any image in 90-degree steps, remove one, or add more — the preview always shows the final page order.",
      },
      {
        q: "Will the PDF be searchable?",
        a: "No. The pages are images. If you need selectable, searchable text, convert with Image to Word instead.",
      },
      {
        q: "Why is my file so large?",
        a: "High quality keeps a lot of pixel detail. Switching to Balanced or Smaller file usually reduces the size several-fold with little visible difference on screen.",
      },
      {
        q: "Which page size should I choose?",
        a: "A4 or Letter if the result will be printed or filed alongside other documents; Automatic if you simply want each photograph on its own correctly-shaped page.",
      },
    ],
  },
  fr: {
    formats: [
      "JPG / JPEG, PNG et WebP",
      "Jusqu'à 60 images dans un seul PDF",
      "A4, US Letter, ou une page à la taille de chaque image",
      "Portrait ou paysage, avec les marges de votre choix",
    ],
    sections: [
      {
        title: "Vos images sont assemblées dans le navigateur",
        body: [
          "Le PDF est construit dans cet onglet à partir des images que vous choisissez, puis remis directement à vos téléchargements. Les images elles-mêmes ne sont jamais envoyées : photos de pièces d'identité, contrats, courriers médicaux et tout autre document privé restent sur votre appareil.",
          "L'assemblage n'a besoin d'aucune connexion une fois la page chargée, ce qui lui permet de fonctionner sur un lien lent. Ce qui nous parvient, c'est un bref enregistrement de la conversion — nom du fichier, type, taille, nombre de pages et une clé qui évite de compter deux fois une nouvelle tentative — servant à décompter votre quota gratuit.",
        ],
      },
      {
        title: "Une mise en page prévisible",
        body: [
          "Ajuster place l'image entière dans la page en conservant ses proportions. Remplir occupe le plus de page possible. Taille d'origine conserve les dimensions de l'image, réduites seulement si nécessaire.",
          "Le format automatique donne à chaque page la forme de son image, idéal pour une série de photos. A4 ou Letter conviennent pour un document destiné à l'impression.",
        ],
      },
      {
        title: "Qualité et taille du fichier",
        body: [
          "La qualité contrôle à la fois le plafond de pixels et la compression JPEG. Élevée préserve le détail des scans chargés en texte ; Équilibrée convient à la plupart des documents ; Fichier plus léger sert à partager une longue série de photos par e-mail.",
          "Le résultat est vérifié avant d'être proposé : un PDF mal assemblé ne vous est jamais remis.",
        ],
      },
    ],
    limitations: [
      "Les images sont placées telles quelles. Le texte qu'elles contiennent n'est pas reconnu : le PDF n'est donc pas consultable par recherche — utilisez Image vers Word si vous avez besoin du texte.",
      "Les très grandes images sont réduites au plafond de qualité choisi afin de garder une taille de fichier raisonnable.",
      "Les zones transparentes des PNG sont aplaties sur du blanc, les pages PDF n'ayant pas de transparence derrière elles.",
      "Convertir des dizaines de photos haute résolution d'un coup dépend de la mémoire de votre appareil, en particulier sur téléphone.",
    ],
    faqs: [
      {
        q: "Quelque chose est-il envoyé ?",
        a: "Vos images, non. Elles sont lues et assemblées dans cet onglet et n'en sortent jamais. Un bref enregistrement de la conversion est transmis pour décompter votre quota : nom du fichier, type, taille, nombre de pages et une clé identifiant la tentative. Aucune donnée d'image n'y figure.",
      },
      {
        q: "Puis-je réorganiser et pivoter les pages ?",
        a: "Oui. Faites glisser les vignettes dans l'ordre voulu, pivotez une image par pas de 90 degrés, supprimez-en une ou ajoutez-en — l'aperçu montre toujours l'ordre final.",
      },
      {
        q: "Le PDF sera-t-il consultable par recherche ?",
        a: "Non, les pages sont des images. Pour du texte sélectionnable, utilisez plutôt Image vers Word.",
      },
      {
        q: "Pourquoi mon fichier est-il si lourd ?",
        a: "La qualité élevée conserve beaucoup de détail. Passer en Équilibrée ou Fichier plus léger réduit généralement la taille de plusieurs fois sans différence visible à l'écran.",
      },
      {
        q: "Quel format de page choisir ?",
        a: "A4 ou Letter si le résultat doit être imprimé ou classé avec d'autres documents ; Automatique si vous voulez simplement chaque photo sur une page à sa forme.",
      },
    ],
  },
  ar: {
    formats: [
      "JPG / JPEG وPNG وWebP",
      "حتى 60 صورة في ملف PDF واحد",
      "A4 أو US Letter أو صفحة بمقاس كل صورة",
      "طولي أو عرضي، مع الهوامش التي تختارها",
    ],
    sections: [
      {
        title: "تُجمَّع صورك داخل المتصفح",
        body: [
          "يُبنى ملف PDF في هذا التبويب من الصور التي تختارها، ثم يُسلَّم مباشرة إلى تنزيلاتك. أما الصور نفسها فلا تُرفع أبدًا: صور وثائق الهوية والعقود والرسائل الطبية وأي مستند خاص آخر تبقى على جهازك.",
          "ولا يحتاج التجميع إلى اتصال بعد تحميل الصفحة، ولذلك يعمل على وصلة بطيئة. والذي يصلنا هو سجل موجز للعملية — اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاح يمنع احتساب إعادة المحاولة مرتين — ويُستخدم لحساب رصيدك المجاني.",
        ],
      },
      {
        title: "إعداد صفحات يتصرّف كما تتوقع",
        body: [
          "«ملاءمة» تضع الصورة كاملة داخل الصفحة مع الحفاظ على نسبها. و«ملء» تستخدم أكبر قدر ممكن من الصفحة. و«الحجم الأصلي» يبقي أبعاد الصورة، ويصغّرها فقط إن لم تكن لتتّسع.",
          "المقاس التلقائي يمنح كل صفحة شكل صورتها، وهو المناسب لمجموعة صور. أما A4 أو Letter فمناسبان لما سيُطبع.",
        ],
      },
      {
        title: "الجودة وحجم الملف",
        body: [
          "تتحكم الجودة في سقف البكسلات وضغط JPEG معًا. «عالية» تحافظ على التفاصيل في المستندات الكثيفة النص، و«متوازنة» تناسب معظم المستندات، و«ملف أصغر» لمشاركة مجموعة صور طويلة عبر البريد.",
          "تُفحص النتيجة قبل عرضها: ولا يُسلَّم إليك ملف PDF فشل تجميعه.",
        ],
      },
    ],
    limitations: [
      "تُدرج الصور كصور. ولا يُتعرَّف على النص بداخلها، لذا لا يكون ملف PDF قابلًا للبحث — استخدم «الصورة إلى Word» إن كنت تحتاج النص.",
      "تُصغَّر الصور الكبيرة جدًا إلى سقف الجودة المختار للحفاظ على حجم ملف معقول.",
      "تُسطَّح المناطق الشفافة في صور PNG على خلفية بيضاء، لأن صفحات PDF لا تدعم الشفافية خلفها.",
      "تحويل عشرات الصور عالية الدقة دفعة واحدة محكوم بذاكرة جهازك، خصوصًا على الهواتف.",
    ],
    faqs: [
      {
        q: "هل يُرفع أي شيء؟",
        a: "صورك لا تُرفع. تُقرأ وتُجمَّع داخل هذا التبويب ولا تغادره. ويُرسل سجل موجز للعملية لحساب رصيدك: اسم الملف ونوعه وحجمه وعدد الصفحات ومفتاح يعرّف المحاولة. ولا يتضمن أي بيانات من الصور.",
      },
      {
        q: "هل يمكنني إعادة الترتيب والتدوير؟",
        a: "نعم. اسحب البطاقات إلى الترتيب المطلوب، ودوّر أي صورة بخطوات 90 درجة، واحذف أو أضف المزيد — وتعرض المعاينة دائمًا الترتيب النهائي.",
      },
      {
        q: "هل سيكون ملف PDF قابلًا للبحث؟",
        a: "لا، فالصفحات صور. إن كنت تريد نصًا قابلًا للتحديد والبحث، استخدم «الصورة إلى Word».",
      },
      {
        q: "لماذا حجم ملفي كبير؟",
        a: "الجودة العالية تحتفظ بتفاصيل كثيرة. التبديل إلى «متوازنة» أو «ملف أصغر» يقلّل الحجم عادةً عدة أضعاف دون فرق ملحوظ على الشاشة.",
      },
      {
        q: "أي مقاس صفحة أختار؟",
        a: "A4 أو Letter إن كانت النتيجة ستُطبع أو تُحفظ مع مستندات أخرى، والتلقائي إن أردت ببساطة كل صورة في صفحة بمقاسها.",
      },
    ],
  },
};

export const converterContent: Record<ConverterTool, ConverterContent> = {
  "pdf-to-word": pdfToWord,
  "image-to-word": imageToWord,
  "image-to-pdf": imageToPdf,
};

export function converterCopy(tool: ConverterTool, locale: Locale): ConverterCopy {
  return converterContent[tool][locale];
}
