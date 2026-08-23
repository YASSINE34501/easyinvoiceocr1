# EasyInvoiceOCR

Invoice and receipt data extraction, plus document conversion, in three languages
(English, French, Arabic).

**Recognition runs in the visitor's browser.** Files are read by Tesseract.js and
pdf.js locally and are never uploaded — the server only decides entitlement,
counts quota and keeps a job record. That is the product's main privacy claim and
the reason the architecture is shaped the way it is.

## Tools

**Extraction** — invoice OCR, receipt to Excel, PDF invoice parser, image to
Excel. Output as Excel, CSV or JSON.

**Conversion** — PDF to Word, image to Word, image to PDF.

An OCR API is described on the site but is **not operational**: no endpoint
accepts requests and no plan grants access. `OCR_API_STATUS.md` lists every
condition that must hold before it may be marked live.

## Running it

```bash
npm install
npm run dev
```

The dev server listens on http://localhost:8080. `predev` vendors the Tesseract
worker, WASM core and language models into `public/tesseract/` (~61 MB) so
recognition never depends on a CDN at run time.

| Command                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `npm run dev`              | Dev server, port 8080                               |
| `npm run typecheck`        | `tsc --noEmit` — must pass before any commit        |
| `npm run lint`             | ESLint, with Prettier as a rule                     |
| `npm run test`             | Unit tests (vitest)                                 |
| `npm run test:integration` | Integration tests against the real Supabase project |
| `npm run build`            | Production build to `.output/`                      |

`npm run test:integration` creates and deletes a throwaway account in the live
project. Run it deliberately, not in a loop.

## Stack

TanStack Start and React 19 on Vite, Supabase for auth and data, PayPal for
subscriptions, Tailwind for styling. Deployed on Vercel.

Two version pins matter: **vite is held at 8.2.0 and rolldown at 1.2.2** through
an `overrides` entry. rolldown 1.2.5 splits the SSR build so a chunk holding the
`__exportAll` runtime helper imports back from a chunk that consumes it; the ESM
cycle leaves the helper undefined and every SSR request dies with HTTP 500. The
dev server cannot catch this because it serves unbundled ESM — verify against
`.output/server/index.mjs` after a build instead.

The Vite config extends `@lovable.dev/vite-tanstack-config`, which supplies the
TanStack Start plugin, nitro, Tailwind, path aliases and the React dedupe rules.
Adding any of those manually produces duplicate plugins and breaks the app.

## Architecture notes

`CLAUDE.md` is the working reference: registries and the rule never to hard-code
a list, the locale routing scheme, the browser-side conversion pipelines, the
billing model (five free conversions per account, shared across every tool), and
the constraints that are easy to violate by accident.

Conventions worth knowing before a first change:

- **Registries, not lists.** Products, navigation, routing and the sitemap all
  derive from `src/config/`. A hard-coded list is how two of them drift apart.
- **Prices live in the database.** `subscription_plans` is the source of truth; a
  second copy in source is how the site and the invoice disagree.
- **Server-only modules are named `*.server.ts`** and imported inside handlers,
  never at the top level of a `*.functions.ts` — otherwise the service-role key
  ships to the browser.
- **Every user-visible string needs all three locales.** A missing key is a type
  error, not an English fallback.
- **Migrations are forward-only and additive.** Write every statement to be
  safely re-runnable.

## Environment

`.env` is git-ignored; `.env.example` documents every variable and how each one
fails closed when unset. Two deserve particular care:

- `VITE_SITE_URL` must equal `https://www.easyinvoiceocr.com` exactly or the
  deployment renders `noindex, nofollow` on every page. That is deliberate: an
  unindexed site is recoverable, five indexed copies of it are not.
- `PAYPAL_LIVE_CHECKOUT_ENABLED` must be exactly `"true"` before live checkout
  opens, and only when every PayPal credential and plan id is present. Anything
  else — unset, `false`, `1`, `yes` — blocks checkout.
