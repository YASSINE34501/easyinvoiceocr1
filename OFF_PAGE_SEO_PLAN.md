# Off-page SEO plan — 90 days

Off-page SEO cannot be done from a source tree. **Everything in this document
is a future owner action.** Nothing here has been performed, and no backlink,
directory listing, mention, ranking or Search Console figure currently exists.

If a line in this plan ever gets marked done, it should be marked done with a
URL and a date, not from memory.

---

## Hard rules

- No purchased links, link exchanges, private blog networks or paid guest
  posts presented as editorial.
- No fabricated reviews, profiles or testimonials.
- No outreach sent without the owner's explicit approval of the message and
  the recipient list.
- No account registered on the owner's behalf.
- No claim of a ranking, a traffic level or an acquired link without a
  screenshot or a live URL.

---

## Prerequisites — must happen before anything else

These block the entire plan. Submitting a site that is `noindex` wastes the
submission.

| # | Action | Owner | Why it blocks |
|---|---|---|---|
| 1 | Attach `easyinvoiceocr.com` and `www` to the Cloudflare Pages project | Owner | `_redirects` cannot execute until the apex resolves |
| 2 | Set `VITE_SITE_URL=https://www.easyinvoiceocr.com` on the production build | Owner | Until then every page is `noindex, nofollow` by design |
| 3 | Confirm HTTPS is enforced | Owner | Edge setting |
| 4 | Verify the apex → www 301 returns 301, not 302 | Owner | A 302 leaves both hosts indexable |

## Phase 1 — Days 1–14: make the site discoverable

| Action | Target | Measurement | Risk |
|---|---|---|---|
| Verify property in Google Search Console (DNS TXT preferred) | `www.easyinvoiceocr.com` | Property shows Verified | Verifying the wrong host variant |
| Submit `https://www.easyinvoiceocr.com/sitemap.xml` | GSC → Sitemaps | Discovered URL count approaches 81 | Submitting before `VITE_SITE_URL` is set → all pages excluded as noindex |
| Verify in Bing Webmaster Tools; import from GSC | Bing | Property verified | — |
| Submit sitemap to Bing | Bing | Sitemap accepted | — |
| Check GSC Pages report for "Excluded by noindex" | GSC | Only the 9 intended noindex slugs appear | Auth/app pages appearing as errors rather than intentional |
| Confirm hreflang has no "no return tag" errors | GSC → International Targeting | Zero errors | — |
| Request indexing for the homepage and the 7 product pages in all 3 locales | GSC URL Inspection | Submitted | Do not mass-request; it does not speed anything up |

## Phase 2 — Days 15–45: legitimate listings

Every one of these is a real directory where a genuine product belongs. None
is a link farm. Each requires a real account created by the owner.

| Directory | Category | Notes |
|---|---|---|
| Product Hunt | SaaS launch | One launch only, when the product is genuinely ready |
| AlternativeTo | Software alternatives | Listing must describe real capability — three OCR languages, no API |
| Capterra / GetApp / Software Advice | Accounting software | Vendor profile; do not solicit incentivised reviews |
| G2 | Business software | Same caveat on reviews |
| SaaSHub, Slant | SaaS directories | Free listings |
| Crunchbase | Company record | Only if a real company entity exists |
| OpenAlternative / awesome-selfhosted-style lists | Browser-local tooling | The in-browser processing angle is genuinely unusual and is the strongest hook |

**Do not** submit to generic "500 free directory" lists. They are the exact
pattern link-spam detection is built for.

## Phase 3 — Days 30–60: partnerships and integrations

| Opportunity | Why it fits | Owner action |
|---|---|---|
| Accounting software communities (Wave, Zoho Books, Pennylane, QuickBooks forums) | Users regularly ask how to get invoice data into a sheet | Answer real questions; link only where it genuinely answers |
| Bookkeeper and accountant associations, FR and MENA | The Arabic and French localisation is a real differentiator | Introduce the tool, offer the invoice-field checklist |
| Freelancer communities | Receipt workflow is a recurring pain | Share the monthly routine article |
| Arabic-language dev and finance communities | Almost nothing handles RTL invoices well | Highest-signal audience for `multilingual-invoice-extraction` |

Rule: participate as a person, disclose affiliation, and link only when the
link answers the question asked.

## Phase 4 — Days 45–90: linkable assets and outreach

Assets come from `CONTENT_PLAN.md`. Outreach happens only after the asset
exists and is genuinely useful.

| Asset | Outreach target | Angle |
|---|---|---|
| Invoice-field checklist | Bookkeeping blogs, accounting newsletters | A reusable reference, free, no signup |
| "Questions to ask a document processor" | Privacy and compliance writers | Extends an existing article into a standalone tool |
| Scan-quality guide | Small-business and freelance publications | Practical, image-led |
| Arabic invoice OCR explainer | MENA tech and finance press | Genuinely under-served topic |

**Guest content:** pitch one article per publication, on a topic that publication
already covers, with the author being the owner. Do not spin variants of the
same piece across sites.

### Outreach template — English

> Subject: A free invoice-field checklist for your readers
>
> Hello [name],
>
> I read your piece on [specific article]. I build EasyInvoiceOCR, a browser
> tool that extracts invoice and receipt data without uploading the document.
>
> We published a printable checklist of the fields worth capturing from a
> supplier invoice — no signup, no pitch: [URL].
>
> If it is useful to your readers, feel free to use it. If not, no reply needed.
>
> [name]

The French and Arabic variants should be written natively rather than
translated, matching how the site content is handled.

## Monitoring

| What | Tool | Cadence | Notes |
|---|---|---|---|
| Indexed pages, impressions, clicks, average position | Google Search Console | Weekly | The only authoritative source; do not estimate |
| Crawl errors, coverage | GSC + Bing | Weekly | |
| Backlinks | GSC → Links (free); Ahrefs/Semrush if licensed | Monthly | Record every acquired link with URL and date |
| Toxic links | GSC → Links | Monthly | Disavow only for a manual action or clear negative SEO — the file is a last resort, not routine hygiene |
| Brand mentions | Google Alerts, Mention | Weekly | Unlinked mentions are the easiest link to earn |
| Core Web Vitals field data | GSC → Core Web Vitals, CrUX | Monthly | Field data only appears after real traffic |

## Metrics to record, not to promise

Track: indexed pages, impressions, clicks, average position, referring domains,
brand mentions, organic signups, organic conversions.

Do **not** set a target for any of them in this document. Targets set before a
single page is indexed are guesses, and a guess written down becomes a claim.

---

# AdSense status

The implementation is fail-closed and **must not be enabled** from here.

## Verified in the current tree

| Check | State | Evidence |
|---|---|---|
| Master flag | `VITE_ADSENSE_ENABLED` not `true` | `.env` |
| Publisher ID | none configured | `adsConfig.clientId` empty |
| Slot IDs | none configured | `slotId()` returns null |
| `ads.txt` seller lines | **0** | `grep -cE '^google\.com,' public/ads.txt` |
| Script requests | none | `curl /en \| grep googlesyndication` → 0 |
| Rendered slots | none | browser: `adScript false`, `adSlots 0` |
| Paid users | never shown ads | `adsAllowed` from `useBilling()` |
| Denied routes | auth, app, admin, billing, checkout, contact, legal, `ocr-api`, `api-reference`, 404 | `DENIED_PREFIXES` + coming-soon filter |
| Consent refusal | blocks loading outright | explicit refusal is final in `AdSlot` |

The AdSense loader URL does appear as a string in the built client bundle. It
sits inside `ensureAdSenseScript`, which is only reached when
`adsRuntimeReady()` is true — currently impossible. Inert code, not a request.

## Owner blockers before review

| # | Blocker | Why it blocks |
|---|---|---|
| 1 | Approved AdSense account | No publisher ID exists without one |
| 2 | Google-certified CMP | Required for EEA, UK and Swiss traffic. The current banner is a custom implementation and is **not** certified. |
| 3 | Real publisher ID | `VITE_ADSENSE_CLIENT_ID`, must start `ca-pub-` |
| 4 | Real slot IDs | One per placement |
| 5 | Exact `ads.txt` seller line | Copy verbatim from AdSense → Sites → Ads.txt. Never retype, never reuse another site's id. |
| 6 | Production consent testing | Accept, reject, withdraw and persistence, on the deployed domain |

## Verdict

**Not ready for AdSense review.** Blockers 1–6 are all outstanding, and the CMP
question (2) is the substantive one — the rest are configuration. The site
should not be submitted until a certified CMP is in place and the content
questions in `SEO_AUDIT.md` are settled on the deployed domain.
