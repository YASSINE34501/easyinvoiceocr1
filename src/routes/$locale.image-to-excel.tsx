import { createFileRoute } from "@tanstack/react-router";
import { ProductPage, productHead } from "@/components/site/ProductPage";
import { productBySlug } from "@/content/products";
import { path } from "@/config/nav";
import { asLocale } from "@/i18n";

const product = productBySlug["image-to-excel"]!;

export const Route = createFileRoute("/$locale/image-to-excel")({
  component: () => (
    <ProductPage
      product={product}
      kind="image"
      breadcrumbs={[{ label: "Product", href: path("image-to-excel") }, { label: product.name }]}
    />
  ),
  head: ({ params }) => productHead(product, asLocale(params.locale)),
});
