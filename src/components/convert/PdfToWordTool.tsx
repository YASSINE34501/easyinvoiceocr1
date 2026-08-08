/**
 * PDF to Word.
 *
 * Reads the text layer where there is one and falls back to recognition where
 * there is not, page by page, then writes a real .docx. The recognised text is
 * shown for correction first, and the generated file is integrity-checked
 * before the download button appears — an empty or truncated .docx is never
 * handed over.
 */

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { useConversionJob } from "./useConversionJob";
import { useLocale, useT } from "@/i18n/useLocale";
import { acceptAttribute, safeBaseName, validateFile } from "@/lib/convert/validation";
import { ConversionError, type ConversionStage, type ErrorCode } from "@/lib/convert/types";
import { defaultOcrLanguage, OCR_LANGUAGES, type OcrLanguage } from "@/lib/convert/ocr";
import type { RecognisedPage } from "@/lib/convert/pipelines";

const OUTPUT_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type View =
  | { step: "idle" }
  | {
      step: "working";
      stage: ConversionStage;
      percent: number;
      page?: number | undefined;
      pageCount?: number | undefined;
    }
  | { step: "review"; pages: RecognisedPage[]; usedOcr: boolean }
  | { step: "done"; blob: Blob; filename: string; summary: string }
  | { step: "error"; code: ErrorCode };

export function PdfToWordTool({ formatsLabel }: { formatsLabel: string }) {
  const t = useT();
  const locale = useLocale();
  const gate = useConverterGate("pdf-to-word");
  const job = useConversionJob("pdf-to-word");

  const [view, setView] = useState<View>({ step: "idle" });
  const [language, setLanguage] = useState<OcrLanguage>(defaultOcrLanguage(locale));
  const [edits, setEdits] = useState<Record<number, string>>({});
  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const maxBytes = gate.kind === "ready" ? gate.maxBytes : 20 * 1024 * 1024;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    fileRef.current = null;
    setEdits({});
    job.resetAttempt();
    setView({ step: "idle" });
  }, [job]);

  const start = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      fileRef.current = file;
      setEdits({});
      job.resetAttempt();

      try {
        validateFile(file, "pdf-to-word", maxBytes);
      } catch (error) {
        const code = error instanceof ConversionError ? error.code : "internal_error";
        setView({ step: "error", code });
        return;
      }

      setView({ step: "working", stage: "reading", percent: 3 });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // The page count decides how much quota to reserve, so the PDF is
        // opened locally first and the job is authorised before any real work.
        const { openPdf } = await import("@/lib/convert/pdf");
        const probe = await openPdf(await file.arrayBuffer());
        const pageCount = probe.pageCount;
        await probe.destroy();

        const authorised = await job.begin({
          originalFilename: file.name,
          inputMimeType: file.type || "application/pdf",
          inputSize: file.size,
          pageCount,
        });
        if (!authorised.ok) {
          setView({ step: "error", code: authorised.error });
          return;
        }

        const { pdfToRecognisedPages } = await import("@/lib/convert/pipelines");
        const result = await pdfToRecognisedPages(file, {
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

        setView({ step: "review", pages: result.pages, usedOcr: result.usedOcr });
      } catch (error) {
        const code = error instanceof ConversionError ? error.code : "internal_error";
        if (error instanceof ConversionError && error.message === "cancelled") {
          reset();
          return;
        }
        console.error("[pdf-to-word] conversion failed", code);
        await job.fail(code);
        setView({ step: "error", code });
      }
    },
    [job, language, maxBytes, reset],
  );

  const build = useCallback(
    async (pages: RecognisedPage[]) => {
      const file = fileRef.current;
      if (!file) return;

      setView({ step: "working", stage: "building", percent: 92 });
      try {
        const { pagesToModel, summarise } = await import("@/lib/convert/pipelines");
        const { buildDocx } = await import("@/lib/convert/docx");

        const model = pagesToModel(pages, file.name, edits);
        const blob = await buildDocx(model);
        const counts = summarise(model);

        await job.complete(model.pageCount, OUTPUT_MIME);

        setView({
          step: "done",
          blob,
          filename: `${safeBaseName(file.name)}.docx`,
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
        console.error("[pdf-to-word] document build failed", code);
        await job.fail(code);
        setView({ step: "error", code });
      }
    },
    [edits, job, t],
  );

  if (gate.kind !== "ready") return <GateCard state={gate} />;

  return (
    <div>
      <QuotaLine remaining={gate.pagesRemaining} limit={gate.pageLimit} />

      {view.step === "idle" && (
        <>
          <div className="mb-4 max-w-xs">
            <Label htmlFor="pdf-ocr-language" className="text-xs font-medium text-muted-foreground">
              {t("conv.ocrLanguage")}
            </Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as OcrLanguage)}>
              <SelectTrigger id="pdf-ocr-language" className="mt-1.5 h-11">
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
          <Dropzone
            accept={acceptAttribute("pdf-to-word")}
            multiple={false}
            formatsLabel={formatsLabel}
            maxBytes={maxBytes}
            onFiles={start}
          />
        </>
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
                  <Label htmlFor={`page-${page.index}`} className="text-xs font-semibold text-navy">
                    {`${t("conv.preview")} · ${page.index}/${view.pages.length}`}
                  </Label>
                  {page.confidence !== null && (
                    <span className="text-[11px] text-muted-foreground">
                      OCR · {Math.round(page.confidence)}%
                    </span>
                  )}
                </div>
                <Textarea
                  id={`page-${page.index}`}
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
        >
          <p className="text-xs text-muted-foreground">{t("conv.previewHint")}</p>
        </ResultPanel>
      )}

      {view.step === "error" && <ErrorNotice code={view.code} onRetry={reset} />}

      <PrivacyNote withOcr />
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
