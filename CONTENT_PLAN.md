# Content plan — 90 days

Twelve articles over three months, each published in English, French and
Modern Standard Arabic on the same day, matching the existing model where a
slug is shared across locales and the body is written per language.

**No performance is predicted.** This document contains no traffic estimate, no
ranking target and no search volume, because none of those can be known before
publishing and none is needed to decide what to write.

---

## Principles carried over from the existing blog

- One primary intent per article per locale, registered in `KEYWORD_MAP.md`
  before writing.
- Three languages on day one. A French or Arabic article added later is a
  second migration; adding all three at once is cheaper and avoids a window
  where the locale falls back.
- No invented statistic, customer, testimonial, benchmark or research finding.
  Where a number would be persuasive but is not measured, there is no number.
- `EasyInvoiceOCR` is the `Organization` author. No fictional byline.
- Every article links to one operational product, one solution page, one
  documentation page and two related articles.
- Length follows the subject. An article is finished when the question is
  answered, not when it reaches a word count.

## Research each article needs before writing

Marked **R** below. These are facts that must be checked against the code or a
primary source, not assumed:

- Exact behaviour of the conversion gate and quota release
- What the exporter actually writes into each sheet
- Which normalisation steps run before arithmetic validation
- Current wording of any third-party terms cited

---

## Month 1 — depth on what already works

| # | Article | Intent | Audience | Product | Internal links | Research | Priority |
|---|---|---|---|---|---|---|---|
| 1 | How to check an invoice extraction before you post it | How-to | Bookkeepers | `invoice-ocr` | accuracy guide, line items, `documentation#accuracy-and-review` | **R** confidence thresholds | High |
| 2 | Turning a supplier PDF into a ledger import | How-to | Accountants | `pdf-invoice-parser` | `solutions/accountants`, exports doc | **R** CSV column order | High |
| 3 | What a good scan looks like, and why it matters | Informational | All | `invoice-ocr` | accuracy guide, help "improve accuracy" | — | Medium |
| 4 | Reading an invoice that mixes Arabic and English | Informational | MENA finance teams | `invoice-ocr` | multilingual article, languages doc | **R** digit normalisation order | High |

## Month 2 — workflow and adjacent jobs

| # | Article | Intent | Audience | Product | Internal links | Research | Priority |
|---|---|---|---|---|---|---|---|
| 5 | A quarterly VAT routine built on exported spreadsheets | How-to | Small business | `receipt-to-excel` | receipts workflow, `solutions/small-businesses` | **R** export sheet shape | High |
| 6 | When a converter is the wrong tool | Informational | All | `pdf-to-word` | converters doc, image-to-word | — | Medium |
| 7 | Keeping digital receipts that survive an audit | Informational | Freelancers | `receipt-to-excel` | receipts workflow, GDPR article | — | Medium |
| 8 | Why a table without borders is hard to read | Informational | Analysts | `image-to-excel` | line items article, image-to-excel page | — | Medium |

## Month 3 — trust and evaluation

| # | Article | Intent | Audience | Product | Internal links | Research | Priority |
|---|---|---|---|---|---|---|---|
| 9 | What "runs in your browser" actually means | Informational | Privacy-conscious buyers | `security` | GDPR article, security-and-data doc | **R** exact conversion record fields | High |
| 10 | Questions to ask before switching OCR vendors | Commercial investigation | Practice owners | `invoice-ocr` | accuracy guide, choosing-an-API | — | Medium |
| 11 | Reconciling extracted totals against a bank statement | How-to | Bookkeepers | `image-to-excel` | receipts workflow, exports doc | **R** JSON shape | Medium |
| 12 | A checklist for handing a month to your accountant | How-to | Small business | `receipt-to-excel` | receipts workflow, `solutions/accountants` | — | Low |

---

## Publishing order

Sequenced so each article can link to one already published, rather than
waiting for a cluster to complete:

`1 → 4 → 2 → 5 → 9 → 3 → 7 → 8 → 6 → 10 → 11 → 12`

Articles 1, 4, 2, 5 and 9 are the high-priority set: each supports an
operational product and answers a question the help pages already receive.

## Linkable assets, in the same period

Not articles, but the pages most likely to be referenced by someone else:

| Asset | Why it earns a link | Effort |
|---|---|---|
| Invoice-field checklist (printable) | Practical, reusable, no product pitch | Small |
| "What to ask a document processor" question list | Extends the GDPR article into a standalone reference | Small |
| Scan-quality guide with real before/after captures | Genuinely useful, needs original images — **not** stock or invented samples | Medium |

## What this plan will not do

- Publish an article per keyword variation. Twelve substantial pieces beat
  forty thin ones, and thin pages are what a manual review penalises.
- Add a comparison page naming competitors until there is something concrete
  to compare.
- Claim an accuracy figure. No benchmark has been run and published.
- Announce the OCR API. It stays Coming Soon until it accepts requests.
