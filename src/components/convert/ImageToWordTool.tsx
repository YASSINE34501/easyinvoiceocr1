/**
 * Image to Word.
 *
 * Two honest outputs: recognised text you can correct before it is written, or
 * the original images placed on their own pages. The second exists precisely
 * because recognition is never certain — when the page itself is the record,
 * inserting the picture guarantees nothing is misread.
 */

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useLocale, useT } from "@/i18n/useLocale";
import { acceptAttribute, safeBaseName, validateFileList } from "@/lib/convert/validation";
import { ConversionError, type ConversionStage, type ErrorCode } from "@/lib/convert/types";
import { defaultOcrLanguage, OCR_LANGUAGES, type OcrLanguage } from "@/lib/convert/ocr";
import type { RecognisedPage } from "@/lib/convert/pipelines";

const OUTPUT_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Mode = "text" | "images";

type View =
  | { step: "collect" }
  | {
      step: "working";
      stage: ConversionStage;
      percent: number;
      page?: number | undefined;
      pageCount?: number | undefined;
    }
  | { step: "review"; pages: RecognisedPage[] }
  | { step: "done"; blob: Blob; filename: string; summary: string }
  | { step: "error"; code: ErrorCode };

export function ImageToWordTool({ formatsLabel }: { formatsLabel: string }) {
  const t = useT();
  const locale = useLocale();
  const gate = useConverterGate("image-to-word");
  const job = useConversionJob("image-to-word");

  const [items, setItems] = useState<StripItem[]>([]);
  const [mode, setMode] = useState<Mode>("text");
  const [language, setLanguage] = useState<OcrLanguage>(defaultOcrLanguage(locale));
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [view, setView] = useState<View>({ step: "collect" });
  const abortRef = useRef<AbortController | null>(null);

  const maxBytes = gate.kind === "ready" ? gate.maxBytes : 20 * 1024 * 1024;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setItems([]);
    setEdits({});
    job.resetAttempt();
    setView({ step: "collect" });
  }, [job]);

  const addFiles = useCallback(
    (files: File[]) => {
      const combined = [...items.map((item) => item.file), ...files];
      try {
        validateFileList(
          combined.map((file) => ({ name: file.name, type: file.type, size: file.size })),
          "image-to-word",
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

    const totalSize = items.reduce((sum, item) => sum + item.file.size, 0);
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

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (mode === "images") {
        setView({ step: "working", stage: "building", percent: 10, pageCount: items.length });
        const { imagesToPictureModel } = await import("@/lib/convert/pipelines");
        const { buildDocx } = await import("@/lib/convert/docx");

        const model = await imagesToPictureModel(items, items[0]!.file.name, (done, total) =>
          setView({
            step: "working",
            stage: "building",
            percent: 10 + Math.round((done / total) * 80),
            page: done,
            pageCount: total,
          }),
        );
        const blob = await buildDocx(model);
        await job.complete(model.pageCount, OUTPUT_MIME);

        setView({
          step: "done",
          blob,
          filename: `${safeBaseName(items[0]!.file.name)}.docx`,
          summary: t("conv.detectedImages", { pages: items.length }),
        });
        void totalSize;
        return;
      }

      setView({ step: "working", stage: "ocr", percent: 5, pageCount: items.length });
      const { imagesToRecognisedPages } = await import("@/lib/convert/pipelines");
      const result = await imagesToRecognisedPages(items, {
        ocrLanguage: language,
        signal: controller.signal,
        onProgress: (update) =>
          setView({
            step: "working",
            stage: update.stage,
            percent: update.percent,
            page: update.page,
            pageCount: update.pageCount,
          }),
      });
      setView({ step: "review", pages: result.pages });
    } catch (error) {
      const code = error instanceof ConversionError ? error.code : "internal_error";
      if (error instanceof ConversionError && error.message === "cancelled") {
        reset();
        return;
      }
      console.error("[image-to-word] conversion failed", code);
      await job.fail(code);
      setView({ step: "error", code });
    }
  }, [items, job, language, mode, reset, t]);

  const build = useCallback(
    async (pages: RecognisedPage[]) => {
      setView({ step: "working", stage: "building", percent: 92 });
      try {
        const { pagesToModel, summarise } = await import("@/lib/convert/pipelines");
        const { buildDocx } = await import("@/lib/convert/docx");

        const model = pagesToModel(pages, items[0]?.file.name ?? "document", edits);
        const blob = await buildDocx(model);
        const counts = summarise(model);
        await job.complete(model.pageCount, OUTPUT_MIME);

        setView({
          step: "done",
          blob,
          filename: `${safeBaseName(items[0]?.file.name ?? "document")}.docx`,
          summary: t("conv.detected", {
            headings: counts.headings,
            paragraphs: counts.paragraphs,
            lists: counts.lists,
            tables: counts.tables,
            pages: model.pageCount,
          }),
        });
      } catch (error) {
        const code = error instanceof ConversionError ? error.code : "internal_error";
        console.error("[image-to-word] document build failed", code);
        await job.fail(code);
        setView({ step: "error", code });
      }
    },
    [edits, items, job, t],
  );

  if (gate.kind !== "ready") return <GateCard state={gate} />;

  return (
    <div>
      <QuotaLine remaining={gate.pagesRemaining} limit={gate.pageLimit} />

      {view.step === "collect" && (
        <div className="space-y-5">
          {items.length === 0 ? (
            <Dropzone
              accept={acceptAttribute("image-to-word")}
              multiple
              formatsLabel={formatsLabel}
              maxBytes={maxBytes}
              onFiles={addFiles}
            />
          ) : (
            <>
              <ImageStrip items={items} onChange={setItems} />
              <Dropzone
                accept={acceptAttribute("image-to-word")}
                multiple
                compact
                formatsLabel={formatsLabel}
                maxBytes={maxBytes}
                onFiles={addFiles}
              />

              <fieldset className="rounded-xl border border-border p-4">
                <legend className="px-1 text-xs font-semibold text-navy">
                  {t("conv.outputMode")}
                </legend>
                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as Mode)}
                  className="gap-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="text" id="mode-text" />
                    <Label htmlFor="mode-text" className="text-sm font-normal">
                      {t("conv.outputText")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="images" id="mode-images" />
                    <Label htmlFor="mode-images" className="text-sm font-normal">
                      {t("conv.outputImages")}
                    </Label>
                  </div>
                </RadioGroup>

                {mode === "text" && (
                  <div className="mt-4 max-w-xs">
                    <Label
                      htmlFor="image-ocr-language"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {t("conv.ocrLanguage")}
                    </Label>
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value as OcrLanguage)}
                    >
                      <SelectTrigger id="image-ocr-language" className="mt-1.5 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OCR_LANGUAGES.map((code) => (
                          <SelectItem key={code} value={code}>
                            {LANGUAGE_LABEL[code]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
          onCancel={reset}
        />
      )}

      {view.step === "review" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-navy">{t("conv.reviewText")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("conv.reviewHint")}</p>
          </div>
          <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-xl border border-border p-4">
            {view.pages.map((page) => (
              <div key={page.index}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`img-page-${page.index}`}
                    className="text-xs font-semibold text-navy"
                  >
                    {`${t("conv.preview")} · ${page.index}/${view.pages.length}`}
                  </Label>
                  {page.confidence !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      OCR · {Math.round(page.confidence)}%
                    </span>
                  )}
                </div>
                <Textarea
                  id={`img-page-${page.index}`}
                  value={edits[page.index] ?? page.text}
                  onChange={(event) =>
                    setEdits((current) => ({ ...current, [page.index]: event.target.value }))
                  }
                  rows={8}
                  className="font-mono text-xs"
                  dir="auto"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void build(view.pages)}
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
        </div>
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
        />
      )}

      {view.step === "error" && <ErrorNotice code={view.code} onRetry={reset} />}

      <PrivacyNote withOcr={mode === "text"} />
    </div>
  );
}

const LANGUAGE_LABEL: Record<OcrLanguage, string> = {
  eng: "English",
  fra: "Français",
  ara: "العربية",
  "eng+ara": "English + العربية",
  "eng+fra": "English + Français",
  deu: "Deutsch",
  spa: "Español",
};
