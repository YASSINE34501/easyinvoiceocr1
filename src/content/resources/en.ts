import type { ResourcesContent } from "./types";

/**
 * English documentation and help content.
 *
 * Seven claims from the previous version were wrong and are corrected rather
 * than translated:
 *
 *   1. "30-day trial", "100 pages for the whole trial". There is no time-based
 *      trial. The allowance is five successful conversions, once per account
 *      (FREE_CONVERSION_ALLOWANCE in src/lib/billing/gate.ts).
 *   2. "You can use the demo workspace without an account" and "No account is
 *      needed to try it". ConversionGate refuses an anonymous visitor.
 *   3. "Page allowance" throughout. The allowance counts conversions, not pages.
 *   4. Documents described as uploaded, stored and protected by row-level
 *      security. Recognition runs in the browser; documents are not uploaded.
 *      Only a conversion record is stored, and RLS protects that record.
 *   5. "Up to 50 pages per file" and "up to 40 images per document". Neither
 *      cap exists in the code. The only enforced limit is 20 MB per file
 *      (DEFAULT_MAX_FILE_BYTES).
 *   6. "JSON matching the API response shape". There is no API to match.
 *   7. "Send it to us and we will use it to improve the model." Customer
 *      documents are not used for training, and promising otherwise would
 *      contradict the privacy posture stated everywhere else.
 */

export const resourcesEn: ResourcesContent = {
  docChapters: [
    {
      slug: "getting-started",
      title: "Getting started",
      summary: "Create an account, run your first conversion and export the result.",
      sections: [
        {
          id: "create-account",
          title: "Create an account",
          body: [
            "Sign up with an email address and a password of at least eight characters containing letters and numbers, or continue with Google. A confirmation email is sent immediately, and the account becomes usable once you follow the link inside it.",
            "An account is required before you can convert anything. Conversions are tied to an account so the free allowance can be counted, and so your conversion history belongs to you rather than to a browser session.",
          ],
        },
        {
          id: "first-upload",
          title: "Run your first conversion",
          body: [
            "Drag a file onto the upload card or use the file picker. PDF, JPG, PNG and WebP are accepted, up to 20 MB per file. A multi-page PDF is treated as one document and returned as a single result.",
          ],
          list: [
            "Photograph documents straight on, with all four corners inside the frame.",
            "Scans at 300 DPI or higher give the most reliable line-item detection.",
            "Password-protected PDFs must be unlocked before you upload them.",
          ],
        },
        {
          id: "review-export",
          title: "Review and export",
          body: [
            "Every extracted field carries a confidence score. Fields below 0.85 are flagged so you can correct them before exporting, and your edits are what the export contains.",
            "Exports are generated in your browser: Excel (.xlsx) with a summary sheet and a line-item sheet; CSV encoded as UTF-8 with a byte-order mark, so accented and Arabic characters survive Excel; and JSON for systems that consume the raw record.",
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
            "PDF — native text or scanned, single or multi-page.",
            "JPG, PNG and WebP — single-page images.",
            "Maximum file size: 20 MB per document. This is the only hard limit enforced.",
          ],
        },
        {
          id: "languages",
          title: "Languages and scripts",
          body: [
            "Latin and Arabic scripts are supported, including right-to-left layouts and invoices that mix both. Digits are normalised to Western form and dates to ISO 8601 before any arithmetic check runs, so a comparison is never made between two notations.",
            "Where a date format is genuinely ambiguous — 03/04/2026 is April third or March fourth depending on the issuer — the field is flagged rather than resolved by assumption.",
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
            "Line items: description, quantity, unit price, tax and line total.",
          ],
        },
      ],
    },
    {
      slug: "exports-and-integrations",
      title: "Exports",
      summary: "Excel, CSV and JSON output, and where the planned API stands.",
      sections: [
        {
          id: "excel",
          title: "Excel workbooks",
          body: [
            "The .xlsx export contains two sheets. 'Invoice Summary' lists each field with its value and confidence. 'Line Items' contains one row per line, ready to pivot or import into an accounting package.",
          ],
        },
        {
          id: "csv",
          title: "CSV",
          body: [
            "CSV exports contain the line items only, comma-separated and UTF-8 encoded with a byte-order mark. They open directly in Excel, Numbers or Google Sheets without a character-set prompt.",
          ],
        },
        {
          id: "api",
          title: "API access — coming soon",
          body: [
            "There is no working API. No endpoint accepts requests, no keys are issued, and API access is not part of any current plan. The interface being designed is described on the OCR API page so integrators can see the intended shape, but nothing there can be called today.",
          ],
        },
      ],
    },
    {
      slug: "accuracy-and-review",
      title: "Accuracy and review",
      summary: "How confidence scores work, and how to correct a result.",
      sections: [
        {
          id: "confidence",
          title: "Confidence scores",
          body: [
            "Each field is scored between 0 and 1. Above 0.95 the value matched cleanly. Between 0.85 and 0.95 it is probably right but worth a glance. Below 0.85 the field is highlighted for review.",
          ],
        },
        {
          id: "arithmetic",
          title: "Arithmetic is the stronger check",
          body: [
            "A confidence score is the engine's opinion of itself. Whether the numbers reconcile is better evidence: line items summing to the subtotal, and subtotal plus tax equalling the stated total. Rows that do not reconcile are flagged rather than exported quietly.",
          ],
        },
        {
          id: "corrections",
          title: "Correcting a field",
          body: [
            "Click any value in the results table to edit it. Line items can be edited, added or removed, and totals recalculate as you go. Corrections apply to the exported file straight away.",
          ],
        },
      ],
    },
    {
      slug: "security-and-data",
      title: "Security and data handling",
      summary: "Where documents stay, what is stored, and how to delete it.",
      sections: [
        {
          id: "local-processing",
          title: "Recognition runs in your browser",
          body: [
            "Your document is not uploaded to a server to be read. Recognition happens on your own machine, so the file's contents never reach our logs and are never held in a processing queue.",
            "The only network requests during a conversion are for the recognition engine and its language files, which are static assets.",
          ],
        },
        {
          id: "what-is-stored",
          title: "What is stored",
          body: [
            "A conversion record — the filename, size, page count and outcome — is written against your account, because that is what the free allowance is measured against. The document's contents are not part of that record.",
            "That record is protected by database row-level security: a request from another signed-in account for your record returns nothing at all. There is no shared-read path.",
          ],
        },
        {
          id: "deletion",
          title: "Deleting data",
          body: [
            "Delete an individual conversion record from your dashboard, or delete the whole account from Account settings. Account deletion removes your profile and conversion history immediately and cannot be undone.",
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
            "Converts a PDF into an editable .docx. Pages with a text layer are read directly; scanned pages go through recognition. A document mixing both is handled page by page.",
            "Paragraphs, headings, bulleted and numbered lists and column-aligned tables are reconstructed, and page order is preserved.",
            "Exact visual layout is not reproduced: multi-column pages become a single reading order, and decorative elements, logos and precise fonts are not carried across.",
          ],
        },
        {
          id: "image-to-word",
          title: "Image to Word",
          body: [
            "Turns one or several JPG, PNG or WebP images into a .docx. Images can be reordered, rotated and removed before conversion, and the order on screen is the order in the document.",
            "Two outputs are offered. Recognised text produces editable content you can correct before it is written. Inserting the original images places each picture on its own page, which is the right choice when the page itself is the record — a signed form, a stamped invoice.",
          ],
        },
        {
          id: "image-to-pdf",
          title: "Image to PDF",
          body: [
            "Combines images into a single PDF entirely inside your browser. Page size (automatic, A4 or Letter), orientation, margins, image fitting and output quality are all under your control.",
            "The pages are pictures, so the result is not searchable. Use Image to Word when you need the text itself.",
          ],
        },
      ],
    },
    {
      slug: "plans-and-billing",
      title: "Plans, free conversions and billing",
      summary: "How the five free conversions work, and how PayPal subscriptions are handled.",
      sections: [
        {
          id: "trial",
          title: "Five free conversions",
          body: [
            "Every account gets five successful conversions, free of charge and without a payment card. They are shared across every tool rather than allocated per product.",
            "This is not a monthly allowance and it does not refill. It is a one-time allocation per account, and it requires a verified email address — the allowance is granted to an authenticated account, not to a browser session.",
            "The rule is enforced on the server, so it cannot be worked around by clearing storage or signing out. After the fifth successful conversion a paid plan is required.",
          ],
        },
        {
          id: "allowance",
          title: "How the allowance is counted",
          body: [
            "One successful conversion counts as one. The count is reserved before processing starts, so two tabs cannot both spend the last one.",
            "A conversion that fails, is cancelled, returns nothing or hits a corrupt file costs you nothing: the reservation is released. Retrying the same conversion reuses its reservation rather than charging twice.",
          ],
        },
        {
          id: "subscriptions",
          title: "Subscriptions and cancellation",
          body: [
            "Paid plans are billed through PayPal. A subscription becomes active only once PayPal confirms it — approving in the PayPal window is not by itself what unlocks the plan.",
            "Cancelling is done through PayPal from the billing page. Access continues until the end of the period already paid for.",
          ],
        },
        {
          id: "advertising",
          title: "Advertising",
          body: [
            "Advertising is currently switched off site-wide. If it is enabled later, free accounts may see it on public content pages only — never inside an upload area, beside a convert or download control, or on account, billing and legal pages. Paid Pro and Business accounts would not see it at all.",
            "Advertising would also require your consent, which you can change at any time from Cookie settings in the footer.",
          ],
        },
      ],
    },
  ],

  helpCategories: [
    "Getting started",
    "Uploads and formats",
    "Accuracy",
    "Exports",
    "Account and billing",
    "Privacy and security",
  ],

  helpArticles: [
    {
      slug: "first-document",
      category: "Getting started",
      question: "How do I process my first document?",
      answer: [
        "Create an account and confirm your email address, then open any product page, drop a file onto the upload card and wait a few seconds.",
        "Review the highlighted low-confidence fields, correct anything that was misread, then export. An account is required: conversions are counted against it.",
      ],
    },
    {
      slug: "which-file-types",
      category: "Uploads and formats",
      question: "Which file types can I upload?",
      answer: [
        "PDF, JPG, PNG and WebP, up to 20 MB per file. PDFs may be native text or scanned images, and may contain several pages.",
        "A HEIC photo from an iPhone must be exported as JPG first — HEIC is not accepted.",
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
      slug: "convert-pdf-to-word",
      category: "Uploads and formats",
      question: "How do I convert a PDF into an editable Word file?",
      answer: [
        "Open PDF to Word, drop the PDF onto the upload card and wait while it is read. Scanned pages take a few extra seconds because the text has to be recognised.",
        "The recognised text is shown for review — correct anything that was misread — and the .docx is built from what you approved.",
      ],
    },
    {
      slug: "improve-accuracy",
      category: "Accuracy",
      question: "How can I improve extraction accuracy?",
      answer: [
        "Photograph documents flat, in even light, with all four corners visible. Avoid shadows falling across the total line.",
        "For scans, 300 DPI in greyscale or black-and-white is ideal. Crumpled receipts read better flattened under glass.",
      ],
    },
    {
      slug: "wrong-total",
      category: "Accuracy",
      question: "A total was read incorrectly. What now?",
      answer: [
        "Click the field in the results table and type the correct value. The corrected value is what gets exported, and the totals recalculate around it.",
        "Your documents are not used to train anything. If a document type is consistently misread, describe the problem through the Contact page — please do not send the document itself.",
      ],
    },
    {
      slug: "word-layout-differs",
      category: "Accuracy",
      question: "Why doesn't my Word file look exactly like the PDF?",
      answer: [
        "The converters aim for editable content in the right order — paragraphs, headings, lists and tables — not a pixel copy. Multi-column layouts become a single reading order, and decorative elements, exact fonts and spacing are not carried across.",
        "Where appearance matters more than the text, Image to Word can insert the original image instead of recognised text.",
      ],
    },
    {
      slug: "excel-arabic",
      category: "Exports",
      question: "Arabic text looks broken when I open the CSV in Excel.",
      answer: [
        "Our CSV files are UTF-8 with a byte-order mark, which Excel reads correctly. If the file was re-saved from another tool the mark may have been stripped — export again and open the fresh file.",
        "The .xlsx export is unaffected by character-set settings and is the safer choice for non-Latin scripts.",
      ],
    },
    {
      slug: "export-formats",
      category: "Exports",
      question: "What export formats are available?",
      answer: [
        "Excel (.xlsx) with a summary sheet and a line-item sheet, CSV of the line items, and JSON for systems that consume the raw record. All three are generated in your browser.",
      ],
    },
    {
      slug: "free-plan",
      category: "Account and billing",
      question: "What do I get for free?",
      answer: [
        "Five successful conversions per account, shared across every tool, with every export format available. No payment card is required.",
        "It is a one-time allocation rather than a monthly allowance, it does not refill, and it needs a verified email address. Conversions that fail or are cancelled do not count against it.",
      ],
    },
    {
      slug: "trial-ended",
      category: "Account and billing",
      question: "I have used my five conversions. What happens now?",
      answer: [
        "Nothing is deleted. Your account stays open and you can still sign in, view your plan and manage your history.",
        "New conversions need a paid subscription. The Pro and Business options are on the plan page.",
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
        "The email on an account cannot be changed today. Create an account with the new address and delete the old one from Account settings once you have moved across.",
      ],
    },
    {
      slug: "no-ads-paid",
      category: "Account and billing",
      question: "Will I see advertising?",
      answer: [
        "Advertising is switched off site-wide at the moment, so nobody sees it.",
        "If it is enabled later, paid Pro and Business accounts would still never see it, and free accounts only on public content pages — never inside an upload area, beside a convert or download button, or on account, billing and legal pages. It would also require your consent.",
      ],
    },
    {
      slug: "converter-privacy",
      category: "Privacy and security",
      question: "Are my files uploaded when I convert something?",
      answer: [
        "No. Recognition and conversion run inside your browser, and your file is never sent to us or to a third party to be read.",
        "The conversion itself is recorded — filename, size, page count and outcome — because that is what the free allowance is measured against. The contents of your document are never stored or logged.",
      ],
    },
    {
      slug: "who-can-see",
      category: "Privacy and security",
      question: "Can anyone else see my documents?",
      answer: [
        "Your documents are not uploaded, so there is nothing on our side for anyone to read.",
        "The conversion records that are stored are tied to the account that created them and protected by database row-level security, so another signed-in account requesting your record receives an empty result.",
      ],
    },
    {
      slug: "delete-account",
      category: "Privacy and security",
      question: "How do I delete my account and data?",
      answer: [
        "Open Account settings, scroll to 'Delete account', type DELETE to confirm and submit. Your profile and conversion history are removed immediately and permanently.",
      ],
    },
  ],

  ui: {
    docTitle: "Documentation — how EasyInvoiceOCR works",
    docDescription:
      "How to create an account, run a conversion, read confidence scores, export to Excel, CSV or JSON, and what is stored. Supported formats, languages and the free allowance.",
    docHeading: "Documentation",
    docLede:
      "Everything the product actually does, and where it stops. Recognition runs in your browser; the limits and behaviour described here are the ones enforced in the code.",
    docEyebrow: "Resources",
    docBreadcrumb: "Documentation",
    onThisPage: "On this page",

    helpTitle: "Help Center — answers to common questions",
    helpDescription:
      "Answers on uploads, file size, accuracy, Excel and CSV exports, the five free conversions, billing, deleting your account and where your documents are processed.",
    helpHeading: "Help Center",
    helpLede: "Short answers to the questions we are actually asked.",
    helpEyebrow: "Resources",
    helpBreadcrumb: "Help Center",
    searchLabel: "Search help articles",
    searchPlaceholder: "Search for a question…",
    allCategories: "All",
    noResults: "No article matches that search.",
    noResultsHint: "Try a shorter phrase, or browse a category above.",
    errorState: "This page could not be loaded.",

    relatedTitle: "Related",
    relatedLinks: [
      { label: "Extract data from an invoice", href: "/en/invoice-ocr" },
      { label: "How documents are handled", href: "/en/security" },
      { label: "What an accuracy claim measures", href: "/en/blog/invoice-ocr-accuracy-guide" },
      {
        label: "Questions to ask any document processor",
        href: "/en/blog/gdpr-document-processing",
      },
    ],
    ctaLabel: "Try a conversion",
    ctaHref: "/en/invoice-ocr",
    ctaNote: "Five conversions are free. A conversion that fails does not use one.",
  },
};
