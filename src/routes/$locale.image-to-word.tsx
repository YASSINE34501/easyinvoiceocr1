import { createFileRoute } from "@tanstack/react-router";
import { ConverterLayout, converterHead } from "@/components/convert/ConverterLayout";
import { ImageToWordTool } from "@/components/convert/ImageToWordTool";
import { requireProduct } from "@/config/products";
import { asLocale } from "@/i18n";

const product = requireProduct("image-to-word");

export const Route = createFileRoute("/$locale/image-to-word")({
  component: ImageToWordPage,
  head: ({ params }) => converterHead(product, asLocale(params.locale)),
});

function ImageToWordPage() {
  return (
    <ConverterLayout product={product}>
      <ImageToWordTool formatsLabel="JPG, PNG, WebP" />
    </ConverterLayout>
  );
}
