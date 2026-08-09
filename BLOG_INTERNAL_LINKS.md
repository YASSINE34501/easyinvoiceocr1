# Blog internal links

Every article links out to a product, an audience page and a documentation or
policy page, plus at least two related articles. Anchor text is written per
article rather than reused, so the blog does not point at every product with
the same phrase.

All link hrefs are locale-relative (`/{locale}/…`) and stay inside the locale
the reader is in. A test asserts this: an Arabic article cannot link to an
English page.

## Link matrix

Three contextual links per article per locale, plus a CTA.

| Article | Product | Solution | Doc / policy | CTA target |
|---|---|---|---|---|
| `invoice-ocr-accuracy-guide` | `/{l}/invoice-ocr` | `/{l}/solutions/accountants` | `/{l}/documentation` | `/{l}/invoice-ocr` |
| `receipts-to-spreadsheet-workflow` | `/{l}/receipt-to-excel` | `/{l}/solutions/freelancers` | `/{l}/documentation` | `/{l}/receipt-to-excel` |
| `multilingual-invoice-extraction` | `/{l}/invoice-ocr` | `/{l}/solutions/accountants` | `/{l}/documentation` | `/{l}/invoice-ocr` |
| `gdpr-document-processing` | `/{l}/security` | `/{l}/solutions/small-businesses` | `/{l}/documentation` | `/{l}/security` |
| `line-item-extraction-hard` | `/{l}/pdf-invoice-parser` | `/{l}/solutions/accountants` | `/{l}/documentation` | `/{l}/pdf-invoice-parser` |
| `choosing-ocr-api` | `/{l}/ocr-api` | `/{l}/solutions/developers` | `/{l}/api-reference` | `/{l}/ocr-api` |

## Anchor text

The same destination is reached through different wording from different
articles. Repeating one phrase across six pages tells a search engine less than
six phrases that each describe why *this* page is linking.

### `/en/invoice-ocr`

- from `invoice-ocr-accuracy-guide` — "Extract data from a PDF or scanned invoice"
- from `multilingual-invoice-extraction` — "Read invoices in Arabic, French or English"

### `/fr/invoice-ocr`

- from `invoice-ocr-accuracy-guide` — "Extraire les données d'une facture PDF ou scannée"
- from `multilingual-invoice-extraction` — "Lire des factures en arabe, français ou anglais"

### `/ar/invoice-ocr`

- from `invoice-ocr-accuracy-guide` — "استخراج البيانات من فاتورة PDF أو ممسوحة ضوئيًا"
- from `multilingual-invoice-extraction` — "قراءة الفواتير بالعربية أو الفرنسية أو الإنجليزية"

### `/{l}/solutions/accountants`

- from `invoice-ocr-accuracy-guide` — "How accounting teams run a review queue" / "Organiser une file de relecture en cabinet" / "كيف تنظّم فرق المحاسبة قائمة المراجعة"
- from `multilingual-invoice-extraction` — "Multi-entity and multilingual accounting teams" / "Cabinets multilingues et multi-entités" / "الفرق المحاسبية متعددة اللغات والكيانات"
- from `line-item-extraction-hard` — "Line-item review in accounts payable" / "Contrôle des lignes en comptabilité fournisseurs" / "مراجعة البنود في حسابات الموردين"

### `/{l}/documentation`

- from `invoice-ocr-accuracy-guide` — "Confidence scores and correcting a field"
- from `receipts-to-spreadsheet-workflow` — "What the exported workbook contains"
- from `multilingual-invoice-extraction` — "Languages, scripts and returned fields"
- from `gdpr-document-processing` — "Deleting your documents and account"
- from `line-item-extraction-hard` — "Which fields and line items are returned"

Five links to one page, five different reasons. Each French and Arabic variant
is written independently rather than translated from the English anchor.

## Related articles

Two per article, chosen for topical adjacency rather than recency. Rendered as
cards below the CTA, using the reader's locale for heading, category and
description.

| Article | Related |
|---|---|
| `invoice-ocr-accuracy-guide` | `line-item-extraction-hard`, `multilingual-invoice-extraction` |
| `receipts-to-spreadsheet-workflow` | `invoice-ocr-accuracy-guide`, `gdpr-document-processing` |
| `multilingual-invoice-extraction` | `invoice-ocr-accuracy-guide`, `line-item-extraction-hard` |
| `gdpr-document-processing` | `receipts-to-spreadsheet-workflow`, `choosing-ocr-api` |
| `line-item-extraction-hard` | `invoice-ocr-accuracy-guide`, `multilingual-invoice-extraction` |
| `choosing-ocr-api` | `gdpr-document-processing`, `line-item-extraction-hard` |

Enforced by test: every related slug resolves to a published article, no
article relates to itself, and each has at least two.

## Content clusters

The six articles form three clusters rather than a flat list.

**Invoice OCR quality** — `invoice-ocr-accuracy-guide`,
`line-item-extraction-hard`, `multilingual-invoice-extraction`.
Mutually interlinked; all point at Invoice OCR or the PDF invoice parser.

**Workflow and record-keeping** — `receipts-to-spreadsheet-workflow`,
`gdpr-document-processing`.
Points at Receipt to Excel and Security.

**Building on documents** — `choosing-ocr-api`, linking back to
`gdpr-document-processing` because retention and sub-processors are part of an
integration decision, not a later review.

## Not done

**Product and solution pages do not yet link back to articles.** The mission
asks for reciprocal linking; the return links belong in the product page
templates, which are Step 3. Until then the linking is one-directional, from
blog to product.

Nothing in the blog links to an article image, because no article artwork
exists yet. `imageAlt` is written and localised for all eighteen variants and
is ready for when it does.
