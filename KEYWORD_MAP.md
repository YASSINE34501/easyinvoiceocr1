# Keyword map

One primary intent per page, per locale. The purpose of writing it down is
cannibalisation: two pages chasing the same query split their own signals and
neither wins.

**No search volume, CPC, competition score or difficulty rating appears in this
document.** Those require a licensed data source. Inventing them would make the
whole map untrustworthy, and every decision below can be made without them.

---

## Rules applied

- **One primary topic per page per locale.** Everything else on the page is
  supporting vocabulary, not a second target.
- **Product pages own transactional intent. Articles own informational
  intent.** Where both could target a phrase, the product page keeps it and the
  article takes the "how" or "why" variant.
- **A page that does not work owns nothing.** `ocr-api` and `api-reference` are
  `noindex` and have no keyword target while the API accepts no requests.
- Terms are written as a searcher would type them, not as the product names
  them.

---

## Homepage

| Locale | Primary topic | Intent | Supporting |
|---|---|---|---|
| en | invoice OCR to Excel | Commercial | receipt OCR, extract invoice data, convert PDF to structured data, browser OCR |
| fr | OCR facture Excel | Commercial | OCR reçu, extraire données facture, convertir PDF en données |
| ar | استخراج بيانات الفواتير | Commercial | تحويل الفاتورة إلى Excel، قراءة الإيصالات، OCR عربي |

The homepage is the pillar for the whole product surface; it links to every
operational tool and to the three resource hubs.

## Product pages — transactional

| Page | en | fr | ar |
|---|---|---|---|
| `invoice-ocr` | invoice OCR | OCR de factures | استخراج بيانات الفواتير |
| `receipt-to-excel` | receipt to Excel | reçu vers Excel | تحويل الإيصال إلى Excel |
| `pdf-invoice-parser` | PDF invoice parser | analyseur de factures PDF | محلّل فواتير PDF |
| `image-to-excel` | image to Excel | image vers Excel | تحويل الصورة إلى Excel |
| `pdf-to-word` | PDF to Word | PDF vers Word | تحويل PDF إلى Word |
| `image-to-word` | image to Word | image vers Word | تحويل الصورة إلى Word |
| `image-to-pdf` | image to PDF | image vers PDF | تحويل الصورة إلى PDF |

Supporting vocabulary per product page comes from its own `fields`,
`capabilities` and `formats` lists, which are written for readers rather than
for density.

## Solution pages — audience intent

| Page | en | fr | ar |
|---|---|---|---|
| `solutions/accountants` | OCR for accountants | logiciel OCR pour comptables | برنامج OCR للمحاسبين |
| `solutions/small-businesses` | invoice OCR for small business | OCR facture petite entreprise | استخراج الفواتير للشركات الصغيرة |
| `solutions/freelancers` | receipt tracking for freelancers | notes de frais indépendants | إدارة إيصالات المستقلين |
| `solutions/developers` | document extraction for developers | extraction documentaire développeurs | استخراج المستندات للمطوّرين |

`solutions/developers` deliberately targets *evaluation* intent, not "OCR API",
because the API does not exist. Its honest answer is the browser tools.

## Blog — informational

Full detail in `BLOG_KEYWORD_MAP.md`. Summary of primary topics:

| Article | en | fr | ar |
|---|---|---|---|
| `invoice-ocr-accuracy-guide` | invoice OCR accuracy | précision OCR facture | دقة استخراج بيانات الفاتورة |
| `receipts-to-spreadsheet-workflow` | receipt to Excel workflow | reçu vers Excel | تحويل الإيصال إلى Excel |
| `multilingual-invoice-extraction` | Arabic invoice OCR | OCR facture arabe | قراءة الفواتير العربية |
| `gdpr-document-processing` | GDPR OCR invoice processing | RGPD traitement de factures | حماية بيانات الفواتير |
| `line-item-extraction-hard` | invoice line item extraction | extraction des lignes de facture | استخراج بنود الفاتورة |
| `choosing-ocr-api` | choosing an OCR API | choisir une API OCR | اختيار واجهة OCR برمجية |

## Resource and company pages

| Page | Intent | Primary topic |
|---|---|---|
| `documentation` | Informational — "how does it work" | how EasyInvoiceOCR works |
| `help` | Support — specific questions | invoice OCR help |
| `blog` | Hub | invoice OCR guides |
| `about` | Navigational | about EasyInvoiceOCR |
| `security` | Trust / commercial investigation | document processing security |
| `contact` | Navigational | contact EasyInvoiceOCR |
| `terms`, `privacy`, `cookies` | Legal | *no commercial target* — indexable but not optimised for commercial phrases |

Legal pages are deliberately left un-optimised. Chasing commercial keywords on
a privacy policy is a pattern that erodes trust and does not convert.

## Cannibalisation register

| Query family | Owner | Others must target |
|---|---|---|
| invoice OCR (transactional) | `/{l}/invoice-ocr` | accuracy, multilingual and line-item *informational* variants |
| receipt to Excel | `/{l}/receipt-to-excel` | the monthly *workflow* variant |
| PDF invoice parsing | `/{l}/pdf-invoice-parser` | *why line items are hard* |
| image to Excel | `/{l}/image-to-excel` | table-structure explanation |
| OCR API | **nobody** — `noindex` while unavailable | `choosing-ocr-api` targets *how to evaluate one* |
| document privacy / GDPR | `/{l}/security` | the *question-asking* variant |
| OCR for accountants | `/{l}/solutions/accountants` | accountant-facing article angles |

Verified mechanically: titles and descriptions are unique within each locale,
36/36 in all three (`SEO_AUDIT.md` §3). No two pages share a primary topic in
any locale.

## Intents deliberately not targeted

- Anything implying a working API, SDK, webhook or key.
- Any language beyond English, French and Arabic — only three recognition
  models ship.
- Accuracy-percentage queries ("99% accurate invoice OCR"), because no accuracy
  figure has been measured on a published benchmark.
- Competitor comparison pages, until there is something substantive to compare
  rather than a thin table written for the query.
