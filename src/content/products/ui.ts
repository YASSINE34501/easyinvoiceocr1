import type { Locale } from "@/i18n";

/**
 * Shared chrome around the product content: section intros, buttons and the
 * closing panel.
 *
 * Kept apart from the per-product content because these strings are identical
 * across all five pages, and duplicating them fifteen times would guarantee
 * they drift. `{name}` is substituted with the localised product name.
 */
export type ProductUi = {
  tryTitle: string;
  tryLede: string;
  tryCta: string;
  signupCta: string;
  whatTitle: string;
  practiceTitle: string;
  securityMore: string;
  securityLink: string;
  closingTitle: string;
  closingBody: string;
  closingUpload: string;
  closingDocs: string;
  comingSoonBadge: string;
  comingSoonNotice: string;
};

export const productUi: Record<Locale, ProductUi> = {
  en: {
    tryTitle: "Try it now",
    tryLede:
      "Upload your own file. Text is recognised in your browser and the document is not uploaded. Complex layouts may need manual review before you export.",
    tryCta: "Try it with your own file",
    signupCta: "Create a free account",
    whatTitle: "What {name} does",
    practiceTitle: "How it works in practice",
    securityMore: "Full detail, including what we deliberately do not claim, is on the",
    securityLink: "Security page",
    closingTitle: "Ready to try {name}?",
    closingBody:
      "Upload a file above, or read the documentation to see how the whole workflow fits together.",
    closingUpload: "Upload a file",
    closingDocs: "Read the docs",
    comingSoonBadge: "Coming soon",
    comingSoonNotice:
      "This product is not operational. Nothing on this page can be used yet, and the page is excluded from search results until it is.",
  },
  fr: {
    tryTitle: "Essayer maintenant",
    tryLede:
      "Envoyez votre propre fichier. Le texte est reconnu dans votre navigateur et le document n'est pas transmis. Les mises en page complexes peuvent demander une relecture avant l'export.",
    tryCta: "Essayer avec votre propre fichier",
    signupCta: "Créer un compte gratuit",
    whatTitle: "Ce que fait {name}",
    practiceTitle: "Comment cela se passe concrètement",
    securityMore: "Le détail complet, y compris ce que nous nous gardons d'affirmer, figure sur la",
    securityLink: "page Sécurité",
    closingTitle: "Prêt à essayer {name} ?",
    closingBody:
      "Envoyez un fichier ci-dessus, ou consultez la documentation pour voir comment l'ensemble s'articule.",
    closingUpload: "Envoyer un fichier",
    closingDocs: "Lire la documentation",
    comingSoonBadge: "Bientôt disponible",
    comingSoonNotice:
      "Ce produit n'est pas en service. Rien sur cette page n'est utilisable pour l'instant, et la page est exclue des résultats de recherche tant que ce sera le cas.",
  },
  ar: {
    tryTitle: "جرّبها الآن",
    tryLede:
      "ارفع ملفك الخاص. يُتعرَّف على النص داخل متصفحك ولا يُرفع المستند. وقد تحتاج التخطيطات المعقّدة إلى مراجعة يدوية قبل التصدير.",
    tryCta: "جرّبها بملفك الخاص",
    signupCta: "أنشئ حسابًا مجانيًا",
    whatTitle: "ما الذي تفعله {name}",
    practiceTitle: "كيف تعمل عمليًا",
    securityMore: "التفاصيل الكاملة، بما فيها ما نتجنّب ادعاءه عمدًا، متاحة في",
    securityLink: "صفحة الأمان",
    closingTitle: "جاهز لتجربة {name}؟",
    closingBody: "ارفع ملفًا أعلاه، أو اطّلع على التوثيق لترى كيف يتكامل سير العمل بأكمله.",
    closingUpload: "ارفع ملفًا",
    closingDocs: "اقرأ التوثيق",
    comingSoonBadge: "قريبًا",
    comingSoonNotice:
      "هذا المنتج ليس في الخدمة. لا شيء في هذه الصفحة قابل للاستخدام بعد، وهي مستبعدة من نتائج البحث إلى أن يصبح كذلك.",
  },
};

export function withName(template: string, name: string): string {
  return template.replace("{name}", name);
}
