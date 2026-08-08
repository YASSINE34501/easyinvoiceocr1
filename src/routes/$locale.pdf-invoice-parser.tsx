import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";

const product = productBySlug["pdf-invoice-parser"]!;

export const Route = createFileRoute("/$locale/pdf-invoice-parser")({
  component: () => (
    <ProductPage
      product={product}
      kind="pdf"
      breadcrumbs={[
        { label: "Product", href: path("pdf-invoice-parser") },
        { label: product.name },
      ]}
    />
  ),
  head: () => productHead(product),
});
