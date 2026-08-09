import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { asLocale } from "@/i18n";

/**
 * /:locale/ocr-api — an honest "not yet" page.
 *
 * This route previously rendered an ApiExtras block containing an
 * Authorization header, endpoint paths, request and response examples and
 * rate-limit headers, for an API that accepts no requests. It was also
 * English-only, so it leaked untranslated content onto /fr and /ar. Both are
 * why it is gone: the page now renders only the localised coming-soon content,
 * which describes the planned operations without presenting anything callable.
 *
 * The page stays reachable and returns 200. It is noindex and absent from the
 * sitemap — see `availability: "coming-soon"` in the product registry — because
 * ranking for "OCR API" and then telling the visitor there is no API wastes
 * their visit. It is deliberately not redirected and does not fake a 404.
 */
const product = productBySlug["ocr-api"]!;

export const Route = createFileRoute("/$locale/ocr-api")({
  component: () => <ProductPage product={product} kind="invoice" />,
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
