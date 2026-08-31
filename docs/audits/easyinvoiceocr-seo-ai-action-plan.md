# EasyInvoiceOCR — SEO / AI / Brand Action Plan

**Generated:** 2026-08-30 · against commit `0d281145cbaed1d71005bc95b46017ea3cb7848d`
**Companion document:** `easyinvoiceocr-seo-ai-brand-audit.md`

Every item below is a **recommendation only**. None has been executed. Each requires explicit approval.

Priority scale: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW** / **INFORMATIONAL**

---

## A-01 — Correct the false privacy claim on `/image-to-pdf`

| Field | Value |
|---|---|
| **Category** | Trust / factual accuracy |
| **Priority** | **CRITICAL** |
| **Problem** | `/image-to-pdf` states in all three locales: "Nothing leaves your device" (heading), "This tool needs no server", and "the conversion itself uses no network at all". All three are false. |
| **Evidence** | `src/lib/convert/validation.ts:25` lists `"image-to-pdf"` in `QUOTA_TOOLS`. `src/components/convert/ImageToPdfTool.tsx:61` calls `useConversionJob("image-to-pdf")`. `conversionJobInput` transmits `tool`, `originalFilename`, `inputMimeType`, `inputSize`, `pageCount`, `idempotencyKey`. Live text verified in EN, FR and AR. Source: `src/content/converters.ts:400`. |
| **Recommendation** | Rewrite that section to match the accurate boundary used everywhere else: image bytes are processed locally and never uploaded; filename, MIME type, size, page count and an idempotency key are transmitted for quota and record-keeping. Remove "needs no server" and "uses no network at all". Apply to all three locales. |
| **Expected benefit** | Removes the only verified false claim on the site, on the exact dimension the product competes on. Not a ranking action. |
| **Risk** | Very low — content-only change in one content file. Risk of *not* doing it is materially higher. |
| **Effort** | Small (one section × 3 locales) |
| **Requires code?** | **YES** — `src/content/converters.ts` |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-02 — Review the "Nothing leaves your browser" phrasing in `/blog/multilingual-invoice-extraction`

| Field | Value |
|---|---|
| **Category** | Trust / phrasing |
| **Priority** | **MEDIUM** |
| **Problem** | Contains "Nothing leaves your browser during recognition." Scoped and defensible, but uses the phrasing family the project has ruled out. |
| **Evidence** | Live text on `/en/blog/multilingual-invoice-extraction`. |
| **Recommendation** | Reword to the standard formulation, e.g. "Document bytes are processed locally in your browser and are never uploaded." |
| **Expected benefit** | Consistent privacy language sitewide; removes an invitation to misread. |
| **Risk** | Very low |
| **Effort** | Trivial |
| **Requires code?** | **YES** — blog content file |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-03 — AlternativeTo priority review

| Field | Value |
|---|---|
| **Category** | Authority / brand entity |
| **Priority** | **HIGH** |
| **Problem** | Listing pending in the normal queue — "expect a few months". While pending it produces no public page and no brand-string co-occurrence. |
| **Evidence** | `alternativeto.net/my-submissions/`: "EasyInvoiceOCR — Submitted Aug 30, 2026 · In the normal queue, expect a few months". Checkout verified as $5, one-time, tax included, non-recurring, Stripe. |
| **Recommendation** | Purchase the $5 priority review. Reviewed in 1–2 business days; crew tells you what to add rather than declining silently. |
| **Expected benefit** | First public third-party page carrying the exact string `EasyInvoiceOCR` beside `easyinvoiceocr.com` — the specific remedy for the tokenization problem in §11 of the audit. **Does not guarantee approval** — AlternativeTo states this explicitly. |
| **Risk** | Low; $5, refundable until the review is performed |
| **Effort** | ~60 seconds |
| **Requires code?** | No |
| **Requires manual action?** | **YES** — Stripe checkout requires entering card details, which Claude does not do |
| **Requires external account?** | Yes (already signed in as YASSINE34501) |
| **Approval required** | **YES** — and must be completed by you |

---

## A-04 — SaaSHub domain verification

| Field | Value |
|---|---|
| **Category** | Authority / brand entity |
| **Priority** | **HIGH** |
| **Problem** | Listing is public but `noindex` and exposes no outbound link while pending, so it currently transmits zero signal. |
| **Evidence** | `saashub.com/easyinvoiceocr` returns 200 with `<meta name="robots" content="noindex, follow">` and a second `noindex`; zero `href` to `www.easyinvoiceocr.com` in the page source. `/verify/easyinvoiceocr` offers only two routes: an `@easyinvoiceocr.com` mailbox, or an HTML meta tag that reads *"You need to log in to enable this method"*. |
| **Recommendation** | Either (a) create an `@easyinvoiceocr.com` mailbox and verify by email, or (b) create a SaaSHub account — which is the **only** way the meta tag value becomes visible at all — then decide separately whether to add that tag to the site. |
| **Expected benefit** | Verification raises approval priority; approval removes `noindex` and exposes the outbound link. |
| **Risk** | Low. Note route (b) would later require an SEO metadata change, which is a separate approval. |
| **Effort** | Small |
| **Requires code?** | Not for verification itself; **YES** if route (b) is chosen and the tag is added |
| **Requires manual action?** | **YES** |
| **Requires external account?** | **YES** |
| **Approval required** | **YES** |

---

## A-05 — Shorten over-length titles

| Field | Value |
|---|---|
| **Category** | On-page SEO / brand |
| **Priority** | **MEDIUM** |
| **Problem** | 51 of 108 titles exceed 60 characters; 18 exceed 70; longest is 92. Every title ends `— EasyInvoiceOCR`, so the brand token is the first casualty of truncation — on a site whose central problem is that Google does not recognise that token. |
| **Evidence** | Measured across all 108 pages. Worst: `/fr/blog/gdpr-document-processing` (92), `/fr/solutions/developers` (83), `/ar/blog` (81). |
| **Recommendation** | Bring the 18 worst offenders under ~65 characters. Consider moving the brand suffix earlier, or dropping it on blog posts where the article title carries the meaning. |
| **Expected benefit** | Brand string survives SERP truncation more often. No ranking claim made. |
| **Risk** | Low, but titles are SEO metadata — needs deliberate approval |
| **Effort** | Small–medium (18 strings across locale content files) |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-06 — Add contextual internal links from blog to product pages

| Field | Value |
|---|---|
| **Category** | Internal linking |
| **Priority** | **HIGH** |
| **Problem** | Internal links per page: min 35, median 35, max 41. A floor equal to the median means essentially every internal link is global nav/footer; contextual in-body linking is near zero. The strongest content (blog) does not funnel into the pages it supports. |
| **Evidence** | Measured across all 108 pages. |
| **Recommendation** | Add a small number of genuinely contextual in-body links: `line-item-extraction-hard` → `invoice-ocr`; `receipts-to-spreadsheet-workflow` → `receipt-to-excel`; `multilingual-invoice-extraction` → `invoice-ocr`; `gdpr-document-processing` → `security` and `privacy`; `choosing-ocr-api` → `solutions/developers`. Only where the sentence genuinely warrants it. |
| **Expected benefit** | Editorial authority flow to commercial pages; better crawl semantics. |
| **Risk** | Low if kept small; avoid link-stuffing |
| **Effort** | Small |
| **Requires code?** | **YES** — blog content files ×3 locales |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-07 — Expand `contact` and `help`

| Field | Value |
|---|---|
| **Category** | Content |
| **Priority** | **MEDIUM** |
| **Problem** | `contact` is 172/187/172 words and the **only page on the site with zero `<h2>`**. `help` is 312/332/285 words yet declares 17 FAQ entries in schema — answers are too short to be useful or citable. |
| **Evidence** | Measured; site p25 is 441 words. |
| **Recommendation** | `contact`: add structure (response expectations, what to include, support scope, security-report channel). `help`: expand the 17 answers to genuinely usable length. |
| **Expected benefit** | Removes the two thinnest pages; makes `help` AI-citable (currently scored 4/10). |
| **Risk** | Low |
| **Effort** | Medium |
| **Requires code?** | **YES** — content files ×3 locales |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-08 — Investigate the `/en/help` FAQ schema entry not found in the rendered body

| Field | Value |
|---|---|
| **Category** | Structured data |
| **Priority** | **LOW** |
| **Problem** | `/en/help` declares 17 `FAQPage` entries; only 16 question strings were matched in the rendered body. Google requires FAQ content to be visible on-page. |
| **Evidence** | Automated match of schema `name` values against rendered text. **PARTIALLY VERIFIED** — may be a text-matching artefact rather than a real gap. |
| **Recommendation** | Confirm all 17 questions render. If one does not, either render it or remove it from the schema. |
| **Expected benefit** | Keeps FAQ markup compliant. |
| **Risk** | Very low |
| **Effort** | Trivial |
| **Requires code?** | Possibly |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-09 — Add `og:locale` to the 66 pages missing it

| Field | Value |
|---|---|
| **Category** | Technical SEO / social |
| **Priority** | **LOW** |
| **Problem** | `og:locale` present on homepages, `pdf-tools` and `/pdf/*`; absent on all product, solutions, docs, blog and legal pages. |
| **Evidence** | Measured: 66 of 108 pages missing. |
| **Recommendation** | Emit `og:locale` from the shared SEO helper so it applies uniformly. |
| **Expected benefit** | Consistent social metadata. Minor. |
| **Risk** | Low, but touches SEO metadata |
| **Effort** | Small |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-10 — Add `BreadcrumbList` to the three `/pdf-tools` hub pages

| Field | Value |
|---|---|
| **Category** | Structured data |
| **Priority** | **LOW** |
| **Problem** | 102 of 108 pages carry `BreadcrumbList`. The 6 without are the 3 homepages (correct) and the 3 `/pdf-tools` hubs (inconsistent). |
| **Evidence** | Measured. |
| **Recommendation** | Add breadcrumbs to `/pdf-tools` for consistency with every other non-home page. |
| **Expected benefit** | Consistency; possible breadcrumb display in SERP. |
| **Risk** | Low |
| **Effort** | Trivial |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-11 — Publish a "What is browser OCR?" pillar and a "browser OCR vs cloud OCR" comparison

| Field | Value |
|---|---|
| **Category** | Content / AI-GEO |
| **Priority** | **HIGH** |
| **Problem** | The site *performs* browser OCR but never *defines* it. No page answers "What is browser OCR?", "Can OCR run without uploading the document?", or "browser OCR vs cloud OCR". |
| **Evidence** | No such slug in the 36-slug inventory. AI Overviews on every brand query recommended competitors and never mentioned EasyInvoiceOCR. |
| **Recommendation** | Two pages: a definitional pillar, and an honest comparison that concedes cloud OCR's advantages (speed, accuracy on hard inputs, scale) as well as stating the local-processing advantage. |
| **Expected benefit** | Owns the category the product occupies; creates directly quotable definitional text. No AI-visibility outcome is claimed in advance. |
| **Risk** | Low, provided the comparison stays honest and avoids unsupported superiority claims |
| **Effort** | Medium–large (×3 locales) |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-12 — Add a Tesseract.js / WebAssembly architecture page

| Field | Value |
|---|---|
| **Category** | Content / entity graph |
| **Priority** | **MEDIUM** |
| **Problem** | "Tesseract.js" and "WebAssembly" are the weakest edges in the entity graph. The architecture rests on both; no on-site page asserts either as a topic. |
| **Evidence** | §12 of the audit. The vendored-models story exists only off-site, on a `noindex` Dev.to page. |
| **Recommendation** | An on-site engineering page covering the PDF-text-layer-first pipeline, Tesseract.js/WASM, why models are vendored, the 5-models + 2-combined-modes architecture, and the real trade-offs. Material already exists and is fact-checked. |
| **Expected benefit** | Binds two missing entity edges; recovers value currently trapped behind Dev.to's `noindex`. |
| **Risk** | Low |
| **Effort** | Medium |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-13 — Add outbound citations across blog posts

| Field | Value |
|---|---|
| **Category** | E-E-A-T / AI-GEO |
| **Priority** | **MEDIUM** |
| **Problem** | **Zero external outbound links across all 108 pages.** The site makes falsifiable technical claims and cites nothing. |
| **Evidence** | Measured across the full crawl. |
| **Recommendation** | Add genuine references where claims warrant them: Tesseract/tesseract.js, PDF.js, the GDPR articles referenced in the GDPR post, WebAssembly specs. Only real, load-bearing citations. |
| **Expected benefit** | Largest single available gain in AI citability; standard E-E-A-T signal. |
| **Risk** | Low |
| **Effort** | Small–medium |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-14 — Add a named author and `Person` schema

| Field | Value |
|---|---|
| **Category** | E-E-A-T / entity |
| **Priority** | **MEDIUM** |
| **Problem** | No page names a human author. No `Person` schema anywhere. Blog posts carrying genuine first-hand engineering experience are attributed to nobody. |
| **Evidence** | Schema census across 108 pages: `Organization`, `WebSite`, `WebApplication`, `FAQPage`, `BreadcrumbList`, `BlogPosting` — no `Person`. |
| **Recommendation** | Add an author entity with real credentials, linked from `BlogPosting.author` and `/about`. **Personal-disclosure decision — yours alone.** |
| **Expected benefit** | Creates a credibility entity; strengthens the experience/expertise dimensions. |
| **Risk** | Personal information exposure — deliberate decision required |
| **Effort** | Small |
| **Requires code?** | **YES** |
| **Requires manual action?** | **YES** (the disclosure decision) |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-15 — Add `Organization.sameAs` → GitHub

| Field | Value |
|---|---|
| **Category** | Structured data / entity |
| **Priority** | **LOW** |
| **Problem** | `Organization` schema is present on all 108 pages but omits `sameAs`. The GitHub repo already points home (`homepage` → `https://www.easyinvoiceocr.com`); the reverse edge is missing. |
| **Evidence** | Schema inspection; GitHub API metadata. |
| **Recommendation** | Add a single `sameAs` entry for the GitHub repository. **Only real profiles** — do not pad with placeholder social URLs. |
| **Expected benefit** | Closes a bidirectional entity edge cheaply. |
| **Risk** | Low. Note: `sameAs` was deliberately omitted in an earlier phase; this reverses that only if you now consider GitHub a public brand profile. |
| **Effort** | Trivial |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-16 — Improve `receipt-to-excel` for its own head term

| Field | Value |
|---|---|
| **Category** | On-page SEO |
| **Priority** | **MEDIUM** |
| **Problem** | `receipt to excel` is the site's highest-impression query (68 of 202) at average position **76.3** — page 8. The page exists and is decent (817/894/706 words). It is ranking badly, not missing. |
| **Evidence** | GSC top queries, Aug 21–28. |
| **Recommendation** | Deepen the page against the actual query: batch receipts, column mapping, the monthly workflow, exact export formats. Link it from `blog/receipts-to-spreadsheet-workflow` (see A-06). |
| **Expected benefit** | The clearest existing demand signal on the site. No ranking guarantee. |
| **Risk** | Low |
| **Effort** | Medium |
| **Requires code?** | **YES** |
| **Requires manual action?** | No |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## A-17 — Pursue one genuine independent mention

| Field | Value |
|---|---|
| **Category** | Authority |
| **Priority** | **HIGH** |
| **Problem** | Independent mentions: **0**. This is the only authority tier at zero, and the one that cannot be self-served. |
| **Evidence** | HN via Algolia: 0. GitHub repo search: own repo only. Brand SERP: own domain only. |
| **Recommendation** | Continue genuine technical participation (two tesseract.js contributions already stand). When the Dev.to article becomes indexable, consider Show HN. Editorial pitch to WASM Weekly / JavaScript Weekly. **No mass outreach, no backlink requests.** |
| **Expected benefit** | The single highest-value authority outcome available — and by definition it must be earned from someone else. |
| **Risk** | Reputational if pursued as promotion rather than contribution |
| **Effort** | Ongoing |
| **Requires code?** | No |
| **Requires manual action?** | **YES** (accounts / posting) |
| **Requires external account?** | **YES** |
| **Approval required** | **YES** |

---

## A-18 — GitHub LICENSE decision

| Field | Value |
|---|---|
| **Category** | Legal / informational |
| **Priority** | **INFORMATIONAL** |
| **Problem** | The public repository has no LICENSE file. Under default copyright nobody may use, copy, modify or redistribute the code — so the repo is public but not open source. |
| **Evidence** | GitHub API: `"license": null`; no LICENSE file in the working tree. |
| **Recommendation** | **Reporting only, as instructed.** This is a product/legal decision, not an SEO one. No licence added, repository not made private. |
| **Expected benefit** | n/a |
| **Risk** | n/a |
| **Effort** | n/a |
| **Requires code?** | No |
| **Requires manual action?** | **YES** |
| **Requires external account?** | No |
| **Approval required** | **YES** |

---

## Explicitly NOT recommended

- Building an OCR API page to capture the API queries in GSC — no API exists; `/solutions/developers` already answers this honestly.
- Adding `Review` or `AggregateRating` schema — there are no reviews.
- Touching `/pdf-tools` or `/pdf/*` privacy copy — "your file never leaves your device" is **verified true** there.
- Editing or republishing the Dev.to article to escape `noindex`; manufacturing Dev.to engagement to lift it.
- Removing any locale.
- Restructuring canonical, hreflang, sitemap or robots.txt — all measured clean.
- Mass directory submissions, purchased links, PBNs, AI-generated article volume, fake reviews or engagement of any kind.
