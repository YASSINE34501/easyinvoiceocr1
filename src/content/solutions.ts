import { path } from "@/config/nav";

export type Solution = {
  slug: string;
  route: string;
  name: string;
  title: string;
  description: string;
  heading: string;
  lede: string;
  intro: string[];
  blocks: { title: string; body: string; points?: string[] }[];
  cta: { label: string; href: string; note: string };
  links: { label: string; href: string }[];
};

export const solutions: Solution[] = [
  {
    slug: "accountants",
    route: path("solutions/accountants"),
    name: "Accountants",
    title: "Invoice OCR for Accountants and Bookkeeping Practices",
    description:
      "Batch invoice processing, VAT and tax field extraction, per-client document organisation, Excel and accounting exports, and a review workflow built for practices.",
    heading: "Built for the month-end invoice pile",
    lede: "A practice does not process one invoice; it processes several hundred across a dozen clients in the same week. The workflow below is shaped around that, not around a single upload.",
    intro: [
      "The bottleneck in a bookkeeping practice is rarely the accounting software — it is getting supplier documents into a state the software can accept. That work is manual, repetitive, and the least valuable thing a qualified person can spend the last week of the month doing.",
      "EasyInvoiceOCR handles the transcription so your team spends its time on the exceptions: the invoice with the wrong VAT rate, the one billed to the wrong entity, the one that never should have been approved.",
    ],
    blocks: [
      {
        title: "Batch invoice processing",
        body: "Upload a folder of supplier invoices in one action. Each document is processed independently, so one bad scan does not fail the batch, and the results arrive as a single reviewable list.",
        points: [
          "Mixed PDFs and images in the same batch",
          "Per-document status: processed, needs review, failed",
          "Failed documents listed separately with the reason",
        ],
      },
      {
        title: "VAT and tax extraction",
        body: "Tax is the field that has to be right. Vendor VAT number, tax rate, tax amount and net/gross split are extracted as distinct fields rather than being inferred from the total.",
        points: [
          "Vendor and buyer tax identifiers",
          "Rate and amount captured separately",
          "Multiple tax rates on one invoice kept per line",
          "Reverse-charge and zero-rated lines preserved as printed",
        ],
      },
      {
        title: "Client document organisation",
        body: "Documents are grouped so that a review session covers one client at a time and an export contains only that client's records.",
        points: [
          "Group by client and period",
          "Search by vendor, invoice number or amount",
          "Filter to documents still awaiting review",
        ],
      },
      {
        title: "Review and correction workflow",
        body: "Low-confidence fields are surfaced first. A reviewer confirms or corrects them, and the corrected values are what gets exported — there is no separate 'raw' version that can leak into a filing.",
        points: [
          "Confidence shown per field",
          "Side-by-side original document",
          "Editable line items with recalculating totals",
        ],
      },
      {
        title: "Excel and accounting exports",
        body: "Export a reviewed batch as an Excel workbook with a summary sheet and a line-item sheet, as CSV for import into a ledger, or as JSON for a bespoke pipeline.",
        points: [
          ".xlsx with summary and line-item sheets",
          "CSV shaped for ledger import",
          "JSON with full field-level detail",
        ],
      },
      {
        title: "Security and retention",
        body: "Client financial documents are held in private storage and read through short-lived signed URLs. Deleting a document removes the file and its extracted record together. Retention and deletion behaviour is documented in full on the Security page — including what we do not claim.",
      },
    ],
    cta: {
      label: "Process your own invoice",
      href: path("invoice-ocr") + "#demo",
      note: "Opens the Invoice OCR page with the upload area. Text is recognised from your own file in your browser; complex layouts may need manual review before export.",
    },
    links: [
      { label: "Invoice OCR", href: path("invoice-ocr") },
      { label: "PDF Invoice Parser", href: path("pdf-invoice-parser") },
      { label: "Security", href: path("security") },
    ],
  },
  {
    slug: "small-businesses",
    route: path("solutions/small-businesses"),
    name: "Small Businesses",
    title: "Invoice and Receipt OCR for Small Businesses",
    description:
      "Cut manual data entry, organise expenses, capture supplier invoices, keep a monthly document history and export to Excel — starting on the free plan.",
    heading: "Stop retyping supplier invoices",
    lede: "Most small businesses do their bookkeeping in a spreadsheet, and most of that spreadsheet is typed by hand from paper and PDFs. This removes the typing, not the spreadsheet.",
    intro: [
      "You do not need an enterprise finance platform. You need the numbers off the invoice and into a sheet, correctly, without spending an evening on it.",
      "EasyInvoiceOCR is deliberately narrow: capture the document, check the figures, export the sheet. Nothing to configure, no chart of accounts to map before you can start.",
    ],
    blocks: [
      {
        title: "Less manual entry",
        body: "A supplier invoice takes a few minutes to type and a few seconds to check. The fields arrive filled in; you confirm the ones flagged as uncertain and move on.",
      },
      {
        title: "Expense organisation",
        body: "Supplier invoices and receipts end up in one list with vendor, date, tax and total, instead of split between an email inbox, a photos app and a drawer.",
        points: [
          "One list for invoices and receipts",
          "Search by vendor or amount",
          "Sort by date or total",
        ],
      },
      {
        title: "Supplier invoice capture",
        body: "PDFs from email, scans from a printer and photos from a phone all go through the same path, so there is no separate process depending on how the invoice arrived.",
      },
      {
        title: "Monthly document history",
        body: "Documents stay grouped by month, so preparing a VAT return or handing a period to an accountant means exporting one month rather than reconstructing it.",
      },
      {
        title: "Simple Excel export",
        body: "One button, one workbook. A summary sheet with the invoice-level fields and a line-item sheet with the detail — both openable in Excel, Numbers, LibreOffice or Google Sheets.",
      },
      {
        title: "Start free",
        body: "The free plan covers 10 pages a month with Excel export, which is enough to decide whether this fits how you work before paying for anything.",
      },
    ],
    cta: {
      label: "Start free",
      href: path("invoice-ocr") + "#demo",
      note: "Try it with one of your own invoices first — no account needed for the demo.",
    },
    links: [
      { label: "Invoice OCR", href: path("invoice-ocr") },
      { label: "Receipt to Excel", href: path("receipt-to-excel") },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    slug: "freelancers",
    route: path("solutions/freelancers"),
    name: "Freelancers",
    title: "Receipt and Expense OCR for Freelancers",
    description:
      "Organise receipts, track expenses, keep client and supplier documents together, export monthly, and capture everything from your phone. Free account available.",
    heading: "Your receipts, sorted, from your phone",
    lede: "Freelance bookkeeping fails at capture, not at accounting. If the receipt is photographed the moment you get it, everything downstream is easy.",
    intro: [
      "Nobody keeps a shoebox because they want to. They keep it because entering receipts is boring enough to postpone until the deadline forces it.",
      "Photograph the receipt when you get it, upload a batch when convenient, export the month when your accountant asks. That is the whole loop.",
    ],
    blocks: [
      {
        title: "Receipt organisation",
        body: "Every receipt becomes a record with merchant, date, currency, tax and total — searchable, instead of a photo you will never find again.",
      },
      {
        title: "Expense tracking",
        body: "Totals per month and per merchant, so you can see what you actually spent without building the sheet yourself first.",
      },
      {
        title: "Client and supplier documents",
        body: "Keep invoices you issued and invoices you received in the same place, tagged by client, so a year-end query takes a search rather than an archaeology session.",
      },
      {
        title: "Monthly export",
        body: "Export a month to Excel or CSV and send it on. Unicode text — including Arabic and accented merchant names — is preserved exactly.",
      },
      {
        title: "Mobile upload",
        body: "The upload area is touch-friendly and accepts photos straight from the camera roll. No app to install.",
      },
      {
        title: "Free account",
        body: "The free plan is genuinely usable for a light month, and there is no card required to try the demo.",
      },
    ],
    cta: {
      label: "Try it with a receipt",
      href: path("receipt-to-excel") + "#demo",
      note: "Opens Receipt to Excel. Upload a receipt photo and download the workbook it produces.",
    },
    links: [
      { label: "Receipt to Excel", href: path("receipt-to-excel") },
      { label: "Image to Excel", href: path("image-to-excel") },
      { label: "Help Center", href: path("help") },
    ],
  },
  {
    slug: "developers",
    route: path("solutions/developers"),
    name: "Developers",
    title: "Document Extraction API for Developers",
    description:
      "OCR API overview, authentication, JSON schema and HTTP examples for integrating invoice and receipt extraction into your own application.",
    heading: "Extraction as a small, boring HTTP API",
    lede: "Five endpoints, one bearer token, one JSON shape. Documented in full before it ships, so you can design against it now.",
    intro: [
      "If you already have a system that receives invoices, you do not want another dashboard — you want a call you can make from the code you already wrote.",
      "The API surface is intentionally minimal and the response shape is stable. Everything below reflects the published specification; see the status note before you plan a launch around it.",
    ],
    blocks: [
      {
        title: "API overview",
        body: "POST a document, poll its status, GET the extraction, list documents, delete a document. That is the entire surface. Processing is asynchronous because OCR on a multi-page scan is not a sub-second operation.",
        points: [
          "POST /v1/documents",
          "GET /v1/documents/{id}",
          "GET /v1/documents/{id}/extraction",
          "GET /v1/documents",
          "DELETE /v1/documents/{id}",
        ],
      },
      {
        title: "Authentication",
        body: "A workspace-scoped bearer token in the Authorization header, plus an X-API-Version header to pin the response shape. Keys are displayed once and can be revoked.",
      },
      {
        title: "JSON schema",
        body: "The extraction response is a flat fields object — each entry carrying value and confidence — plus a line_items array. Confidence lets you route uncertain documents to human review automatically instead of trusting everything equally.",
      },
      {
        title: "Webhooks — not implemented",
        body: "There is no webhook delivery today, and none is documented as if there were. The intended design is a signed POST to a URL you register when a document reaches a terminal status, but until it exists, poll the status endpoint.",
      },
      {
        title: "HTTP examples — no SDK",
        body: "No SDK is published. The API Reference carries working-shape examples in cURL, JavaScript fetch and Python requests for every endpoint, which is all a five-endpoint API needs.",
      },
      {
        title: "Current status",
        body: "The endpoints are not live and API keys are not being issued. Every endpoint in the reference is labelled Planned. Do not schedule an integration against it until that label is removed.",
      },
    ],
    cta: {
      label: "Read the API Reference",
      href: path("api-reference"),
      note: "API key management arrives with the developer account area. Use the contact form (API topic) to be notified when keys are issued.",
    },
    links: [
      { label: "OCR API", href: path("ocr-api") },
      { label: "API Reference", href: path("api-reference") },
      { label: "Documentation", href: path("documentation") },
    ],
  },
];

export const solutionBySlug: Record<string, Solution | undefined> = Object.fromEntries(
  solutions.map((s) => [s.slug, s] as const),
);
