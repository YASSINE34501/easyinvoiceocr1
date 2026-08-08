import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";

const product = productBySlug["receipt-to-excel"]!;

export const Route = createFileRoute("/$locale/receipt-to-excel")({
  component: () => (
    <ProductPage
      product={product}
      kind="receipt"
      breadcrumbs={[{ label: "Product", href: path("receipt-to-excel") }, { label: product.name }]}
    />
  ),
  head: () => productHead(product),
});
