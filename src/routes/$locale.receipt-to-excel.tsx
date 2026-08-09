import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";

const product = productBySlug["receipt-to-excel"]!;

export const Route = createFileRoute("/$locale/receipt-to-excel")({
  component: () => <ProductPage product={product} kind="receipt" />,
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
