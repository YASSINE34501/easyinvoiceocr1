import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";

const product = productBySlug["pdf-invoice-parser"]!;

export const Route = createFileRoute("/$locale/pdf-invoice-parser")({
  component: () => <ProductPage product={product} kind="pdf" />,
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
