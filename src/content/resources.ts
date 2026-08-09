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

// Blog content moved to src/content/blog.ts, which carries a complete
// English, French and Arabic version of every article rather than one shared
// English body. This file keeps documentation, help and FAQ content.
