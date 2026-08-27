/**
 * The shared pieces every converter is built from.
 *
 * All three tools use the same drop zone, the same progress panel, the same
 * error treatment and the same access gate, so PDF to Word, Image to Word and
 * Image to PDF are recognisably one product rather than three separate designs.
 */

import { useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Download,
  FileUp,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppLink } from "@/components/site/AppLink";
import { authSlugs, path } from "@/config/nav";
import { useLocale, useT, type Translator } from "@/i18n/useLocale";
import { useAuth } from "@/auth/AuthProvider";
import { useBilling } from "@/billing/BillingProvider";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/convert/validation";
import type { ConversionStage, ErrorCode } from "@/lib/convert/types";
import type { MessageKey } from "@/i18n";

/* ------------------------------------------------------------------ */
/* Drop zone                                                           */
/* ------------------------------------------------------------------ */

export function Dropzone({
  accept,
  multiple,
  formatsLabel,
  maxBytes,
  onFiles,
  disabled,
  compact,
  title,
  buttonLabel,
}: {
  accept: string;
  multiple: boolean;
  formatsLabel: string;
  maxBytes: number;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
  /** Overrides the heading. The default wording assumes images. */
  title?: string;
  /** Overrides the button. Same reason. */
  buttonLabel?: string;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        if (disabled) return;
        const dropped = Array.from(event.dataTransfer.files ?? []);
        if (dropped.length > 0) onFiles(multiple ? dropped : dropped.slice(0, 1));
      }}
      className={cn(
        "cursor-pointer rounded-xl border-2 border-dashed border-border bg-surface/60 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "px-4 py-6" : "px-6 py-12 sm:py-16",
        dragActive && "border-primary bg-pale-green",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? []);
          if (chosen.length > 0) onFiles(chosen);
          event.target.value = "";
        }}
      />
      <UploadCloud
        className={cn("mx-auto text-primary", compact ? "size-6" : "size-10")}
        aria-hidden="true"
      />
      <p className="mt-3 text-[15px] font-semibold text-navy">
        {title ?? (multiple ? t("conv.dropTitleMulti") : t("conv.dropTitle"))}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("conv.dropHint", { formats: formatsLabel, size: formatBytes(maxBytes) })}
      </p>
      <Button
        type="button"
        className="mt-5 min-h-11 rounded-lg px-6 font-semibold"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
      >
        <FileUp className="size-4" aria-hidden="true" />
        {buttonLabel ?? (multiple ? t("conv.chooseFiles") : t("conv.chooseFile"))}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

const STAGE_KEY: Record<ConversionStage, MessageKey> = {
  waiting: "conv.stage.waiting",
  uploading: "conv.stage.uploading",
  reading: "conv.stage.reading",
  ocr: "conv.stage.ocr",
  building: "conv.stage.building",
  completed: "conv.stage.completed",
  failed: "conv.stage.failed",
};

export function StageProgress({
  stage,
  percent,
  page,
  pageCount,
  onCancel,
}: {
  stage: ConversionStage;
  percent: number;
  page?: number | undefined;
  pageCount?: number | undefined;
  onCancel?: (() => void) | undefined;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy" aria-live="polite">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t(STAGE_KEY[stage])}
          {page && pageCount ? ` · ${page}/${pageCount}` : ""}
        </p>
        {onCancel && (
          <Button type="button" variant="ghost" className="min-h-11" onClick={onCancel}>
            {t("conv.cancel")}
          </Button>
        )}
      </div>
      <Progress value={percent} className="mt-4 h-1.5" />
      <p className="mt-2 text-xs text-muted-foreground">{percent}%</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

const ERROR_KEY = (code: ErrorCode): MessageKey => `conv.err.${code}` as MessageKey;

export function ErrorNotice({ code, onRetry }: { code: ErrorCode; onRetry?: () => void }) {
  const t = useT();
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="size-4" aria-hidden="true" />
      <AlertTitle>{t("conv.stage.failed")}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{t(ERROR_KEY(code))}</p>
        {onRetry && (
          <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("conv.retry")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy note                                                        */
/* ------------------------------------------------------------------ */

export function PrivacyNote({ withOcr }: { withOcr: boolean }) {
  const t = useT();
  return (
    <div className="mt-5 flex gap-3 rounded-lg border border-primary/25 bg-pale-green/60 p-4">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed text-accent-foreground">
        <p className="font-semibold">{t("conv.privacyTitle")}</p>
        <p className="mt-1">{t("conv.privacyLocal")}</p>
        {withOcr && <p className="mt-1">{t("conv.privacyOcr")}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

export function ResultPanel({
  title,
  summary,
  onDownload,
  onStartOver,
  children,
}: {
  title: string;
  summary: string;
  onDownload: () => void;
  onStartOver: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{summary}</p>

      {children && <div className="mt-5">{children}</div>}

      {/* Download and Start over are the page's primary controls; no ad unit is
          ever rendered in this block. */}
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
        <Button type="button" className="min-h-11 rounded-lg font-semibold" onClick={onDownload}>
          <Download className="size-4" aria-hidden="true" />
          {t("conv.download")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-lg"
          onClick={onStartOver}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("conv.startOver")}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Access gate                                                         */
/* ------------------------------------------------------------------ */

export type GateState =
  | { kind: "ready"; maxBytes: number; pagesRemaining: number; pageLimit: number }
  | { kind: "loading" }
  | { kind: "sign-in" }
  | { kind: "plan" }
  | { kind: "quota" };

/**
 * Decides what the visitor may do, from the server-resolved billing state.
 * The gate hides what is unavailable; the server refuses it regardless.
 */
export function useConverterGate(toolSlug: string): GateState {
  const { user, loading: authLoading } = useAuth();
  const { state, loading } = useBilling();

  if (authLoading) return { kind: "loading" };
  if (!user) return { kind: "sign-in" };
  if (loading || !state) return { kind: "loading" };

  if (!state.entitlements.allowedTools.includes(toolSlug)) return { kind: "plan" };
  if (state.blockedReason === "quota_exceeded") return { kind: "quota" };
  if (!state.canProcess) return { kind: "plan" };

  return {
    kind: "ready",
    maxBytes: state.entitlements.maxFileSize,
    pagesRemaining: state.usage.pagesRemaining,
    pageLimit: state.entitlements.monthlyPageLimit,
  };
}

export function GateCard({ state }: { state: Exclude<GateState, { kind: "ready" }> }) {
  const t = useT();
  const locale = useLocale();

  if (state.kind === "loading") {
    return (
      <div className="grid place-items-center rounded-xl border border-border bg-surface/60 px-6 py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const copy: Record<"sign-in" | "plan" | "quota", { title: MessageKey; body: MessageKey }> = {
    "sign-in": { title: "conv.gate.signInTitle", body: "conv.gate.signInBody" },
    plan: { title: "conv.gate.planTitle", body: "conv.gate.planBody" },
    quota: { title: "conv.gate.quotaTitle", body: "conv.gate.quotaBody" },
  };

  const { title, body } = copy[state.kind];
  const href =
    state.kind === "sign-in" ? path(authSlugs.signup, locale) : path(authSlugs.choosePlan, locale);
  const label = state.kind === "sign-in" ? t("cta.signup") : t("choose.title");

  return (
    <div className="rounded-xl border border-border bg-surface/60 px-6 py-12 text-center">
      <Lock className="mx-auto size-8 text-primary" aria-hidden="true" />
      <p className="mt-4 text-[15px] font-semibold text-navy">{t(title)}</p>
      <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-muted-foreground">
        {t(body)}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild className="min-h-11 rounded-lg px-6 font-semibold">
          <AppLink href={href}>{label}</AppLink>
        </Button>
        {state.kind === "sign-in" && (
          <Button asChild variant="outline" className="min-h-11 rounded-lg px-6 text-navy">
            <AppLink href={path(authSlugs.login, locale)}>{t("cta.login")}</AppLink>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Small "x of y pages left" line shown above the tool for signed-in users. */
export function QuotaLine({ remaining, limit }: { remaining: number; limit: number }) {
  const t = useT();
  if (limit <= 0) return null;
  return (
    <p className="mb-3 text-xs text-muted-foreground">
      {t("conv.pagesLeft", { remaining, limit })}
    </p>
  );
}

/** Triggers a browser download for a generated Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoked on the next tick so Safari has started the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type { Translator };
