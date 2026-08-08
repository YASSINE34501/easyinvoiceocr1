/** Editorial content for Documentation, Help Center and Blog. English source. */

export type DocSection = {
  id: string;
  title: string;
  body: string[];
  list?: string[];
};

export type DocChapter = {
  slug: string;
  title: string;
  summary: string;
  sections: DocSection[];
};

export const docChapters: DocChapter[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary: "Create an account, upload your first document and export the result.",
    sections: [
      {
        id: "create-account",
        title: "Create an account",
        body: [
          "Sign up with an email address and a password of at least eight characters containing letters and numbers, or continue with Google. A confirmation email is sent immediately; your account becomes active once you follow the link inside it.",
          "You can use the demo workspace on any product page without an account. Documents processed there stay in your browser and are never uploaded.",
        ],
      },
      {
        id: "first-upload",
        title: "Upload your first document",
        body: [
          "Drag a file onto the upload card or use the file picker. Accepted formats are PDF, JPG, PNG and WebP up to 20 MB. Multi-page PDFs are processed page by page and returned as one result.",
        ],
        list: [
          "Photographs should be taken straight on, with the whole document inside the frame.",
          "Scans of 300 DPI or higher give the most reliable line-item detection.",
          "Password-protected PDFs must be unlocked before upload.",
        ],
      },
      {
        id: "review-export",
        title: "Review and export",
        body: [
          "Every extracted field carries a confidence score. Fields below 85% are flagged so you can correct them before exporting. Edits you make are used in the export immediately.",
          "Exports are generated in your browser: Excel (.xlsx) with a summary sheet and a line-item sheet, CSV encoded UTF-8 with a byte-order mark so accented and Arabic characters survive Excel, and JSON matching the API response shape.",
        ],
      },
    ],
  },
  {
    slug: "supported-documents",
    title: "Supported documents",
    summary: "Formats, languages, size limits and what the extractor reads.",
    sections: [
      {
        id: "formats",
        title: "File formats and limits",
        body: ["The following inputs are accepted on every plan."],
        list: [
          "PDF — native text or scanned, up to 50 pages per file.",
          "JPG, PNG, WebP — single-page images up to 20 MB.",
          "Maximum file size: 20 MB per document.",
        ],
      },
      {
        id: "languages",
        title: "Languages and scripts",
        body: [
          "Latin, Arabic and Cyrillic scripts are supported, including right-to-left layouts and mixed-script invoices. Dates are normalised to ISO 8601 and amounts to a decimal point, whatever the source formatting.",
        ],
      },
      {
        id: "fields",
        title: "Fields returned",
        body: ["Invoice-level fields and a line-item array are returned for every document."],
        list: [
          "Vendor name, address and tax identifier.",
          "Invoice number, invoice date and due date.",
          "Subtotal, tax amount, total and currency.",
          "Line items: description, quantity, unit price, tax and total.",
        ],
      },
    ],
  },
  {
    slug: "exports-and-integrations",
    title: "Exports and integrations",
    summary: "Excel, CSV and JSON output, plus how the API fits in.",
    sections: [
      {
        id: "excel",
        title: "Excel workbooks",
        body: [
          "The .xlsx export contains two sheets. 'Invoice Summary' lists each field with its value and confidence. 'Line Items' contains one row per line, ready to pivot or import into your accounting package.",
        ],
      },
      {
        id: "csv",
        title: "CSV",
        body: [
          "CSV exports contain the line items only, comma-separated and UTF-8 encoded with a BOM. Open them directly in Excel, Numbers or Google Sheets without a character-set prompt.",
        ],
      },
      {
        id: "api",
        title: "API access",
        body: [
          "The REST API mirrors the interface: upload a document, poll its status, then retrieve the extraction. The full contract is published in the API Reference. Endpoints are documented and stable, and are marked as planned until the public beta opens.",
        ],
      },
    ],
  },
  {
    slug: "accuracy-and-review",
    title: "Accuracy and review",
    summary: "How confidence scores work and how to correct a result.",
    sections: [
      {
        id: "confidence",
        title: "Confidence scores",
        body: [
          "Each field is scored between 0 and 1. Above 0.95 the value matched cleanly. Between 0.85 and 0.95 the value is probably right but worth a glance. Below 0.85 the field is highlighted for review.",
        ],
      },
      {
        id: "corrections",
        title: "Correcting a field",
        body: [
          "Click any value in the results table to edit it. Line items can be edited, added or removed. Corrections apply to the exported file straight away.",
        ],
      },
    ],
  },
  {
    slug: "security-and-data",
    title: "Security and data handling",
    summary: "Where documents live, who can read them and how to delete them.",
    sections: [
      {
        id: "isolation",
        title: "Account isolation",
        body: [
          "Documents belong to the account that uploaded them. Database row-level security means a request for another account's document returns nothing at all — there is no shared-read path, even for a valid signed-in session.",
        ],
      },
      {
        id: "deletion",
        title: "Deleting data",
        body: [
          "Delete an individual document from the dashboard, or delete your entire account from Account settings. Account deletion removes your profile, documents and extractions immediately and cannot be undone.",
        ],
      },
    ],
  },
  {
    slug: "file-converters",
    title: "File converters",
    summary: "PDF to Word, Image to Word and Image to PDF — what they do and where they stop.",
    sections: [
      {
        id: "pdf-to-word",
        title: "PDF to Word",
        body: [
          "Converts a PDF into an editable .docx. Pages with a text layer are read directly; pages that are scanned images go through text recognition. A document that mixes both is handled page by page.",
          "Paragraphs, headings, bulleted and numbered lists and column-aligned tables are reconstructed. Page order is preserved and each source page starts a new page in the result.",
          "Exact visual layout is not reproduced: multi-column pages become a single reading order, and decorative elements, logos and precise fonts are not carried across.",
        ],
      },
      {
        id: "image-to-word",
        title: "Image to Word",
        body: [
          "Turns one or many JPG, PNG or WebP images into a .docx. Images can be reordered, rotated and removed before conversion, and the order on screen is the order in the document.",
          "Two outputs are offered. Recognised text produces editable content you can correct before it is written. Inserting the original images places each picture on its own page, which is the right choice when the page itself is the record — a signed form, a stamped invoice.",
        ],
        list: [
          "Up to 40 images per document",
          "Each image counts as one page against your allowance",
          "Recognised text is shown for review before anything is written",
        ],
      },
      {
        id: "image-to-pdf",
        title: "Image to PDF",
        body: [
          "Combines images into a single PDF entirely inside your browser — nothing is uploaded. Page size (automatic, A4 or Letter), orientation, margins, image fitting and output quality are all under your control.",
          "The pages are pictures, so the result is not searchable. Use Image to Word when you need the text itself.",
        ],
      },
      {
        id: "where-conversion-runs",
        title: "Where conversion runs",
        body: [
          "All three converters run in your browser. Your file is not uploaded to us or to any third party. The only network requests are for the recognition engine and its language files, which are static assets.",
          "A conversion job record is still written on our side — the filename, size, page count and outcome — because that is what your page allowance is measured against. Document contents are never stored or logged.",
        ],
      },
    ],
  },
  {
    slug: "plans-and-billing",
    title: "Plans, trial and billing",
    summary: "How the 30-day trial, the page allowance and PayPal subscriptions work.",
    sections: [
      {
        id: "trial",
        title: "The 30-day trial",
        body: [
          "After confirming your email address you are offered a choice: start a 30-day free trial, or subscribe immediately. You can do one or the other, never both at once.",
          "The trial has to be started explicitly — it does not begin when you create an account, and no payment method is taken. It includes 100 pages for the whole trial, and that allowance does not reset partway through.",
          "A trial can be used once per account. That rule is enforced on our servers, not in the browser, so it cannot be worked around by clearing storage or creating a new session.",
        ],
      },
      {
        id: "allowance",
        title: "How the page allowance is counted",
        body: [
          "One page of a PDF, or one image, counts as one page. The count is reserved before a conversion starts, so two tabs cannot both spend the last page.",
          "A conversion that fails does not cost you anything: the reservation is released. Retrying the same conversion reuses its reservation rather than charging twice.",
        ],
      },
      {
        id: "subscriptions",
        title: "Subscriptions and cancellation",
        body: [
          "Paid plans are billed through PayPal. Your subscription becomes active only once PayPal confirms it — approving in the PayPal window is not by itself what unlocks the plan.",
          "Cancelling is done through PayPal from the billing page. Access continues until the end of the period you have already paid for, and your documents are not deleted because a payment failed.",
        ],
      },
      {
        id: "advertising",
        title: "Advertising",
        body: [
          "Free and trial accounts may see advertising on public pages with substantial content — never inside an upload area, next to a conversion or download control, or on account, billing or legal pages.",
          "Paid Pro and Business accounts see no advertising at all.",
        ],
      },
    ],
  },
];

export const docBySlug = Object.fromEntries(docChapters.map((c) => [c.slug, c]));

export type HelpArticle = {
  slug: string;
  category: string;
  question: string;
  answer: string[];
};

export const helpCategories = [
  "Getting started",
  "Uploads and formats",
  "Accuracy",
  "Exports",
  "Account and billing",
  "Privacy and security",
] as const;

export const helpArticles: HelpArticle[] = [
  {
    slug: "which-file-types",
    category: "Uploads and formats",
    question: "Which file types can I upload?",
    answer: [
      "PDF, JPG, PNG and WebP, up to 20 MB per file. PDFs may be native text or scanned images, and may contain up to 50 pages.",
      "If your file is a HEIC photo from an iPhone, export it as JPG first — HEIC is not accepted.",
    ],
  },
  {
    slug: "file-too-large",
    category: "Uploads and formats",
    question: "My file is rejected as too large. What can I do?",
    answer: [
      "The limit is 20 MB. Re-scan at 300 DPI rather than 600, or split a long PDF into several files. Scanning in greyscale rather than colour typically halves the size with no loss of accuracy.",
    ],
  },
  {
    slug: "improve-accuracy",
    category: "Accuracy",
    question: "How can I improve extraction accuracy?",
    answer: [
      "Photograph documents flat, in even light, with all four corners visible. Avoid shadows across the total line.",
      "For scans, 300 DPI black-and-white or greyscale is ideal. Crumpled receipts scan better flattened under glass.",
    ],
  },
  {
    slug: "wrong-total",
    category: "Accuracy",
    question: "A total was read incorrectly. What now?",
    answer: [
      "Click the field in the results table and type the correct value. The corrected value is what gets exported.",
      "If a document type is consistently misread, send it to us through the Contact page and we will use it to improve the model.",
    ],
  },
  {
    slug: "excel-arabic",
    category: "Exports",
    question: "Arabic text looks broken when I open the CSV in Excel.",
    answer: [
      "Our CSV files are UTF-8 with a byte-order mark, which Excel reads correctly. If you re-saved the file from another tool the BOM may have been stripped — re-export from EasyInvoiceOCR and open the fresh file.",
      "The .xlsx export is unaffected by character-set settings and is the safer choice for non-Latin scripts.",
    ],
  },
  {
    slug: "export-formats",
    category: "Exports",
    question: "What export formats are available?",
    answer: [
      "Excel (.xlsx) with a summary sheet and a line-item sheet, CSV of the line items, and JSON matching the API response shape.",
    ],
  },
  {
    slug: "forgot-password",
    category: "Account and billing",
    question: "I forgot my password.",
    answer: [
      "Use the 'Forgot your password?' link on the login page. If an account exists for the address you enter, a reset link arrives within a few minutes. The link is single-use and expires after one hour.",
    ],
  },
  {
    slug: "change-email",
    category: "Account and billing",
    question: "Can I change my email address?",
    answer: [
      "The email on an account cannot be changed today. Create an account with the new address and delete the old one from Account settings once you have moved over.",
    ],
  },
  {
    slug: "delete-account",
    category: "Privacy and security",
    question: "How do I delete my account and data?",
    answer: [
      "Open Account settings, scroll to 'Delete account', type DELETE to confirm and submit. Your profile, documents and extractions are removed immediately and permanently.",
    ],
  },
  {
    slug: "who-can-see",
    category: "Privacy and security",
    question: "Can anyone else see my documents?",
    answer: [
      "No. Every document row is tied to the account that created it and protected by database row-level security, so another signed-in account requesting your document id receives an empty result.",
    ],
  },
  {
    slug: "first-document",
    category: "Getting started",
    question: "How do I process my first document?",
    answer: [
      "Open any product page, drop a file onto the upload card and wait a few seconds. Review the highlighted low-confidence fields, then export.",
      "No account is needed to try it: demo processing happens in your browser.",
    ],
  },
  {
    slug: "free-plan",
    category: "Account and billing",
    question: "What is included in the free trial?",
    answer: [
      "Thirty days, 100 pages in total, and access to every standard converter with all export formats. No payment card and no PayPal charge.",
      "The trial has to be started explicitly from the plan page, and it can only be used once per account.",
    ],
  },
  {
    slug: "trial-ended",
    category: "Account and billing",
    question: "My trial has ended. What happens to my files?",
    answer: [
      "Nothing is deleted. Your account stays open, you can still sign in, view your plan and manage the files you already have under the retention policy.",
      "New conversions need a paid subscription. Pro and Business options are on the plan page.",
    ],
  },
  {
    slug: "convert-pdf-to-word",
    category: "Uploads and formats",
    question: "How do I convert a PDF to an editable Word file?",
    answer: [
      "Open PDF to Word, drop the PDF onto the upload card and wait while it is read. Scanned pages take a few extra seconds because the text has to be recognised.",
      "The recognised text is shown for review — correct anything that was misread — and the .docx is built from what you approved.",
    ],
  },
  {
    slug: "converter-privacy",
    category: "Privacy and security",
    question: "Are my files uploaded when I use a converter?",
    answer: [
      "No. PDF to Word, Image to Word and Image to PDF all run inside your browser, and your file is never sent to us or to a third party.",
      "We do record the conversion itself — filename, size, page count and whether it succeeded — because that is what your page allowance is measured against. The contents of your document are never stored or logged.",
    ],
  },
  {
    slug: "word-layout-differs",
    category: "Accuracy",
    question: "Why doesn't my Word file look exactly like the PDF?",
    answer: [
      "The converters aim for editable content in the right order — paragraphs, headings, lists and tables — not a pixel copy. Multi-column layouts become a single reading order, and decorative elements, exact fonts and spacing are not carried across.",
      "For pages where appearance matters more than text, Image to Word can insert the original image instead of recognised text.",
    ],
  },
  {
    slug: "no-ads-paid",
    category: "Account and billing",
    question: "Will I see advertising?",
    answer: [
      "Paid Pro and Business accounts never see advertising. Free and trial accounts may see it on public content pages only — never inside an upload area, beside a convert or download button, or on account, billing and legal pages.",
      "Advertising also requires your consent, which you can change at any time from “Cookie settings” in the footer.",
    ],
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  updated?: string;
  readingMinutes: number;
  author: string;
  featured?: boolean;
  body: { heading?: string; paragraphs: string[]; list?: string[] }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "invoice-ocr-accuracy-guide",
    title: "What invoice OCR accuracy actually means",
    description:
      "Vendor accuracy claims are rarely comparable. Here is how field-level accuracy is measured, and which numbers matter for accounts payable.",
    category: "Accuracy",
    date: "2026-06-18",
    readingMinutes: 7,
    author: "EasyInvoiceOCR team",
    featured: true,
    body: [
      {
        paragraphs: [
          "Every OCR vendor publishes an accuracy figure, and almost none of them describe how it was measured. A 99% character accuracy rate sounds excellent until you realise a single wrong digit in a total makes the whole invoice unusable.",
        ],
      },
      {
        heading: "Character accuracy versus field accuracy",
        paragraphs: [
          "Character accuracy counts individual glyphs. Field accuracy asks a stricter question: is the extracted total exactly equal to the total on the page? For accounts payable, only field accuracy matters, and it is always the lower number.",
          "When you compare tools, insist on field-level numbers for the fields you actually post to your ledger: vendor, invoice number, date, tax and total.",
        ],
      },
      {
        heading: "Why confidence scores matter more than averages",
        paragraphs: [
          "A model that is right 92% of the time and knows when it is unsure beats a model that is right 96% of the time and is confidently wrong. Confidence scores turn extraction into a review queue: you check the flagged 8% and trust the rest.",
        ],
        list: [
          "Above 0.95 — accept without review in most workflows.",
          "0.85 to 0.95 — spot-check on high-value invoices.",
          "Below 0.85 — always review before posting.",
        ],
      },
      {
        heading: "Measure on your own documents",
        paragraphs: [
          "Take twenty invoices that represent your real mix of suppliers, formats and languages, and run them through any tool you are evaluating. Twenty documents from your own inbox tell you more than any published benchmark.",
        ],
      },
    ],
  },
  {
    slug: "receipts-to-spreadsheet-workflow",
    title: "A practical monthly workflow for turning receipts into a spreadsheet",
    description:
      "A repeatable routine for freelancers and small teams: capture, extract, review and archive, in under thirty minutes a month.",
    category: "Workflows",
    date: "2026-05-02",
    readingMinutes: 6,
    author: "EasyInvoiceOCR team",
    body: [
      {
        paragraphs: [
          "Receipt admin is unpleasant because it is done in one painful session at the end of the quarter. Split into four small steps done monthly, it takes half an hour.",
        ],
      },
      {
        heading: "Capture as you go",
        paragraphs: [
          "Photograph each receipt when you receive it and drop it in one folder. Flat, well-lit, all corners visible. This is the only step that has to happen throughout the month.",
        ],
      },
      {
        heading: "Extract in one batch",
        paragraphs: [
          "Once a month, run the folder through extraction and export a single spreadsheet. Line items, dates, taxes and totals arrive already typed as numbers and dates.",
        ],
      },
      {
        heading: "Review only what is flagged",
        paragraphs: [
          "Sort by confidence and correct the handful of low-confidence fields. Faded thermal receipts are the usual culprits.",
        ],
      },
      {
        heading: "Archive the originals",
        paragraphs: [
          "Keep the images alongside the spreadsheet. Most tax authorities accept digital copies, and your future self will want the original when a line is queried.",
        ],
      },
    ],
  },
  {
    slug: "multilingual-invoice-extraction",
    title: "Extracting data from invoices in Arabic, French and mixed scripts",
    description:
      "Right-to-left layouts, Eastern Arabic numerals and mixed-language invoices break naive parsers. Here is what to watch for.",
    category: "Product",
    date: "2026-03-21",
    updated: "2026-06-01",
    readingMinutes: 8,
    author: "EasyInvoiceOCR team",
    body: [
      {
        paragraphs: [
          "An invoice issued in Riyadh may carry Arabic vendor details, English item descriptions, Eastern Arabic numerals in the header and Western digits in the totals table. Handling that mix is a layout problem as much as a character-recognition one.",
        ],
      },
      {
        heading: "Reading order is not visual order",
        paragraphs: [
          "In right-to-left documents the label sits to the right of its value. A parser that assumes left-to-right pairing attaches every label to the wrong field, producing confident nonsense.",
        ],
      },
      {
        heading: "Numeral systems",
        paragraphs: [
          "Eastern Arabic numerals must be normalised before any arithmetic check can run. We normalise all digits to Western form and all dates to ISO 8601 before validating that line items sum to the stated subtotal.",
        ],
      },
      {
        heading: "Validate with arithmetic",
        paragraphs: [
          "The strongest signal that a multilingual extraction is correct is not the OCR confidence — it is whether the numbers add up. When subtotal plus tax equals the total, the parse is almost certainly right.",
        ],
      },
    ],
  },
  {
    slug: "gdpr-document-processing",
    title: "GDPR questions to ask before uploading invoices to any OCR service",
    description:
      "Invoices contain personal data. Five questions to put to a vendor before your first upload, and what a good answer looks like.",
    category: "Security",
    date: "2026-01-29",
    readingMinutes: 5,
    author: "EasyInvoiceOCR team",
    body: [
      {
        paragraphs: [
          "Supplier invoices routinely contain names, addresses, bank details and sometimes signatures. Uploading them to a third party is processing personal data, and it deserves the same scrutiny as any other processor relationship.",
        ],
      },
      {
        heading: "The five questions",
        paragraphs: ["Ask these before your first upload, and get the answers in writing."],
        list: [
          "Where are documents stored, and in which jurisdictions?",
          "How long are they retained after processing, and can I force deletion?",
          "Are my documents used to train models? If so, can I opt out?",
          "Who inside the vendor can read my documents, and is that access logged?",
          "Is there a data processing agreement, and does it list sub-processors?",
        ],
      },
      {
        heading: "What a good answer looks like",
        paragraphs: [
          "A clear retention window, deletion on demand, no training on customer documents by default, access limited and logged, and a DPA you can actually read. Vagueness on any of these is itself an answer.",
        ],
      },
    ],
  },
  {
    slug: "line-item-extraction-hard",
    title: "Why line-item extraction is harder than reading the total",
    description:
      "Totals sit in predictable places. Tables do not. A look at why line items are the real test of a document parser.",
    category: "Accuracy",
    date: "2025-11-14",
    readingMinutes: 6,
    author: "EasyInvoiceOCR team",
    body: [
      {
        paragraphs: [
          "Finding the total on an invoice is a solved problem: it is the largest number near the word 'total' at the bottom right. Reconstructing a table of twenty lines that wraps across two pages is not.",
        ],
      },
      {
        heading: "Tables without borders",
        paragraphs: [
          "Many invoice templates use whitespace instead of rules to separate columns. Column boundaries have to be inferred from alignment, and a single wrapped description can shift every value on the row.",
        ],
      },
      {
        heading: "Page breaks",
        paragraphs: [
          "When a table continues onto page two, headers may or may not repeat, and a running subtotal may appear that is not a line item at all. Treating it as one silently inflates the parse.",
        ],
      },
      {
        heading: "Arithmetic as a safety net",
        paragraphs: [
          "We check that quantity times unit price equals the line total, and that the lines sum to the subtotal. When they do not, the affected rows are flagged rather than exported silently.",
        ],
      },
    ],
  },
  {
    slug: "choosing-ocr-api",
    title: "Choosing an OCR API: a checklist for developers",
    description:
      "Latency, idempotency, error envelopes and versioning matter more than model marketing. What to check before you integrate.",
    category: "Developers",
    date: "2025-09-08",
    readingMinutes: 7,
    author: "EasyInvoiceOCR team",
    body: [
      {
        paragraphs: [
          "Integrating a document API is a long-term commitment. The extraction quality gets all the attention, but the operational details determine how much of your time it consumes afterwards.",
        ],
      },
      {
        heading: "Look for these in the documentation",
        paragraphs: [
          "If any of these is missing from the public docs, assume it is missing from the product.",
        ],
        list: [
          "A stable error envelope with machine-readable codes, not prose messages.",
          "Idempotency keys on upload, so a retry cannot create a duplicate.",
          "Explicit rate-limit headers and a documented Retry-After.",
          "Versioning via a header, with a deprecation policy in writing.",
          "Cursor pagination on list endpoints; offset pagination breaks under concurrent writes.",
        ],
      },
      {
        heading: "Test the failure paths first",
        paragraphs: [
          "Upload a corrupt PDF, an encrypted file and a blank page before you test the happy path. How an API fails tells you more about it than how it succeeds.",
        ],
      },
    ],
  },
];

export const blogBySlug = Object.fromEntries(blogPosts.map((p) => [p.slug, p]));
export const blogCategories = Array.from(new Set(blogPosts.map((p) => p.category)));
