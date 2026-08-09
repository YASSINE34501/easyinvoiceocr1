/**
 * The real extraction workspace.
 *
 * Every result on this screen comes from Tesseract reading the visitor's own
 * file in their own browser. There is no sample data and no simulated progress:
 * the bar advances only when the pipeline reports a stage, and if recognition
 * finds nothing usable the conversion fails rather than showing an empty table
 * as a success.
 *
 * The conversion gate is resolved before any work starts and again before the
 * attempt is committed, so a customer past their allowance cannot reach the
 * processing path at all.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, FileUp, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { extractFromFile } from "@/lib/extract/pipeline";
import { downloadExport, type ExportFormat } from "@/lib/extract/exports";
import { FIELD_LABELS } from "@/lib/extract/workbook";
import type { ExtractedDocument } from "@/lib/extract/parser";
import { defaultOcrLanguage } from "@/lib/convert/ocr";
import { dayFirstForLocale } from "@/lib/extract/normalize";
import { isConversionError, type ConversionStage } from "@/lib/convert/types";
import type { QuotaTool } from "@/lib/convert/validation";
import { useConversionJob } from "@/components/convert/useConversionJob";
import {
  Paywall,
  SignInToConvert,
  TrialCounter,
  useConversionGate,
} from "@/components/billing/ConversionGate";
import { useLocale, useT } from "@/i18n/useLocale";

export type ExtractionKind = "invoice" | "receipt" | "pdf" | "image";

const ACCEPT: Record<ExtractionKind, { mime: string[]; label: string; attr: string }> = {
  invoice: {
    mime: ["application/pdf", "image/jpeg", "image/png"],
    label: "PDF, JPG or PNG",
    attr: ".pdf,.jpg,.jpeg,.png",
  },
  receipt: {
    mime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    label: "JPG · PNG · WebP · PDF",
    attr: ".pdf,.jpg,.jpeg,.png,.webp",
  },
  pdf: { mime: ["application/pdf"], label: "PDF", attr: ".pdf" },
  image: {
    mime: ["image/jpeg", "image/png", "image/webp"],
    label: "JPG · PNG · WebP",
    attr: ".jpg,.jpeg,.png,.webp",
  },
};

const MAX_BYTES = 20 * 1024 * 1024;

type Status = "idle" | "processing" | "ready" | "error";

/** Maps a pipeline stage to the localized label shown next to the bar. */
function stageKey(stage: ConversionStage): string {
  switch (stage) {
    case "reading":
      return "convert.stageReading";
    case "ocr":
      return "convert.stageOcr";
    case "building":
      return "convert.stageBuilding";
    case "completed":
      return "convert.stageCompleted";
    default:
      return "convert.stageWaiting";
  }
}

export function ExtractionWorkspace({
  kind,
  tool,
  id = "workspace",
  onSuccess,
  disabled = false,
  disabledReason,
}: {
  kind: ExtractionKind;
  /** Quota tool slug. When given, every conversion goes through the gate. */
  tool?: QuotaTool | undefined;
  id?: string | undefined;
  /** Called once, after a genuinely successful extraction, to commit the attempt. */
  onSuccess?: (() => void) | undefined;
  /** True when the gate blocks conversion; the upload control is inert. */
  disabled?: boolean | undefined;
  disabledReason?: React.ReactNode | undefined;
}) {
  const t = useT();
  const locale = useLocale();
  const accept = ACCEPT[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hooks cannot be conditional, so the job is always created and simply not
  // used when this workspace is rendered without a quota tool.
  const conversionJob = useConversionJob(tool ?? "invoice-ocr");
  const job = tool ? conversionJob : null;
  const { gate, ready: gateReady, reload: reloadGate, signedIn } = useConversionGate();

  const [status, setStatus] = useState<Status>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ConversionStage>("waiting");
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<ExtractedDocument | null>(null);

  useEffect(
    () => () => {
      // Abort any in-flight recognition when the component unmounts so the
      // Tesseract worker is not left running.
      abortRef.current?.abort();
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setError(null);
    setDocument(null);
    setProgress(0);
    setStage("waiting");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    void reloadGate();
    // A cancelled conversion consumes nothing. The abort path in start() calls
    // job.fail(), which releases the reservation server-side.
    setStatus("idle");
    setProgress(0);
    setStage("waiting");
    setFileName("");
    toast.info(t("convert.cancelled"));
  }, [reloadGate, t]);

  const start = useCallback(
    async (file: File) => {
      if (disabled) return;

      // A new file is new work, so it gets a new idempotency key. Without this
      // a second file would reuse the first key and be charged nothing.
      job?.resetAttempt();

      if (!accept.mime.includes(file.type)) {
        setError(t("convert.errUnsupported"));
        setStatus("error");
        return;
      }
      if (file.size === 0) {
        setError(t("convert.errEmptyFile"));
        setStatus("error");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(t("convert.errTooLarge"));
        setStatus("error");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setDocument(null);
      setFileName(file.name);
      setStatus("processing");
      setProgress(0);
      setStage("waiting");

      // Reserve before any work starts. The server re-resolves the gate and
      // takes the reservation under a per-user lock, so two tabs cannot both
      // spend the last conversion.
      if (job) {
        const opened = await job.begin({
          originalFilename: file.name,
          inputMimeType: file.type,
          inputSize: file.size,
          pageCount: 1,
        });
        if (!opened.ok) {
          setError(t(`convert.err_${opened.error}` as never) || t("convert.errGeneric"));
          setStatus("error");
          abortRef.current = null;
          return;
        }
      }

      try {
        const result = await extractFromFile(file, {
          kind: kind === "receipt" ? "receipt" : "invoice",
          ocrLanguage: defaultOcrLanguage(locale),
          dayFirst: dayFirstForLocale(locale),
          signal: controller.signal,
          onProgress: (update) => {
            // Real progress from the pipeline — never a timer.
            setProgress(update.percent);
            setStage(update.stage);
          },
        });

        if (controller.signal.aborted) {
          // Cancelled after the reservation: give it straight back. Reported as
          // "cancelled" rather than "timeout" so the funnel can tell a user who
          // changed their mind from a conversion that genuinely broke.
          await job?.fail("cancelled");
          return;
        }

        setDocument(result);
        setStatus("ready");
        // Commit exactly once, only with a valid result in hand.
        await job?.complete(1, "application/json");
        onSuccess?.();
      } catch (caught) {
        const code = isConversionError(caught) ? caught.code : "internal_error";
        // A failure must cost nothing, so the reservation is released before
        // the error is shown.
        await job?.fail(code);
        if (controller.signal.aborted) return;
        setError(t(`convert.err_${code}` as never) || t("convert.errGeneric"));
        setStatus("error");
      } finally {
        abortRef.current = null;
        // Re-read committed usage after every outcome, so the counter and the
        // paywall reflect the database rather than an optimistic guess.
        await reloadGate();
      }
    },
    [accept.mime, disabled, job, kind, locale, onSuccess, reloadGate, t],
  );

  const updateField = (key: string, value: string) =>
    setDocument((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.key === key ? { ...field, value } : field,
            ),
          }
        : current,
    );

  const updateItem = (index: number, patch: Partial<ExtractedDocument["lineItems"][number]>) =>
    setDocument((current) =>
      current
        ? {
            ...current,
            lineItems: current.lineItems.map((item, position) =>
              position === index ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );

  const exportAs = (format: ExportFormat) => {
    if (!document) return;
    const base = fileName.replace(/\.[^.]+$/, "") || "extraction";
    downloadExport(document, format, base);
  };

  if (disabled) {
    return (
      <div id={id} className="rounded-2xl border border-border bg-card p-6 shadow-panel">
        {disabledReason}
      </div>
    );
  }

  return (
    <div id={id} className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-6">
      <Alert className="mb-5">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <AlertTitle>{t("convert.reviewNoticeTitle")}</AlertTitle>
        <AlertDescription>{t("convert.reviewNoticeBody")}</AlertDescription>
      </Alert>

      {tool && gateReady && gate && <TrialCounter gate={gate} />}

      {/* The paywall replaces the upload control rather than sitting beside it,
          so an exhausted allowance leaves no path to start a conversion. */}
      {tool && gateReady && !signedIn ? (
        <SignInToConvert />
      ) : tool && gateReady && gate && !gate.canProcess ? (
        <Paywall
          reason={
            gate.blockedReason === "trial_exhausted" ? "trial_exhausted" : "subscription_inactive"
          }
        />
      ) : status === "idle" || status === "error" ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) void start(dropped);
          }}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface/60 px-6 py-10 text-center transition-colors",
            dragActive && "border-primary bg-pale-green",
            error && "border-destructive/60",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept.attr}
            className="sr-only"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) void start(chosen);
            }}
          />
          <FileUp className="mx-auto size-8 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-navy">{t("convert.dropHere")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{accept.label} · 20 MB</p>
          {error && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : null}

      {status === "processing" && (
        <div className="rounded-xl border border-border bg-surface/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-navy">{fileName}</p>
            <Button variant="ghost" size="sm" onClick={cancel}>
              <X className="size-4" aria-hidden="true" /> {t("convert.cancel")}
            </Button>
          </div>
          <Progress value={progress} className="mt-4 h-1.5" />
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t(stageKey(stage) as never)} · {progress}%
          </p>
        </div>
      )}

      {status === "ready" && document && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-navy">{fileName}</p>
              {document.ocrConfidence !== null && (
                <Badge variant="secondary">
                  {t("convert.ocrConfidence")}: {Math.round(document.ocrConfidence)}%
                </Badge>
              )}
              {document.needsReview && (
                <Badge variant="outline" className="border-destructive/50 text-destructive">
                  {t("convert.needsReview")}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" aria-hidden="true" /> {t("convert.startOver")}
            </Button>
          </div>

          {document.warnings.length > 0 && (
            <Alert className="border-destructive/40">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <AlertTitle>{t("convert.warningsTitle")}</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 ps-5 text-xs">
                  {document.warnings.map((warning, index) => (
                    <li key={`${warning.code}-${index}`}>
                      {t(`convert.warn_${warning.code}` as never)}
                      {warning.detail?.["expected"] !== undefined && (
                        <>
                          {" "}
                          ({t("convert.expected")} {warning.detail["expected"]},{" "}
                          {t("convert.found")} {warning.detail["found"]})
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <section>
            <h3 className="text-sm font-semibold text-navy">{t("convert.fields")}</h3>
            {document.fields.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("convert.noFields")}</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {document.fields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      {FIELD_LABELS[field.key] ?? field.key}
                      {field.needsReview && (
                        <Badge
                          variant="outline"
                          className="border-destructive/50 px-1 py-0 text-[10px] text-destructive"
                        >
                          {t("convert.check")}
                        </Badge>
                      )}
                    </span>
                    <Input
                      value={field.value}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      className={cn("mt-1", field.needsReview && "border-destructive/50")}
                    />
                  </label>
                ))}
              </div>
            )}
          </section>

          {document.lineItems.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-navy">{t("convert.lineItems")}</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-surface text-navy">
                    <tr>
                      {["description", "quantity", "unitPrice", "lineTotal"].map((column) => (
                        <th key={column} className="px-2 py-2 text-start text-xs font-semibold">
                          {t(`convert.col_${column}` as never)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {document.lineItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-t border-border",
                          item.needsReview && "bg-destructive/5",
                        )}
                      >
                        <td className="px-2 py-1">
                          <Input
                            value={item.description}
                            onChange={(event) =>
                              updateItem(index, { description: event.target.value })
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, { quantity: event.target.value })
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.unitPrice}
                            onChange={(event) =>
                              updateItem(index, { unitPrice: event.target.value })
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.lineTotal}
                            onChange={(event) =>
                              updateItem(index, { lineTotal: event.target.value })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            {(["xlsx", "csv", "json"] as const).map((format) => (
              <Button key={format} onClick={() => exportAs(format)} variant="outline">
                <Download className="size-4" aria-hidden="true" /> {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
