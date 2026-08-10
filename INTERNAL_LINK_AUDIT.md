# Internal link audit

Measured against the running dev server at `83dbe79`. **129 unique internal
links crawled, 0 broken.** No cross-locale link exists anywhere: every link
from a `/fr/*` page stays in `/fr/*`, and the same for `/ar/*`, enforced by
tests in `src/content/blog.test.ts`, `products.test.ts` and `resources.test.ts`.

---

## 1. Topic clusters

Each cluster names a pillar, the operational products beneath it, the audience
page, the supporting articles and the conversion CTA.

### Invoice OCR
- **Pillar:** `/{l}/invoice-ocr`
- **Products:** `pdf-invoice-parser`
- **Solution:** `solutions/accountants`
- **Articles:** `invoice-ocr-accuracy-guide`, `line-item-extraction-hard`, `multilingual-invoice-extraction`
- **Docs:** `documentation#accuracy-and-review`
- **CTA:** upload on the Invoice OCR page

### Receipt extraction
- **Pillar:** `/{l}/receipt-to-excel`
- **Solution:** `solutions/freelancers`
- **Articles:** `receipts-to-spreadsheet-workflow`, `gdpr-document-processing`
- **Docs:** `documentation#exports-and-integrations`
- **CTA:** upload on Receipt to Excel

### Invoice to Excel
- **Pillar:** `/{l}/invoice-ocr` → export section
- **Products:** `receipt-to-excel`, `image-to-excel`
- **Articles:** `invoice-ocr-accuracy-guide`
- **Docs:** `documentation#excel`

### Image to Excel
- **Pillar:** `/{l}/image-to-excel`
- **Solution:** `solutions/small-businesses`
- **Articles:** `line-item-extraction-hard`, `receipts-to-spreadsheet-workflow`

### PDF invoice parsing
- **Pillar:** `/{l}/pdf-invoice-parser`
- **Solution:** `solutions/accountants`
- **Articles:** `line-item-extraction-hard`, `invoice-ocr-accuracy-guide`

### PDF to Word · Image to Word · Image to PDF
- **Pillars:** the three converter pages
- **Docs:** `documentation#file-converters`
- These are conversion utilities rather than extraction; they link to
  documentation and to each other, and are reachable from the homepage cards.

### Multilingual OCR
- **Pillar:** `multilingual-invoice-extraction` (article)
- **Products:** `invoice-ocr`
- **Solution:** `solutions/accountants`
- **Docs:** `documentation#languages`
- The Arabic variant is the most valuable page in this cluster and previously
  served English prose; that is fixed.

### Accounting workflows
- **Pillar:** `solutions/accountants`
- **Products:** `invoice-ocr`, `pdf-invoice-parser`
- **Articles:** `invoice-ocr-accuracy-guide`, `line-item-extraction-hard`

### Browser-based processing and privacy
- **Pillar:** `/{l}/security`
- **Articles:** `gdpr-document-processing`
- **Docs:** `documentation#security-and-data`, `help` privacy category
- Every product page's security section links here.

---

## 2. Link depth from the homepage

| Depth | Pages |
|---|---|
| 1 click | 7 product pages, `blog`, `documentation`, `help`, `about`, `security`, `contact`, legal pages, pricing anchor |
| 2 clicks | 4 solution pages, 6 blog articles, `ocr-api` |
| 3 clicks | documentation chapters and help articles by anchor |

**Every indexable page is reachable within three clicks.** Products, resources,
company and legal links come from `src/config/nav.ts`, which also backs the
footer and the sitemap — so a page cannot exist in the sitemap and be
unreachable from navigation.

## 3. Orphan check

**No orphan indexable pages.** All 81 sitemap URLs are reachable from the
homepage within three clicks. Verified by crawling all 108 combinations and
collecting every `href`: 129 unique internal targets, all resolving.

The two `noindex` product pages (`ocr-api`, `api-reference`) are still linked
from navigation — deliberately. A page that vanishes is worse for someone who
bookmarked it than one that says "not yet".

## 4. Reciprocity

Blog → product was built in `f3d822f`; product → blog in `f00545f`. Both
directions now exist for every cluster.

| Direction | Where | Count |
|---|---|---|
| Blog → product | `relatedGuides` block on each article | 3 contextual links + 2 related articles |
| Product → blog | `relatedGuides` section on each product page | 2 articles + 1 solution + 2 sibling tools |
| Solution → product & blog | `productLinks` / `blogLinks` per solution | 3 + 2 |
| Docs/help → product | `relatedLinks` in the resources chrome | 4 |

## 5. Anchor quality

Anchor text is written per source page rather than reused, so the same
destination is reached through different wording depending on why the link
exists. `/{l}/documentation` is linked from five articles with five different
anchors; `/{l}/solutions/accountants` from three product pages with three.

No anchor is a bare URL, a bare product name repeated site-wide, or a
keyword-stuffed phrase. Each French and Arabic anchor is written independently
rather than translated from the English one.

## 6. Locale preservation

Enforced by test, not by convention:

- `blog.test.ts` — every article link starts `/{locale}/`
- `products.test.ts` — every product link, CTA and solution link stays in locale
- `resources.test.ts` — every `relatedLink` and CTA stays in locale
- 108-route audit — zero cross-locale `href` found in any served page

## 7. Links that must not exist

No internal link presents the OCR API or the API Reference as operational.
Links to `ocr-api` are labelled "coming soon" in all three locales
(`products.test.ts` asserts the marker per locale), and the developers solution
page opens by stating the API is not built.

## 8. Code changes made in this phase

**None.** The audit found no genuine internal-link gap: no orphan page, no
broken link, no missing reciprocal direction, no cross-locale link, no
artificial anchor. The reciprocal linking this phase was meant to add was
already delivered in `f3d822f` and `f00545f`, and adding more links now would
be link stuffing rather than an improvement.

This is recorded deliberately: the honest outcome of an audit is sometimes that
the thing already holds.
