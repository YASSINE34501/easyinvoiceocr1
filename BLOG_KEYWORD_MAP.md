# Blog keyword map

One primary intent per article, per locale. The point of writing it down is
cannibalisation: two articles competing for the same query split their own
signals and neither ranks.

No ranking is promised anywhere in this document. These are the intents each
page is *written to serve*; whether it does is measured in Search Console, not
asserted here.

## Rules applied

- **One primary keyword per article per locale.** Everything else on the page is
  a supporting term, not a second target.
- **Articles do not compete with product pages.** A product page answers
  "I want to do this now"; an article answers "I want to understand this
  first". Where both could target a phrase, the product page owns it and the
  article targets the informational variant.
- **No keyword stuffing.** The primary term appears in the title, the H1 and
  naturally in the body. It is not repeated to hit a density.

## Article → intent map

### `invoice-ocr-accuracy-guide`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | invoice OCR accuracy | Informational | field-level accuracy, confidence score, OCR benchmark, extract invoice data | `/en/invoice-ocr` |
| fr | précision OCR facture | Informational | précision par champ, indice de confiance, OCR facture | `/fr/invoice-ocr` |
| ar | دقة استخراج بيانات الفاتورة | Informational | دقة الحقول، درجة الثقة، قراءة الفواتير | `/ar/invoice-ocr` |

### `receipts-to-spreadsheet-workflow`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | receipt to Excel workflow | How-to | digitise receipts, expense spreadsheet, monthly bookkeeping routine | `/en/receipt-to-excel` |
| fr | reçu vers Excel | How-to | notes de frais, numériser les reçus, routine comptable mensuelle | `/fr/receipt-to-excel` |
| ar | تحويل الإيصال إلى Excel | How-to | رقمنة الإيصالات، جدول المصروفات، روتين محاسبي شهري | `/ar/receipt-to-excel` |

### `multilingual-invoice-extraction`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | Arabic invoice OCR | Informational | right-to-left invoice, Eastern Arabic numerals, bilingual invoice, French invoice OCR | `/en/invoice-ocr` |
| fr | OCR facture arabe | Informational | facture bilingue, chiffres arabes orientaux, lecture de droite à gauche | `/fr/invoice-ocr` |
| ar | قراءة الفواتير العربية | Informational | الفواتير ثنائية اللغة، الأرقام العربية المشرقية، الاتجاه من اليمين إلى اليسار | `/ar/invoice-ocr` |

This is the one article where the Arabic version is the most valuable of the
three: it is about Arabic invoices, and it previously served English prose to
Arabic readers.

### `gdpr-document-processing`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | GDPR OCR invoice processing | Commercial investigation | data processing agreement, document retention, sub-processors, OCR privacy | `/en/security` |
| fr | RGPD traitement de factures | Commercial investigation | sous-traitance, durée de conservation, confidentialité documentaire | `/fr/security` |
| ar | حماية بيانات الفواتير | Commercial investigation | اتفاقية معالجة البيانات، مدة الاحتفاظ، خصوصية المستندات | `/ar/security` |

### `line-item-extraction-hard`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | invoice line item extraction | Informational | table extraction, borderless table, PDF invoice parser | `/en/pdf-invoice-parser` |
| fr | extraction des lignes de facture | Informational | tableau sans filets, analyse de facture PDF | `/fr/pdf-invoice-parser` |
| ar | استخراج بنود الفاتورة | Informational | جداول بلا حدود، تحليل فاتورة PDF | `/ar/pdf-invoice-parser` |

### `choosing-ocr-api`

| Locale | Primary keyword | Intent | Supporting terms | Supports |
|---|---|---|---|---|
| en | choosing an OCR API | Commercial investigation | idempotency key, rate limit headers, error envelope, cursor pagination | `/en/ocr-api` |
| fr | choisir une API OCR | Commercial investigation | clé d'idempotence, limitation de débit, format d'erreur | `/fr/ocr-api` |
| ar | اختيار واجهة OCR برمجية | Commercial investigation | مفاتيح منع التكرار، حدود المعدل، صيغة الأخطاء | `/ar/ocr-api` |

The target product page describes an API that is **not operational**. The
article says so explicitly and does not claim availability.

## Cannibalisation check

Terms where an article and a product page could collide, and who owns each.

| Query family | Owner | Article role |
|---|---|---|
| "invoice OCR" / "OCR facture" / "استخراج بيانات الفاتورة" (transactional) | `/{locale}/invoice-ocr` | Articles target the *informational* variants: accuracy, multilingual, line items |
| "receipt to Excel" (transactional) | `/{locale}/receipt-to-excel` | `receipts-to-spreadsheet-workflow` targets the *workflow* variant |
| "PDF invoice parser" (transactional) | `/{locale}/pdf-invoice-parser` | `line-item-extraction-hard` targets *why line items are hard* |
| "OCR API" (transactional) | `/{locale}/ocr-api` | `choosing-ocr-api` targets *how to evaluate one* |
| Document privacy / GDPR | `/{locale}/security` | `gdpr-document-processing` targets the *question-asking* variant |

No two articles share a primary keyword in any locale. Verified mechanically:
titles and descriptions are unique within each locale
(`src/content/blog.test.ts`).

## Intents deliberately not covered

These appear in the wider mission keyword list but belong to product pages, not
the blog. Creating thin articles for them would be exactly the cannibalisation
this document exists to prevent.

- PDF to Word / PDF vers Word / تحويل PDF إلى Word → `/{locale}/pdf-to-word`
- Image to Word / image vers Word / تحويل الصورة إلى Word → `/{locale}/image-to-word`
- Image to PDF / image vers PDF / تحويل الصورة إلى PDF → `/{locale}/image-to-pdf`
- Image to Excel / تحويل الصورة إلى Excel → `/{locale}/image-to-excel`
- OCR for accountants / logiciel OCR pour comptables / برنامج OCR للمحاسبين → `/{locale}/solutions/accountants`

If any of these later justifies an article, it must target a genuinely
different intent from its product page — a how-to or a comparison — and be
recorded here first.
