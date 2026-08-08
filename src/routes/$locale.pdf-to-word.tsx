import { createFileRoute } from "@tanstack/react-router";
import { ConverterLayout, converterHead } from "@/components/convert/ConverterLayout";
import { PdfToWordTool } from "@/components/convert/PdfToWordTool";
import { requireProduct } from "@/config/products";
import { asLocale } from "@/i18n";

const product = requireProduct("pdf-to-word");

export const Route = createFileRoute("/$locale/pdf-to-word")({
  component: PdfToWordPage,
  head: ({ params }) => converterHead(product, asLocale(params.locale)),
});

function PdfToWordPage() {
  return (
    <ConverterLayout product={product}>
      <PdfToWordTool formatsLabel="PDF" />
    </ConverterLayout>
  );
}
