# OCR API — status and re-indexing conditions

The OCR API is **not operational**. This file records what was changed to stop
the site claiming otherwise, and the conditions that must all be true before
`/{locale}/ocr-api` may be indexed again.

## Current state

| Property | Value |
|---|---|
| Endpoint | none — nothing accepts requests |
| Keys | none issued; no key management exists |
| Plan entitlement | none, on any plan |
| Page | reachable, HTTP **200**, in EN/FR/AR |
| Indexing | `noindex, nofollow` on all three locales |
| Sitemap | excluded in all three locales |
| Redirect | none — the page is not redirected and does not fake a 404 |

## What was wrong, and what changed

Four separate places told a visitor the API was available or purchasable.

1. **`src/config/site.ts`** answered *"Is an API available?"* with *"API access
   is part of the Business plan"*. It is not part of any plan and is not
   billed. Corrected.
2. **`planAllowsProduct("business", "ocr-api")` returned `true`.** The
   application itself believed a paying Business customer had API access that
   does not exist. `planAllowsProduct` now returns `false` for any coming-soon
   product regardless of plan, and the test that asserted the old behaviour was
   rewritten.
3. **The product page rendered an `ApiExtras` block** containing an
   `Authorization: Bearer YOUR_API_KEY` header, endpoint paths, request and
   response examples and rate-limit headers — documentation for something
   callable. It was also English-only, so it leaked untranslated content onto
   `/fr/ocr-api` and `/ar/ocr-api`. Removed.
4. **`src/content/resources.ts`** described the REST API as *"documented and
   stable"*. Corrected to say plainly that there is no working API.

The product registry now carries `availability: "coming-soon"`, and both the
`noindex` directive and the sitemap exclusion are derived from it. There is no
second list to keep in sync: mark the product `live` and it becomes indexable
everywhere at once.

Tests enforce this in `src/content/products/products.test.ts`:

- registered as coming-soon, and the only such product
- says it accepts no requests, in each of the three locales
- denies plan inclusion, in each of the three locales
- promises no availability date
- contains no endpoint path, `Authorization`, `Bearer`, `X-RateLimit` or
  `YOUR_API_KEY` string in any locale
- excluded from the sitemap in all three locales, while every live product
  remains present
- the site-wide FAQ no longer says "part of the Business plan"

## Conditions for re-indexing

Every one of these must hold. Meeting some of them is not partial progress —
an API that authenticates but has no deletion endpoint is still not something
to advertise.

1. **The endpoints exist and respond in production.** Submit, status, retrieve,
   list and delete all work against the live host, not a branch.
2. **Authentication works end to end.** A key can be created, used and revoked
   by a real account holder without manual intervention.
3. **The error contract is real.** A stable machine-readable envelope is
   returned for at least: unsupported media type, oversized file, encrypted
   PDF, unknown document id, revoked key, and rate-limit exceeded.
4. **Idempotency is implemented.** A repeated submission with the same
   idempotency key returns the original document rather than creating a second.
5. **Rate limits are enforced and reported**, with the headers the page
   describes actually present on responses.
6. **The entitlement question is answered.** Either API access is genuinely
   included in a named plan — in which case the plan pages, `site.ts` FAQ and
   `minPlan` must all say the same thing — or it is not, and the page continues
   to say so.
7. **The page content is rewritten** from planned-tense to present-tense in all
   three locales, and re-verified for language leakage.
8. **`availability` is flipped to `"live"`** in `src/content/products/index.ts`,
   which is the single switch that restores indexing and the sitemap entries.
9. **The tests above are updated in the same change**, so the honesty
   assertions track the new reality instead of being deleted.

Until all nine hold, the page stays reachable and unindexed. That combination
is deliberate: someone who already has the link still gets a straight answer,
and nobody arrives from a search expecting a product that is not there.
