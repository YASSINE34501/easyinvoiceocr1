/**
 * Security page registry.
 *
 * One entry per locale, so a missing translation is a type error rather than a
 * French page quietly serving English prose — the failure this project has hit
 * before on the blog, the products and the solutions.
 */

import type { Locale } from "@/i18n";
import type { SecurityContent } from "./types";
import { securityEn } from "./en";
import { securityFr } from "./fr";
import { securityAr } from "./ar";

export type {
  SecurityContent,
  SecurityPillar,
  SecurityPoint,
  SecurityStage,
  SecurityStep,
} from "./types";

export const security: Record<Locale, SecurityContent> = {
  en: securityEn,
  fr: securityFr,
  ar: securityAr,
};

export function securityFor(locale: Locale): SecurityContent {
  return security[locale];
}

/** Page title and description, written per locale rather than translated. */
export const securitySeo: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Security & Privacy | EasyInvoiceOCR",
    description:
      "How EasyInvoiceOCR protects your documents and account: files are read in your browser and never uploaded, row-level security isolates every account, and payments are handled by PayPal.",
  },
  fr: {
    title: "Sécurité et confidentialité | EasyInvoiceOCR",
    description:
      "Comment EasyInvoiceOCR protège vos documents et votre compte : vos fichiers sont lus dans votre navigateur sans jamais être transmis, la sécurité au niveau des lignes isole chaque compte, et les paiements passent par PayPal.",
  },
  ar: {
    title: "الأمان والخصوصية | EasyInvoiceOCR",
    description:
      "كيف يحمي EasyInvoiceOCR مستنداتك وحسابك: تُقرأ ملفاتك داخل متصفحك ولا تُرفع أبدًا، ويعزل الأمان على مستوى الصف كل حساب، وتمرّ المدفوعات عبر PayPal.",
  },
};
