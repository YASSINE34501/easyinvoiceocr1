export const siteConfig = {
  name: "EasyInvoiceOCR",
  description:
    "AI-powered OCR for PDFs, scans, and photos. Extract vendors, dates, taxes, totals, and line items — then export to Excel, CSV, JSON, or your accounting software.",
  maxUploadMb: 20,
  acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
  languages: [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
  ],
};

// Navigation, product links and pricing are no longer defined here.
//   - product links and cards come from src/config/products.ts,
//   - navigation groups from src/config/nav.ts,
//   - prices, limits and features from the subscription_plans table, read
//     through getPublicPlans(). Keeping a second copy of a price in the
//     source is exactly how the two drift apart.

export const faqs = [
  {
    q: "What file types are supported?",
    a: "PDF invoices (including multi-page files), JPG, JPEG and PNG images are supported, up to 20 MB per file.",
  },
  {
    q: "Can EasyInvoiceOCR read low-quality scans?",
    a: "The engine handles scans and phone photos. Results depend on the source image — every field stays editable and low-confidence values are highlighted for review.",
  },
  {
    q: "Which invoice fields can be extracted?",
    a: "Vendor and address, tax/VAT number, invoice number, invoice and due dates, currency, subtotal, discounts, tax rate and amount, total, payment terms, and each line item with quantity, unit price, tax and total.",
  },
  {
    q: "Is my financial data secure?",
    a: "Files are stored in private storage and served through short-lived signed URLs. Each account can only access its own documents.",
  },
  {
    q: "How long are uploaded files stored?",
    a: "Files stay available until you delete them or until the retention period configured for your workspace elapses.",
  },
  {
    q: "Can I export invoices to Excel?",
    a: "Yes. Every document exports to an .xlsx workbook with an Invoice Summary sheet and a Line Items sheet, plus CSV and JSON.",
  },
  {
    q: "Does it support multiple languages and currencies?",
    a: "The interface ships in English, French and Arabic with Spanish, German and Portuguese in progress, and extraction handles international number, date and currency formats.",
  },
  {
    q: "Is an API available?",
    a: "API access is part of the Business plan, so you can submit documents and retrieve structured JSON from your own systems.",
  },
];
