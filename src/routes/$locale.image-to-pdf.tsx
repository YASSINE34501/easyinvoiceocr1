import { createFileRoute } from "@tanstack/react-router";
import { ConverterLayout, converterHead } from "@/components/convert/ConverterLayout";
import { ImageToPdfTool } from "@/components/convert/ImageToPdfTool";
import { requireProduct } from "@/config/products";
import { asLocale } from "@/i18n";

const product = requireProduct("image-to-pdf");

export const Route = createFileRoute("/$locale/image-to-pdf")({
  component: ImageToPdfPage,
  head: ({ params }) => converterHead(product, asLocale(params.locale)),
});

function ImageToPdfPage() {
  return (
    <ConverterLayout product={product}>
      <ImageToPdfTool formatsLabel="JPG, PNG, WebP" />
    </ConverterLayout>
  );
}
