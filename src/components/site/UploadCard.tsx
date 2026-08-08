/**
 * Homepage entry point to the converters.
 *
 * This card deliberately does no processing of its own. It validates the choice
 * and hands the visitor to the product page, where the real Tesseract pipeline
 * runs. It shows no extracted values, because any figure shown here would be
 * invented rather than read from the visitor's file.
 */

import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileUp, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { path } from "@/config/nav";
import { useLocale, useT } from "@/i18n/useLocale";

const MAX_BYTES = siteConfig.maxUploadMb * 1024 * 1024;

function validate(file: File, t: ReturnType<typeof useT>): string | null {
  if (!siteConfig.acceptedTypes.includes(file.type)) return t("convert.errUnsupported");
  if (file.size === 0) return t("convert.errEmptyFile");
  if (file.size > MAX_BYTES) return t("convert.errTooLarge");
  return null;
}

export function UploadCard() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * A file chosen here cannot be handed across a navigation, so the visitor is
   * taken to the converter and picks it there. Nothing is processed on this
   * page and no result is ever displayed here.
   */
  const go = (file?: File) => {
    if (file) {
      const problem = validate(file, t);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setError(null);
    void navigate({ to: path("invoice-ocr", locale), hash: "demo" });
  };

  return (
    <div
      id="upload"
      className="rounded-2xl border border-border bg-card p-4 shadow-panel sm:p-5"
      aria-label="Start a conversion"
    >
      <div
        role="button"
        tabIndex={0}
        aria-describedby="upload-hint"
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
          go(event.dataTransfer.files?.[0]);
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
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(event) => go(event.target.files?.[0])}
        />

        <UploadCloud className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-navy">{t("convert.dropHere")}</p>
        <p id="upload-hint" className="mt-1 text-xs text-muted-foreground">
          PDF, JPG, PNG · {siteConfig.maxUploadMb} MB
        </p>
        <Button
          className="mt-4 h-10 rounded-lg px-5 font-semibold"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <FileUp className="size-4" aria-hidden="true" /> {t("free.tryFree")}
        </Button>
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        {t("free.noCard")}
        <ArrowRight className="size-3.5 text-primary" aria-hidden="true" />
        {t("free.afterFive")}
      </p>
    </div>
  );
}
