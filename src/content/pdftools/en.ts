import type { PdfToolsContent } from "./types";

/**
 * English copy for the PDF tools.
 *
 * Written from what the code in src/lib/pdftools actually does. Where a tool
 * has a boundary — the crop that leaves the content in the file, the page
 * numbers that cannot draw Arabic-Indic digits without an embedded font — the
 * boundary is written down rather than left for the visitor to discover.
 */
export const pdfToolsEn: PdfToolsContent = {
  index: {
    title: "Free PDF Tools — Merge, Split, Rotate and Organise PDFs | EasyInvoiceOCR",
    description:
      "Eight PDF tools that run entirely in your browser: merge, split, remove, extract, reorder, rotate, crop and number pages. No upload, no account, no watermark.",
    eyebrow: "PDF tools",
    h1: "PDF tools that run in your browser",
    lede: "Merge, split, reorder, rotate, crop and number PDF pages. Your file never leaves your device — the work happens in this tab, so there is nothing to upload and nothing for us to store.",
    categories: {
      organise: {
        title: "Organise pages",
        lede: "Combine documents, break one apart, and decide which pages stay and in what order.",
      },
      edit: {
        title: "Edit pages",
        lede: "Change how the pages themselves are presented: their orientation, their margins, their numbering.",
      },
    },
    privacy: {
      title: "Your document stays on your device",
      body: [
        "Every tool on this page runs in your browser. The file is read into the tab's memory, changed there, and handed back to you as a download. It is never sent to our servers, because these pages have no upload path at all.",
        "That also means we cannot recover a file for you, and closing the tab discards everything. Keep your original until you have checked the result.",
      ],
    },
    faqs: [
      {
        q: "Do I need an account to use these tools?",
        a: "No. The PDF tools are free and need no sign-in. An account is only required for the invoice and receipt extraction products, which have a quota attached.",
      },
      {
        q: "Is there a watermark on the output?",
        a: "No. The tools write a normal PDF with nothing added beyond what you asked for.",
      },
      {
        q: "How large a file can I use?",
        a: "Up to 100 MB and 2,000 pages. Beyond that a browser tab tends to run out of memory part-way through, which fails messily rather than cleanly.",
      },
      {
        q: "Can these tools open a password-protected PDF?",
        a: "No. An encrypted document is refused rather than worked around. Remove the password in the application that set it, then come back.",
      },
    ],
  },

  ui: {
    dropTitle: "Drop your PDF files here",
    chooseFiles: "Choose PDF files",
    run: "Run",
    running: "Working…",
    reading: "Reading the document…",
    done: "Done",
    download: "Download",
    downloadAll: "Download all (.zip)",
    startOver: "Start over",
    addFiles: "Add more files",
    removeFile: "Remove",
    moveUp: "Move up",
    moveDown: "Move down",
    duplicate: "Duplicate",
    restore: "Restore all pages",
    files: "Files",
    orderHint:
      "They are merged top to bottom. Reorder them here if that is not the order you want.",
    pageCount: "{count} pages",
    pagesLabel: "Pages",
    pagesHint: "Single pages and ranges, for example 1-3, 7, 9-. Leave empty for every page.",
    pagesAll: "All pages",
    selectedPages: "Selected: {pages}",
    angle: "Turn by",
    angle90: "90° clockwise",
    angle180: "180°",
    angle270: "90° anticlockwise",
    splitMode: "Split into",
    splitEach: "One file per page",
    splitFixed: "Groups of a fixed size",
    groupSize: "Pages per file",
    position: "Position",
    positionBottomCenter: "Bottom centre",
    positionBottomLeft: "Bottom left",
    positionBottomRight: "Bottom right",
    positionTopCenter: "Top centre",
    positionTopLeft: "Top left",
    positionTopRight: "Top right",
    startAt: "Start numbering at",
    fontSize: "Text size",
    numberFormat: "Format",
    numberFormatHint: "{n} is the number, {total} the page count.",
    margins: "Margins to trim",
    marginsHint:
      "In points — 72 points is one inch. The trimmed area is hidden, not deleted, so the crop can be undone in any PDF editor.",
    marginTop: "Top",
    marginRight: "Right",
    marginBottom: "Bottom",
    marginLeft: "Left",
    page: "Page {n}",
    outputFiles: "{count} files",
    outputSize: "Size",
    pagesIn: "Pages in",
    pagesOut: "Pages out",
    privacyTitle: "Nothing is uploaded",
    privacyBody:
      "This runs in your browser. The file is not sent anywhere and we keep no copy of it.",
    errorTitle: "That did not work",
    howItWorks: "How it works",
    nextTitle: "Working with invoices or receipts?",
    nextCta: "Extract the data to Excel",
    pdfInvoiceNote:
      "If the PDFs you are working with are invoices, they can be read into a spreadsheet instead.",
    pdfInvoiceCta: "Parse PDF invoices",
    limitsTitle: "What it will not do",
    faqTitle: "Questions",
    otherTools: "Other PDF tools",
    allTools: "All PDF tools",
  },

  errors: {
    file_empty: "That file is empty.",
    file_too_large: "That file is larger than 100 MB. Try splitting it first.",
    no_files: "Choose a file to start.",
    not_a_pdf: "That is not a PDF. The tools on this page only read PDF files.",
    too_many_files: "That is more than 20 files. Do it in a couple of passes.",
    need_two_files: "Merging needs at least two files.",
    pdf_corrupt: "This PDF could not be read. It may be damaged or incomplete.",
    pdf_encrypted:
      "This PDF is password-protected. Remove the password in the application that set it, then try again.",
    pdf_no_pages: "This PDF has no pages.",
    pdf_too_many_pages:
      "This PDF has more than 2,000 pages, which is more than a browser tab can hold.",
    selection_empty: "No pages are selected.",
    selection_invalid: "That page selection could not be read. Use a form like 1-3, 7, 9-.",
    selection_out_of_range: "That selection names a page the document does not have.",
    would_remove_every_page: "That would leave the document with no pages at all.",
    crop_invalid: "Margins have to be zero or more.",
    crop_too_large: "Those margins would trim the page away completely.",
    font_invalid: "That font file could not be embedded.",
    font_missing_glyphs:
      "The built-in font has no glyph for one of those characters. Use Western digits, or plain Latin text.",
    font_size_invalid: "Text size has to be between 4 and 96.",
    output_invalid:
      "The result did not come out as a readable PDF, so it was not offered for download. Nothing was changed on your device.",
    unknown: "Something went wrong. Your file was not changed.",
  },

  tools: {
    "merge-pdf": {
      name: "Merge PDF",
      title: "Merge PDF — Combine PDF files in your browser | EasyInvoiceOCR",
      description:
        "Combine two or more PDFs into one file, in the order you choose. Runs in your browser: nothing is uploaded, and there is no watermark.",
      h1: "Merge PDF files",
      lede: "Combine up to 20 PDFs into a single document. Put the files in the order you want before you run it.",
      card: "Combine several PDFs into one, in the order you choose.",
      steps: [
        {
          title: "Choose the files",
          body: "Pick two or more PDFs, or drop them onto the page. Each one is checked for a real PDF header before anything else happens.",
        },
        {
          title: "Put them in order",
          body: "The list is the order they will be merged in. Move a file up or down until it reads the way you want.",
        },
        {
          title: "Merge and download",
          body: "Pages are copied one document at a time, each keeping its own size and rotation. The result is reopened and checked before it is offered to you.",
        },
      ],
      faqs: [
        {
          q: "Does merging change the quality of the pages?",
          a: "No. Pages are copied across as they are — the same fonts, the same images, the same page sizes. Nothing is re-encoded.",
        },
        {
          q: "Can I merge documents with different page sizes?",
          a: "Yes. Each page keeps the size it had, so an A4 document and a landscape spreadsheet can sit in the same file.",
        },
        {
          q: "What happens to bookmarks and form fields?",
          a: "Page content, size and rotation are carried across. Document-level structures — the outline, form fields, attachments — are not, so a merged file will not keep them.",
        },
      ],
      limits: [
        "Bookmarks, form fields, annotations and attachments are not carried into the merged file.",
        "Up to 20 files and 2,000 pages in total.",
      ],
    },

    "split-pdf": {
      name: "Split PDF",
      title: "Split PDF — Break a PDF into separate files | EasyInvoiceOCR",
      description:
        "Split a PDF into one file per page, or into fixed-size groups. Runs in your browser: no upload, no account, no watermark.",
      h1: "Split a PDF",
      lede: "Break one document into several — a file per page, or groups of a size you choose. More than one file comes back as a zip.",
      card: "Break one PDF into single pages or fixed-size groups.",
      steps: [
        {
          title: "Choose the document",
          body: "The page count is read straight from the file, so you can see what you are working with before you decide how to split it.",
        },
        {
          title: "Choose how to split it",
          body: "One file per page, or groups of a fixed size. A 10-page document split into groups of four gives you 4, 4 and 2.",
        },
        {
          title: "Download the parts",
          body: "Parts are named with a padded number — report-01.pdf, report-02.pdf — so they sort correctly in a file manager. Several parts arrive as a single zip.",
        },
      ],
      faqs: [
        {
          q: "How are the resulting files named?",
          a: "After the original, with a two-digit part number: a file called report.pdf becomes report-01.pdf, report-02.pdf and so on.",
        },
        {
          q: "Why is the download a zip?",
          a: "Because a browser cannot reliably start several downloads at once. A split producing one file hands you that file directly instead.",
        },
        {
          q: "Can I split at specific pages instead?",
          a: "For a specific set of pages, use Extract pages — it produces one document containing exactly the pages you name.",
        },
      ],
      limits: [
        "Splitting at arbitrary chosen points is not offered here; Extract pages covers that case.",
        "Each part is a fresh document, so document-level structures such as bookmarks are not carried over.",
      ],
    },

    "remove-pages": {
      name: "Remove pages",
      title: "Remove pages from a PDF — Delete PDF pages | EasyInvoiceOCR",
      description:
        "Delete pages from a PDF and keep everything else. Runs in your browser: nothing is uploaded and the original file is untouched.",
      h1: "Remove pages from a PDF",
      lede: "Name the pages you do not want and keep the rest. Your original file is not modified — you get a new document back.",
      card: "Delete the pages you name and keep everything else.",
      steps: [
        {
          title: "Choose the document",
          body: "Its page count is read first, so a selection that names a page past the end is caught before anything is written.",
        },
        {
          title: "Name the pages to drop",
          body: "Single pages and ranges: 2, or 5-9, or 1-3, 12. Everything you do not name is kept, in its original order.",
        },
        {
          title: "Download the result",
          body: "The new document is reopened and its page count checked against what you asked for before it is offered as a download.",
        },
      ],
      faqs: [
        {
          q: "Is my original file changed?",
          a: "No. Nothing is written to your device except the file you choose to download.",
        },
        {
          q: "What if I try to remove every page?",
          a: "It is refused. A PDF with no pages is not a valid document, so the tool stops rather than handing you a file that will not open.",
        },
      ],
      limits: [
        "The result cannot be empty — at least one page must remain.",
        "Bookmarks and form fields are not carried into the new document.",
      ],
    },

    "extract-pages": {
      name: "Extract pages",
      title: "Extract pages from a PDF — Keep only the pages you need | EasyInvoiceOCR",
      description:
        "Pull selected pages out of a PDF into a new document. Runs in your browser: no upload, no account, no watermark.",
      h1: "Extract pages from a PDF",
      lede: "Keep exactly the pages you name and nothing else. Useful for pulling one invoice out of a month of them.",
      card: "Pull the pages you name into a new document.",
      steps: [
        {
          title: "Choose the document",
          body: "The page count is read from the file itself, not guessed from its size.",
        },
        {
          title: "Name the pages to keep",
          body: "Ranges and single pages, in any order: 1-3, 7, 9-. They come out in ascending order, each page once.",
        },
        {
          title: "Download the extract",
          body: "A new PDF containing only those pages, checked for readability before it is handed over.",
        },
      ],
      faqs: [
        {
          q: "What is the difference between this and Remove pages?",
          a: "They are opposites. Extract keeps what you name; Remove keeps what you do not. Use whichever is the shorter list to type.",
        },
        {
          q: "Can I extract the same page twice?",
          a: "Not here — a selection is a set, so a repeated page appears once. Organize PDF can repeat a page if that is what you need.",
        },
      ],
      limits: [
        "A selection is deduplicated and sorted; use Organize PDF for a custom order or a repeated page.",
        "Bookmarks and form fields are not carried into the new document.",
      ],
    },

    "organize-pdf": {
      name: "Organize PDF",
      title: "Organize PDF — Reorder, duplicate and delete PDF pages | EasyInvoiceOCR",
      description:
        "Put PDF pages in the order you want, duplicate one, or drop it. Runs in your browser: nothing is uploaded.",
      h1: "Organize the pages of a PDF",
      lede: "Move pages around, repeat one, or take one out. The list below is exactly what the finished document will contain, from top to bottom.",
      card: "Reorder, duplicate or drop individual pages.",
      steps: [
        {
          title: "Choose the document",
          body: "Every page is listed with its original number, along with its size and any rotation it already carries.",
        },
        {
          title: "Arrange the pages",
          body: "Move a page up or down, duplicate it, or remove it. The order in the list is the order in the result — no sorting is applied afterwards.",
        },
        {
          title: "Build and download",
          body: "The pages are copied in exactly that order, and the result is checked before it is offered to you.",
        },
      ],
      faqs: [
        {
          q: "Can I put the same page in twice?",
          a: "Yes. Duplicating a page is a normal thing to want — a cover sheet, a repeated terms page — so it is allowed here, unlike in Extract pages.",
        },
        {
          q: "Are the page thumbnails rendered?",
          a: "Not in this version. Pages are listed by number, size and rotation rather than as images, so nothing needs to be rendered before you can work.",
        },
      ],
      limits: [
        "Pages are shown as a numbered list, not as thumbnails.",
        "The list cannot be emptied — a document needs at least one page.",
      ],
    },

    "rotate-pdf": {
      name: "Rotate PDF",
      title: "Rotate PDF pages — Fix sideways scans | EasyInvoiceOCR",
      description:
        "Turn PDF pages by 90, 180 or 270 degrees, all of them or just the ones you name. Runs in your browser.",
      h1: "Rotate PDF pages",
      lede: "Turn a sideways scan the right way up. Rotate the whole document, or only the pages that need it.",
      card: "Turn pages by 90, 180 or 270 degrees.",
      steps: [
        {
          title: "Choose the document",
          body: "Each page's current rotation is read from the file, so you can see which pages are already turned.",
        },
        {
          title: "Choose the pages and the angle",
          body: "Leave the selection empty to rotate everything, or name the pages that are wrong. Pick a quarter turn either way, or a half turn.",
        },
        {
          title: "Download the result",
          body: "The turn is added to whatever rotation the page already had, so a scan that was already sideways lands where you expect instead of snapping to a fixed angle.",
        },
      ],
      faqs: [
        {
          q: "Does rotating re-encode the page?",
          a: "No. A PDF page carries a rotation value, and that value is what changes. The content is untouched, so there is no loss of quality and the file size barely moves.",
        },
        {
          q: "Why did rotating an already-rotated page not give me 90°?",
          a: "Because the turn is relative. Rotating a page that already sat at 90° by another 90° gives 180°, which is what you would expect from turning it in your hands.",
        },
      ],
      limits: [
        "Only quarter and half turns — PDF page rotation is defined in multiples of 90°.",
        "Rotation applies to whole pages; individual images on a page cannot be turned.",
      ],
    },

    "crop-pdf": {
      name: "Crop PDF",
      title: "Crop PDF — Trim margins from PDF pages | EasyInvoiceOCR",
      description:
        "Trim the margins of PDF pages by setting a crop box. Runs in your browser, and the crop can be undone in any PDF editor.",
      h1: "Crop PDF pages",
      lede: "Trim white margins off a scan so the content fills the page. The trimmed area is hidden rather than deleted, so nothing is lost.",
      card: "Trim margins by setting a crop box.",
      steps: [
        {
          title: "Choose the document",
          body: "Each page's size is read in points, which is the unit the margins are given in — 72 points to an inch.",
        },
        {
          title: "Set the margins",
          body: "How much to trim from each edge. A crop that would leave nothing is refused, because a zero-area page renders blank in some readers and errors in others.",
        },
        {
          title: "Download the result",
          body: "The crop box is set and the media box left alone, which is what makes the crop reversible.",
        },
      ],
      faqs: [
        {
          q: "Is the cropped content deleted?",
          a: "No. Cropping a PDF sets a crop box — a note telling the reader which part of the page to show. The content outside it is still in the file and can be brought back by resetting the crop box.",
        },
        {
          q: "Does cropping make the file smaller?",
          a: "Barely. Nothing is removed, so the size stays roughly the same. If you need a genuinely smaller file, cropping is not the tool for it.",
        },
        {
          q: "Can I crop each page by a different amount?",
          a: "Not in one pass. Run the tool once per group of pages that share a margin, naming those pages each time.",
        },
      ],
      limits: [
        "The crop is reversible, so it does not remove sensitive content and does not reduce file size.",
        "One set of margins per run; pages needing different margins take separate runs.",
        "No visual preview — margins are entered as numbers in points.",
      ],
    },

    "page-numbers": {
      name: "Page numbers",
      title: "Add page numbers to a PDF | EasyInvoiceOCR",
      description:
        "Stamp page numbers onto a PDF, in the position and format you choose. Runs in your browser: nothing is uploaded.",
      h1: "Add page numbers to a PDF",
      lede: "Stamp a number onto each page, where you want it, in the format you want. Number the whole document or only part of it.",
      card: "Stamp numbers onto pages, positioned as you like.",
      steps: [
        {
          title: "Choose the document",
          body: "Page sizes are read first, because the number is placed relative to each page's own edges rather than an assumed A4.",
        },
        {
          title: "Choose position and format",
          body: "Six positions, and a format of your own: {n} becomes the number and {total} the page count, so Page {n} of {total} works.",
        },
        {
          title: "Download the numbered document",
          body: "Numbers are drawn onto the pages in the built-in Helvetica, and the result is reopened and checked before you get it.",
        },
      ],
      faqs: [
        {
          q: "Can I start numbering at something other than 1?",
          a: "Yes. Set the starting number — useful when a document continues from another one, or when the first pages are unnumbered front matter.",
        },
        {
          q: "Can I number only some of the pages?",
          a: "Yes. Name the pages, and the numbering starts at your chosen number on the first of them and counts up from there.",
        },
        {
          q: "Can I use Arabic-Indic digits?",
          a: "Not yet. The built-in fonts cover Latin characters and Western digits only. Rather than quietly printing Western digits on a document that wanted ٠١٢٣, the tool refuses — proper support needs an embedded font, which is not in this version.",
        },
      ],
      limits: [
        "Western digits and Latin text only; Arabic-Indic numerals need an embedded font and are not supported yet.",
        "One position and one format per run.",
        "The number is drawn onto the page and cannot be removed afterwards, so keep your original.",
      ],
    },
  },

  landing: {
    greeting: "Hello — let's get started",
    greetingNamed: "Hello {name} — let's get started",
    lede: "Every PDF tool EasyInvoiceOCR offers, in one place. The page-level tools run entirely in this tab and need no account; the extraction products read invoices and receipts into Excel, CSV and JSON.",
    stats: [
      { value: "15", label: "tools that work today" },
      { value: "0", label: "files uploaded to our servers" },
      { value: "3", label: "languages, including Arabic" },
    ],
    filterLabel: "Filter tools by category",
    categoryAll: "All",
    categories: {
      organise: "Organise PDF",
      edit: "Edit PDF",
      convert: "Convert PDF",
      intelligence: "PDF intelligence",
    },
    badges: { new: "New!", account: "Account", soon: "Coming soon" },
    count: "{count} tools",
    empty: "No tool in this category yet.",
    waysTitle: "Work the way you already work",
    waysLede:
      "No installer, no plugin, no account for the page tools. What you need is the browser you already have open.",
    ways: [
      {
        title: "In your browser",
        body: "The page tools read your file into this tab, change it there, and hand it back. There is nothing to install and nothing to sign up for.",
      },
      {
        title: "On a phone as on a desktop",
        body: "The same tools, the same controls, at every width. Nothing is hidden on a small screen because it was easier to hide it.",
      },
      {
        title: "Into formats your other tools read",
        body: "The extraction products write Word, Excel, CSV and JSON — the formats your accounting software and your spreadsheets already open.",
      },
    ],
    featuresTitle: "Built to be trusted with a document",
    featuresLede:
      "The details that decide whether a tool is usable on real work rather than on a test file.",
    features: [
      {
        title: "The output is checked before you get it",
        body: "Every result is saved, reopened and its page count compared against what you asked for. A file that did not come out readable is refused rather than handed over.",
      },
      {
        title: "A file is what its bytes say it is",
        body: "The PDF header is read before anything opens the file, so a renamed document is caught at the door rather than inside a parser.",
      },
      {
        title: "Arabic is a first-class language",
        body: "Right-to-left throughout, with the page-range field kept left-to-right so a range like 1-3, 7 still reads correctly.",
      },
      {
        title: "Limits are written down",
        body: "Each tool says what it will not do — the crop that hides rather than deletes, the numbering that needs Latin digits — before you spend time on it.",
      },
    ],
    trustTitle: "What we can actually promise",
    trust: [
      "The page tools upload nothing. These pages have no upload path at all.",
      "No watermark is added, and no account is required to use them.",
      "A password-protected PDF is refused, never worked around.",
      "Closing the tab discards everything — we cannot recover a file for you.",
    ],
    trustLink: "Read the security page",
    ctaTitle: "Need to pull the numbers out of a document?",
    ctaBody:
      "The extraction products read invoices and receipts into a spreadsheet. Every account starts with five conversions, free, across every product.",
    ctaPrimary: "Create a free account",
    ctaSecondary: "See the plans",
    ctaNote: "The PDF tools on this page stay free and need no account.",
  },
};
