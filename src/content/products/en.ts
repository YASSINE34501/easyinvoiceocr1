import type { ProductContent } from "./types";

/**
 * English product-page content.
 *
 * Two corrections were made while moving this out of the old single-locale
 * file, both because the previous text described behaviour the code does not
 * have:
 *
 *   1. The shared security list claimed "Extraction runs server-side". It does
 *      not. Recognition runs in the visitor's browser through Tesseract
 *      (src/lib/extract/pipeline.ts), and the document is never uploaded to be
 *      read. The old wording also implied files are stored and served through
 *      signed URLs, which described a pipeline that is not the one shipping.
 *   2. Invoice OCR's FAQ said "The interface itself is currently English only".
 *      The interface ships in English, French and Arabic.
 */

/**
 * How documents are actually handled. Written from the code, not from an
 * intended architecture: recognition is client-side, so the strongest true
 * claim is that the document does not leave the machine to be read.
 */
const security: string[] = [
  "Recognition runs inside your browser. The document is not uploaded to a server to be read.",
  "Because the file stays on your device during extraction, its contents are never written to our logs or held in a processing queue.",
  "A conversion record — filename, size and page count — is stored against your account so your allowance and history are accurate. The document's contents are not part of that record.",
  "The connection to the application is HTTPS/TLS only.",
  "You can delete a conversion record at any time from your account.",
];

const labels: ProductContent["labels"] = {
  what: "What this is",
  fields: "What gets extracted",
  audience: "Who it is for",
  formats: "Supported formats",
  capabilities: "What you can do",
  security: "How your documents are handled",
  faqs: "Frequently asked questions",
  relatedGuides: "Related guides",
  relatedTools: "Related tools",
};

export const productsEn: Record<string, ProductContent> = {
  "invoice-ocr": {
    name: "Invoice OCR",
    title: "Invoice OCR — Extract Invoice Data From PDFs and Scans",
    description:
      "Upload a PDF or image invoice and get vendor, invoice number, dates, tax, totals and line items as structured, editable data you can export to Excel, CSV or JSON.",
    eyebrow: "Product",
    heading: "Invoice OCR that returns structured, editable invoice data",
    lede: "Drop in a PDF, scan or phone photo of an invoice. The document is read in your browser, every field comes back with a confidence value, and you can correct anything before exporting to Excel, CSV or JSON.",
    what: [
      "Invoice OCR is optical character recognition combined with document understanding. Plain OCR gives you a wall of text; invoice OCR also decides which piece of text is the invoice number, which is the due date, and which numbers belong to which line item.",
      "That distinction is what makes the output usable. Instead of retyping an invoice into a spreadsheet, you review a structured record where each field is already filled in and every value stays editable.",
      "Low-confidence values are highlighted, so review time goes to the fields that actually need a human rather than to the whole document.",
    ],
    fields: [
      {
        group: "Vendor and buyer",
        items: [
          "Vendor name",
          "Vendor address",
          "Vendor tax / VAT number",
          "Buyer name and address",
          "Contact details when printed",
        ],
      },
      {
        group: "Document",
        items: [
          "Invoice number",
          "Purchase order reference",
          "Invoice date",
          "Due date",
          "Payment terms",
          "Currency",
        ],
      },
      {
        group: "Amounts",
        items: [
          "Subtotal",
          "Discount",
          "Tax rate",
          "Tax amount",
          "Shipping",
          "Total due",
          "Amount paid / balance",
        ],
      },
      {
        group: "Line items",
        items: [
          "Description",
          "Quantity",
          "Unit",
          "Unit price",
          "Line discount",
          "Line tax",
          "Line total",
        ],
      },
    ],
    audience: [
      {
        title: "Accounting teams",
        body: "Bookkeepers processing supplier invoices for several clients, who need a consistent export rather than a scanned PDF archive.",
      },
      {
        title: "Finance and AP",
        body: "Accounts payable staff matching invoices against purchase orders and preparing payment runs.",
      },
      {
        title: "Small business owners",
        body: "Anyone who currently types invoice totals into a spreadsheet by hand at the end of each month.",
      },
    ],
    formats: [
      "PDF — native (text-based) and scanned, single or multi-page",
      "JPG / JPEG — photos and scans",
      "PNG — screenshots and exports",
      "Up to 20 MB per file",
    ],
    capabilities: [
      {
        title: "Drag, drop or browse",
        body: "Drop a file onto the upload area or pick it from your device. Type and size are checked before anything is processed.",
      },
      {
        title: "Progress you can see",
        body: "Preparation, reading and field extraction are reported as distinct stages, so a slow document never looks like a frozen page.",
      },
      {
        title: "Side-by-side review",
        body: "The original document sits next to the extracted fields, so you can verify a value without opening the source file separately.",
      },
      {
        title: "Editable line items",
        body: "Add, remove, reorder and correct rows. Totals recalculate as you edit, so the exported figures stay internally consistent.",
      },
      {
        title: "Three export formats",
        body: "Excel (.xlsx) with a summary sheet and a line-item sheet, CSV for imports, and JSON for systems that consume the raw record.",
      },
      {
        title: "Honest failure states",
        body: "Unsupported file, oversized file, unreadable scan and empty result each produce a specific message and a way forward.",
      },
    ],
    security,
    faqs: [
      {
        q: "Does it work on scanned invoices and photos?",
        a: "Yes. Both native PDFs and images captured with a phone are supported. Accuracy depends on the source: a straight, well-lit, in-focus capture reads far better than a skewed low-resolution one, and every field stays editable either way.",
      },
      {
        q: "What happens to a field the engine is unsure about?",
        a: "It is returned with a low confidence value and highlighted in the review panel, so you check it before exporting.",
      },
      {
        q: "Are multi-page invoices supported?",
        a: "Yes — a multi-page PDF is treated as one document, and line items spanning pages are collected into a single table.",
      },
      {
        q: "Which languages and currencies are handled?",
        a: "Extraction handles international number, date and currency formats, and both Latin and Arabic script. The interface itself is available in English, French and Arabic.",
      },
      {
        q: "Is my invoice uploaded anywhere?",
        a: "No. Recognition runs in your browser, so the document is not sent to a server to be read. Only a conversion record — filename, size and page count — is stored against your account.",
      },
    ],
    cta: {
      label: "Extract an invoice",
      href: "/en/invoice-ocr#upload",
      note: "Five conversions are free. No card required.",
    },
    relatedGuides: [
      {
        label: "What invoice OCR accuracy actually means",
        href: "/en/blog/invoice-ocr-accuracy-guide",
      },
      {
        label: "Reading invoices in Arabic, French and mixed scripts",
        href: "/en/blog/multilingual-invoice-extraction",
      },
    ],
    relatedTools: [
      { label: "Parse a multi-page PDF invoice", href: "/en/pdf-invoice-parser" },
      { label: "Turn receipts into a spreadsheet", href: "/en/receipt-to-excel" },
    ],
    solutionLink: {
      label: "Invoice processing for accounting teams",
      href: "/en/solutions/accountants",
    },
    labels,
    emptyState:
      "No invoice fields were found in this document. Try a sharper, straighter capture with all four corners in frame.",
    errorState: "This document could not be read. Nothing was charged against your allowance.",
    a11y: { uploadLabel: "Upload an invoice", previewLabel: "Preview of the uploaded invoice" },
  },

  "receipt-to-excel": {
    name: "Receipt to Excel",
    title: "Receipt to Excel — Convert Receipt Photos Into a Spreadsheet",
    description:
      "Upload one or many receipts and export merchant, date, currency, subtotal, tax, tip, total and individual items to a clean Excel workbook, flat or grouped.",
    eyebrow: "Product",
    heading: "Turn a pile of receipts into one spreadsheet",
    lede: "Photograph or scan your receipts, upload them together, correct anything that needs correcting, and download a single Excel workbook — flat for pivoting, or grouped by receipt for reading.",
    what: [
      "Receipts are the hardest documents to keep on top of: they are small, thermal-printed, creased, and they arrive one at a time. Typing them into a spreadsheet at month end is the part everyone puts off.",
      "Receipt to Excel reads a batch of receipt images in one pass and produces a workbook you can hand to an accountant or import into your books.",
      "Because the extracted values remain editable before export, a smudged total or a misread tax line is a two-second correction rather than a reason to redo the whole sheet.",
    ],
    fields: [
      {
        group: "Receipt header",
        items: [
          "Merchant name",
          "Merchant location",
          "Date",
          "Time",
          "Receipt / transaction number",
          "Currency",
        ],
      },
      {
        group: "Amounts",
        items: ["Subtotal", "Tax", "Tip", "Discount", "Total", "Payment method when printed"],
      },
      { group: "Items", items: ["Item description", "Quantity", "Unit price", "Line total"] },
    ],
    audience: [
      {
        title: "Freelancers",
        body: "Anyone claiming business expenses who needs a monthly list instead of a shoebox.",
      },
      {
        title: "Small teams",
        body: "Expense reconciliation for a handful of people without buying an expense platform.",
      },
      {
        title: "Bookkeepers",
        body: "Clients who send photos of receipts and expect a categorised sheet back.",
      },
    ],
    formats: ["JPG / JPEG", "PNG", "WebP", "PDF receipts", "Up to 20 MB per file"],
    capabilities: [
      {
        title: "Batch upload",
        body: "Select or drop many receipts at once. Each is processed independently, so one unreadable image does not fail the batch.",
      },
      {
        title: "Two workbook layouts",
        body: "Flat — one row per line item with the receipt reference repeated, ideal for pivot tables. Grouped — one block per receipt with a header row and its items beneath.",
      },
      {
        title: "Unicode-safe output",
        body: "Arabic, accented Latin and other non-ASCII merchant and item names are written to the workbook as text, not as mangled characters.",
      },
      {
        title: "Preview before download",
        body: "The exact table that will be written to the workbook is shown on screen first. Nothing downloads until you have seen it.",
      },
      {
        title: "Per-receipt correction",
        body: "Fix a merchant name or a tax figure on one receipt without touching the rest of the batch.",
      },
      {
        title: "Currency handling",
        body: "The printed currency is preserved per receipt, so a mixed-currency batch does not silently become one currency.",
      },
    ],
    security,
    faqs: [
      {
        q: "How many receipts can I upload at once?",
        a: "Batch size is bounded by your plan's monthly page allowance. Each receipt image counts as one page.",
      },
      {
        q: "Will Arabic or accented text survive the export?",
        a: "Yes. The workbook is written with Unicode text, so non-Latin merchant and item names appear as they do on the receipt.",
      },
      {
        q: "Can I export to CSV instead?",
        a: "Yes — the same flat layout is available as CSV, alongside .xlsx and JSON.",
      },
      {
        q: "What about a receipt the engine cannot read at all?",
        a: "It is returned as an empty result with a clear explanation, and it is listed separately in the batch so you can re-shoot it or enter it manually.",
      },
    ],
    cta: {
      label: "Convert receipts",
      href: "/en/receipt-to-excel#upload",
      note: "Five conversions are free. No card required.",
    },
    relatedGuides: [
      {
        label: "A monthly routine for turning receipts into a spreadsheet",
        href: "/en/blog/receipts-to-spreadsheet-workflow",
      },
      {
        label: "Questions to ask before uploading documents anywhere",
        href: "/en/blog/gdpr-document-processing",
      },
    ],
    relatedTools: [
      { label: "Extract data from a full invoice", href: "/en/invoice-ocr" },
      { label: "Photograph a table and get a workbook", href: "/en/image-to-excel" },
    ],
    solutionLink: {
      label: "Expense handling for independent workers",
      href: "/en/solutions/freelancers",
    },
    labels,
    emptyState:
      "Nothing could be read from this receipt. Faded thermal paper and folds across the total are the usual causes.",
    errorState: "This receipt could not be processed. Nothing was charged against your allowance.",
    a11y: { uploadLabel: "Upload receipts", previewLabel: "Preview of the uploaded receipt" },
  },

  "pdf-invoice-parser": {
    name: "PDF Invoice Parser",
    title: "PDF Invoice Parser — Extract Data From Native and Scanned PDFs",
    description:
      "Parse single and multi-page PDF invoices, native or scanned, with page navigation, invoice-level and line-item extraction, review and structured export.",
    eyebrow: "Product",
    heading: "Parse PDF invoices — native text or scanned image",
    lede: "Upload a PDF invoice of any kind. Text-based PDFs are read directly, scanned pages go through recognition, and multi-page documents keep their page structure so you can check any value against the page it came from.",
    what: [
      "There are two kinds of PDF invoice and they need different handling. A native PDF exported from accounting software contains a real text layer. A scanned PDF is a picture of paper wrapped in a PDF container, with no text at all.",
      "The parser detects which kind it has been given and routes it accordingly, so you do not have to know or care which you have.",
      "Multi-page documents are common in supplier billing — a summary page followed by pages of line items. Pages stay navigable, and line items are collected across page boundaries into one table.",
    ],
    fields: [
      {
        group: "Document level",
        items: [
          "Invoice number",
          "Invoice and due dates",
          "Vendor and buyer blocks",
          "Tax / VAT numbers",
          "Currency",
          "Payment terms",
        ],
      },
      {
        group: "Totals",
        items: [
          "Subtotal",
          "Tax rate and amount",
          "Discounts",
          "Shipping",
          "Grand total",
          "Balance due",
        ],
      },
      {
        group: "Per line",
        items: ["Description", "Quantity", "Unit price", "Tax", "Line total", "Source page number"],
      },
    ],
    audience: [
      {
        title: "Accounts payable",
        body: "Teams receiving supplier PDFs by email and rekeying them into an ERP.",
      },
      {
        title: "Accounting practices",
        body: "Firms handling batches of client supplier invoices each month.",
      },
      {
        title: "Operations",
        body: "Anyone reconciling long, multi-page billing documents against deliveries.",
      },
    ],
    formats: [
      "PDF with a text layer (native export)",
      "Scanned PDF (image pages, read with OCR)",
      "Multi-page PDFs",
      "Up to 20 MB per file",
    ],
    capabilities: [
      {
        title: "Page navigation",
        body: "Move between pages of the source document while reviewing, with the current page indicated.",
      },
      {
        title: "Native versus scanned detection",
        body: "The document is inspected for a text layer and routed to direct parsing or to recognition automatically.",
      },
      {
        title: "Cross-page line items",
        body: "A line-item table split over several pages is reassembled into one continuous table, with each row keeping its source page.",
      },
      {
        title: "Review and correct",
        body: "Every document-level field and every row remains editable before export.",
      },
      {
        title: "Explicit PDF error states",
        body: "Password-protected, corrupted, zero-page and unsupported PDFs each produce a distinct message that says what to do next, rather than a generic failure.",
      },
      {
        title: "Structured export",
        body: "Excel with summary and line-item sheets, CSV, or JSON including page references.",
      },
    ],
    security,
    faqs: [
      {
        q: "Can it handle password-protected PDFs?",
        a: "No. An encrypted PDF is rejected with a message asking you to remove the password and try again.",
      },
      {
        q: "What is the page limit?",
        a: "Page count is limited by file size (20 MB) and your plan's monthly page allowance. Each parsed page counts as one page.",
      },
      {
        q: "Does it split several invoices inside one PDF?",
        a: "No. A file is treated as one document. If it contains several invoices they are extracted as a single record, and you can correct or split the result before exporting.",
      },
      {
        q: "Is the original PDF kept?",
        a: "The file stays on your device. Only a conversion record — filename, size and page count — is stored against your account.",
      },
    ],
    cta: {
      label: "Parse a PDF invoice",
      href: "/en/pdf-invoice-parser#upload",
      note: "Five conversions are free. No card required.",
    },
    relatedGuides: [
      {
        label: "Why line-item extraction is harder than reading the total",
        href: "/en/blog/line-item-extraction-hard",
      },
      { label: "How to judge an accuracy claim", href: "/en/blog/invoice-ocr-accuracy-guide" },
    ],
    relatedTools: [
      { label: "Extract from a single invoice image", href: "/en/invoice-ocr" },
      { label: "Convert a PDF into an editable Word file", href: "/en/pdf-to-word" },
    ],
    solutionLink: {
      label: "Accounts payable in accounting practices",
      href: "/en/solutions/accountants",
    },
    labels,
    emptyState: "No invoice fields were found in this PDF. It may be a scan with no readable text.",
    errorState: "This PDF could not be parsed. Nothing was charged against your allowance.",
    a11y: { uploadLabel: "Upload a PDF invoice", previewLabel: "Preview of the uploaded PDF page" },
  },

  "image-to-excel": {
    name: "Image to Excel",
    title: "Image to Excel — Convert Photographed Tables Into .xlsx",
    description:
      "Upload a JPG, PNG or WebP of a table or document, preview it, extract the structured rows and columns, edit them, and download a real Excel workbook.",
    eyebrow: "Product",
    heading: "Photograph a table, download a spreadsheet",
    lede: "Upload an image of a printed table, statement or invoice. The rows and columns are detected, shown as an editable grid, and exported to a genuine .xlsx workbook — with numbers as numbers and dates as dates.",
    what: [
      "Plenty of financial data still arrives as a picture: a photo of a printed statement, a screenshot from a portal with no export button, a scan of a supplier price list.",
      "Image to Excel finds the table structure inside that picture and gives you the grid back, so you can work with the values instead of squinting at them.",
      "The output is a real workbook produced by a spreadsheet writer — not a renamed CSV, and not an empty file with a promising name.",
    ],
    fields: [
      {
        group: "Table structure",
        items: [
          "Column headers",
          "Row cells",
          "Merged-cell handling",
          "Multiple tables per image where present",
        ],
      },
      {
        group: "Typed values",
        items: [
          "Numbers written as numbers",
          "Currency amounts with their symbol preserved",
          "Dates normalised to ISO in a second column",
          "Text kept as Unicode",
        ],
      },
    ],
    audience: [
      {
        title: "Analysts",
        body: "Anyone who receives data as an image and needs it in a sheet to work with.",
      },
      { title: "Bookkeepers", body: "Statements and ledgers that only exist on paper." },
      {
        title: "Operations",
        body: "Price lists, stock counts and delivery notes captured on a phone.",
      },
    ],
    formats: ["JPG / JPEG", "PNG", "WebP", "Up to 20 MB per image"],
    capabilities: [
      {
        title: "Image preview",
        body: "The uploaded image is shown next to the extracted grid so you can compare cell by cell.",
      },
      {
        title: "Editable grid",
        body: "Change any cell, rename a header, delete a stray row picked up from a page footer.",
      },
      {
        title: "Real .xlsx output",
        body: "The workbook is generated with a spreadsheet library and opens in Excel, LibreOffice, Numbers and Google Sheets. An empty extraction never produces a download.",
      },
      {
        title: "Type preservation",
        body: "Numeric cells are written as numbers so they sum correctly; dates and currency codes are kept alongside the original text.",
      },
      {
        title: "Unicode text",
        body: "Arabic, accented Latin and other scripts are written through unchanged.",
      },
      {
        title: "Empty-result handling",
        body: "If no table structure is found you are told so, with guidance on re-shooting, instead of being handed a blank sheet.",
      },
    ],
    security,
    faqs: [
      {
        q: "What if the image contains no table?",
        a: "You get an explicit empty state explaining that no table structure was detected, with tips for a better capture. No file downloads.",
      },
      {
        q: "Are the numbers usable in formulas?",
        a: "Yes — numeric cells are written as numeric types, so SUM and friends work without a text-to-columns step.",
      },
      { q: "Can I get CSV or JSON instead?", a: "Yes, the same grid exports to CSV and JSON." },
      {
        q: "Does it handle rotated or skewed photos?",
        a: "Mild rotation is tolerated. Heavily skewed or partially cropped tables reduce accuracy — the preview shows you what was read before you export.",
      },
    ],
    cta: {
      label: "Convert an image",
      href: "/en/image-to-excel#upload",
      note: "Five conversions are free. No card required.",
    },
    relatedGuides: [
      {
        label: "Why table structure is the hard part",
        href: "/en/blog/line-item-extraction-hard",
      },
      {
        label: "Turning a month of receipts into one sheet",
        href: "/en/blog/receipts-to-spreadsheet-workflow",
      },
    ],
    relatedTools: [
      { label: "Extract a full invoice instead", href: "/en/invoice-ocr" },
      { label: "Combine images into a single PDF", href: "/en/image-to-pdf" },
    ],
    solutionLink: {
      label: "Document handling for small businesses",
      href: "/en/solutions/small-businesses",
    },
    labels,
    emptyState: "No table structure was detected in this image. Try a flatter, better-lit capture.",
    errorState: "This image could not be processed. Nothing was charged against your allowance.",
    a11y: {
      uploadLabel: "Upload an image of a table",
      previewLabel: "Preview of the uploaded image",
    },
  },

  "ocr-api": {
    name: "OCR API",
    title: "OCR API — Planned Programmatic Extraction (Coming Soon)",
    description:
      "The EasyInvoiceOCR HTTP API is not yet available and does not accept requests. This page describes the interface being designed, so integrators can plan against it.",
    eyebrow: "Coming soon",
    heading: "The OCR API is not available yet",
    lede: "This page describes an interface that is being designed. There is no endpoint accepting requests, no key to obtain and no timetable being promised. It exists so that anyone planning an integration can see the intended shape early.",
    what: [
      "The API is intended for teams that already have a system receiving invoices — an ERP, a procurement tool, an internal dashboard — and would rather have extraction happen there than in a browser tab.",
      "Nothing described below is live. The endpoints do not exist, no credentials are issued, and no request will succeed. Treat this page as a design note, not as documentation for something you can call today.",
      "It is published early for one reason: an integrator deciding between vendors deserves to know what is planned and what is not, rather than discovering the gap after committing.",
    ],
    fields: [
      {
        group: "Planned operations",
        items: [
          "Submit a document for extraction",
          "Check the processing status of a submission",
          "Retrieve the structured result",
          "List previously submitted documents",
          "Delete a document and its record",
        ],
      },
      {
        group: "Planned response contents",
        items: [
          "Document metadata and status",
          "Invoice-level fields with a confidence value",
          "A line-item array",
          "Detected currency and locale hints",
          "Page count",
        ],
      },
    ],
    audience: [
      { title: "Product teams", body: "Adding document capture to an existing application." },
      {
        title: "Internal tooling",
        body: "Automating an inbox of supplier invoices into a database.",
      },
      {
        title: "Integrators",
        body: "Connecting extraction to an accounting package on a client's behalf.",
      },
    ],
    formats: [
      "The planned interface targets the same inputs as the browser tools: PDF, JPG, PNG and WebP.",
      "No upload endpoint is live, so no size or rate limit is in force.",
    ],
    capabilities: [
      {
        title: "Not accepting requests",
        body: "There is no live endpoint. Any call you make today will fail, because nothing is listening.",
      },
      {
        title: "No keys are issued",
        body: "There is no key management, no developer account area and no way to authenticate. API access is not part of any current plan.",
      },
      {
        title: "Design goals, not features",
        body: "Idempotent submission, a stable machine-readable error envelope and explicit rate-limit headers are what the interface is being designed around. None of them is implemented.",
      },
      {
        title: "No SDK and no webhooks",
        body: "Neither exists. They are absent from this page rather than described as though they worked.",
      },
    ],
    security,
    faqs: [
      {
        q: "Is the API available today?",
        a: "No. It does not accept requests. There is no endpoint, no key and no sandbox.",
      },
      {
        q: "Is API access included in the Business plan?",
        a: "No. API access is not part of any current plan and is not billed. If that changes, the plan pages will say so before the endpoint opens.",
      },
      {
        q: "When will it be available?",
        a: "There is no date to give. Announcing one before the endpoint is built and tested would be a guess, and integration plans should not be built on a guess.",
      },
      {
        q: "What can I use in the meantime?",
        a: "The browser tools do the same extraction today. Invoice OCR, the PDF invoice parser and Receipt to Excel all run without an API.",
      },
    ],
    cta: {
      label: "Use the browser tools instead",
      href: "/en/invoice-ocr",
      note: "The API accepts no requests. The browser tools do the same extraction today.",
    },
    relatedGuides: [
      {
        label: "A developer's checklist for evaluating an OCR API",
        href: "/en/blog/choosing-ocr-api",
      },
      {
        label: "What to ask a document processor about your data",
        href: "/en/blog/gdpr-document-processing",
      },
    ],
    relatedTools: [
      { label: "Extract invoices in the browser today", href: "/en/invoice-ocr" },
      { label: "Parse multi-page PDF invoices", href: "/en/pdf-invoice-parser" },
    ],
    solutionLink: { label: "Notes for developers", href: "/en/solutions/developers" },
    labels,
    emptyState: "There is nothing to show: the API is not operational.",
    errorState: "The API is not available. No request can succeed yet.",
    a11y: { uploadLabel: "Upload is unavailable", previewLabel: "No preview is available" },
  },
};
