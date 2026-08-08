/**
 * Image to PDF.
 *
 * No recognition, no upload, no server round trip for the document itself: the
 * PDF is assembled from the images in the browser. A conversion job is still
 * opened so usage is recorded against the plan like any other tool.
 */

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dropzone,
  ErrorNotice,
  GateCard,
  PrivacyNote,
  QuotaLine,
  ResultPanel,
  StageProgress,
  downloadBlob,
  useConverterGate,
} from "./parts";
import { ImageStrip, newStripItems, type StripItem } from "./ImageStrip";
import { useConversionJob } from "./useConversionJob";
import { useT } from "@/i18n/useLocale";
import { acceptAttribute, safeBaseName, validateFileList } from "@/lib/convert/validation";
import { ConversionError, type ConversionStage, type ErrorCode } from "@/lib/convert/types";
import {
  DEFAULT_IMAGE_PDF_OPTIONS,
  type FitMode,
  type ImagePdfOptions,
  type MarginKey,
  type Orientation,
  type PageSizeKey,
  type QualityKey,
} from "@/lib/convert/imagePdf";
import type { MessageKey } from "@/i18n";

type View =
  | { step: "collect" }
  | {
      step: "working";
      stage: ConversionStage;
      percent: number;
      page?: number | undefined;
      pageCount?: number | undefined;
    }
  | { step: "done"; blob: Blob; filename: string; summary: string }
  | { step: "error"; code: ErrorCode };

export function ImageToPdfTool({ formatsLabel }: { formatsLabel: string }) {
  const t = useT();
  const gate = useConverterGate("image-to-pdf");
  const job = useConversionJob("image-to-pdf");

  const [items, setItems] = useState<StripItem[]>([]);
  const [options, setOptions] = useState<ImagePdfOptions>(DEFAULT_IMAGE_PDF_OPTIONS);
  const [view, setView] = useState<View>({ step: "collect" });

  const maxBytes = gate.kind === "ready" ? gate.maxBytes : 20 * 1024 * 1024;

  const reset = useCallback(() => {
    setItems([]);
    job.resetAttempt();
    setView({ step: "collect" });
  }, [job]);

  const addFiles = useCallback(
    (files: File[]) => {
      const combined = [...items.map((item) => item.file), ...files];
      try {
        validateFileList(
          combined.map((file) => ({ name: file.name, type: file.type, size: file.size })),
          "image-to-pdf",
          maxBytes,
        );
      } catch (error) {
        setView({
          step: "error",
          code: error instanceof ConversionError ? error.code : "internal_error",
        });
        return;
      }
      job.resetAttempt();
      setItems((current) => [...current, ...newStripItems(files)]);
      setView({ step: "collect" });
    },
    [items, job, maxBytes],
  );

  const convert = useCallback(async () => {
    if (items.length === 0) return;
    job.resetAttempt();

    const authorised = await job.begin({
      originalFilename: items[0]!.file.name,
      inputMimeType: items[0]!.file.type || "image/jpeg",
      inputSize: Math.max(...items.map((item) => item.file.size)),
      pageCount: items.length,
    });
    if (!authorised.ok) {
      setView({ step: "error", code: authorised.error });
      return;
    }

    setView({ step: "working", stage: "building", percent: 5, pageCount: items.length });

    try {
      const { buildImagePdf } = await import("@/lib/convert/imagePdf");
      const blob = await buildImagePdf(items, options, (done, total) =>
        setView({
          step: "working",
          stage: "building",
          percent: 5 + Math.round((done / total) * 90),
          page: done,
          pageCount: total,
        }),
      );

      await job.complete(items.length, "application/pdf");
      setView({
        step: "done",
        blob,
        filename: `${safeBaseName(items[0]!.file.name)}.pdf`,
        summary: t("conv.detectedImages", { pages: items.length }),
      });
    } catch (error) {
      const code = error instanceof ConversionError ? error.code : "internal_error";
      console.error("[image-to-pdf] conversion failed", code);
      await job.fail(code);
      setView({ step: "error", code });
    }
  }, [items, job, options, t]);

  const settings = useMemo(
    () =>
      [
        {
          id: "pageSize",
          label: "conv.pageSize" as MessageKey,
          value: options.pageSize,
          options: [
            ["auto", "conv.opt.auto"],
            ["a4", "conv.opt.a4"],
            ["letter", "conv.opt.letter"],
          ] as [PageSizeKey, MessageKey][],
          onChange: (value: string) =>
            setOptions((current) => ({ ...current, pageSize: value as PageSizeKey })),
          disabled: false,
        },
        {
          id: "orientation",
          label: "conv.orientation" as MessageKey,
          value: options.orientation,
          options: [
            ["portrait", "conv.opt.portrait"],
            ["landscape", "conv.opt.landscape"],
          ] as [Orientation, MessageKey][],
          onChange: (value: string) =>
            setOptions((current) => ({ ...current, orientation: value as Orientation })),
          // Automatic pages take the image's own shape, so orientation is moot.
          disabled: options.pageSize === "auto",
        },
        {
          id: "margin",
          label: "conv.margins" as MessageKey,
          value: options.margin,
          options: [
            ["none", "conv.opt.none"],
            ["small", "conv.opt.small"],
            ["normal", "conv.opt.normal"],
          ] as [MarginKey, MessageKey][],
          onChange: (value: string) =>
            setOptions((current) => ({ ...current, margin: value as MarginKey })),
          disabled: false,
        },
        {
          id: "fit",
          label: "conv.fit" as MessageKey,
          value: options.fit,
          options: [
            ["fit", "conv.opt.fit"],
            ["fill", "conv.opt.fill"],
            ["original", "conv.opt.original"],
          ] as [FitMode, MessageKey][],
          onChange: (value: string) =>
            setOptions((current) => ({ ...current, fit: value as FitMode })),
          disabled: false,
        },
        {
          id: "quality",
          label: "conv.quality" as MessageKey,
          value: options.quality,
          options: [
            ["high", "conv.opt.high"],
            ["balanced", "conv.opt.balanced"],
            ["small", "conv.opt.compact"],
          ] as [QualityKey, MessageKey][],
          onChange: (value: string) =>
            setOptions((current) => ({ ...current, quality: value as QualityKey })),
          disabled: false,
        },
      ] as const,
    [options],
  );

  if (gate.kind !== "ready") return <GateCard state={gate} />;

  return (
    <div>
      <QuotaLine remaining={gate.pagesRemaining} limit={gate.pageLimit} />

      {view.step === "collect" && (
        <div className="space-y-5">
          {items.length === 0 ? (
            <Dropzone
              accept={acceptAttribute("image-to-pdf")}
              multiple
              formatsLabel={formatsLabel}
              maxBytes={maxBytes}
              onFiles={addFiles}
            />
          ) : (
            <>
              <ImageStrip items={items} onChange={setItems} />
              <Dropzone
                accept={acceptAttribute("image-to-pdf")}
                multiple
                compact
                formatsLabel={formatsLabel}
                maxBytes={maxBytes}
                onFiles={addFiles}
              />

              <fieldset className="rounded-xl border border-border p-4">
                <legend className="px-1 text-xs font-semibold text-navy">
                  {t("conv.settings")}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {settings.map((setting) => (
                    <div key={setting.id}>
                      <Label
                        htmlFor={`pdf-${setting.id}`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        {t(setting.label)}
                      </Label>
                      <Select
                        value={setting.value}
                        onValueChange={setting.onChange}
                        disabled={setting.disabled}
                      >
                        <SelectTrigger id={`pdf-${setting.id}`} className="mt-1.5 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options.map(([value, labelKey]) => (
                            <SelectItem key={value} value={value}>
                              {t(labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void convert()}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("conv.convert")}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-navy"
                >
                  {t("conv.startOver")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {view.step === "working" && (
        <StageProgress
          stage={view.stage}
          percent={view.percent}
          page={view.page}
          pageCount={view.pageCount}
        />
      )}

      {view.step === "done" && (
        <ResultPanel
          title={t("conv.stage.completed")}
          summary={view.summary}
          onDownload={() => {
            downloadBlob(view.blob, view.filename);
            toast.success(t("conv.download"));
          }}
          onStartOver={reset}
        >
          <PdfPreview blob={view.blob} />
        </ResultPanel>
      )}

      {view.step === "error" && <ErrorNotice code={view.code} onRetry={reset} />}

      <PrivacyNote withOcr={false} />
    </div>
  );
}

/** Inline preview of the finished PDF, from a blob URL that is never uploaded. */
function PdfPreview({ blob }: { blob: Blob }) {
  const t = useT();
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{t("conv.previewHint")}</p>
      <object
        data={url}
        type="application/pdf"
        className="h-[420px] w-full rounded-lg border border-border"
        aria-label={t("conv.preview")}
      >
        <p className="p-4 text-sm text-muted-foreground">{t("conv.previewHint")}</p>
      </object>
    </div>
  );
}
