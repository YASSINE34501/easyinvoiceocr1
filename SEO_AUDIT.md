# SEO audit

**Scope:** every public route of EasyInvoiceOCR in English, French and Arabic.
**Branch:** `feature/seo-icons-production` · **Audited at:** `83dbe79`
**Environment:** local dev server, `VITE_SITE_URL` deliberately unset.

This document records what was measured, not what is hoped for. Every figure
below came from a command that can be re-run. Nothing here asserts a ranking,
a traffic number or a Search Console result, because none of those can be
observed from a local tree.

---

## 1. Coverage

36 slugs × 3 locales = **108 route-locale combinations**.

| Group | Slugs | Indexable |
|---|---|---|
| Homepage | `/` | yes |
| Products (operational) | `invoice-ocr`, `receipt-to-excel`, `pdf-invoice-parser`, `image-to-excel`, `pdf-to-word`, `image-to-word`, `image-to-pdf` | yes |
| Solutions | `accountants`, `small-businesses`, `freelancers`, `developers` | yes |
| Resources | `documentation`, `help`, `blog` | yes |
| Blog articles | 6 slugs | yes |
| Company & legal | `about`, `contact`, `security`, `terms`, `privacy`, `cookies` | yes |
| Unavailable product | `ocr-api`, `api-reference` | **no** |
| Auth | `login`, `signup`, `forgot-password`, `reset-password`, `verify-email` | **no** |
| Private | `choose-plan`, `app` | **no** |

## 2. Method

The audit reads the **raw HTTP response**, never the hydrated DOM. That
distinction is the reason three defects survived earlier rounds: a browser
check of `document.documentElement.lang` passes even when the served HTML says
something different, because the client corrects it after hydration.

Per combination it checks status, `<html lang>` and `dir`, `<title>`, meta
description, H1 count, canonical, the hreflang set, robots, `og:description`,
JSON-LD parse validity and URL absoluteness, sitemap membership, cross-locale
links, and language leakage.

Language leakage is measured differently per locale, because a single method
cannot work for both: Arabic uses a non-Latin script, so any Latin run that is
not a brand or format is a leak; French shares the Latin alphabet with English,
so it is checked for English function words (`the`, `your`, `with`, `into`,
`built`, `every`…) that do not exist in French.

The allowlist contains only proper nouns and formats — `EasyInvoiceOCR`, `OCR`,
`PDF`, `Excel`, `CSV`, `JSON`, `Supabase`, `PostgreSQL`, `Tesseract`,
`WebAssembly`, `PayPal`, `CDN`, `PCI`, `DSS` — plus the words of the homepage
specimen invoice, which is rendered inside a `<figure>` labelled *Example /
Exemple / مثال*. Each was checked in context before being added. No common
English word is on it.

## 3. Result

```
108/108 passed
unique titles       en 36/36   fr 36/36   ar 36/36
unique descriptions en 36/36   fr 36/36   ar 36/36
internal links checked: 129, broken: 0
/en/does-not-exist -> 404
```

## 4. Defects found and fixed

Every one of these was a real bug, not a style preference.

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `<html lang="en">` hard-coded, no `dir`. Every crawler reading `/fr/*` and `/ar/*` was told the page was English LTR. | Raw HTTP showed `lang="en"` on all locales | Shell resolves both from router state → `176e3c7` |
| 2 | `terms`, `privacy`, `cookies` carried `{name:"robots",content:"index, follow"}` **after** `robotsMeta()`, so the literal won and the page advertised itself as indexable even on localhost | Raw meta showed `index, follow` | Literal removed → `176e3c7` |
| 3 | Same defect on 7 auth/app routes with `content:"noindex"` — no `nofollow`, so link equity still flowed out | Audit row `robots` mismatch | Replaced with `robotsMeta()` → `83dbe79` |
| 4 | `terms`, `privacy`, `cookies` had **no H1** — `Section title` renders `<h2>`, so the document opened at level two | H1 count 0 | `PageHero` added → `176e3c7` |
| 5 | Homepage body English on `/fr` and `/ar` | Raw HTTP body | Locale-keyed model → `2f64ac1` |
| 6 | "50+ languages" and a six-language strip, against **three** vendored models | `public/tesseract/lang/` holds `eng`, `fra`, `ara` only | Corrected → `87174bd`, `2f64ac1` |
| 7 | "Powerful API and SDKs" on the Developers card, for an API accepting no requests | No endpoint exists | Corrected → `2f64ac1` |
| 8 | "AI-powered" in five places, in three languages, while the engine is Tesseract.js and Gemini is disabled | `src/lib/extract/pipeline.ts` | Corrected → `0824046` |
| 9 | `High Accuracy` rendered as an English literal inside Arabic prose on `/ar/about` | Latin-script scan | Uses `{c.accuracy}` → `83dbe79` |
| 10 | Breadcrumb labels hard-coded English on 6 pages in all locales, while translated `link.*` keys already existed | Latin-script scan | Uses `t()` / `translate()` → `83dbe79` |
| 11 | Arabic `terms` and `privacy` meta descriptions ~45 characters | Length check | Rewritten → `83dbe79` |
| 12 | Homepage `FAQPage` emitted the English config list on **every** locale — structured data that did not match the page | Raw JSON-LD | Uses localized items + `inLanguage` → `2f64ac1` |

## 5. Technical results

| Check | Result | Evidence |
|---|---|---|
| Sitemap | 81 URLs, **0** non-www, **0** noindex routes leaked | `curl /sitemap.xml` |
| robots.txt | `Sitemap: https://www.easyinvoiceocr.com/sitemap.xml` — absolute | served file |
| Canonical | absolute and self-referential on all 81 indexable combinations | audit |
| Hreflang | `en`/`fr`/`ar`/`x-default`, reciprocal | audit |
| Noindex | `ocr-api`, `api-reference`, auth, `app`, `choose-plan` all `noindex, nofollow` | audit |
| 404 | genuine `404` status, not a soft 200 | `curl` |
| JSON-LD | every block parses; no relative URL in any | audit |
| Structured-data honesty | `FAQPage` only where an accordion renders the same questions; no `Review`, `AggregateRating` or fake `Offer` | source |
| Open Graph | `og:title`, `og:description`, `og:url`, `og:locale`, `og:image` per locale | audit |
| Social image | `/og/easyinvoiceocr-card.svg`, 1842 bytes, self-hosted | file |
| Manifest & icons | `site.webmanifest`, SVG icon + maskable variant, `theme-color` | build output |
| Cross-locale links | none | audit |

## 6. On-page results

Titles and meta descriptions are unique within every locale (36/36 each).
Exactly one H1 per indexable page. H2/H3 hierarchy verified on the homepage,
products, solutions, documentation, help and all blog articles.

No page carries a keyword-stuffed heading, hidden text, or a claim that the
code does not support. Where a claim could not be verified it was removed
rather than softened — see §4, rows 6–8.

## 7. Blog results

18 article-locale variants plus 3 index pages, all passing. Details in
`BLOG_AUDIT.md`; the short version is that all six articles carry complete
English, French and Arabic bodies, `BlogPosting` + `BreadcrumbList` JSON-LD
with absolute URLs, an `Organization` author (no invented person), and a CTA
pointing at an operational tool.

## 8. Performance — lab observations only

These are local observations. **No production Core Web Vitals are claimed**:
LCP, INP and CLS require field data from a deployed domain, which does not
exist yet.

| Observation | Detail |
|---|---|
| Tesseract assets | 62 MB vendored under `public/tesseract/`, `Disallow`ed in robots.txt. Loaded only when a conversion starts — not on any content page. |
| Language models | 3 files, gzipped, fetched on demand |
| Ad slots | reserve height up front (`min-h-[280px]` / `110px` / `600px`), so an empty slot causes no shift |
| Fonts | Google Fonts with `display=swap` and `preconnect` |
| Layout shift risk | no ad renders at all today; specimen invoice is static markup |
| Bundle risk | route-level code splitting via TanStack Start; converter libraries load per route |

## 9. What cannot be verified locally

| Item | Why |
|---|---|
| Apex → www 301 | `public/_redirects` declares it; only Cloudflare Pages with the domain attached can execute it |
| HTTPS enforcement | edge setting |
| `index, follow` actually served | requires `VITE_SITE_URL` set on production; locally everything is correctly `noindex, nofollow` |
| Real Core Web Vitals | needs field data |
| Search Console / Bing coverage | needs a verified property |

## 10. Verdict

**The code is locally ready for indexing.** All 108 combinations pass, no
internal link is broken, the sitemap and robots.txt are correct and absolute,
and no unverifiable claim remains in user-facing copy.

**The deployment is not yet indexable, by design.** `robotsMeta()` fails closed:
until `VITE_SITE_URL` is set to exactly `https://www.easyinvoiceocr.com` on the
production build, every page renders `noindex, nofollow`. That is the single
switch that turns indexing on, and it is deliberately not set here.

**The site is not ready for AdSense review** — see `§ AdSense` in
`OFF_PAGE_SEO_PLAN.md` for the owner blockers.
