import { path } from "@/config/nav";

export type ProductFaq = { q: string; a: string };

export type Product = {
  slug: string;
  route: string;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  what: string[];
  fields: { group: string; items: string[] }[];
  audience: { title: string; body: string }[];
  formats: string[];
  capabilities: { title: string; body: string }[];
  security: string[];
  faqs: ProductFaq[];
};

const sharedSecurity = [
  "Files are transferred over HTTPS/TLS only.",
  "Documents are held in private storage — never in a public bucket — and are read through short-lived signed URLs.",
  "Extraction runs server-side; API credentials are never exposed to the browser.",
  "Invoice contents are not written to application logs.",
  "You can delete a document at any time, which removes both the stored file and its extracted record.",
];

export const products: Product[] = [
  {
    slug: "invoice-ocr",
    route: path("invoice-ocr"),
    name: "Invoice OCR",
    title: "Invoice OCR — Extract Invoice Data From PDFs and Scans",
    description:
      "Upload a PDF or image invoice and get vendor, invoice number, dates, tax, totals and line items as structured, editable data you can export to Excel, CSV or JSON.",
    eyebrow: "Product",
    heading: "Invoice OCR that returns structured, editable invoice data",
    lede: "Drop in a PDF, scan or phone photo of an invoice. EasyInvoiceOCR reads the document, returns every field with a confidence value, and lets you correct anything before exporting to Excel, CSV or JSON.",
    what: [
      "Invoice OCR is optical character recognition combined with document understanding. Plain OCR gives you a wall of text; invoice OCR also decides which piece of text is the invoice number, which is the due date, and which numbers belong to which line item.",
      "That distinction is what makes the output usable. Instead of retyping an invoice into a spreadsheet, you review a structured record where each field is already filled in and every value stays editable.",
      "Low-confidence values are highlighted so review time goes to the fields that actually need a human, not to the whole document.",
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
      {
        title: "Developers",
        body: "Teams that want the same extraction behind an HTTP call instead of a browser upload.",
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
        body: "Drop a file onto the upload area, pick it from your device, or paste it in. MIME type and size are validated before anything is sent.",
      },
      {
        title: "Progress you can see",
        body: "Upload, preparation, reading and field extraction are reported as distinct stages, so a slow document never looks like a frozen page.",
      },
      {
        title: "Side-by-side review",
        body: "The original document sits next to the extracted fields, so you can verify a value without opening the source file separately.",
      },
      {
        title: "Editable line items",
        body: "Add, remove, reorder and correct rows. Totals recalculate as you edit so the exported figures stay internally consistent.",
      },
      {
        title: "Three export formats",
        body: "Excel (.xlsx) with a summary sheet and a line-item sheet, CSV for imports, and JSON for systems that consume the raw record.",
      },
      {
        title: "Honest failure states",
        body: "Unsupported file, oversized file, unreadable scan, empty result and provider failure each produce a specific message and a way forward.",
      },
    ],
    security: sharedSecurity,
    faqs: [
      {
        q: "Does it work on scanned invoices and photos?",
        a: "Yes. Both native PDFs and images captured with a phone are supported. Accuracy depends on the source: a straight, well-lit, in-focus capture reads far better than a skewed low-resolution one, and every field stays editable either way.",
      },
      {
        q: "What happens to a field the engine is unsure about?",
        a: "It is returned with a low confidence value and highlighted in the review panel so you check it before exporting.",
      },
      {
        q: "Are multi-page invoices supported?",
        a: "Yes — a multi-page PDF is treated as one document, and line items spanning pages are collected into a single table.",
      },
      {
        q: "Which languages and currencies are handled?",
        a: "Extraction handles international number, date and currency formats, and Latin and Arabic script documents. The interface itself is currently English only.",
      },
    ],
  },
  {
    slug: "receipt-to-excel",
    route: path("receipt-to-excel"),
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
      {
        group: "Items",
        items: ["Item description", "Quantity", "Unit price", "Line total"],
      },
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
    security: sharedSecurity,
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
        a: "It is returned as an empty result with a clear explanation, and it is listed separately in the batch so you can re-shoot or enter it manually.",
      },
    ],
  },
  {
    slug: "pdf-invoice-parser",
    route: path("pdf-invoice-parser"),
    name: "PDF Invoice Parser",
    title: "PDF Invoice Parser — Extract Data From Native and Scanned PDFs",
    description:
      "Parse single and multi-page PDF invoices, native or scanned, with page navigation, invoice-level and line-item extraction, review and structured export.",
    eyebrow: "Product",
    heading: "Parse PDF invoices — native text or scanned image",
    lede: "Upload a PDF invoice of any kind. Text-based PDFs are read directly, scanned pages go through OCR, and multi-page documents keep their page structure so you can check any value against the page it came from.",
    what: [
      "There are two kinds of PDF invoice and they need different handling. A native PDF exported from accounting software contains a real text layer. A scanned PDF is a picture of paper wrapped in a PDF container, with no text at all.",
      "The parser detects which kind it is given and routes it accordingly, so you do not have to know or care which you have.",
      "Multi-page documents are common in supplier billing — a summary page followed by pages of line items. Pages are kept navigable, and line items are collected across page boundaries into one table.",
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
      "Scanned PDF (image pages, processed with OCR)",
      "Multi-page PDFs",
      "Up to 20 MB per file",
    ],
    capabilities: [
      {
        title: "Page navigation",
        body: "Move between pages of the source document while reviewing, with the current page indicated.",
      },
      {
        title: "Native vs scanned detection",
        body: "The document is inspected for a text layer and routed to direct parsing or OCR automatically.",
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
    security: sharedSecurity,
    faqs: [
      {
        q: "Can it handle password-protected PDFs?",
        a: "No. An encrypted PDF is rejected with a message asking you to remove the password and re-upload — the file is not stored.",
      },
      {
        q: "What is the page limit?",
        a: "Page count is limited by file size (20 MB) and your plan's monthly page allowance. Each parsed page counts as one page.",
      },
      {
        q: "Does it detect several invoices inside one PDF?",
        a: "Multiple-invoice splitting depends on the configured extraction backend. When the backend does not support it the file is treated as a single document, and the interface says so rather than silently returning partial data.",
      },
      {
        q: "Is the original PDF kept?",
        a: "It stays in private storage so you can re-open it during review, and it is removed when you delete the document.",
      },
    ],
  },
  {
    slug: "image-to-excel",
    route: path("image-to-excel"),
    name: "Image to Excel",
    title: "Image to Excel — Convert Photographed Tables Into .xlsx",
    description:
      "Upload a JPG, PNG or WebP of a table or document, preview it, extract the structured rows and columns, edit them, and download a real Excel workbook.",
    eyebrow: "Product",
    heading: "Photograph a table, download a spreadsheet",
    lede: "Upload an image of a printed table, statement or invoice. The rows and columns are detected, shown as an editable grid, and exported to a genuine .xlsx workbook — with numbers as numbers and dates as dates.",
    what: [
      "Plenty of financial data still arrives as a picture: a photo of a printed statement, a screenshot from a portal that has no export button, a scan of a supplier price list.",
      "Image to Excel finds the table structure inside that picture and gives you the grid back, so you can work with the values instead of squinting at them.",
      "The output is a real workbook produced by a spreadsheet writer — not a renamed CSV and not an empty file with a promising name.",
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
      {
        title: "Bookkeepers",
        body: "Statements and ledgers that only exist on paper.",
      },
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
    security: sharedSecurity,
    faqs: [
      {
        q: "What if the image contains no table?",
        a: "You get an explicit empty state explaining that no table structure was detected, with tips for a better capture. No file downloads.",
      },
      {
        q: "Are the numbers usable in formulas?",
        a: "Yes — numeric cells are written as numeric types, so SUM and friends work without a text-to-columns step.",
      },
      {
        q: "Can I get CSV or JSON instead?",
        a: "Yes, the same grid exports to CSV and JSON.",
      },
      {
        q: "Does it handle rotated or skewed photos?",
        a: "Mild rotation is tolerated. Heavily skewed or partially cropped tables reduce accuracy — the preview shows you what was read before you export.",
      },
    ],
  },
  {
    slug: "ocr-api",
    route: path("ocr-api"),
    name: "OCR API",
    title: "OCR API — Programmatic Invoice and Receipt Extraction",
    description:
      "HTTP API for submitting invoices and receipts and retrieving structured JSON. Authentication, endpoints, request and response examples, error codes and rate limits.",
    eyebrow: "Developers",
    heading: "The same extraction, behind an HTTP call",
    lede: "Submit a document, poll for status, retrieve structured JSON. The API surface is documented in full below and in the API Reference.",
    what: [
      "The OCR API is intended for teams that already have a system receiving invoices — an ERP, a procurement tool, an internal ops dashboard — and want extraction to happen there rather than in a browser tab.",
      "It is a small surface on purpose: upload a document, check its status, fetch the extraction, list what you have, delete what you no longer need.",
      "Responses are plain JSON with a stable field layout, so you can map it into your own schema once and leave it alone.",
    ],
    fields: [
      {
        group: "Endpoints",
        items: [
          "POST /v1/documents — submit a document",
          "GET /v1/documents/{id} — processing status",
          "GET /v1/documents/{id}/extraction — structured result",
          "GET /v1/documents — list documents",
          "DELETE /v1/documents/{id} — delete a document and its file",
        ],
      },
      {
        group: "Response payload",
        items: [
          "Document metadata and status",
          "Invoice-level fields with confidence",
          "Line items array",
          "Detected currency and locale hints",
          "Timing and page count",
        ],
      },
    ],
    audience: [
      {
        title: "Product teams",
        body: "Adding document capture to an existing application.",
      },
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
      "PDF (native and scanned)",
      "JPG / JPEG",
      "PNG",
      "WebP",
      "multipart/form-data upload, up to 20 MB",
    ],
    capabilities: [
      {
        title: "API key authentication",
        body: "A single bearer token per workspace, sent in the Authorization header. Keys are shown once at creation and can be revoked.",
      },
      {
        title: "Asynchronous processing",
        body: "Submission returns immediately with a document id and a queued status; extraction is fetched once processing completes.",
      },
      {
        title: "Idempotency",
        body: "An Idempotency-Key header on submission makes retries safe after a network failure.",
      },
      {
        title: "Rate limits",
        body: "Per-key limits are reported on every response through X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset.",
      },
      {
        title: "Predictable errors",
        body: "One error envelope for every failure, with a machine-readable code and a human message.",
      },
      {
        title: "No secrets in docs",
        body: "Every example uses the literal placeholder YOUR_API_KEY. No live credential appears anywhere in the documentation.",
      },
    ],
    security: sharedSecurity,
    faqs: [
      {
        q: "Is the API available today?",
        a: "No. The API is documented and specified, but the endpoints are not live yet — they are marked Planned throughout the API Reference. The documentation is published now so integrators can design against a stable contract.",
      },
      {
        q: "How will I get a key?",
        a: "API key management arrives with the developer account area. Until then, contact us and describe your integration so we can notify you when keys are issued.",
      },
      {
        q: "Are there webhooks?",
        a: "Webhooks are not implemented. They are deliberately absent from the reference rather than documented as if they worked.",
      },
      {
        q: "Is there an SDK?",
        a: "No SDK exists. The reference shows plain cURL, JavaScript fetch and Python requests examples, which is all the API needs.",
      },
    ],
  },
];

export const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
