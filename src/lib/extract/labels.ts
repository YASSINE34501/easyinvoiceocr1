/**
 * Field labels in English, French and Arabic.
 *
 * Order matters. The matcher tries every pattern in the order declared here and
 * stops at the first hit, so more specific labels must come before the ones
 * they contain: "sous-total" has to be tested before "total", otherwise every
 * subtotal on a French invoice is read as the grand total.
 */

export type FieldKey =
  | "supplierName"
  | "customerName"
  | "documentNumber"
  | "issueDate"
  | "dueDate"
  | "subtotal"
  | "discount"
  | "taxRate"
  | "taxAmount"
  | "total";

/** Every amount-valued field, used to decide whether to parse a number. */
export const AMOUNT_FIELDS: ReadonlySet<FieldKey> = new Set<FieldKey>([
  "subtotal",
  "discount",
  "taxAmount",
  "total",
]);

export const DATE_FIELDS: ReadonlySet<FieldKey> = new Set<FieldKey>(["issueDate", "dueDate"]);

/**
 * Label patterns, most specific first within each field, and fields ordered so
 * that a line matching several is attributed to the narrowest one.
 */
export const LABELS: { key: FieldKey; patterns: RegExp[] }[] = [
  {
    key: "dueDate",
    patterns: [
      /\bdue\s*date\b/i,
      /\bpayment\s*due\b/i,
      /\bdate\s*d[' ]?\s*[ée]ch[ée]ance\b/i,
      /\b[ée]ch[ée]ance\b/i,
      /تاريخ\s*الاستحقاق/,
      /الاستحقاق/,
    ],
  },
  {
    key: "issueDate",
    patterns: [
      /\binvoice\s*date\b/i,
      /\bdate\s*of\s*issue\b/i,
      /\bissue\s*date\b/i,
      /\breceipt\s*date\b/i,
      /\bdate\s*de\s*facture\b/i,
      /\bdate\s*d[' ]?\s*[ée]mission\b/i,
      /تاريخ\s*الفاتورة/,
      /تاريخ\s*الإصدار/,
      /\bdate\b/i,
      /التاريخ/,
    ],
  },
  {
    key: "documentNumber",
    patterns: [
      /\binvoice\s*(?:no\.?|number|#)\b/i,
      /\binvoice\s*id\b/i,
      /\breceipt\s*(?:no\.?|number|#)\b/i,
      /\bbill\s*(?:no\.?|number|#)\b/i,
      /\bfacture\s*(?:n[°ºo]\.?|num[ée]ro)\b/i,
      /\bn[°ºo]\s*de\s*facture\b/i,
      /\bre[çc]u\s*n[°ºo]\b/i,
      /رقم\s*الفاتورة/,
      /رقم\s*الإيصال/,
      /\binvoice\b/i,
      /\bfacture\b/i,
    ],
  },
  {
    key: "subtotal",
    patterns: [
      /\bsub\s*-?\s*total\b/i,
      /\bnet\s*amount\b/i,
      /\bamount\s*before\s*tax\b/i,
      /\bsous\s*-?\s*total\b/i,
      /\btotal\s*h\.?\s*t\.?\b/i,
      /\bmontant\s*h\.?\s*t\.?\b/i,
      /المجموع\s*الفرعي/,
      /الإجمالي\s*قبل\s*الضريبة/,
    ],
  },
  {
    key: "discount",
    patterns: [
      /\bdiscount\b/i,
      /\brebate\b/i,
      /\bremise\b/i,
      /\brabais\b/i,
      /\bristourne\b/i,
      /خصم/,
      /تخفيض/,
    ],
  },
  {
    key: "taxRate",
    patterns: [
      /\b(?:vat|tax|gst)\s*rate\b/i,
      /\btaux\s*(?:de\s*)?t\.?v\.?a\.?\b/i,
      /نسبة\s*الضريبة/,
      /معدل\s*الضريبة/,
    ],
  },
  {
    key: "taxAmount",
    patterns: [
      /\bvat\s*amount\b/i,
      /\btax\s*amount\b/i,
      /\bsales\s*tax\b/i,
      /\b(?:vat|tax|gst)\b/i,
      /\bmontant\s*(?:de\s*la\s*)?t\.?v\.?a\.?\b/i,
      /\bt\.?v\.?a\.?\b/i,
      /مبلغ\s*الضريبة/,
      /الضريبة/,
      /ضريبة\s*القيمة\s*المضافة/,
    ],
  },
  {
    key: "total",
    patterns: [
      /\bgrand\s*total\b/i,
      /\btotal\s*due\b/i,
      /\bamount\s*due\b/i,
      /\bbalance\s*due\b/i,
      /\btotal\s*amount\b/i,
      /\btotal\s*t\.?t\.?c\.?\b/i,
      /\bmontant\s*total\b/i,
      /\bnet\s*[àa]\s*payer\b/i,
      /\btotal\b/i,
      /الإجمالي\s*الكلي/,
      /المبلغ\s*الإجمالي/,
      /المجموع\s*الكلي/,
      /الإجمالي/,
      /المجموع/,
    ],
  },
  {
    key: "supplierName",
    patterns: [
      /\b(?:supplier|vendor|seller|from|billed\s*by|issued\s*by)\b\s*:/i,
      /\b(?:fournisseur|vendeur|[ée]metteur|de)\b\s*:/i,
      /المورد\s*:/,
      /البائع\s*:/,
    ],
  },
  {
    key: "customerName",
    patterns: [
      /\b(?:bill\s*to|billed\s*to|sold\s*to|customer|client|buyer|to)\b\s*:/i,
      /\b(?:factur[ée]\s*[àa]|client|acheteur)\b\s*:/i,
      /العميل\s*:/,
      /المشتري\s*:/,
      /فاتورة\s*إلى/,
    ],
  },
];

/** Column headers for the line-item table, per language. */
export const ITEM_HEADERS = {
  description: [
    /\bdescription\b/i,
    /\bitem\b/i,
    /\bproduct\b/i,
    /\bservice\b/i,
    /\bd[ée]signation\b/i,
    /\barticle\b/i,
    /\blibell[ée]\b/i,
    /الوصف/,
    /البيان/,
    /الصنف/,
  ],
  quantity: [/\bqu?ant(?:ity)?\b/i, /\bqty\b/i, /\bqt[ée]?\b/i, /\bnombre\b/i, /الكمية/, /العدد/],
  unitPrice: [
    /\bunit\s*price\b/i,
    /\bprice\s*(?:each|\/\s*unit)\b/i,
    /\brate\b/i,
    /\bprix\s*unitaire\b/i,
    /\bp\.?\s*u\.?\b/i,
    /سعر\s*الوحدة/,
    /السعر/,
  ],
  lineTotal: [
    /\bline\s*total\b/i,
    /\bamount\b/i,
    /\btotal\b/i,
    /\bmontant\b/i,
    /الإجمالي/,
    /المجموع/,
  ],
} as const satisfies Record<string, readonly RegExp[]>;

export type ItemColumn = keyof typeof ITEM_HEADERS;

/** Returns the field a line's label text refers to, or null. */
export function matchFieldLabel(text: string): FieldKey | null {
  for (const { key, patterns } of LABELS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) return key;
    }
  }
  return null;
}

/** Returns the item column a header cell refers to, or null. */
export function matchItemHeader(text: string): ItemColumn | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Narrow columns first so "unit price" is not captured by the "total" pattern.
  const order: ItemColumn[] = ["quantity", "unitPrice", "description", "lineTotal"];
  for (const column of order) {
    for (const pattern of ITEM_HEADERS[column]) {
      if (pattern.test(trimmed)) return column;
    }
  }
  return null;
}
