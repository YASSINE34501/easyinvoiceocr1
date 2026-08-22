# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EasyInvoiceOCR** — a three-locale (en/fr/ar) invoice and receipt extraction site plus file converters, built on TanStack Start + React 19 + Supabase, deployed through Lovable. All recognition runs in the visitor's browser (Tesseract.js); the server owns only entitlement, quota and record-keeping.

The project is connected to [Lovable](https://lovable.dev) (see `AGENTS.md`): **never rewrite published history** — no force push, no rebase/amend/squash of pushed commits — and keep the connected branch in a working state, because commits sync back into the Lovable editor.

## Commands

```bash
npm run dev          # Dev server on http://localhost:8080 (strictPort). predev vendors Tesseract assets.
npm run typecheck    # tsc --noEmit — must pass before any commit
npm run lint         # ESLint (Prettier runs as an ESLint rule); `npm run lint -- --fix` to autofix
npm run test         # vitest run (27 test files)
npm run build        # Production build to .output/ (prebuild vendors Tesseract assets)
npm run format       # prettier --write .
```

Single test file / pattern:

```bash
npx vitest run src/lib/billing/gate.test.ts
```

```bash
npx vitest run -t "free allowance"
```

`scripts/vendor-tesseract.mjs` (run automatically by `predev`/`prebuild`) copies the worker + WASM core from `node_modules` and downloads the language models into `public/tesseract/` (~61 MB, ESLint-ignored). Recognition must not depend on a CDN at run time — a CDN failure used to wedge conversions with quota already reserved.

## Architecture

### Build system

- `vite.config.ts` imports `defineConfig` from **`@lovable.dev/vite-tanstack-config`**, not from `vite`. The preset already supplies TanStack devtools, `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, nitro (Cloudflare target), `VITE_*` injection, the `@/*` alias, React/TanStack dedupe and the error-logger plugins — **adding any of them manually breaks the app with duplicate plugins**. Port 8080 / `strictPort` comes from the preset; a `server.port` override is ignored.
- `src/server.ts` is the SSR entry (`tanstackStart.server.entry: "server"`): it wraps the real server entry to catch h3-swallowed 500s (`{"unhandled":true,...}` JSON bodies) and render a real error page.
- `src/start.ts` defines `createStart` — its existence opts out of Start's automatic CSRF middleware, so CSRF is re-added explicitly there alongside `attachSupabaseAuth` and an error middleware.
- `vitest.config.ts` is standalone (jsdom, `globals: false`, `@` alias) — unit tests must not load the Start/nitro plugin chain.

### Routing & locales

- File-based routes in `src/routes/`, flat with dots: `$locale.app.billing.tsx` → `/:locale/app/billing`. `routeTree.gen.ts` is generated — never hand-edit. `src/routes/README.md` documents the conventions and warns against Next.js/Remix habits.
- Locales: `en`, `fr` (LTR), `ar` (RTL). `src/routes/index.tsx` redirects bare `/` to the visitor's preferred locale. `useLocale()` for the locale, `useT()` for `t()`.
- Every page route is locale-prefixed. Products (8): `invoice-ocr`, `receipt-to-excel`, `pdf-invoice-parser`, `image-to-excel`, `pdf-to-word`, `image-to-word`, `image-to-pdf`, `ocr-api`. Plus `solutions/$slug` (accountants, small-businesses, freelancers, developers), `documentation`, `api-reference`, `help`, `blog[/$slug]`, `about`, `contact`, `security`, `terms`, `privacy`, `cookies`, the auth pages, `choose-plan`, and `app`, `app/settings`, `app/billing`, `app/admin`. Non-locale: `/sitemap.xml`, `POST /api/contact`, `POST /api/paypal/webhook`.
- `/:locale/app/*` is client-side protected only; unauthenticated visitors are redirected to `/login?redirect=…`.

### Registries — never hard-code a list

- `src/config/products.ts` — the product registry (slug, icon, kind, converter/workspace, minPlan, accepted MIME, nav/sitemap/ads flags, per-locale copy). Nav, homepage cards, footer, docs index and sitemap all derive from it.
- `src/content/products/{en,fr,ar}.ts` + `index.ts` — long-form per-locale product page content and the `live` / `coming-soon` availability registry. A missing locale is a type error, not an English fallback.
- `src/config/nav.ts` — nav/footer groups and `allPublicSlugs` (backs the broken-link scan test).
- `src/config/routing.ts` — `path(slug, locale)`, the only URL builder.
- `src/config/site.ts` — copy and FAQs only. Prices and limits live in the `subscription_plans` table, read via `getPublicPlans()`; a second copy of a price in source is how the two drift.
- `src/content/{solutions,resources,blog,home}` — per-locale page content, each with its own test file.

### SEO (`src/config/seo.ts`, `src/lib/seo/sitemap.ts`)

- `SITE_ORIGIN` is the constant `https://www.easyinvoiceocr.com`; canonicals always name it, even from a preview.
- Indexability is a separate idea and **fails closed**: `isIndexableDeployment()` is true only when `VITE_SITE_URL` equals `SITE_ORIGIN` exactly. Anywhere else every page renders `noindex, nofollow`.
- `NOINDEX_SLUGS` covers auth, `choose-plan`, `app/*` and `api-reference`. `ocr-api` is `coming-soon` in the product registry, and that flag alone drives both its noindex and its sitemap exclusion — there is no second list to keep in sync.
- `src/config/seo.test.ts` / `ssr-seo.test.ts` encode the technical-SEO contract (absolute canonicals, hreflang + x-default, robots.txt, manifest). `src/content/ai-claims.test.ts` fails if "AI-powered" returns to any marketing surface while Tesseract.js is the only engine.
- Root-level SEO markdown (`SEO_AUDIT.md`, `KEYWORD_MAP.md`, `CONTENT_PLAN.md`, `BLOG_*.md`, `INTERNAL_LINK_AUDIT.md`, `OFF_PAGE_SEO_PLAN.md`, `OCR_API_STATUS.md`) records measured state and owner actions. `OCR_API_STATUS.md` lists the conditions that must all hold before `ocr-api` may be marked live.

### Processing pipelines (browser-side)

- `src/lib/convert/` — converters: `pdf.ts` (text layer / needs-OCR detection), `ocr.ts` (Tesseract engine), `layout.ts` (positioned lines → blocks, direction detection), `pipelines.ts` (per-tool orchestration + progress stages), `docx.ts` / `imagePdf.ts` (writers), `validation.ts` (`TOOL_ACCEPT`, shared client/server file rules).
- `src/lib/extract/` — invoice/receipt extraction reusing the same readers: `pipeline.ts` → `parser.ts` → `normalize.ts` → `workbook.ts` / `exports.ts` (Excel/CSV/JSON). Both paths converge on the same positioned-line shape, so the parser is reader-agnostic. Max 30 pages, 120 s per page, abortable.
- Nothing is uploaded; a job row is still written server-side because quota decisions are never made in the browser.

### Billing & entitlements

- The model is **five successful conversions per account, shared across every product** (`FREE_CONVERSION_ALLOWANCE` in `src/lib/billing/gate.ts`) — not a 30-day trial. `resolveGate()` is pure (no db, no clock, no network) so the same function decides in production and in tests. A cancelled or suspended subscription resolves to `subscription_inactive` and must never fall back to the free five.
- Paid plans: Pro and Business, monthly or yearly, seeded in `supabase/migrations/20260807120000_five_conversion_trial_and_pricing.sql`; prices and page limits come from the database.
- `src/lib/billing/entitlements.server.ts` is the single authority (`resolveBillingState`, `reserveQuota`). Server-only — import it *inside* a handler with `await import(...)`, never at the top level of a `*.functions.ts`, or the service-role client ships to the browser.
- Quota is reserved before processing and released on failure; the idempotency key is generated once per attempt and reused on retry, so a retried conversion is charged once. `consume_quota()` serialises with `pg_advisory_xact_lock`.
- PayPal: `src/lib/paypal/*.server.ts`; webhooks verified server-side. Live checkout fails closed — it opens only when every PayPal env var is present *and* `PAYPAL_LIVE_CHECKOUT_ENABLED` is exactly `"true"`.

### Server functions & auth

- `src/lib/**/*.functions.ts` are bundled for the client: no secrets, lazy-import server-only modules inside handlers, return JSON-serializable values (ISO strings, not `Date`).
- `requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`, generated — do not edit) validates the Bearer token and provides `context.userId` and `context.supabase`. Admin handlers re-check the role server-side through `has_role`; reaching `/app/admin` in the browser grants nothing.
- Client `supabase` uses the publishable key under RLS; `serverDb()` uses the service-role key. Private tables enforce `auth.uid() = user_id`; unauthenticated queries return empty results, not 401.
- Never surface raw Supabase errors — map them through `src/lib/auth/errors.ts` to i18n keys. Duplicate-signup responses stay neutral (no account enumeration).

### Ads & analytics

- `src/config/ads.ts`: an ad renders only when the flag is on, the client id starts with `ca-pub-`, the build is production, the route is eligible, the visitor consented, and the account is not paying. Anything less renders nothing (a visible placeholder in dev).
- `src/lib/analytics/`: session-scoped and non-identifying (random per-tab token, no fingerprinting, no IP). Collection rules are pure and unit-tested in `collection.ts` / `events.ts`.

### i18n

- `src/i18n/index.ts` (~1.6k lines): `locales`, `localeDir`, `localeFromPathname`, `formatDate`, and three flat dictionaries. Keys are flat: `"auth.loginTitle"`, `"valid.emailRequired"`. RTL via Tailwind `rtl:` and `[dir="rtl"]`.
- Any user-visible string added to chrome, forms or validation must land in all three dictionaries — an untranslated label leaking onto `/fr` or `/ar` is a recurring class of bug here.

## Constraints & gotchas

- **TypeScript is maximally strict**: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature` (read env as `env["VITE_X"]`, not `env.VITE_X`), `noImplicitReturns`. Optional fields need an explicit `| undefined`.
- **`vite` is pinned to 8.2.0 and `rolldown` is held at 1.2.2 by an `overrides` entry** — do not widen either, and do not `npm update` them without rebuilding and fetching a route from the bundle. rolldown 1.2.5 splits the SSR build so a chunk holding the `__exportAll` runtime helper imports back from a chunk that consumes it; the ESM cycle leaves the helper undefined and every SSR request dies with `__exportAll is not a function` — HTTP 500 on every route, on every deploy target. `npm run dev` cannot catch this: dev serves unbundled ESM and never runs rolldown. Verify with `node -e` against `.output/server/index.mjs` after a build, not with the dev server.
- **`server-only` is banned** by an ESLint rule — name server modules `*.server.ts` instead.
- **Migrations are forward-only and additive** (`supabase/migrations/`, 7 files); write every statement to be safely re-runnable and drop nothing.
- Env: `.env` is git-ignored. Server names are `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`; PayPal uses `PAYPAL_ENV` (anything but `"live"` resolves to sandbox). `.env.example` documents every flag and its fail-closed behaviour.
- Prettier: 100 columns, double quotes, trailing commas.
- Comments explain *why* — constraints, past failures, fail-closed reasoning. Existing modules follow this closely; match that tone rather than annotating what the code does.
- Git: new commits rather than amends; trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Known limitations

- **The OCR API is not operational** — no endpoint, no keys, no plan entitlement. `planAllowsProduct` returns `false` for coming-soon products on every plan. Tests in `src/content/products/products.test.ts` fail if any endpoint path, `Authorization`, `Bearer`, `X-RateLimit` or `YOUR_API_KEY` string reappears in product copy.
- Email delivery (sign-up verification, password reset) needs SMTP configuration; those flows cannot be exercised locally.
- AdSense stays disabled until account approval; a certified consent platform is a prerequisite.
- PayPal live checkout needs live credentials, a verified domain and the registered webhook.
