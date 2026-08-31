# EasyInvoiceOCR

**Official website: <https://www.easyinvoiceocr.com/>**

EasyInvoiceOCR is a browser-based invoice and document OCR platform. It reads
invoices and receipts, extracts their fields, and converts documents between PDF,
Word, Excel and image formats — with recognition running inside the visitor's own
browser rather than on a server.

The interface is available in English, French and Arabic.

## What is EasyInvoiceOCR?

EasyInvoiceOCR performs two related jobs:

- **Extraction** — read an invoice or receipt and pull out structured fields
  (vendor, invoice number, dates, tax, totals, line items), then export them as
  Excel, CSV or JSON.
- **Conversion** — turn documents between formats: PDF to Word, image to Word,
  image to PDF, plus a set of standalone PDF utilities.

It is a web application. There is nothing to install.

## Tools

Each page below is a live product page on the official site.

| Tool | What it does |
| ---- | ------------ |
| [Invoice OCR](https://www.easyinvoiceocr.com/en/invoice-ocr) | Read an invoice and extract its fields |
| [Receipt to Excel](https://www.easyinvoiceocr.com/en/receipt-to-excel) | Turn receipts into a spreadsheet |
| [PDF Invoice Parser](https://www.easyinvoiceocr.com/en/pdf-invoice-parser) | Parse invoice data out of a PDF |
| [Image to Excel](https://www.easyinvoiceocr.com/en/image-to-excel) | Extract tabular data from a photo or scan |
| [PDF to Word](https://www.easyinvoiceocr.com/en/pdf-to-word) | Convert a PDF into an editable document |
| [Image to Word](https://www.easyinvoiceocr.com/en/image-to-word) | Convert an image into an editable document |
| [Image to PDF](https://www.easyinvoiceocr.com/en/image-to-pdf) | Combine images into a PDF |
| [PDF tools](https://www.easyinvoiceocr.com/en/pdf-tools) | Merge, split, compress and related utilities |

## Supported documents

PDF files and images (JPG, PNG, WebP). Extraction handles up to 30 pages per
document. Exact accepted MIME types per tool are defined in
`src/lib/convert/validation.ts`, which is the same rule the server enforces.

## Browser-based processing

**Recognition runs in the visitor's browser.** Documents are read locally by
[Tesseract.js](https://github.com/naptha/tesseract.js) (WebAssembly) and
[pdf.js](https://github.com/mozilla/pdf.js). The engine, the WebAssembly core and
the language models are served from our own origin, not a third-party CDN, so a
conversion never depends on an external service being up.

## Privacy model

This is the part worth stating precisely, because "browser-based" is often
oversold.

**The file's contents are never uploaded.** Page images and document text are
processed in the browser and the bytes do not leave it.

**A job record is written server-side**, because quota and entitlement decisions
are not safe to make in the browser. That record carries metadata only — the
tool used, the original file name, MIME type, file size, page count, and an
idempotency key. It does not carry the document, its images, or any extracted
field values.

We therefore do not claim that "nothing leaves your device". What we claim is
narrower and true: the document content stays local; the accounting metadata does
not.

Details: [Privacy](https://www.easyinvoiceocr.com/en/privacy) ·
[Security](https://www.easyinvoiceocr.com/en/security)

## Supported languages

Recognition models vendored and served locally: **English, French, Arabic, German
and Spanish**, plus two combined modes (English + Arabic, English + French) for
mixed-language documents — seven selectable recognition modes in total.

The interface itself is available in English, French and Arabic, with Arabic
rendered right-to-left.

## Pricing

Every account gets **five free conversions**, shared across every tool. It is an
allowance, not a 30-day trial, and it does not require a card.

Beyond that there is a paid subscription. Current plans and prices are published
on the pricing page and read from our billing records rather than restated here,
so this file cannot drift out of date:

**<https://www.easyinvoiceocr.com/en/pricing>**

## API

An OCR API is described on the site but is **not operational**: no endpoint
accepts requests and no plan grants access. `OCR_API_STATUS.md` lists every
condition that must hold before it may be marked live. Please do not build
against it yet.

---

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
