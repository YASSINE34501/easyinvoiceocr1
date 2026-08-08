/**
 * Single source of truth for every EasyInvoiceOCR product.
 *
 * Navigation, homepage cards, the footer, the sitemap, the documentation index
 * and every localized SEO page read from this registry. Adding a product here
 * is the only edit needed for it to appear everywhere — nothing else keeps its
 * own hard-coded product list.
 */

import {
  Code2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  ImagePlus,
  ScanText,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { path } from "@/config/routing";
import { locales, type Locale, type MessageKey } from "@/i18n";

/** Plan codes, matching subscription_plans.code in the database. */
export type PlanCode = "trial" | "pro" | "business";

/** Which in-browser/OCR engine a product page mounts. */
export type ConverterTool = "pdf-to-word" | "image-to-word" | "image-to-pdf";

/** Kind passed to the OCR review workspace on the five extraction products. */
export type WorkspaceKind = "invoice" | "receipt" | "pdf" | "image";

export type ProductCopy = {
  /** Nav / card label. */
  name: string;
  /** <title> — unique per product per locale. */
  title: string;
  /** <meta name="description"> — unique per product per locale. */
  description: string;
  /** Single <h1>. */
  h1: string;
  /** Sub-headline under the H1. */
  lede: string;
  /** Short body for the homepage product card. */
  card: string;
};

export type ProductDefinition = {
  slug: string;
  icon: LucideIcon;
  /** "extraction" products use the OCR review workspace, "converter" products the file converter shell. */
  kind: "extraction" | "converter" | "api";
  converter?: ConverterTool;
  workspace?: WorkspaceKind;
  /** Lowest plan whose entitlements include this tool. */
  minPlan: PlanCode;
  /** Formats accepted, as MIME types — enforced client- and server-side. */
  acceptMime: string[];
  /** Output MIME type produced by the tool, when it produces a file. */
  outputMime?: string;
  /** True when conversion happens entirely in the visitor's browser. */
  localProcessing: boolean;
  /** Page may host AdSense units (public page with substantial original content). */
  adsEligible: boolean;
  /** Shown as a card on the homepage. */
  homepageCard: boolean;
  /** Included in the Product navigation menu and footer column. */
  inNav: boolean;
  /** Included in sitemap.xml. */
  inSitemap: boolean;
  /** Ordering across nav, cards, footer and sitemap. */
  order: number;
  /** Feature bullets used on the product page and in the documentation index. */
  features: string[];
  copy: Record<Locale, ProductCopy>;
};

const PDF = "application/pdf";
const JPEG = "image/jpeg";
const PNG = "image/png";
const WEBP = "image/webp";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const products: ProductDefinition[] = [
  {
    slug: "invoice-ocr",
    icon: FileText,
    kind: "extraction",
    workspace: "invoice",
    minPlan: "trial",
    acceptMime: [PDF, JPEG, PNG],
    localProcessing: false,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 10,
    features: [
      "Vendor, buyer, tax and total extraction",
      "Editable line items with confidence scores",
      "Excel, CSV and JSON export",
    ],
    copy: {
      en: {
        name: "Invoice OCR",
        title: "Invoice OCR — Extract Invoice Data From PDFs and Scans",
        description:
          "Upload a PDF or image invoice and get vendor, invoice number, dates, tax, totals and line items as structured, editable data you can export to Excel, CSV or JSON.",
        h1: "Invoice OCR that returns structured, editable invoice data",
        lede: "Drop in a PDF, scan or phone photo of an invoice. EasyInvoiceOCR reads the document, returns every field with a confidence value, and lets you correct anything before exporting.",
        card: "Extract vendors, dates, totals, taxes and line items from any invoice.",
      },
      fr: {
        name: "OCR de factures",
        title: "OCR de factures — Extraire les données de vos PDF et scans",
        description:
          "Importez une facture PDF ou image et récupérez fournisseur, numéro, dates, TVA, totaux et lignes sous forme de données structurées et modifiables, exportables vers Excel, CSV ou JSON.",
        h1: "Une OCR de factures qui renvoie des données structurées et modifiables",
        lede: "Déposez un PDF, un scan ou une photo de facture. EasyInvoiceOCR lit le document, renvoie chaque champ avec un indice de confiance et vous laisse corriger avant l'export.",
        card: "Extrayez fournisseurs, dates, totaux, taxes et lignes de n'importe quelle facture.",
      },
      ar: {
        name: "قراءة الفواتير",
        title: "قراءة الفواتير ضوئيًا — استخراج بيانات الفواتير من ملفات PDF والصور الممسوحة",
        description:
          "ارفع فاتورة بصيغة PDF أو صورة واحصل على اسم المورد ورقم الفاتورة والتواريخ والضريبة والإجماليات والبنود كبيانات منظمة قابلة للتعديل والتصدير إلى Excel أو CSV أو JSON.",
        h1: "قراءة الفواتير ضوئيًا مع إخراج بيانات منظمة قابلة للتعديل",
        lede: "أضف ملف PDF أو صورة ممسوحة أو صورة من هاتفك. يقرأ EasyInvoiceOCR المستند ويعيد كل حقل مع درجة ثقة، ويتيح لك التصحيح قبل التصدير.",
        card: "استخرج المورد والتواريخ والإجماليات والضرائب والبنود من أي فاتورة.",
      },
    },
  },
  {
    slug: "receipt-to-excel",
    icon: FileSpreadsheet,
    kind: "extraction",
    workspace: "receipt",
    minPlan: "trial",
    acceptMime: [PDF, JPEG, PNG, WEBP],
    localProcessing: false,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 20,
    features: [
      "Batch upload of many receipts",
      "Flat or grouped workbook layouts",
      "Unicode-safe merchant and item names",
    ],
    copy: {
      en: {
        name: "Receipt to Excel",
        title: "Receipt to Excel — Convert Receipt Photos Into a Spreadsheet",
        description:
          "Upload one or many receipts and export merchant, date, currency, subtotal, tax, tip, total and individual items to a clean Excel workbook, flat or grouped.",
        h1: "Turn a pile of receipts into one spreadsheet",
        lede: "Photograph or scan your receipts, upload them together, correct anything that needs correcting, and download a single Excel workbook.",
        card: "Convert receipts into clean Excel spreadsheets in seconds.",
      },
      fr: {
        name: "Reçu vers Excel",
        title: "Reçu vers Excel — Convertir des photos de reçus en tableur",
        description:
          "Importez un ou plusieurs reçus et exportez commerçant, date, devise, sous-total, taxe, pourboire, total et articles vers un classeur Excel propre, à plat ou groupé.",
        h1: "Transformez une pile de reçus en un seul tableur",
        lede: "Photographiez ou scannez vos reçus, importez-les ensemble, corrigez ce qui doit l'être et téléchargez un unique classeur Excel.",
        card: "Convertissez vos reçus en tableurs Excel propres en quelques secondes.",
      },
      ar: {
        name: "الإيصال إلى Excel",
        title: "الإيصال إلى Excel — تحويل صور الإيصالات إلى جدول بيانات",
        description:
          "ارفع إيصالًا واحدًا أو عدة إيصالات وصدّر اسم المتجر والتاريخ والعملة والمجموع الفرعي والضريبة والإكرامية والإجمالي والأصناف إلى مصنف Excel مرتّب.",
        h1: "حوّل كومة الإيصالات إلى جدول بيانات واحد",
        lede: "صوّر إيصالاتك أو امسحها ضوئيًا، ارفعها معًا، صحّح ما يلزم، ثم نزّل مصنف Excel واحدًا.",
        card: "حوّل الإيصالات إلى جداول Excel مرتّبة خلال ثوانٍ.",
      },
    },
  },
  {
    slug: "pdf-invoice-parser",
    icon: ScanText,
    kind: "extraction",
    workspace: "pdf",
    minPlan: "trial",
    acceptMime: [PDF],
    localProcessing: false,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 30,
    features: [
      "Native text and scanned PDFs",
      "Multi-page navigation",
      "Line items reassembled across pages",
    ],
    copy: {
      en: {
        name: "PDF Invoice Parser",
        title: "PDF Invoice Parser — Extract Data From Native and Scanned PDFs",
        description:
          "Parse single and multi-page PDF invoices, native or scanned, with page navigation, invoice-level and line-item extraction, review and structured export.",
        h1: "Parse PDF invoices — native text or scanned image",
        lede: "Text-based PDFs are read directly, scanned pages go through OCR, and multi-page documents keep their page structure.",
        card: "Parse complex, multi-page PDF invoices with page-level review.",
      },
      fr: {
        name: "Analyseur de factures PDF",
        title: "Analyseur de factures PDF — Extraire les données des PDF natifs et scannés",
        description:
          "Analysez des factures PDF d'une ou plusieurs pages, natives ou scannées, avec navigation par page, extraction au niveau facture et ligne, relecture et export structuré.",
        h1: "Analysez vos factures PDF — texte natif ou image scannée",
        lede: "Les PDF texte sont lus directement, les pages scannées passent par l'OCR, et les documents multipages conservent leur structure.",
        card: "Analysez des factures PDF complexes et multipages, page par page.",
      },
      ar: {
        name: "محلل فواتير PDF",
        title: "محلل فواتير PDF — استخراج البيانات من ملفات PDF الأصلية والممسوحة",
        description:
          "حلّل فواتير PDF من صفحة واحدة أو عدة صفحات، أصلية كانت أم ممسوحة، مع التنقل بين الصفحات واستخراج بيانات الفاتورة والبنود ثم المراجعة والتصدير المنظم.",
        h1: "حلّل فواتير PDF — نص أصلي أو صورة ممسوحة",
        lede: "تُقرأ ملفات PDF النصية مباشرة، وتمرّ الصفحات الممسوحة عبر OCR، وتحتفظ المستندات متعددة الصفحات ببنيتها.",
        card: "حلّل فواتير PDF المعقّدة ومتعددة الصفحات مع مراجعة لكل صفحة.",
      },
    },
  },
  {
    slug: "image-to-excel",
    icon: Table2,
    kind: "extraction",
    workspace: "image",
    minPlan: "trial",
    acceptMime: [JPEG, PNG, WEBP],
    localProcessing: false,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 40,
    features: [
      "Table structure detection",
      "Editable grid before export",
      "Real .xlsx output, never an empty file",
    ],
    copy: {
      en: {
        name: "Image to Excel",
        title: "Image to Excel — Convert Photographed Tables Into .xlsx",
        description:
          "Upload a JPG, PNG or WebP of a table or document, preview it, extract the structured rows and columns, edit them, and download a real Excel workbook.",
        h1: "Photograph a table, download a spreadsheet",
        lede: "Rows and columns are detected, shown as an editable grid, and exported to a genuine .xlsx workbook.",
        card: "Turn a photo of a table into an editable Excel workbook.",
      },
      fr: {
        name: "Image vers Excel",
        title: "Image vers Excel — Convertir un tableau photographié en .xlsx",
        description:
          "Importez un JPG, PNG ou WebP d'un tableau ou d'un document, prévisualisez-le, extrayez les lignes et colonnes structurées, modifiez-les et téléchargez un vrai classeur Excel.",
        h1: "Photographiez un tableau, téléchargez un tableur",
        lede: "Les lignes et colonnes sont détectées, affichées dans une grille modifiable, puis exportées vers un vrai classeur .xlsx.",
        card: "Transformez la photo d'un tableau en classeur Excel modifiable.",
      },
      ar: {
        name: "الصورة إلى Excel",
        title: "الصورة إلى Excel — تحويل الجداول المصوّرة إلى ملف ‎.xlsx",
        description:
          "ارفع صورة JPG أو PNG أو WebP لجدول أو مستند، عاينها، استخرج الصفوف والأعمدة المنظمة، عدّلها، ثم نزّل مصنف Excel حقيقيًا.",
        h1: "صوّر جدولًا ونزّل جدول بيانات",
        lede: "تُكتشف الصفوف والأعمدة وتُعرض في شبكة قابلة للتعديل، ثم تُصدَّر إلى مصنف ‎.xlsx حقيقي.",
        card: "حوّل صورة جدول إلى مصنف Excel قابل للتعديل.",
      },
    },
  },
  {
    slug: "pdf-to-word",
    icon: FileType2,
    kind: "converter",
    converter: "pdf-to-word",
    minPlan: "trial",
    acceptMime: [PDF],
    outputMime: DOCX,
    localProcessing: true,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 50,
    features: [
      "Native-text and scanned PDFs",
      "Headings, paragraphs, lists and tables when detectable",
      "Arabic and right-to-left paragraphs preserved",
    ],
    copy: {
      en: {
        name: "PDF to Word",
        title: "PDF to Word — Convert PDF Files Into Editable .docx Documents",
        description:
          "Convert native or scanned PDF files into editable Word documents. Multi-page support, OCR for scans, heading, list and table detection, and full Arabic and right-to-left text handling.",
        h1: "Convert a PDF into an editable Word document",
        lede: "Upload a PDF and download a real .docx you can edit. Text-based PDFs are read directly; scanned pages are recognised with OCR. Page order, Arabic text and right-to-left paragraphs are preserved.",
        card: "Turn native or scanned PDFs into editable Word documents.",
      },
      fr: {
        name: "PDF vers Word",
        title: "PDF vers Word — Convertir un PDF en document .docx modifiable",
        description:
          "Convertissez des PDF natifs ou scannés en documents Word modifiables. Prise en charge multipage, OCR pour les scans, détection des titres, listes et tableaux, et gestion complète de l'arabe et du sens droite-à-gauche.",
        h1: "Convertissez un PDF en document Word modifiable",
        lede: "Importez un PDF et téléchargez un vrai fichier .docx modifiable. Les PDF texte sont lus directement, les pages scannées passent par l'OCR. L'ordre des pages, le texte arabe et les paragraphes de droite à gauche sont préservés.",
        card: "Transformez un PDF natif ou scanné en document Word modifiable.",
      },
      ar: {
        name: "PDF إلى Word",
        title: "تحويل PDF إلى Word — ملفات ‎.docx قابلة للتعديل",
        description:
          "حوّل ملفات PDF الأصلية أو الممسوحة ضوئيًا إلى مستندات Word قابلة للتعديل، مع دعم الصفحات المتعددة وOCR للمستندات الممسوحة واكتشاف العناوين والقوائم والجداول ومعالجة كاملة للنص العربي والاتجاه من اليمين إلى اليسار.",
        h1: "حوّل ملف PDF إلى مستند Word قابل للتعديل",
        lede: "ارفع ملف PDF ونزّل ملف ‎.docx حقيقيًا يمكنك تحريره. تُقرأ ملفات PDF النصية مباشرة، وتُقرأ الصفحات الممسوحة عبر OCR. يُحفظ ترتيب الصفحات والنص العربي والفقرات من اليمين إلى اليسار.",
        card: "حوّل ملفات PDF الأصلية أو الممسوحة إلى مستندات Word قابلة للتعديل.",
      },
    },
  },
  {
    slug: "image-to-word",
    icon: ImagePlus,
    kind: "converter",
    converter: "image-to-word",
    minPlan: "trial",
    acceptMime: [JPEG, PNG, WEBP],
    outputMime: DOCX,
    localProcessing: true,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 60,
    features: [
      "One or many images, reordered and rotated before conversion",
      "Recognised text you can review and correct",
      "Editable OCR text or the original images placed in Word",
    ],
    copy: {
      en: {
        name: "Image to Word",
        title: "Image to Word — Convert JPG, PNG and WebP Images Into .docx",
        description:
          "Convert one or many photos and scans into an editable Word document. Reorder and rotate images, review the recognised text before it is written, and keep Arabic and right-to-left paragraphs intact.",
        h1: "Convert images into an editable Word document",
        lede: "Add JPG, PNG or WebP images, put them in the order you want, and download a .docx — either as recognised, editable text, or with the original images placed on the page.",
        card: "Turn photos and scans into an editable Word document.",
      },
      fr: {
        name: "Image vers Word",
        title: "Image vers Word — Convertir des JPG, PNG et WebP en .docx",
        description:
          "Convertissez une ou plusieurs photos et scans en document Word modifiable. Réorganisez et pivotez les images, relisez le texte reconnu avant l'écriture, et conservez l'arabe et les paragraphes de droite à gauche.",
        h1: "Convertissez des images en document Word modifiable",
        lede: "Ajoutez des images JPG, PNG ou WebP, placez-les dans l'ordre voulu et téléchargez un .docx — soit en texte reconnu et modifiable, soit avec les images d'origine sur la page.",
        card: "Transformez photos et scans en document Word modifiable.",
      },
      ar: {
        name: "الصورة إلى Word",
        title: "تحويل الصور إلى Word — من JPG وPNG وWebP إلى ‎.docx",
        description:
          "حوّل صورة واحدة أو عدة صور ومستندات ممسوحة إلى مستند Word قابل للتعديل. أعد ترتيب الصور ودوّرها، وراجع النص المتعرَّف عليه قبل كتابته، مع الحفاظ على النص العربي والفقرات من اليمين إلى اليسار.",
        h1: "حوّل الصور إلى مستند Word قابل للتعديل",
        lede: "أضف صور JPG أو PNG أو WebP، رتّبها كما تريد، ثم نزّل ملف ‎.docx — إما كنص متعرَّف عليه قابل للتعديل أو بإدراج الصور الأصلية في الصفحة.",
        card: "حوّل الصور والمستندات الممسوحة إلى مستند Word قابل للتعديل.",
      },
    },
  },
  {
    slug: "image-to-pdf",
    icon: FileImage,
    kind: "converter",
    converter: "image-to-pdf",
    minPlan: "trial",
    acceptMime: [JPEG, PNG, WEBP],
    outputMime: PDF,
    localProcessing: true,
    adsEligible: true,
    homepageCard: true,
    inNav: true,
    inSitemap: true,
    order: 70,
    features: [
      "Drag to reorder, rotate and remove pages",
      "A4, Letter or automatic page size, margins and orientation",
      "Runs entirely in your browser — images are never uploaded",
    ],
    copy: {
      en: {
        name: "Image to PDF",
        title: "Image to PDF — Combine JPG, PNG and WebP Images Into One PDF",
        description:
          "Combine images into a single PDF in your browser. Drag to reorder, rotate, choose A4, Letter or automatic page size, orientation, margins, image fitting and output quality.",
        h1: "Combine images into a single PDF",
        lede: "Add JPG, PNG or WebP images, arrange them, choose page size, orientation, margins and quality, then download one PDF. The conversion runs entirely in your browser — nothing is uploaded.",
        card: "Combine images into one PDF, entirely in your browser.",
      },
      fr: {
        name: "Image vers PDF",
        title: "Image vers PDF — Combiner des JPG, PNG et WebP en un seul PDF",
        description:
          "Combinez des images en un seul PDF directement dans votre navigateur. Réorganisez par glisser-déposer, pivotez, choisissez A4, Letter ou taille automatique, orientation, marges, ajustement et qualité.",
        h1: "Combinez vos images en un seul PDF",
        lede: "Ajoutez des images JPG, PNG ou WebP, organisez-les, choisissez format, orientation, marges et qualité, puis téléchargez un PDF. La conversion se fait entièrement dans votre navigateur — rien n'est envoyé.",
        card: "Combinez des images en un seul PDF, entièrement dans votre navigateur.",
      },
      ar: {
        name: "الصورة إلى PDF",
        title: "تحويل الصور إلى PDF — دمج صور JPG وPNG وWebP في ملف واحد",
        description:
          "ادمج الصور في ملف PDF واحد داخل متصفحك. أعد الترتيب بالسحب، ودوّر الصور، واختر مقاس A4 أو Letter أو تلقائيًا، مع الاتجاه والهوامش وطريقة الملاءمة وجودة الإخراج.",
        h1: "ادمج صورك في ملف PDF واحد",
        lede: "أضف صور JPG أو PNG أو WebP، رتّبها، اختر المقاس والاتجاه والهوامش والجودة، ثم نزّل ملف PDF. تتم العملية بالكامل داخل متصفحك — لا يُرفع أي ملف.",
        card: "ادمج الصور في ملف PDF واحد، بالكامل داخل متصفحك.",
      },
    },
  },
  {
    slug: "ocr-api",
    icon: Code2,
    kind: "api",
    minPlan: "business",
    acceptMime: [PDF, JPEG, PNG, WEBP],
    localProcessing: false,
    adsEligible: true,
    homepageCard: false,
    inNav: true,
    inSitemap: true,
    order: 80,
    features: ["API key authentication", "Asynchronous processing", "Idempotent submission"],
    copy: {
      en: {
        name: "OCR API",
        title: "OCR API — Programmatic Invoice and Receipt Extraction",
        description:
          "HTTP API for submitting invoices and receipts and retrieving structured JSON. Authentication, endpoints, request and response examples, error codes and rate limits.",
        h1: "The same extraction, behind an HTTP call",
        lede: "Submit a document, poll for status, retrieve structured JSON.",
        card: "Submit documents and retrieve structured JSON from your own systems.",
      },
      fr: {
        name: "API OCR",
        title: "API OCR — Extraction programmatique de factures et reçus",
        description:
          "API HTTP pour soumettre factures et reçus et récupérer du JSON structuré. Authentification, points de terminaison, exemples de requêtes et réponses, codes d'erreur et limites de débit.",
        h1: "La même extraction, derrière un appel HTTP",
        lede: "Soumettez un document, interrogez son statut, récupérez du JSON structuré.",
        card: "Soumettez des documents et récupérez du JSON structuré depuis vos systèmes.",
      },
      ar: {
        name: "واجهة OCR البرمجية",
        title: "واجهة OCR البرمجية — استخراج بيانات الفواتير والإيصالات برمجيًا",
        description:
          "واجهة HTTP لإرسال الفواتير والإيصالات واسترجاع JSON منظم، مع المصادقة ونقاط النهاية وأمثلة الطلبات والاستجابات ورموز الأخطاء وحدود المعدل.",
        h1: "الاستخراج نفسه عبر طلب HTTP",
        lede: "أرسل مستندًا، تابع حالته، واسترجع JSON منظمًا.",
        card: "أرسل المستندات واسترجع JSON منظمًا من أنظمتك.",
      },
    },
  },
];

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProduct(slug: string): ProductDefinition | undefined {
  return bySlug.get(slug);
}

export function requireProduct(slug: string): ProductDefinition {
  const found = bySlug.get(slug);
  if (!found) throw new Error(`Unknown product slug: ${slug}`);
  return found;
}

export const sortedProducts = [...products].sort((a, b) => a.order - b.order);

export const navProducts = sortedProducts.filter((p) => p.inNav);
export const homepageProducts = sortedProducts.filter((p) => p.homepageCard);
export const converterProducts = sortedProducts.filter(
  (p): p is ProductDefinition & { converter: ConverterTool } => Boolean(p.converter),
);

/** Message key for a product's nav label, e.g. "link.pdf-to-word". */
export function productLabelKey(slug: string): MessageKey {
  return `link.${slug}` as MessageKey;
}

export function productRoute(slug: string, locale: Locale): string {
  return path(slug, locale);
}

/** hreflang alternates for a product page. */
export function productAlternates(slug: string) {
  return locales.map((l) => ({ locale: l, href: path(slug, l) }));
}

/** Products a plan may use, for the pricing and entitlement surfaces. */
const planRank: Record<PlanCode, number> = { trial: 0, pro: 1, business: 2 };

export function planAllowsProduct(plan: PlanCode, slug: string): boolean {
  const product = bySlug.get(slug);
  if (!product) return false;
  return planRank[plan] >= planRank[product.minPlan];
}

/** Related tools shown at the bottom of every converter page. */
export function relatedProducts(slug: string, limit = 3): ProductDefinition[] {
  const self = bySlug.get(slug);
  const sameKind = sortedProducts.filter((p) => p.slug !== slug && p.kind === self?.kind);
  const rest = sortedProducts.filter((p) => p.slug !== slug && p.kind !== self?.kind);
  return [...sameKind, ...rest].slice(0, limit);
}
