# Blog audit

State of the blog before and after Step 2 of the SEO mission, and the evidence
behind every claim. Verified against a running server on
`feature/seo-icons-production`.

## 1. Content inventory — before

Six articles existed, all defined once in `src/content/resources.ts` with a
single `title`, `description`, `category` and `body`. The routes were
locale-prefixed, so `/fr/blog/…` and `/ar/blog/…` resolved and returned HTTP
200 — but served the **English body inside a translated page shell**.

| Article | EN | FR | AR | Search intent | Target product | Problem before |
|---|---|---|---|---|---|---|
| `invoice-ocr-accuracy-guide` | ✅ | ❌ | ❌ | Informational — "how accurate is invoice OCR" | Invoice OCR | English body on FR/AR URLs |
| `receipts-to-spreadsheet-workflow` | ✅ | ❌ | ❌ | How-to — "receipts to Excel workflow" | Receipt to Excel | English body on FR/AR URLs |
| `multilingual-invoice-extraction` | ✅ | ❌ | ❌ | Informational — "Arabic/French invoice OCR" | Invoice OCR | English body on FR/AR URLs; the article is *about* Arabic yet had no Arabic version |
| `gdpr-document-processing` | ✅ | ❌ | ❌ | Commercial investigation — "is OCR GDPR compliant" | Invoice OCR / Security | English body on FR/AR URLs |
| `line-item-extraction-hard` | ✅ | ❌ | ❌ | Informational — "extract invoice line items" | PDF invoice parser | English body on FR/AR URLs |
| `choosing-ocr-api` | ✅ | ❌ | ❌ | Commercial investigation — "best OCR API" | OCR API | English body on FR/AR URLs; **implied a working API** |

No article was duplicated, thin or a placeholder. All six are genuine and were
worth keeping, so none was deleted and **no slug changed**.

## 2. What changed

`src/content/blog.ts` replaces the blog half of `resources.ts`. `BlogPost` now
holds a `content: Record<Locale, BlogLocaleContent>`, where each locale carries
its own title, description, H1, category, standfirst, body, image alt text,
internal links and CTA.

French and Arabic were written for their own readers rather than translated
sentence by sentence — headings and emphasis differ where the language does —
while every technical claim is identical across the three, because an article
that says something different about the product in one language is a bug.

### Editorial constraints honoured

- **No invented facts.** No statistic, customer, testimonial, research finding,
  integration or capability was added. Where a number would have been
  persuasive but is not measured, there is no number.
- **No named author.** `EasyInvoiceOCR` is credited as an `Organization` in the
  visible byline and in `BlogPosting.author`.
- **The OCR API is labelled Coming Soon.** `choosing-ocr-api` states in all
  three locales that the API "is not yet available… does not currently accept
  requests", and that the article is not a pitch for it. A test asserts the
  marker exists per locale (`قريبًا`, `prochainement`, `coming soon`).

### Two pre-existing bugs found and fixed in passing

1. **`Skip to content` was hard-coded English** in `PageLayout.tsx`, even though
   the `nav.skip` key was already translated in all three dictionaries. Every
   French and Arabic page shipped one untranslated accessibility string. Now
   uses `t("nav.skip")`, and `focus:start-4` instead of `focus:left-4` so the
   focus panel appears on the correct side in Arabic.
2. **The `rtl:` Tailwind variant does not generate** in this setup —
   `rtl:rotate-180` produced no CSS rule (verified by inspecting
   `document.styleSheets`). The directional arrow now swaps component
   (`ArrowLeft` in RTL) rather than relying on a CSS mirror. Worth knowing
   before Step 4, where more directional icons are in scope.

## 3. Route verification

All 21 blog URLs, against the dev server.

```
6 articles × 3 locales   → 200
/en /fr /ar blog index   → 200
/{locale}/blog/does-not-exist → 404   (real status, not a soft 404)
```

## 4. Per-article results

Automated audit of the served HTML — status, canonical, hreflang set, H1 count,
JSON-LD validity and absolute URLs, and a Latin-script scan of the Arabic body.

| Slug | Locale | Status | Desc chars | Canonical | Hreflang | H1 | JSON-LD | Body language | Result |
|---|---|---|---|---|---|---|---|---|---|
| invoice-ocr-accuracy-guide | en | 200 | 170 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| invoice-ocr-accuracy-guide | fr | 200 | 136 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| invoice-ocr-accuracy-guide | ar | 200 | 158 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| receipts-to-spreadsheet-workflow | en | 200 | 140 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| receipts-to-spreadsheet-workflow | fr | 200 | 170 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| receipts-to-spreadsheet-workflow | ar | 200 | 120 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| multilingual-invoice-extraction | en | 200 | 153 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| multilingual-invoice-extraction | fr | 200 | 189 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| multilingual-invoice-extraction | ar | 200 | 155 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| gdpr-document-processing | en | 200 | 158 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| gdpr-document-processing | fr | 200 | 195 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| gdpr-document-processing | ar | 200 | 130 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| line-item-extraction-hard | en | 200 | 178 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| line-item-extraction-hard | fr | 200 | 158 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| line-item-extraction-hard | ar | 200 | 174 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| choosing-ocr-api | en | 200 | 160 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| choosing-ocr-api | fr | 200 | 191 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |
| choosing-ocr-api | ar | 200 | 141 | ok | en/fr/ar/x-default | 1 | BlogPosting + BreadcrumbList | clean | PASS |

**18/18 pass.** Titles unique within each locale: 6/6 in en, fr and ar.

Some French descriptions sit slightly above the ~160 characters Google
typically renders. French is a longer language and a truncated description is
not an error; the two worst offenders were shortened, the rest were left
readable rather than clipped to a character budget.

## 5. Structured data

Each article emits two blocks, both validated by `JSON.parse` on the served
HTML and checked for relative URLs:

- **BlogPosting** — `headline` matches the visible H1 (not the longer SEO
  title), `inLanguage` set per locale, `datePublished` / `dateModified` in ISO
  form, `mainEntityOfPage` and `url` absolute, `author` and `publisher` both
  `Organization`.
- **BreadcrumbList** — three absolute items: locale home → blog → article.

No `FAQPage` is emitted on articles, because no article renders a visible FAQ.
No `Review`, `Rating` or `AggregateRating` appears anywhere.

## 6. Arabic RTL and mobile

Checked on `/ar/blog/choosing-ocr-api` and `/ar/blog/gdpr-document-processing`:

| Check | Result |
|---|---|
| `dir` / `lang` | `rtl` / `ar` |
| Horizontal overflow, desktop | none — scrollWidth = clientWidth |
| Horizontal overflow, mobile 375px | none — 375 = 375, zero overflowing elements |
| Directional arrow | renders `lucide-arrow-left` in RTL |
| Skip link | `تخطٍ إلى المحتوى` |
| Stray Latin words in body | none beyond brand and format names |

## 7. Sitemap

`blogSlugs` feeds `sitemapEntries()`, so all six articles appear in all three
locales — 18 new URLs, taking the sitemap from 69 to 87 `<loc>` entries, each
with the full `en / fr / ar / x-default` alternate set.

There is no draft state in the model. An article is added to `blogPosts` only
when it is complete in all three languages, so nothing half-written can reach
the sitemap.

## 8. Test coverage

`src/content/blog.test.ts` — 138 tests, including:

- every article complete in all three locales (fields, body length, per-block prose)
- FR and AR bodies, headings, descriptions and categories differ from English
- **no stray Latin words in any Arabic article** beyond an explicit allowlist
- titles and descriptions unique within and across locales
- the API article says "coming soon" in each locale and states it is not operational
- related slugs resolve, are never self-referential, and number at least two
- dates are valid ISO, `updated` never precedes `date`
- every article present in the sitemap in every locale

The body-length assertion is locale-aware: Arabic carries articles and
prepositions as clitics, so equivalent prose runs roughly 15% shorter in words
than English. A single threshold would either pass English stubs or fail
complete Arabic articles.

## 9. Not done in this step

- Localised slugs. The six English slugs are kept in all three locales. They may
  already be linked or indexed, and a cosmetic rename would cost real links for
  no measurable gain. If localised slugs are wanted later, they need a slug map
  plus 301s from the current URLs.
- Article images. `imageAlt` is written and localised for all eighteen
  variants, but no article artwork exists yet, so nothing renders it. The alt
  text is ready for when it does.
- Product page localisation. `/ar/invoice-ocr` still serves English copy — the
  product pages are English-only in `src/content/products.ts`. That is Step 3.
