import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";

const product = productBySlug["invoice-ocr"]!;

export const Route = createFileRoute("/$locale/invoice-ocr")({
  component: () => <ProductPage product={product} kind="invoice" />,
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
