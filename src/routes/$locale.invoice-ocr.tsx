import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";

const product = productBySlug["invoice-ocr"]!;

export const Route = createFileRoute("/$locale/invoice-ocr")({
  component: () => (
    <ProductPage
      product={product}
      kind="invoice"
      breadcrumbs={[{ label: "Product", href: path("invoice-ocr") }, { label: product.name }]}
    />
  ),
  head: () => productHead(product),
});
