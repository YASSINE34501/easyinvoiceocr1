# EasyInvoiceOCR — SEO, AI/GEO and Brand Entity Audit

**Audit timestamp:** 2026-08-30
**Production:** https://www.easyinvoiceocr.com
**Commit audited:** `0d281145cbaed1d71005bc95b46017ea3cb7848d` (HEAD = origin/main, working tree clean)
**Method:** full crawl of all 108 sitemap URLs plus source inspection. Every number below is measured, not estimated.

Evidence labels used throughout: **VERIFIED** / **PARTIALLY VERIFIED** / **NOT OBSERVED** / **UNKNOWN** / **BLOCKED** / **RECOMMENDATION**.

---

## 1. Executive Summary

The technical SEO of this site is, measurably, close to flawless. 108/108 URLs return 200, every page is self-canonical, every page carries four reciprocal hreflang alternates with zero errors, there are zero duplicate titles and zero duplicate meta descriptions across 108 pages in three languages, and every page carries valid JSON-LD. That is a better technical baseline than most commercial sites achieve deliberately.

The site nevertheless has **0 clicks**. The bottleneck is not on-page SEO, and further on-page work will not fix it.

Three findings matter more than everything else in this document:

1. **CRITICAL — a false privacy claim is live in production, in all three languages.** `/image-to-pdf` states "Nothing leaves your device", "This tool needs no server", and "the conversion itself uses no network at all". All three are contradicted by the source: `image-to-pdf` is in `QUOTA_TOOLS` and `ImageToPdfTool.tsx:61` calls `useConversionJob("image-to-pdf")`, transmitting filename, MIME type, size, page count and idempotency key. This is a trust defect on the one dimension the product competes on.

2. **The brand name is being dissolved by the tokenizer.** Google renders `EasyInvoiceOCR` as "Easy Invoice OCR" on every unquoted query tested and returns `easyinvoice.com` — a different, established invoicing product — at #1. The site appears only under the exact quoted string. This is a name-collision problem, not a link problem.

3. **Zero verified followed backlinks and zero independent mentions.** The Dev.to article is `noindex, nofollow`; SaaSHub is `noindex` with no outbound link; AlternativeTo is unapproved. Nothing currently corroborates the entity from outside.

The content itself is unusually good — specific, honest, first-hand, with real limitations stated. It is being held back by discoverability, not quality.

---

## 2. Current Baseline

| Item | Value | Status |
|---|---|---|
| Sitemap URLs | 108 (36 slugs × 3 locales) | VERIFIED |
| HTTP 200 | 108/108 | VERIFIED |
| Self-canonical | 108/108 | VERIFIED |
| `index, follow` | 108/108, no exceptions | VERIFIED |
| hreflang alternates | 4 per page (en, fr, ar, x-default) | VERIFIED |
| GSC (Aug 21–28) | 202 impressions, 0 clicks, 0% CTR, pos 61.6, 30 queries | VERIFIED |
| GSC sitemap | Success, 108 discovered | VERIFIED |
| GSC Page Indexing | "Processing data" | UNKNOWN — PROCESSING |
| GSC Links | "Processing data" | UNKNOWN — PROCESSING (**not** zero backlinks) |
| Bing | 0 clicks, 1 impression; Site Explorer "No data available" | NOT OBSERVED |
| OCR footprint | 76.00 MB (32.75 models + 43.25 cores); was 61.26 MB | VERIFIED |
| OCR architecture | 5 base models (eng/fra/ara/deu/spa) + 2 combined modes (eng+ara, eng+fra) | VERIFIED |

---

## 3. Technical SEO — **VERIFIED, 94/100**

Measured across all 108 URLs.

| Check | Result |
|---|---|
| Status codes | 108× 200. Zero 3xx, 4xx, 5xx |
| Canonical | 108/108 self-canonical, absolute, `https://www.` |
| Robots meta | One tag per page, value `index, follow` on all 108. **Zero conflicting directives** |
| X-Robots-Tag | Not set on any page (no header/meta conflict) |
| hreflang self-reference | 0 missing |
| hreflang reciprocity | 0 non-reciprocal pairs across 432 alternate declarations |
| `<html lang>` / `dir` | en/ltr ×36, fr/ltr ×36, **ar/rtl ×36** — 0 mismatches with URL locale |
| Duplicate titles | **0** |
| Duplicate descriptions | **0** |
| Missing descriptions | **0** |
| JSON-LD parse errors | **0** |
| Orphan pages | None — every page carries ≥35 internal links |
| Broken internal links | None detected in the crawl set |
| apex → www | 308 redirect, correct direction |
| robots.txt | Single `User-agent: *` group; every `Disallow` binds; absolute `Sitemap:` line |
| Private routes in sitemap | None — `/app/*`, `choose-plan`, auth routes correctly excluded |

**Defects found:**

- **MEDIUM — 51 of 108 titles exceed 60 characters; 18 exceed 70.** Longest is 92 (`/fr/blog/gdpr-document-processing`). These truncate in SERPs. Because every title ends with `— EasyInvoiceOCR`, the brand token — the very string that needs reinforcing — is the part most likely to be cut.
- **LOW — 36 of 108 meta descriptions exceed 160 characters.**
- **LOW — `BreadcrumbList` absent on 6 pages:** the 3 locale homepages (correct) and the 3 `/pdf-tools` hubs (arguably should have one).
- **LOW — `og:locale` missing on 66 of 108 pages.** Present on homepages, `pdf-tools` and the `/pdf/*` tools; absent on all product, solutions, docs, blog and legal pages. Inconsistent, low impact.

---

## 4. Page-by-Page Audit

All 36 slugs exist in all 3 locales, all 200, all indexable, all self-canonical, all with 4 reciprocal hreflang, all with exactly one `<h1>`, all with `Organization` + `WebSite` schema. The table records what varies.

See the master table in §21 of this document.

**Content depth (words, EN/FR/AR):** min 172, p25 441, median 558, p75 766, max 1729.

**Thin pages — VERIFIED:**

| Page | Words (en/fr/ar) | Issue |
|---|---|---|
| `contact` | 172 / 187 / 172 | Thinnest on the site, and the **only pages with zero `<h2>`** |
| `help` | 312 / 332 / 285 | Below the site's own p25 |
| `solutions/freelancers` (ar) | 357 | Thinnest solutions page |
| `pdf/extract-pages`, `remove-pages`, `organize-pdf`, `merge-pdf`, `rotate-pdf` (ar) | 372–384 | Arabic PDF tool pages sit at the bottom of the distribution |

**Zero `<img>` elements across all 108 pages — VERIFIED.** The entire site renders iconography as inline SVG. Consequence: no alt-text debt (0 missing alts), but also **no Google Images surface at all**, and no visual proof of the product in the SERP.

**Zero external outbound links across all 108 pages — VERIFIED.** The site cites nothing. For a technical product making falsifiable engineering claims (Tesseract.js, WebAssembly, PDF.js, GDPR), this is a measurable E-E-A-T and AI-citation weakness.

---

## 5. International SEO — **VERIFIED, 96/100**

The strongest dimension of the site.

- 36/36 slugs present in all three locales — no locale gaps.
- Word-count parity per slug ranges 0.72–1.00 (min/max ratio). Lowest: `security` 0.72, `documentation` 0.75. Arabic is consistently ~10–20% shorter, which is expected for the script, not evidence of truncation.
- Locale totals: EN 22,366 words (avg 621), FR 24,736 (avg 687), AR 19,988 (avg 555).
- **No untranslated fragments detected.** Titles, descriptions, H1s and body content are natively phrased per locale, not machine-mirrored — e.g. `/fr/blog/gdpr-document-processing` is titled "RGPD : les questions à poser avant de confier vos factures à un service OCR", which is idiomatic French framing, not a translation of the English title.
- Arabic RTL: `dir="rtl"` on all 36 Arabic pages. VERIFIED.
- `og:locale` values: `en_US`, `fr_FR`, `ar_AR` — all valid; missing entirely on 66 pages (see §3).

**No recommendation to remove any locale.** The Arabic estate is a genuine differentiator; GSC shows the Arabic OCR-API query at position 20.2, the site's best measured position.

---

## 6. Content Audit

**Strong pages (original, specific, first-hand):**

- `/blog/line-item-extraction-hard` — explains why line items are harder than totals. Genuine engineering insight, not a listicle.
- `/blog/invoice-ocr-accuracy-guide` — argues vendor accuracy figures are not comparable. Contrarian and correct.
- `/blog/multilingual-invoice-extraction` — Arabic/French/mixed-script extraction. Nobody else in this niche writes this.
- `/blog/gdpr-document-processing` — questions to ask before uploading invoices to an OCR service. Sells the architecture by teaching the reader to interrogate it.
- `/solutions/developers` — **exemplary.** It states plainly that the API accepts no requests, and explains that a previous version of the page listed five endpoints and a bearer token which were removed rather than qualified. This is the single most trust-building paragraph on the site.
- `/pdf-to-word`, `/image-to-word` — both include explicit "what may not carry over" sections naming handwriting, column layouts and skew as failure modes.

**Pages needing work:**

- `contact` (all locales) — 172 words, zero `<h2>`, no structure.
- `help` (all locales) — 17 FAQ entries in schema but only ~300 words rendered; the ratio suggests answers are very short.
- Arabic `/pdf/*` pages — thinnest cluster on the site.

**No thin-content-farm patterns, no keyword stuffing, no AI-generated filler detected.** VERIFIED.

---

## 7. Search Intent

| Cluster | Primary intent | Pages | Intent satisfied? |
|---|---|---|---|
| Homepage | Navigational + commercial | 3 | Yes — tool picker plus direct upload affordance |
| Product/converter (`invoice-ocr`, `receipt-to-excel`, `pdf-invoice-parser`, `image-to-excel`, `pdf-to-word`, `image-to-word`, `image-to-pdf`) | Transactional | 21 | Yes — each is a working tool, not a landing page |
| `/pdf/*` (8 tools) | Transactional | 24 | Yes |
| `pdf-tools` | Transactional hub | 3 | Yes |
| `solutions/*` | Commercial investigation | 12 | Yes |
| `blog/*` | Informational | 18 | Yes — genuinely informational, not thinly disguised product copy |
| `documentation`, `help` | Informational | 6 | Partly — `help` is thin |
| `about`, `security`, `terms`, `privacy`, `cookies`, `contact` | Trust | 18 | Yes, except `contact` |

**No intent cannibalisation detected.** `invoice-ocr` (extraction), `pdf-invoice-parser` (PDF-specific) and `receipt-to-excel` (receipts) target distinct queries with distinct H1s and distinct descriptions. VERIFIED.

---

## 8. Keyword / Topic Map

**Covered well:** invoice OCR, receipt to Excel, PDF invoice parsing, image to Excel, PDF↔Word conversion, PDF manipulation, browser-side processing, multilingual extraction, GDPR/document privacy, OCR accuracy semantics, line-item extraction.

**Covered weakly or not at all — RECOMMENDATION:**

| Gap | Why it matters |
|---|---|
| "Tesseract.js" as an on-site topic | The site's whole architecture rests on it; the term appears nowhere as a page. It is the highest-intent technical term the product can legitimately own. |
| "WebAssembly OCR" / "client-side OCR" | Category-defining terms with low competition and exact product fit. |
| "browser OCR vs cloud OCR" | Comparison intent, directly serves the differentiator. |
| "PDF text layer vs OCR" | The actual architecture; explains why the product is faster and more accurate on native PDFs. |
| "receipt to excel" | **68 impressions at position 76.3** — the site's highest-volume query, and the page exists. It is ranking badly, not missing. |

**Do not build an OCR API page.** GSC shows API queries (`ocr api` 8 impressions, Arabic API query 22 impressions at pos 20.2) but no API exists. `/solutions/developers` already handles this correctly by stating the API accepts no requests. That page should remain the answer.

---

## 9. Internal Linking

**Measured:** every page carries 35–41 internal links; median 35; minimum 35.

The uniformity is the finding. A floor of 35 that is also the median means **almost every internal link on the site is global navigation and footer**, and contextual in-body linking is close to zero. Only the blog index (41) deviates meaningfully.

Consequences:
- No page can concentrate authority on another page through editorial context.
- The blog articles — the strongest content — do not funnel into the product pages they naturally support.
- **No orphans** (the nav guarantees reachability), so the problem is link *quality*, not coverage.

**RECOMMENDATION (no code change proposed here):** contextual links from `blog/line-item-extraction-hard` → `invoice-ocr`, `blog/receipts-to-spreadsheet-workflow` → `receipt-to-excel`, `blog/multilingual-invoice-extraction` → `invoice-ocr`, `blog/gdpr-document-processing` → `security` and `privacy`.

---

## 10. Structured Data — **VERIFIED**

| Type | Pages | Assessment |
|---|---|---|
| `Organization` | 108 | Correct, sitewide |
| `WebSite` | 108 | Correct, sitewide |
| `WebApplication` | 36 | On tool pages. Appropriate |
| `BreadcrumbList` | 102 | Missing only on homepages (correct) and `pdf-tools` hubs |
| `FAQPage` | 66 | See below |
| `BlogPosting` | 18 | Correct |
| `Review` / `AggregateRating` | **0** | **Correct and important — no fabricated ratings anywhere** |

**FAQPage — PARTIALLY VERIFIED.** 91 FAQ questions across the 36 EN pages, **89 unique**. Only two are reused across pages ("Which file types can I upload?", "What do I get for free?"). Google requires FAQ content to be visible on the page; I verified visibility by matching schema question text against rendered body text: **all pages match except `/en/help`, which declares 17 FAQ entries but only 16 were matched in the rendered body.** That single entry warrants a look — it may be a rendering gap or a text-matching artefact of my check.

66 pages carrying FAQPage is aggressive but not abusive given the questions are genuinely unique and genuinely rendered.

---

## 11. Brand Entity Audit — **the core problem, VERIFIED**

| Query | Google behaviour | Site visible? |
|---|---|---|
| `EasyInvoiceOCR` | "These are results for **Easy Invoice OCR**" | **Not in top 20** |
| `"easyinvoiceocr"` (quoted) | Still autocorrects to "easy invoice ocr" | **#1** + `/invoice-ocr`, `/about`, `/documentation`, `/pdf-invoice-parser` |
| `EasyInvoiceOCR OCR` | "…results for EasyInvoice OCR OCR" | **Not in top 20** |
| `EasyInvoiceOCR invoice OCR browser` | "…results for EasyInvoice OCR invoice OCR browser" | **Not in top 20**; `easyinvoice.com` ranks #1 |
| `site:easyinvoiceocr.com` | Returns EN, FR and AR pages across multiple result pages | **INDEXED** |

**Knowledge Panel:** none. **Sitelinks:** none. **Dev.to / GitHub / AlternativeTo / SaaSHub in brand SERP:** NOT OBSERVED (Dev.to is `noindex`; SaaSHub is `noindex`; AlternativeTo is not public).

**Competing entities occupying the tokens — VERIFIED:**

- `easyinvoice.com` — established invoicing SaaS, ranks #1 for the split brand
- **"EasyInvoice: Invoice Generator" on the Apple App Store** — and it advertises *"scan receipts with OCR"*, i.e. direct category overlap
- `easyocr.org`, `easyocrtools.com` ("Easy OCR Tools")
- **EasyOCR** — the widely known Python OCR library
- `easy-software.com` ("easy invoice"), `easydataworld.com`, Isenzo "Easy Invoice"

**Diagnosis:** the brand is a compound of two tokens that are each already owned by established products in the same category. This cannot be solved by link volume. It is solved by **repeated co-occurrence of the exact string `EasyInvoiceOCR` adjacent to `easyinvoiceocr.com` on domains the project does not own** — which is precisely what the two pending directory listings and any independent mention would supply.

---

## 12. Brand Entity Graph

```
EasyInvoiceOCR
  └─ easyinvoiceocr.com ................ STRONG  (108 pages, Organization+WebSite sitewide)
       ├─ Invoice OCR .................. STRONG  (dedicated page ×3 locales, blog support)
       ├─ Receipt OCR .................. STRONG  (receipt-to-excel ×3, blog support)
       ├─ PDF tools .................... STRONG  (hub + 8 tools ×3 locales)
       ├─ Excel / CSV / JSON export .... STRONG  (stated on every extraction page)
       ├─ Browser OCR .................. MEDIUM  (claimed everywhere, no dedicated page)
       ├─ Client-side processing ....... MEDIUM  (claimed, but one page contradicts it — §15)
       ├─ Tesseract.js ................. WEAK    (no on-site page; only off-site, in GitHub comments)
       └─ WebAssembly .................. WEAK    (no on-site page)

Corroboration edges:
  GitHub repo ......................... SELF-OWNED    (homepage → canonical www, 7 accurate topics)
  Dev.to article ...................... SELF-PUBLISHED, noindex+nofollow — carries no signal
  AlternativeTo ....................... DIRECTORY, pending, not public
  SaaSHub ............................. DIRECTORY, pending, noindex, no outbound link
  tesseract.js #1071, #968 ............ COMMUNITY CONTRIBUTION (self-authored, link-free)
  Independent editorial ............... NONE
```

**Missing edges, in priority order:** Tesseract.js → EasyInvoiceOCR (no on-site page asserts it); WebAssembly → EasyInvoiceOCR; any third-party domain → EasyInvoiceOCR.

---

## 13. AI / GEO Audit

**Strengths for AI citation:**
- Claims are specific and falsifiable ("five base models plus two combined modes", "76.00 MB", "PDF text layer read first").
- Limitations are stated openly — handwriting, skew, column layouts, no published accuracy figure. AI systems weight explicit limitation statements as credibility signals.
- `/solutions/developers` documents a *removed* overclaim. That is rare and highly citable.
- 89 unique FAQ questions in schema give direct question→answer pairs.

**Weaknesses:**
- **Zero outbound citations sitewide.** Nothing links to Tesseract, PDF.js, the GDPR text, or any standard. AI systems favour sources that themselves cite.
- No page defines "browser OCR", "client-side OCR" or "WebAssembly OCR" as concepts. The site *does* browser OCR but never *explains* it as a category.
- No comparison content (browser vs cloud OCR; PDF text layer vs OCR).
- No named author or credentials anywhere — no `Person` schema, no byline.

**AI visibility: NOT OBSERVED.** Google's AI Overview on every brand query tested recommended Nanonets, Dext, Docsumo, Rossum, Parsio, Affinda, DocuClipper and Vyapar. EasyInvoiceOCR was **not mentioned in any AI Overview observed**.

---

## 14. AI Answerability Scores

Scored 0–10 on: clear entity, clear topic, direct answer, evidence, original information, factual precision, limitations, semantic context, internal support, citation usefulness.

| Page | Score | Reasoning |
|---|---|---|
| `/solutions/developers` | **9** | Unique, verifiable, states what does *not* exist. Loses 1 for no outbound citation. |
| `/blog/line-item-extraction-hard` | **8** | Original technical explanation, clear limitations. Loses points for no citations, no author. |
| `/blog/invoice-ocr-accuracy-guide` | **8** | Contrarian, falsifiable, directly answers "what does OCR accuracy mean". |
| `/blog/multilingual-invoice-extraction` | **8** | First-hand multilingual/RTL experience; almost no competition on this topic. |
| `/blog/gdpr-document-processing` | **7** | Strong Q&A shape; would be 9 with citations to the GDPR text. |
| `/security` | **7** | Detailed (1404 words EN), concrete. No third-party attestation. |
| `/invoice-ocr` | **7** | Clear entity + topic, working tool, confidence scores explained. |
| `/documentation` | **7** | Longest page (1531 EN); good coverage, no citations. |
| `/receipt-to-excel` | **6** | Good page ranking badly (pos 76.3 on its head term). |
| `/blog/choosing-ocr-api` | **6** | Useful checklist, but the site has no API — an AI could misattribute one. |
| `/pdf/*` tools | **5** | Functional, low informational depth. |
| `/help` | **4** | 17 FAQ entries, ~300 words — answers too short to cite. |
| `/contact` | **2** | 172 words, no `<h2>`, nothing citable. |

---

## 15. E-E-A-T / Trust

**Experience:** strong. The site describes real production behaviour, including failures.

**Expertise:** strong and demonstrable.

**Authoritativeness:** weak. Zero independent corroboration; zero outbound citations; no named author or credentials on any page.

**Trust:** strong overall — **with one critical exception.**

### 🔴 CRITICAL — VERIFIED false privacy claim in production

`/image-to-pdf`, in all three locales, renders a section titled:

- EN: **"Nothing leaves your device"**
- FR: **"Rien ne quitte votre appareil"**
- AR: **"لا شيء يغادر جهازك"**

Body text (EN): *"This tool needs no server: the PDF is assembled in your browser and handed straight to your downloads… That is also why it keeps working on a slow connection — once the page has loaded, **the conversion itself uses no network at all**."*

**Contradicting evidence, from the source:**
- `src/lib/convert/validation.ts:25` — `"image-to-pdf"` is a member of `QUOTA_TOOLS`.
- `src/components/convert/ImageToPdfTool.tsx:61` — `const job = useConversionJob("image-to-pdf");`
- `conversionJobInput` transmits `tool`, `originalFilename`, `inputMimeType`, `inputSize`, `pageCount`, `idempotencyKey`.

Three separate statements on that page are therefore false: "Nothing leaves your device", "This tool needs no server", and "uses no network at all". Source: `src/content/converters.ts:400`.

**Why this is the most serious finding in the audit:** the product's entire positioning is that it states the privacy boundary *more* precisely than competitors. One page overclaiming undermines every page that is scrupulously accurate — and it is on the tool handling "photographs of identity documents, contracts, medical letters", per its own copy.

### 🟡 MEDIUM — same phrasing pattern, different page

`/blog/multilingual-invoice-extraction`: *"Nothing leaves your browser during recognition."* Scoped to recognition, so defensible, but it uses the forbidden phrasing family and invites the same misreading.

### ✅ VERIFIED ACCURATE — do not "fix" these

`/pdf-tools` and the eight `/pdf/*` tools state *"Your file never leaves your device"* (`src/content/pdftools/en.ts:18`, `ar.ts:18`). **This is true.** Those tools are **not** in `QUOTA_TOOLS`, there is no `src/components/pdf/` job hook, and `useConversionJob` is imported by exactly four components: `ImageToPdfTool`, `ImageToWordTool`, `PdfToWordTool`, `ExtractionWorkspace`. For the pure PDF tools, no server call occurs.

**Other claim scans (36 EN pages) — all clean:**

| Claim pattern | Occurrences | Verdict |
|---|---|---|
| "AI-powered" / "machine learning" | **0** | ✅ correct — Tesseract is not AI-marketed |
| "100+ languages" | **0** | ✅ |
| API key / Bearer / X-RateLimit | 1 (`/solutions/developers`) | ✅ appears only in text *disclaiming* the removed API |
| Handwriting | 2 (`pdf-to-word`, `image-to-word`) | ✅ both are limitation disclaimers |
| "never uploaded" | 36 | ✅ accurate — file bytes genuinely are not uploaded |

---

## 16. Authority

| Tier | Asset | Status |
|---|---|---|
| **SELF-OWNED** | easyinvoiceocr.com | 108 pages indexed |
| **SELF-OWNED** | github.com/YASSINE34501/easyinvoiceocr1 | Public, homepage → canonical www, 7 accurate topics, 0 stars/forks, **no LICENSE** |
| **SELF-PUBLISHED** | Dev.to article | Live, but `noindex` + `nofollow` |
| **COMMUNITY** | tesseract.js issue #1071 comment | Public, first comment on thread, link-free |
| **COMMUNITY** | tesseract.js discussion #968 answer | Public, first substantive answer, link-free |
| **DIRECTORY** | AlternativeTo | PENDING — "expect a few months" |
| **DIRECTORY** | SaaSHub | PENDING — public page but `noindex`, no outbound link |
| **INDEPENDENT** | — | **0** |

Hacker News (Algolia, authoritative across all HN): **0 mentions**. GitHub repo search: 1 result, the project's own repo.

**GitHub LICENSE — INFORMATIONAL, reporting only:** the repository is public with no LICENSE file. Under default copyright, no one may use, copy, modify or redistribute the code. The repo is therefore public-but-not-open-source. This is a product/legal decision, not an SEO one.

---

## 17. Backlinks

| Source | Target | Anchor | Rel | Source indexable | Type | Status |
|---|---|---|---|---|---|---|
| dev.to article | `https://www.easyinvoiceocr.com` | "EasyInvoiceOCR" | `noopener noreferrer` on the `<a>`, but page-level `<meta name="robots" content="nofollow">` | **No** — page-level `noindex` | Self-published | Effectively **nofollow** |
| saashub.com/easyinvoiceocr | — | — | — | No (`noindex`) | Directory | **No outbound link exists yet** |
| alternativeto.net | — | — | — | — | Directory | Not public |

**Verified followed external links: 0. New referring domains contributing signal: 0.**

The Dev.to page carries three conflicting robots metas (`max-snippet…`, `noindex`, `nofollow`); the most restrictive wins. A control comparison against an established Dev.to post (`devteam/what-was-your-win-this-week-51oc`) shows only the permissive tag, so this is specific to this post/account — most plausibly Dev.to's new-account anti-spam behaviour. **UNKNOWN** as to cause; **VERIFIED** as to effect.

No claim is made that any backlink would improve rankings.

---

## 18. Google Search Console

**NO MATERIAL UPDATE OBSERVED** since the Aug 21–28 baseline. Window unchanged, figures identical: 0 clicks, 202 impressions, 0% CTR, position 61.6, 30 queries.

Top queries: `receipt to excel` 68 impressions / pos 76.3 · `واجهة برمجة تطبيقات ocr للإيصال` 22 / **pos 20.2** · `intégration api ocr lecture document` 8 · `ocr api` 8 · `pdf invoice parser` 5 · `line item extraction` 5.

Sitemap: Success, 108 discovered. Page Indexing and Links: **PROCESSING — UNKNOWN**, explicitly not zero.

Other: HTTPS 13 / non-HTTPS 0 · Breadcrumbs 12 valid, 0 invalid · Core Web Vitals: no field data.

**Observation, no action recommended:** four of the top ten queries are OCR-API queries, and the Arabic one is the site's best-ranking term. The API does not exist. `/solutions/developers` is the correct answer to this demand and already handles it honestly.

---

## 19. Bing

Authenticated. Search Performance: 0 clicks, 1 impression (Aug 27). Site Explorer → Indexed URLs: *"No data available"* → **NOT OBSERVED** (not asserted as zero, since Bing recorded an impression). URL submission history under this property: *"No pages found"* → **UNKNOWN**. No quota consumed; nothing resubmitted.

---

## 20. AI Search Visibility

| Query | EasyInvoiceOCR mentioned? | Competitors surfaced in AI Overview |
|---|---|---|
| `EasyInvoiceOCR` | **No** | Nanonets, Dext, Docsumo, Rossum, Tipalti |
| `"easyinvoiceocr"` | **No** (though the site ranks #1 organically) | DocuClipper, Wafeq, Vyapar, Affinda |
| `EasyInvoiceOCR OCR` | **No** | EasyInvoice (App Store), EasyData |
| `EasyInvoiceOCR invoice OCR browser` | **No** | Easy OCR Tools, Parsio, Nanonets |

**AI visibility: NOT OBSERVED.** No manipulation attempted; queries run once each.

---

## 21. Page-by-Page Master Table

Every slug below exists in **en, fr and ar** — 108 pages total. All are HTTP 200, indexable (`index, follow`), self-canonical, with 4 reciprocal hreflang and `Organization` + `WebSite` schema. Only differences are tabulated.

| Slug (×3 locales) | Intent | Words en/fr/ar | H2s | Title len | Schema beyond Org+WebSite | og:locale | Int.links |
|---|---|---|---|---|---|---|---|
| `(home)` | Nav+Comm | 809/880/734 | 9 | 62 | WebApplication+FAQPage | y | 35 |
| `about` | Info/Trust | 414/512/408 | 4 | 37 | BreadcrumbList | MISSING | 35 |
| `blog` | Info hub | 416/471/410 | 1 | 68 | BreadcrumbList | MISSING | 41 |
| `blog/choosing-ocr-api` | Info | 592/675/555 | 6 | 66 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `blog/gdpr-document-processing` | Info | 603/660/526 | 5 | 82 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `blog/invoice-ocr-accuracy-guide` | Info | 614/710/558 | 6 | 57 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `blog/line-item-extraction-hard` | Info | 542/595/476 | 5 | 74 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `blog/multilingual-invoice-extraction` | Info | 617/674/547 | 6 | 76 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `blog/receipts-to-spreadsheet-workflow` | Info | 575/626/503 | 7 | 74 | BlogPosting+BreadcrumbList | MISSING | 37 |
| `contact` | Info/Trust | 172/187/172 | 0 | 27 | BreadcrumbList | MISSING | 35 |
| `cookies` | Info/Trust | 739/889/805 | 7 | 30 | BreadcrumbList | MISSING | 35 |
| `documentation` | Info/Trust | 1531/1729/1295 | 8 | 40 | BreadcrumbList | MISSING | 35 |
| `help` | Info/Trust | 312/332/285 | 2 | 41 | FAQPage+BreadcrumbList | MISSING | 35 |
| `image-to-excel` | Transactional | 785/847/678 | 10 | 55 | FAQPage+BreadcrumbList | MISSING | 37 |
| `image-to-pdf` | Transactional | 566/600/489 | 5 | 60 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `image-to-word` | Transactional | 567/600/494 | 5 | 59 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `invoice-ocr` | Transactional | 877/999/778 | 10 | 54 | FAQPage+BreadcrumbList | MISSING | 37 |
| `pdf-invoice-parser` | Transactional | 802/899/717 | 10 | 62 | FAQPage+BreadcrumbList | MISSING | 37 |
| `pdf-to-word` | Transactional | 644/667/540 | 5 | 61 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf-tools` | Trans hub | 807/855/728 | 5 | 72 | FAQPage | y | 36 |
| `pdf/crop-pdf` | Transactional | 443/483/402 | 4 | 55 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/extract-pages` | Transactional | 408/439/372 | 4 | 72 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/merge-pdf` | Transactional | 429/451/376 | 4 | 62 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/organize-pdf` | Transactional | 420/444/375 | 4 | 71 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/page-numbers` | Transactional | 444/491/404 | 4 | 42 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/remove-pages` | Transactional | 418/453/374 | 4 | 59 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/rotate-pdf` | Transactional | 424/469/384 | 4 | 54 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `pdf/split-pdf` | Transactional | 441/479/400 | 4 | 60 | WebApplication+FAQPage+BreadcrumbList | y | 35 |
| `privacy` | Info/Trust | 827/989/787 | 11 | 31 | BreadcrumbList | MISSING | 35 |
| `receipt-to-excel` | Transactional | 817/894/706 | 10 | 60 | FAQPage+BreadcrumbList | MISSING | 37 |
| `security` | Info/Trust | 1404/1576/1136 | 11 | 39 | BreadcrumbList | MISSING | 35 |
| `solutions/accountants` | Comm inv | 647/713/557 | 5 | 70 | BreadcrumbList+FAQPage | MISSING | 38 |
| `solutions/developers` | Comm inv | 532/566/486 | 5 | 69 | BreadcrumbList+FAQPage | MISSING | 37 |
| `solutions/freelancers` | Comm inv | 403/445/357 | 5 | 56 | BreadcrumbList+FAQPage | MISSING | 38 |
| `solutions/small-businesses` | Comm inv | 486/520/408 | 5 | 61 | BreadcrumbList+FAQPage | MISSING | 38 |
| `terms` | Info/Trust | 839/917/766 | 11 | 33 | BreadcrumbList | MISSING | 35 |

---

## 22. Scoring

| Dimension | Score | Basis |
|---|---|---|
| Technical SEO | **94/100** | 108/108 clean on status, canonical, robots, hreflang, duplicates. −6 for title/description length and `og:locale` gaps |
| On-page SEO | **82/100** | Unique titles/descriptions/H1s everywhere; −18 for 51 over-length titles and thin `contact`/`help` |
| Content | **80/100** | Genuinely original and honest; −20 for zero citations, no author, thin pages |
| International SEO | **96/100** | Best dimension: full parity, perfect reciprocity, correct RTL |
| Internal linking | **45/100** | No orphans, but links are ~100% boilerplate nav; almost no contextual linking |
| Structured data | **88/100** | Valid, appropriate, no fake ratings; −12 for `BreadcrumbList` gaps and one unverified FAQ entry |
| Authority | **12/100** | 0 followed links, 0 independent mentions; two genuine community contributions |
| Brand SEO | **25/100** | #1 on exact quoted string only; absent from every unquoted brand SERP; no Knowledge Panel |
| AI/GEO readiness | **48/100** | Excellent raw material, zero observed AI visibility, no citations, no author entity |
| **Overall** | **62/100** | A technically excellent site nobody can find by name |

### Brand Entity Score: **28/100**

| Component | Score | Note |
|---|---|---|
| Brand distinctiveness | 2/10 | Compound of two tokens already owned by others |
| Entity clarity | 4/10 | Clear on-site; unrecognised by Google |
| Search recognition | 2/10 | Autocorrected on every unquoted query |
| First-party consistency | 9/10 | Sitewide `Organization`, canonical www, correct GitHub homepage |
| Third-party corroboration | 1/10 | Nothing public yet |
| Authority | 1/10 | 0 followed links |
| AI discoverability | 1/10 | Not observed in any AI Overview |
| Topic association | 4/10 | Strong for invoice/receipt/PDF; weak for Tesseract.js/WASM |
| Trust | 6/10 | Would be 9 without the `/image-to-pdf` false claim |
| International consistency | 8/10 | Excellent, minor `og:locale` gaps |

---

## 23. Critical Findings

### Top 10 SEO issues
1. **CRITICAL** — false privacy claim on `/image-to-pdf` ×3 locales (trust, not ranking)
2. **HIGH** — 0 verified followed backlinks; Dev.to asset is `noindex, nofollow`
3. **HIGH** — brand absent from every unquoted brand SERP
4. **HIGH** — internal linking is ~100% boilerplate; no contextual authority flow
5. **MEDIUM** — 51 titles >60 chars, 18 >70; brand token truncates first
6. **MEDIUM** — `receipt to excel` at pos 76.3 with 68 impressions: best opportunity, worst position
7. **MEDIUM** — thin `contact` (172w, no `<h2>`) and `help` (~300w)
8. **LOW** — 36 descriptions >160 chars
9. **LOW** — `og:locale` missing on 66/108; `BreadcrumbList` missing on `pdf-tools` ×3
10. **LOW** — one `/en/help` FAQ schema entry not matched in rendered body

### Top 10 AI/GEO opportunities
1. Zero outbound citations — adding real references to Tesseract, PDF.js, GDPR text
2. No "What is browser OCR?" definitional page
3. No "browser OCR vs cloud OCR" comparison
4. No "PDF text layer vs OCR" explainer
5. No named author / `Person` schema — no credibility entity
6. `/solutions/developers` is highly citable but has no inbound context
7. The vendored-models story exists off-site (Dev.to, noindexed) but not on-site
8. `help` answers too short to be quotable
9. No `HowTo` schema on genuinely procedural pages
10. Arabic content is a near-uncontested AI answer space (pos 20.2 already)

### Top 10 brand/entity opportunities
1. Get AlternativeTo approved — exact brand string on a third-party domain
2. Get SaaSHub approved — same
3. Fix Dev.to indexability path (earned, not gamed)
4. Add Tesseract.js / WebAssembly as on-site topics to bind the technical entity
5. Publish the vendoring case study on-site as well as Dev.to
6. Name a human author and give the project a person-entity
7. `sameAs` edges from `Organization` to GitHub (currently omitted)
8. Shorten titles so `EasyInvoiceOCR` survives truncation
9. Pursue an independent mention — the only tier at 0
10. Consider whether the brand string itself needs a disambiguating tagline in titles

### Top 10 content opportunities
1. Expand `contact` (add `<h2>`s, response expectations)
2. Expand `help` answers to citable length
3. Deepen Arabic `/pdf/*` pages
4. "What is browser OCR?" pillar
5. "Browser OCR vs cloud OCR" comparison
6. "PDF text layer first" architecture explainer
7. On-site version of the vendored-models incident
8. Strengthen `receipt-to-excel` for its own head term
9. Add outbound citations across blog posts
10. Add author bios / credentials

### Top 10 authority opportunities
1. AlternativeTo priority review ($5) — highest impact per effort
2. SaaSHub domain verification
3. Continue genuine tesseract.js participation
4. Dev.to reputation growth (organic only)
5. Show HN once the article is indexable
6. WASM Weekly / JavaScript Weekly editorial pitch
7. Relevant PDF.js community participation
8. Lobsters (invite-only — requires a member)
9. Arabic-language developer communities (uncontested)
10. Accounting/bookkeeping communities where invoice OCR is on-topic

---

## 24. 30-Day Roadmap

| # | Action | Why | Code? | Manual? | External account? |
|---|---|---|---|---|---|
| 1 | Correct the `/image-to-pdf` privacy section | Live false claim on the product's core promise | **YES** | No | No |
| 2 | AlternativeTo priority review | Only near-term route to third-party brand-string co-occurrence | No | **YES** (payment) | Yes |
| 3 | SaaSHub verification | Unlocks approval → indexable listing + outbound link | No | **YES** | Yes |
| 4 | Shorten 18 titles >70 chars | Protect the brand token from truncation | **YES** | No | No |
| 5 | Add contextual blog → product links | Only real internal-linking lever | **YES** | No | No |
| 6 | Expand `contact` and `help` | Thinnest pages on the site | **YES** | No | No |

## 25. 60–90-Day Roadmap

| # | Action | Why | Code? |
|---|---|---|---|
| 7 | "What is browser OCR?" pillar + "browser vs cloud OCR" comparison | Owns the category the product actually occupies | **YES** |
| 8 | On-site Tesseract.js / WebAssembly architecture page | Binds the missing entity-graph edges | **YES** |
| 9 | Add outbound citations across blog posts | Largest single AI-citability gain | **YES** |
| 10 | Named author + `Person` schema | Creates a credibility entity | **YES** |
| 11 | `Organization.sameAs` → GitHub | Cheap, real entity corroboration | **YES** |
| 12 | Pursue one independent technical mention | The only tier at zero | No |

---

## 26. What NOT to change

- **Do not touch** `/pdf-tools` or `/pdf/*` privacy copy — "your file never leaves your device" is **verified true** there.
- **Do not build an OCR API page** despite API queries in GSC.
- **Do not add** `Review` or `AggregateRating` schema — there are no reviews.
- **Do not remove** any locale. Arabic is a differentiator and holds the best measured position.
- **Do not restructure** canonical, hreflang, sitemap or robots.txt — all measured clean.
- **Do not edit or republish** the Dev.to article to escape `noindex`.
- **Do not manufacture** Dev.to engagement to lift the noindex.
- **Do not add** a LICENSE without a deliberate legal decision.

---

## 27. Evidence / Sources

- Full crawl of 108 sitemap URLs, 2026-08-30 (`crawl.json`)
- Per-page FAQ/claim extraction of 36 EN pages (`deep.json`)
- Source: `src/lib/convert/validation.ts`, `src/components/convert/ImageToPdfTool.tsx`, `src/content/converters.ts`, `src/content/pdftools/{en,ar}.ts`
- Google Search Console (property `https://www.easyinvoiceocr.com/`), authenticated
- Bing Webmaster Tools, authenticated
- Google SERPs: 5 brand queries + `site:` operator
- GitHub REST API: repo metadata, tesseract.js issue #1071
- AlternativeTo `/my-submissions/`, authenticated as YASSINE34501
- SaaSHub `/easyinvoiceocr` and `/verify/easyinvoiceocr`, unauthenticated
- Hacker News via Algolia API

## 28. Audit timestamp

**2026-08-30**, against commit `0d281145cbaed1d71005bc95b46017ea3cb7848d`.

**NO PRODUCTION CHANGES WERE MADE DURING THIS AUDIT.**
