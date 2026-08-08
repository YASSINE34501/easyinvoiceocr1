# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EasyInvoiceOCR** is a multi-locale invoice/receipt extraction and document conversion platform. It provides real-time client-side document processing (PDF to Word, Image to Word, Image to PDF) and integrates with Supabase for authentication, billing, and data storage. The codebase is undergoing a phased launch toward production.

**Current Phase:** Phase 3 (Billing & Subscriptions) — database verification pending owner action.

## Common Commands

### Development
```bash
npm run dev                  # Start dev server at http://localhost:8080 (strictPort — no fallback)
npm run typecheck           # TypeScript strict mode check (must pass before builds)
npm run lint                # ESLint + Prettier check
npm run lint -- --fix       # Auto-fix lint/format issues
npm run test                # Run all tests once (Vitest)
npm run test:watch          # Run tests in watch mode
npm run format              # Prettier format all files
npm run build               # Production build (outputs to .output/)
npm run preview             # Preview production build
```

### Testing Single Files
```bash
npx vitest run src/lib/billing/billing.test.ts         # Run specific test file
npx vitest run -t "pattern"                            # Run tests matching pattern
```

## Architecture & Key Patterns

### Build System
- `vite.config.ts` imports `defineConfig` from **`@lovable.dev/vite-tanstack-config`**, not from `vite`. The preset already supplies TanStack devtools (dev-only), `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, nitro (build-only, Cloudflare default target), `VITE_*` env injection, the `@/*` alias, React/TanStack dedupe, and error-logger plugins — **adding any of these manually breaks the app with duplicate plugins**
- The preset pins the dev server to port 8080 with `strictPort: true`; a `server.port` override is warned about and then ignored
- `tanstackStart.server.entry` is redirected to `src/server.ts` (an SSR error wrapper); nitro builds from that entry
- `.claude/launch.json` declares the `dev` configuration used by the preview tooling — same `npm run dev`, port 8080

### File Structure
- **`src/routes/`** — File-based routing (TanStack Start). Routes are `$locale.page.tsx` (e.g. `$locale.about.tsx` → `/:locale/about`); dots nest, so `$locale.app.billing.tsx` → `/:locale/app/billing`
- **`src/config/`** — Single sources of truth: `products.ts` (product registry), `nav.ts` (every nav/footer/sitemap link), `routing.ts` (locale-prefixed URL builder)
- **`src/lib/`** — Shared server/client utilities, split by domain (auth, billing, convert, account)
- **`src/components/`** — React components (split by domain: site, billing, ui, etc.)
- **`src/auth/`** — AuthProvider, session management (client-side only)
- **`src/billing/`** — Subscription/trial/entitlements logic
- **`src/integrations/supabase/`** — Supabase client & auth middleware
- **`supabase/migrations/`** — Database schema & seed data (3 files, additive only)

### Routing & Locales
- Three locales: `en` (LTR), `fr` (LTR), `ar` (RTL)
- Routes are locale-prefixed: `/en/pdf-to-word`, `/fr/about`, `/ar/app/settings`
- `src/routes/index.tsx` catches bare `/` and redirects to the visitor's preferred locale (`navigator.languages`, falling back to `en`)
- Use `useLocale()` hook to get current locale; `useT()` to get i18n function
- Protected routes: `/app/*` redirects unauthenticated users to `/login?redirect=/app/...`

### Route Inventory
Every page route is locale-prefixed (`/:locale/<slug>`). Slugs below are the `<slug>` portion.

- **Home** — `/:locale` itself (`$locale.index.tsx`); `$locale.tsx` is its layout, `$locale.app.tsx` the layout for the protected area
- **Products (8)** — `invoice-ocr`, `receipt-to-excel`, `pdf-invoice-parser`, `image-to-excel`, `pdf-to-word`, `image-to-word`, `image-to-pdf`, `ocr-api`
- **Solutions** — `solutions/$slug`, four slugs registered in `nav.ts`: accountants, small-businesses, freelancers, developers
- **Resources** — `documentation`, `api-reference`, `help`, `blog` (index) and `blog/$slug`
- **Company** — `about`, `contact`, `security`
- **Legal** — `terms`, `privacy`, `cookies`
- **Auth** — `login`, `signup`, `forgot-password`, `reset-password`, `verify-email`
- **Billing** — `choose-plan`
- **Protected (`app/*`)** — `app` (index), `app/settings`, `app/billing`, `app/admin`
- **Non-locale** — `/sitemap.xml`, `POST /api/contact`, `POST /api/paypal/webhook`

Products, solutions, resources, company and legal links are all *derived* from `src/config/products.ts` and `src/config/nav.ts` — header, mobile menu, footer and `sitemap.xml` read from those registries, so adding a product or link there propagates everywhere. Never hard-code a link list. `allPublicSlugs` in `nav.ts` backs the broken-link scan test; auth/app/billing routes are deliberately excluded from the sitemap.

`src/routes/README.md` documents the TanStack file-naming conventions (dynamic `$id`, optional `{-$param}`, splat `$.tsx`, `__root.tsx`) and warns against Next.js/Remix conventions. `routeTree.gen.ts` is generated — never hand-edit.

### Authentication (Supabase)
- **Client:** `supabase` (public key, RLS enforced)
- **Server:** `supabaseAdmin` (service role, bypasses RLS)
- **Session:** Stored in localStorage, persisted across tabs via `onAuthStateChange` listener
- **Error Mapping:** `src/lib/auth/errors.ts` maps Supabase errors to localized message keys (prevents leaking raw API messages)
- **RLS:** All private tables have `auth.uid() = user_id` or `auth.uid() = id` policies
- **Email Verification:** Required before login; verification link expires (Supabase-managed)

### Validation & Error Messages
- All forms use **Zod** with localized error messages from i18n
- Errors are rendered immediately on form blur/submit; server errors shown as alerts
- Never show raw Supabase error messages to users; use centralized error mapping

### Subscriptions & Billing
- **Plans:** Trial (30 days, 100 pages/mo, free), Pro ($14/mo, 500 pages/mo), Business ($49/mo, 5000 pages/mo)
- **Quota Enforcement:** Atomic via `pg_advisory_xact_lock` in `consume_quota()` function (prevents concurrent quota overshooting)
- **Trial:** One per account, enforced by PRIMARY KEY on `trial_claims.user_id`
- **Payment:** PayPal Subscriptions API; webhooks signed and verified server-side
- **Entitlements:** Resolved server-side via `resolveBillingState()`, never trusted from client

### Client-Side Processing
- **Real Converters:** PDF to Word, Image to Word, Image to PDF (use pdf-lib, docx, html2canvas)
- **Demo Converters:** Invoice OCR, Receipt to Excel, PDF Invoice Parser (placeholder UI, no real processing)
- **OCR Engine:** Tesseract.js (browser-based, no file upload required)

### Server Functions
- File: `src/lib/*.functions.ts` (bundled for client, lazy-import server-only modules inside handlers)
- Authentication: Use `requireSupabaseAuth` middleware to extract `context.userId`
- No secrets in these files — all sensitive operations in server-only modules
- Return types must be serializable (no Date objects; use ISO strings)

### i18n
- Dictionary: `src/i18n/index.ts` (3 objects: `en`, `fr`, `ar`)
- Message keys are flat (no nesting): `"auth.loginTitle"`, `"valid.emailRequired"`
- Use `useT()` to get `t()` function in components
- RTL support: Tailwind `rtl:` prefix; CSS `[dir="rtl"]` selector

## Important Constraints & Gotchas

### TypeScript
- **Strict Mode:** `exactOptionalPropertyTypes` enabled; optional fields must be `Type | undefined`
- **Auth Error Type:** Must explicitly union properties with `undefined` (not just optional)

### Supabase
- **Published Key:** Stored in `.env` (already git-ignored, public by design)
- **Service Role Key:** Never commit; set as deployment env var only
- **Email Delivery:** Blocked locally without SMTP configuration; requires SendGrid setup for production
- **RLS:** Always on; anonymous users get empty results (not 401) on private tables

### Builds & Tests
- `npm run typecheck` must pass before any commit/push
- `npm run lint` runs Prettier + ESLint; auto-fix with `--fix` if it fails
- All tests must pass: `npm run test`
- Production build: `npm run build` (outputs optimized bundle to `.output/`)

### Protected Routes
- Routes under `/:locale/app/*` require authentication
- Client-side only: no server-side auth check
- Unauthenticated users redirected to `/login?redirect=/original/path`

## Current Project State

### Phase 1: Public Routes ✅ COMPLETE
- ✅ All 6 public pages (about, contact, security, terms, privacy, cookies) created in en/fr/ar
- ✅ Contact form submits to `contact_messages` table (API: POST `/api/contact`)
- ✅ Full SEO (title, description, canonical, hreflang, structured data)

### Phase 2: Authentication ⚠️ CONDITIONAL PASS
- ✅ Code verified: logout, session persistence, profile updates, account deletion, protected routes, RLS
- ⛔ Email-dependent flows blocked by SMTP: sign-up verification, password reset
- **Blockers:** Real email delivery (SendGrid), verification-link redirect, password-reset flow end-to-end

### Phase 3: Billing & Subscriptions ⛔ BLOCKED (Awaiting Owner Action)
- ✅ Code verified: database schema, RLS policies, quota functions, seed data
- ⛔ Database verification: **Requires authorized Supabase credentials** to verify tables exist and functions work
- **Owner Action Required:** Query Supabase to confirm schema; see Phase 3 report for SQL queries

## Pre-Production Blockers (Must Complete Before Launch)

1. **Email Delivery (SMTP):** Configure SendGrid; test sign-up verification and password reset flows end-to-end
2. **Verification Link Redirect:** Test that email links redirect to deployed domain and process correctly
3. **Password Reset Expiration:** Verify links expire correctly and old links fail gracefully
4. **Account Deletion Cleanup:** Verify all user data cascades delete (documents, profiles, subscriptions, usage records)
5. **Database Verification:** Confirm all tables, functions, indexes, and constraints exist in connected Supabase

## Environment Setup

### Required Env Vars (Already Configured)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase public key
- `SUPABASE_URL` — Same as above (server-side)
- `SUPABASE_PUBLISHABLE_KEY` — Same as above (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Secret key (deployment only, never commit)

### Optional Env Vars (Not Yet Configured)
- `PAYPAL_ENVIRONMENT` — "sandbox" (default) or "live"
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` — PayPal credentials
- `VITE_ADSENSE_ENABLED` — "false" (default, until approval)
- `VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_SLOT_*` — AdSense slots
- `VITE_TESSERACT_*` — Self-hosted OCR assets (uses CDN by default)

## Known Limitations & TODOs

1. **OCR Providers:** Invoice OCR, Receipt to Excel, PDF Invoice Parser are demo placeholders
2. **Authentication:** Email verification and password recovery blocked locally (SMTP required)
3. **Billing Testing:** Cannot test plans/trials/quota without logged-in user (email verification blocker)
4. **PayPal Integration:** Sandbox only; live requires PayPal live credentials and domain verification
5. **AdSense:** Disabled until account approval; currently shows placeholder ads

## Testing Notes

### Sign-Up Flow
- Form validation (client-side Zod) works end-to-end
- Supabase registration succeeds but email delivery blocked locally
- Duplicate email returns neutral "You already have an account" message (no enumeration)

### Login Flow
- Valid credentials → session established, redirect to dashboard
- Invalid credentials → localized error message
- Unverified email → "Please verify your email" message
- Session persists across refresh and new tabs

### Protected Routes
- Unauthenticated access to `/app/*` redirects to `/login?redirect=/app/...`
- After login, redirect parameter automatically navigated

### RLS Isolation
- All private tables enforce `auth.uid() = user_id` at database level
- Client queries without auth filter return empty (not 401)
- Storage bucket uses foldername[1] path segment as isolation key

## Debugging Tips

- **Typecheck Errors:** Always run `npm run typecheck` before assuming code is correct
- **Lint Issues:** Auto-fix most with `npm run lint -- --fix`
- **Supabase Errors:** Check `src/lib/auth/errors.ts` mapping; raw errors logged but hidden from users
- **Session Issues:** Check browser DevTools Application > Cookies for `sb-*` session tokens
- **RLS Failures:** Query returns empty array for private tables when unauthenticated
- **i18n Missing Keys:** Error message keys like `"auth.unknownError"` indicate missing i18n entry

## Conventions & Style

- **Naming:** camelCase for functions/variables, PascalCase for components/types, UPPER_SNAKE_CASE for constants
- **Imports:** Absolute paths (`@/lib/...`) preferred; relative only within same directory
- **Component Props:** Use Radix UI + Tailwind; no custom CSS unless design-system requires it
- **Error Handling:** Never show raw Supabase messages; map to i18n keys
- **Comments:** Only for non-obvious why, hidden constraints, or workarounds; avoid stating what the code does
- **Git:** Create new commits rather than amending; include `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>` trailer

## References

- [TanStack Start](https://tanstack.com/start/latest) — File-based routing, server functions
- [Supabase Docs](https://supabase.com/docs) — Auth, RLS, realtime
- [Zod](https://zod.dev/) — Schema validation
- [Tailwind CSS](https://tailwindcss.com/) — Utility CSS
- [React Query](https://tanstack.com/query/latest) — Server state management
