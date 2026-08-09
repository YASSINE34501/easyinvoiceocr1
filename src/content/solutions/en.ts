import type { SolutionContent } from "./types";

/**
 * English solution content.
 *
 * Four claims from the previous version were removed because they were not
 * true:
 *
 *   1. "The free plan covers 10 pages a month." The model is five successful
 *      conversions once per account (FREE_CONVERSION_ALLOWANCE), not a monthly
 *      page bucket.
 *   2. "No account needed for the demo." ConversionGate refuses an anonymous
 *      visitor and shows a sign-in prompt.
 *   3. "Held in private storage and read through short-lived signed URLs."
 *      Recognition runs in the browser; the document is not uploaded to be read.
 *   4. The developer page listed live endpoints, a bearer token and "working
 *      examples" for an API that accepts no requests.
 */

const labels: SolutionContent["labels"] = {
  intro: "The problem",
  blocks: "How it works",
  faqs: "Frequently asked questions",
  products: "Tools for this",
  guides: "Related reading",
  breadcrumb: "Solutions",
};

export const solutionsEn: Record<string, SolutionContent> = {
  accountants: {
    name: "Accountants",
    title: "Invoice OCR for Accountants and Bookkeeping Practices — EasyInvoiceOCR",
    description:
      "Batch supplier invoices, extract VAT and tax as distinct fields, review by exception and export to Excel or CSV. Built around a practice's month-end, not a single upload.",
    eyebrow: "Solutions",
    heading: "Built for the month-end invoice pile",
    lede: "A practice does not process one invoice. It processes several hundred across a dozen clients in the same week, and the workflow has to be shaped around that.",
    intro: [
      "The bottleneck in a bookkeeping practice is rarely the accounting software. It is getting supplier documents into a state the software will accept — manual, repetitive work, and the least valuable thing a qualified person can spend the last week of the month doing.",
      "Transcription is the part a machine should do. Your team's time is better spent on the exceptions: the invoice with the wrong VAT rate, the one billed to the wrong entity, the one that should never have been approved.",
    ],
    blocks: [
      {
        title: "Work through a batch, not a file",
        body: "Process supplier invoices one after another without re-configuring anything between them. Each document is handled independently, so one bad scan does not spoil the rest of the session.",
        points: [
          "Mixed PDFs and images in the same working session",
          "Per-document outcome: extracted, needs review, or failed",
          "A failure names its reason instead of disappearing",
        ],
      },
      {
        title: "Tax as distinct fields",
        body: "Tax is the field that has to be right. Vendor tax number, rate, amount and the net/gross split are extracted as separate values rather than inferred from the total.",
        points: [
          "Vendor and buyer tax identifiers",
          "Rate and amount captured separately",
          "Several rates on one invoice kept per line",
          "Reverse-charge and zero-rated lines preserved as printed",
        ],
      },
      {
        title: "Review by exception",
        body: "Low-confidence fields are surfaced first. A reviewer confirms or corrects them, and the corrected values are what gets exported — there is no separate raw version that can leak into a filing.",
        points: [
          "Confidence shown per field",
          "The original document beside the extracted values",
          "Editable line items with totals that recalculate",
        ],
      },
      {
        title: "Arithmetic as the real check",
        body: "A parse that balances is almost certainly right. Line items are summed against the subtotal and the subtotal against the stated total, and rows that do not reconcile are flagged rather than exported quietly.",
      },
      {
        title: "Exports a ledger will accept",
        body: "An Excel workbook with a summary sheet and a line-item sheet, CSV shaped for ledger import, or JSON with full field-level detail.",
        points: [
          ".xlsx with summary and line-item sheets",
          "CSV for ledger import",
          "JSON with per-field confidence",
        ],
      },
      {
        title: "Client documents stay on the reviewer's machine",
        body: "Recognition runs in the browser, so a client's invoice is not uploaded to a server to be read. Only a conversion record — filename, size and page count — is stored against the account. What is and is not claimed is set out in full on the Security page.",
      },
    ],
    faqs: [
      {
        q: "Can several people in the practice review at once?",
        a: "Each person works in their own browser session against their own account. There is no shared review queue yet — that is a genuine limitation rather than a feature being withheld.",
      },
      {
        q: "Does it handle invoices in more than one language?",
        a: "Extraction handles Latin and Arabic script and international number, date and currency formats. Where a date format is genuinely ambiguous the field is flagged instead of guessed.",
      },
      {
        q: "What happens to a document it cannot read?",
        a: "It is reported as a failure with a reason, and it does not consume a conversion from your allowance.",
      },
    ],
    cta: {
      label: "Process one of your own invoices",
      href: "/en/invoice-ocr#demo",
      note: "Opens Invoice OCR with the upload area. Recognition runs on your own file, in your browser.",
    },
    productLinks: [
      { label: "Extract a single invoice", href: "/en/invoice-ocr" },
      { label: "Parse multi-page PDF invoices", href: "/en/pdf-invoice-parser" },
      { label: "How documents are handled", href: "/en/security" },
    ],
    blogLinks: [
      {
        label: "What an accuracy claim actually measures",
        href: "/en/blog/invoice-ocr-accuracy-guide",
      },
      { label: "Why line items are the hard part", href: "/en/blog/line-item-extraction-hard" },
    ],
    labels,
    a11y: { navLabel: "Tools and guides for accounting practices" },
    emptyState: "No documents in this view yet.",
    errorState: "This page could not be loaded. Nothing was charged against your allowance.",
  },

  "small-businesses": {
    name: "Small Businesses",
    title: "Invoice and Receipt OCR for Small Businesses — EasyInvoiceOCR",
    description:
      "Cut manual data entry, keep supplier invoices and receipts in one list, and export a month to Excel. Five conversions are free, with no card required.",
    eyebrow: "Solutions",
    heading: "Stop retyping supplier invoices",
    lede: "Most small businesses keep their books in a spreadsheet, and most of that spreadsheet is typed by hand from paper and PDFs. This removes the typing, not the spreadsheet.",
    intro: [
      "You do not need an enterprise finance platform. You need the numbers off the invoice and into a sheet, correctly, without spending an evening on it.",
      "The scope here is deliberately narrow: capture the document, check the figures, export the sheet. There is no chart of accounts to map before you can start.",
    ],
    blocks: [
      {
        title: "Less typing, same spreadsheet",
        body: "A supplier invoice takes a few minutes to type and a few seconds to check. The fields arrive filled in; you confirm the ones flagged as uncertain and move on.",
      },
      {
        title: "Invoices and receipts in one place",
        body: "Both end up as records with vendor, date, tax and total, instead of being split between an email inbox, a photos app and a drawer.",
        points: [
          "One list for invoices and receipts",
          "Search by vendor or amount",
          "Sort by date or total",
        ],
      },
      {
        title: "However the invoice arrived",
        body: "A PDF from email, a scan from the printer and a photo from a phone all go down the same path, so there is no separate process depending on the source.",
      },
      {
        title: "One month, one export",
        body: "Export a period to an Excel workbook — a summary sheet with the invoice-level fields and a line-item sheet with the detail. It opens in Excel, Numbers, LibreOffice and Google Sheets.",
      },
      {
        title: "Five conversions to decide with",
        body: "Every account gets five successful conversions, free and without a card. A conversion that fails or is cancelled costs nothing, so a bad scan does not use one up.",
      },
    ],
    faqs: [
      {
        q: "What exactly is free?",
        a: "Five successful conversions per account, shared across every tool. They are not a monthly allowance and they do not refill — after the fifth, a paid plan is required.",
      },
      {
        q: "Do I need an account to try it?",
        a: "Yes. Conversions are tied to an account so the free five can be counted, and because your conversion history belongs to you rather than to a browser session.",
      },
      {
        q: "Is my invoice sent to a server?",
        a: "No. Recognition runs in your browser. Only a conversion record — filename, size and page count — is stored against your account.",
      },
    ],
    cta: {
      label: "Try it with one of your invoices",
      href: "/en/invoice-ocr#demo",
      note: "Five conversions are free. A conversion that fails does not use one.",
    },
    productLinks: [
      { label: "Read a supplier invoice", href: "/en/invoice-ocr" },
      { label: "Turn receipts into a spreadsheet", href: "/en/receipt-to-excel" },
      { label: "Photograph a table", href: "/en/image-to-excel" },
    ],
    blogLinks: [
      {
        label: "A monthly routine that actually holds",
        href: "/en/blog/receipts-to-spreadsheet-workflow",
      },
      {
        label: "What to ask before uploading documents anywhere",
        href: "/en/blog/gdpr-document-processing",
      },
    ],
    labels,
    a11y: { navLabel: "Tools and guides for small businesses" },
    emptyState: "Nothing here yet.",
    errorState: "This page could not be loaded.",
  },

  freelancers: {
    name: "Freelancers",
    title: "Receipt and Expense OCR for Freelancers — EasyInvoiceOCR",
    description:
      "Photograph receipts as you get them, extract merchant, date, tax and total, and export the month to Excel. Five conversions are free.",
    eyebrow: "Solutions",
    heading: "Your receipts, sorted, from your phone",
    lede: "Freelance bookkeeping fails at capture, not at accounting. If the receipt is photographed the moment you get it, everything downstream is easy.",
    intro: [
      "Nobody keeps a shoebox because they want to. They keep it because entering receipts is boring enough to postpone until a deadline forces it.",
      "Photograph the receipt when you get it, process a batch when it suits you, export the month when your accountant asks. That is the whole loop.",
    ],
    blocks: [
      {
        title: "A receipt becomes a record",
        body: "Merchant, date, currency, tax and total, searchable — instead of a photo you will never find again.",
      },
      {
        title: "See what you actually spent",
        body: "Totals by month and by merchant, without building the sheet yourself first.",
      },
      {
        title: "Both directions of invoice",
        body: "Keep the invoices you issued and the ones you received in the same place, so a year-end query is a search rather than an excavation.",
      },
      {
        title: "Export and send it on",
        body: "A month to Excel or CSV. Unicode text — including Arabic and accented merchant names — survives exactly as printed.",
      },
      {
        title: "Works on the phone you photographed it with",
        body: "The upload area is touch-friendly and takes photos straight from the camera roll. There is no app to install.",
      },
    ],
    faqs: [
      {
        q: "Will a faded thermal receipt work?",
        a: "Sometimes. Faded thermal paper and folds across the total are the usual causes of a poor read. When nothing can be extracted you get an explicit empty result, and it does not consume a free conversion.",
      },
      {
        q: "Do Arabic or accented merchant names survive the export?",
        a: "Yes. The workbook is written as Unicode text, so names appear as they do on the receipt.",
      },
      {
        q: "How many free conversions do I get?",
        a: "Five successful ones per account, shared across every tool, with no card required. Failed and cancelled conversions cost nothing.",
      },
    ],
    cta: {
      label: "Try it with a receipt",
      href: "/en/receipt-to-excel#demo",
      note: "Opens Receipt to Excel. Five conversions are free.",
    },
    productLinks: [
      { label: "Receipts into a spreadsheet", href: "/en/receipt-to-excel" },
      { label: "A photographed table into .xlsx", href: "/en/image-to-excel" },
      { label: "Help Center", href: "/en/help" },
    ],
    blogLinks: [
      { label: "The monthly receipt routine", href: "/en/blog/receipts-to-spreadsheet-workflow" },
      { label: "How accuracy is really measured", href: "/en/blog/invoice-ocr-accuracy-guide" },
    ],
    labels,
    a11y: { navLabel: "Tools and guides for freelancers" },
    emptyState: "No receipts yet.",
    errorState: "This page could not be loaded.",
  },

  developers: {
    name: "Developers",
    title: "Document Extraction for Developers — API Coming Soon — EasyInvoiceOCR",
    description:
      "The EasyInvoiceOCR API is not operational and accepts no requests. What exists today runs in the browser; this page explains what is planned and what to use meanwhile.",
    eyebrow: "Solutions",
    heading: "There is no API yet — here is what does exist",
    lede: "If you are evaluating this for an integration, the honest answer comes first: the HTTP API is not built. No endpoint accepts requests and no key is issued.",
    intro: [
      "This page used to list five endpoints, a bearer token and example requests. None of it was callable, which made it documentation for something that did not exist. It has been removed rather than qualified.",
      "What does work today runs entirely in the browser: recognition, field extraction, review and export, with no server round trip for the document itself. If that fits where your users already are, it is usable now.",
    ],
    blocks: [
      {
        title: "What is actually available",
        body: "The browser tools. Invoice OCR, the PDF invoice parser, Receipt to Excel and Image to Excel all run client-side and export Excel, CSV or JSON. There is no integration step and no key.",
        points: [
          "Recognition and extraction run in the visitor's browser",
          "Exports are produced client-side as .xlsx, CSV or JSON",
          "No document is uploaded to be read",
        ],
      },
      {
        title: "What is not available",
        body: "The HTTP API. There is no endpoint, no authentication, no sandbox, no SDK and no webhook delivery. API access is not included in any current plan and is not billed.",
      },
      {
        title: "What is being designed",
        body: "Submit a document, check its status, retrieve the structured result, list submissions, delete one. The design goals are idempotent submission, a stable machine-readable error envelope and explicit rate-limit headers. None of it is implemented.",
      },
      {
        title: "No date is being promised",
        body: "Announcing a date before the service is built and tested would be a guess, and an integration plan should not be built on a guess.",
      },
      {
        title: "How to evaluate any document API",
        body: "The checklist we would want you to hold us to — error envelopes, idempotency keys, rate-limit headers, versioning and cursor pagination — is written up in the developer guide, and it applies to every vendor including us.",
      },
    ],
    faqs: [
      {
        q: "Can I call the API today?",
        a: "No. There is no endpoint listening, so every request fails. This is not a beta gate or a waiting list — the service does not exist yet.",
      },
      {
        q: "Is API access part of the Business plan?",
        a: "No. It is not part of any current plan and is not billed. If that changes, the plan pages will say so before the endpoint opens.",
      },
      {
        q: "What can I integrate with in the meantime?",
        a: "Nothing programmatic. The browser tools do the extraction today, but they are a user-facing workflow rather than a service you can call from your own code.",
      },
    ],
    cta: {
      label: "See what the API will offer",
      href: "/en/ocr-api",
      note: "The OCR API page describes the planned interface. It accepts no requests.",
    },
    productLinks: [
      { label: "The OCR API — coming soon", href: "/en/ocr-api" },
      { label: "Extraction that works today", href: "/en/invoice-ocr" },
      { label: "Documentation", href: "/en/documentation" },
    ],
    blogLinks: [
      { label: "A checklist for choosing an OCR API", href: "/en/blog/choosing-ocr-api" },
      { label: "What to ask about document handling", href: "/en/blog/gdpr-document-processing" },
    ],
    labels,
    a11y: { navLabel: "Tools and guides for developers" },
    emptyState: "There is nothing to show here yet.",
    errorState: "This page could not be loaded.",
  },
};
