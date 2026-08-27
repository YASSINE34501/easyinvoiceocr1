/**
 * The interactive half of every PDF tool page.
 *
 * One component for all eight tools rather than eight near-identical ones: the
 * shape of the work is the same every time — choose files, read them, set a few
 * options, run, check the output, download — and only the options differ. The
 * per-tool part is confined to `Options` and `run`, so a change to how files
 * are read or how errors are shown lands on every tool at once.
 *
 * Everything happens in the tab. There is no upload, no server call and no
 * quota check, because these tools cost us nothing to run and the file never
 * reaches us. That is also why they are not gated behind an account, unlike the
 * extraction products.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  ArrowUp,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dropzone } from "@/components/convert/parts";
import { useLocale } from "@/i18n/useLocale";
import { pdfToolsCopy } from "@/content/pdftools";
import { pdfTool } from "@/lib/pdftools/registry";
import {
  MAX_FILE_BYTES,
  MAX_FILES,
  assertPdfSignature,
  formatBytes,
  validatePdfFile,
  validatePdfFiles,
} from "@/lib/pdftools/validate";
import { parsePageSelection } from "@/lib/pdftools/pages";
import {
  addPageNumbers,
  cropPages,
  eachPageRange,
  extractPages,
  fixedSizeRanges,
  inspectPdf,
  mergePdfs,
  organizePages,
  removePages,
  rotatePages,
  splitPdf,
} from "@/lib/pdftools/operations";
import {
  PdfToolError,
  type OutputFile,
  type PagePosition,
  type PdfErrorCode,
  type PdfToolSlug,
  type RotationAngle,
} from "@/lib/pdftools/types";
import { downloadOne, downloadOutputs, totalBytes } from "./archive";
import { cn } from "@/lib/utils";

type Loaded = { name: string; size: number; bytes: Uint8Array };

type PageInfo = { width: number; height: number; rotation: number };

type Phase =
  | { kind: "empty" }
  | { kind: "reading" }
  | { kind: "ready" }
  | { kind: "working" }
  | { kind: "done"; files: OutputFile[]; summary: [string, string][] }
  | { kind: "error"; code: PdfErrorCode };

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Anything thrown becomes a code the visitor has a translated sentence for. */
function codeOf(error: unknown): PdfErrorCode {
  return error instanceof PdfToolError ? error.code : "unknown";
}

export function ToolRunner({ slug }: { slug: PdfToolSlug }) {
  const locale = useLocale();
  const copy = pdfToolsCopy(locale);
  const ui = copy.ui;
  const tool = pdfTool(slug);
  const multiple = tool?.input === "multiple";

  const [files, setFiles] = useState<Loaded[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "empty" });

  /* Options. Each tool reads only the ones it shows. */
  const [selection, setSelection] = useState("");
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [splitMode, setSplitMode] = useState<"each" | "fixed">("each");
  const [groupSize, setGroupSize] = useState(2);
  const [margins, setMargins] = useState({ top: 36, right: 36, bottom: 36, left: 36 });
  const [order, setOrder] = useState<number[]>([]);
  const [position, setPosition] = useState<PagePosition>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [numberFormat, setNumberFormat] = useState("{n}");

  // Guards against a second run being started while the first is still going;
  // the operations are synchronous enough to finish, but two runs writing to
  // the same state would show the wrong summary.
  const busy = useRef(false);

  const reset = useCallback(() => {
    setFiles([]);
    setPages([]);
    setOrder([]);
    setSelection("");
    setPhase({ kind: "empty" });
  }, []);

  const onFiles = useCallback(
    async (chosen: File[]) => {
      setPhase({ kind: "reading" });
      try {
        // Single-input tools replace what is there; a multi-file tool adds to
        // it, so dropping a second batch does not discard the first.
        const kept = multiple ? files : [];
        const incoming = multiple ? chosen : chosen.slice(0, 1);
        validatePdfFiles(incoming.map((f) => ({ name: f.name, size: f.size, type: f.type })));
        if (kept.length + incoming.length > MAX_FILES) {
          throw new PdfToolError("too_many_files");
        }

        const added: Loaded[] = [];
        for (const file of incoming) {
          validatePdfFile({ name: file.name, size: file.size, type: file.type });
          const bytes = new Uint8Array(await file.arrayBuffer());
          // The extension is the weakest signal there is; the header is the
          // check that a rename cannot get past.
          assertPdfSignature(bytes);
          added.push({ name: file.name, size: file.size, bytes });
        }

        const loaded = [...kept, ...added];
        setFiles(loaded);

        const first = loaded[0];
        if (!multiple && first) {
          const info = await inspectPdf(first.bytes);
          setPages(info.pages);
          setOrder(info.pages.map((_, index) => index));
        }
        setPhase({ kind: "ready" });
      } catch (error) {
        setFiles([]);
        setPages([]);
        setPhase({ kind: "error", code: codeOf(error) });
      }
    },
    [files, multiple],
  );

  /** The selection box, empty, means every page. */
  const resolveSelection = useCallback((): number[] => {
    const count = pages.length;
    if (selection.trim() === "") return Array.from({ length: count }, (_, index) => index);
    return parsePageSelection(selection, count);
  }, [pages.length, selection]);

  const run = useCallback(async () => {
    if (busy.current) return;
    const first = files[0];
    if (!first) {
      setPhase({ kind: "error", code: "no_files" });
      return;
    }

    busy.current = true;
    setPhase({ kind: "working" });

    try {
      const pagesIn = pages.length;
      let outputs: OutputFile[] = [];
      let summary: [string, string][] = [];

      switch (slug) {
        case "merge-pdf": {
          const merged = await mergePdfs(files.map((f) => ({ name: f.name, bytes: f.bytes })));
          outputs = [merged.file];
          summary = [
            [ui.files, String(merged.sources)],
            [ui.pagesOut, String(merged.pageCount)],
          ];
          break;
        }
        case "split-pdf": {
          const ranges =
            splitMode === "each" ? eachPageRange(pagesIn) : fixedSizeRanges(pagesIn, groupSize);
          const split = await splitPdf(first.bytes, first.name, ranges);
          outputs = split.files;
          summary = [
            [ui.pagesIn, String(pagesIn)],
            [ui.files, String(split.files.length)],
          ];
          break;
        }
        case "extract-pages": {
          const result = await extractPages(first.bytes, first.name, resolveSelection());
          outputs = [result.file];
          summary = [
            [ui.pagesIn, String(pagesIn)],
            [ui.pagesOut, String(result.pageCount)],
          ];
          break;
        }
        case "remove-pages": {
          const result = await removePages(first.bytes, first.name, resolveSelection());
          outputs = [result.file];
          summary = [
            [ui.pagesIn, String(pagesIn)],
            [ui.pagesOut, String(result.pageCount)],
          ];
          break;
        }
        case "organize-pdf": {
          const result = await organizePages(first.bytes, first.name, order);
          outputs = [result.file];
          summary = [
            [ui.pagesIn, String(pagesIn)],
            [ui.pagesOut, String(result.pageCount)],
          ];
          break;
        }
        case "rotate-pdf": {
          const result = await rotatePages(first.bytes, first.name, resolveSelection(), angle);
          outputs = [result.file];
          summary = [
            [ui.pagesOut, String(result.pageCount)],
            [ui.pagesLabel, result.rotated],
          ];
          break;
        }
        case "crop-pdf": {
          const result = await cropPages(first.bytes, first.name, resolveSelection(), margins);
          outputs = [result.file];
          summary = [
            [ui.pagesOut, String(result.pageCount)],
            [ui.pagesLabel, result.cropped],
          ];
          break;
        }
        case "page-numbers": {
          const result = await addPageNumbers(first.bytes, first.name, resolveSelection(), {
            position,
            startAt,
            fontSize,
            format: numberFormat,
          });
          outputs = [result.file];
          summary = [
            [ui.pagesOut, String(result.pageCount)],
            [ui.pagesLabel, String(result.numbered)],
          ];
          break;
        }
      }

      summary.push([ui.outputSize, formatBytes(totalBytes(outputs))]);
      setPhase({ kind: "done", files: outputs, summary });
    } catch (error) {
      setPhase({ kind: "error", code: codeOf(error) });
    } finally {
      busy.current = false;
    }
  }, [
    angle,
    files,
    fontSize,
    groupSize,
    margins,
    numberFormat,
    order,
    pages.length,
    position,
    resolveSelection,
    slug,
    splitMode,
    startAt,
    ui,
  ]);

  const zipName = useMemo(() => {
    const stem = files[0]?.name.replace(/\.pdf$/i, "") ?? "pdf-tools";
    return `${stem}-${slug}.zip`;
  }, [files, slug]);

  /* ---------------------------------------------------------------- */

  if (phase.kind === "done") {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          {ui.done}
        </p>
        {phase.files.length === 1 && phase.files[0] && (
          <p className="mt-2 truncate text-sm text-muted-foreground" dir="ltr">
            {phase.files[0].name}
          </p>
        )}
        <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {phase.summary.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="font-semibold text-navy">{value}</dd>
            </div>
          ))}
        </dl>

        {phase.files.length > 1 && (
          <>
            <p className="mt-5 text-sm font-semibold text-navy">
              {ui.outputFiles.replace("{count}", String(phase.files.length))}
            </p>
            <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
              {phase.files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-navy">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => downloadOne(file)}
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    {ui.download}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <Button
            type="button"
            className="min-h-11 rounded-lg font-semibold"
            onClick={() => void downloadOutputs(phase.files, zipName)}
          >
            <Download className="size-4" aria-hidden="true" />
            {phase.files.length > 1 ? ui.downloadAll : ui.download}
          </Button>
          <Button type="button" variant="outline" className="min-h-11 rounded-lg" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {ui.startOver}
          </Button>
        </div>
      </div>
    );
  }

  // Ready, not merely "a file was picked": the page count arrives from an
  // await, and the controls must not be usable before it lands.
  const hasFiles = files.length > 0 && phase.kind !== "reading";
  const working = phase.kind === "working";

  return (
    <div>
      {!hasFiles && (
        <Dropzone
          accept=".pdf,application/pdf"
          multiple={multiple ?? false}
          formatsLabel="PDF"
          maxBytes={MAX_FILE_BYTES}
          onFiles={(chosen) => void onFiles(chosen)}
          title={ui.dropTitle}
          buttonLabel={ui.chooseFiles}
          disabled={phase.kind === "reading"}
        />
      )}

      {phase.kind === "reading" && (
        <div
          className="rounded-xl border border-border bg-surface/60 px-6 py-10 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-navy">{ui.reading}</p>
        </div>
      )}

      {hasFiles && (
        <div className="space-y-5">
          <FileList
            files={files}
            multiple={multiple ?? false}
            pageCount={pages.length}
            labels={ui}
            onChange={setFiles}
            onClear={reset}
          />

          {multiple && files.length < MAX_FILES && (
            <Dropzone
              accept=".pdf,application/pdf"
              multiple
              formatsLabel="PDF"
              maxBytes={MAX_FILE_BYTES}
              onFiles={(chosen) => void onFiles(chosen)}
              title={ui.dropTitle}
              buttonLabel={ui.chooseFiles}
              compact
            />
          )}

          <fieldset disabled={working} className="contents">
            <Options
              slug={slug}
              ui={ui}
              pages={pages}
              selection={selection}
              setSelection={setSelection}
              angle={angle}
              setAngle={setAngle}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
              groupSize={groupSize}
              setGroupSize={setGroupSize}
              margins={margins}
              setMargins={setMargins}
              order={order}
              setOrder={setOrder}
              position={position}
              setPosition={setPosition}
              startAt={startAt}
              setStartAt={setStartAt}
              fontSize={fontSize}
              setFontSize={setFontSize}
              numberFormat={numberFormat}
              setNumberFormat={setNumberFormat}
            />
          </fieldset>

          {working && (
            <div
              className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              {/* Indeterminate on purpose. pdf-lib reports no progress, and a
                  bar that moves on a timer would be a lie about what is
                  happening. */}
              <p className="text-sm font-semibold text-navy">{ui.running}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button
              type="button"
              className="min-h-11 rounded-lg px-6 font-semibold"
              disabled={working}
              onClick={() => void run()}
            >
              {working ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {working ? ui.running : ui.run}
            </Button>
            <Button type="button" variant="ghost" className="min-h-11" onClick={reset}>
              {ui.startOver}
            </Button>
          </div>
        </div>
      )}

      {phase.kind === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>{ui.errorTitle}</AlertTitle>
          <AlertDescription>{copy.errors[phase.code]}</AlertDescription>
        </Alert>
      )}

      <div className="mt-5 flex gap-3 rounded-lg border border-primary/25 bg-pale-green/60 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 text-sm leading-relaxed text-accent-foreground">
          <p className="font-semibold">{ui.privacyTitle}</p>
          <p className="mt-1">{ui.privacyBody}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The chosen files                                                    */
/* ------------------------------------------------------------------ */

function FileList({
  files,
  multiple,
  pageCount,
  labels,
  onChange,
  onClear,
}: {
  files: Loaded[];
  multiple: boolean;
  pageCount: number;
  labels: ReturnType<typeof pdfToolsCopy>["ui"];
  onChange: (files: Loaded[]) => void;
  onClear: () => void;
}) {
  const move = (index: number, by: number) => {
    const next = [...files];
    const target = index + by;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-navy">{labels.files}</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-muted-foreground hover:text-navy"
        >
          {labels.startOver}
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${index}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 px-3 py-2.5"
          >
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm text-navy">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatBytes(file.size)}
              {!multiple && pageCount > 0
                ? ` · ${labels.pageCount.replace("{count}", String(pageCount))}`
                : ""}
            </span>
            {multiple && (
              <span className="flex shrink-0 gap-1">
                <IconButton
                  label={labels.moveUp}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={labels.moveDown}
                  disabled={index === files.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={labels.removeFile}
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </IconButton>
              </span>
            )}
          </li>
        ))}
      </ul>

      {multiple && <p className="mt-2 text-xs text-muted-foreground">{labels.orderHint}</p>}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-navy",
        disabled && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Per-tool options                                                    */
/* ------------------------------------------------------------------ */

type OptionsProps = {
  slug: PdfToolSlug;
  ui: ReturnType<typeof pdfToolsCopy>["ui"];
  pages: PageInfo[];
  selection: string;
  setSelection: (value: string) => void;
  angle: RotationAngle;
  setAngle: (value: RotationAngle) => void;
  splitMode: "each" | "fixed";
  setSplitMode: (value: "each" | "fixed") => void;
  groupSize: number;
  setGroupSize: (value: number) => void;
  margins: { top: number; right: number; bottom: number; left: number };
  setMargins: (value: { top: number; right: number; bottom: number; left: number }) => void;
  order: number[];
  setOrder: (value: number[]) => void;
  position: PagePosition;
  setPosition: (value: PagePosition) => void;
  startAt: number;
  setStartAt: (value: number) => void;
  fontSize: number;
  setFontSize: (value: number) => void;
  numberFormat: string;
  setNumberFormat: (value: string) => void;
};

function Options(props: OptionsProps) {
  const { slug, ui } = props;

  if (slug === "merge-pdf") return null;

  if (slug === "split-pdf") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ui.splitMode} htmlFor="split-mode">
          <select
            id="split-mode"
            className={SELECT_CLASS}
            value={props.splitMode}
            onChange={(event) =>
              props.setSplitMode(event.target.value === "fixed" ? "fixed" : "each")
            }
          >
            <option value="each">{ui.splitEach}</option>
            <option value="fixed">{ui.splitFixed}</option>
          </select>
        </Field>
        {props.splitMode === "fixed" && (
          <Field label={ui.groupSize} htmlFor="group-size">
            <Input
              id="group-size"
              type="number"
              min={1}
              max={Math.max(1, props.pages.length)}
              value={props.groupSize}
              onChange={(event) => props.setGroupSize(Number(event.target.value))}
              className="h-11"
            />
          </Field>
        )}
      </div>
    );
  }

  if (slug === "organize-pdf") {
    return <PageOrder pages={props.pages} order={props.order} setOrder={props.setOrder} ui={ui} />;
  }

  const selectionField = (
    <Field label={ui.pagesLabel} htmlFor="pages" hint={ui.pagesHint}>
      <Input
        id="pages"
        inputMode="text"
        placeholder={ui.pagesAll}
        value={props.selection}
        onChange={(event) => props.setSelection(event.target.value)}
        className="h-11"
        dir="ltr"
      />
    </Field>
  );

  if (slug === "extract-pages" || slug === "remove-pages") {
    return <div className="grid gap-4">{selectionField}</div>;
  }

  if (slug === "rotate-pdf") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {selectionField}
        <Field label={ui.angle} htmlFor="angle">
          <select
            id="angle"
            className={SELECT_CLASS}
            value={props.angle}
            onChange={(event) => props.setAngle(Number(event.target.value) as RotationAngle)}
          >
            <option value={90}>{ui.angle90}</option>
            <option value={180}>{ui.angle180}</option>
            <option value={270}>{ui.angle270}</option>
          </select>
        </Field>
      </div>
    );
  }

  if (slug === "crop-pdf") {
    const edges: [keyof OptionsProps["margins"], string][] = [
      ["top", ui.marginTop],
      ["right", ui.marginRight],
      ["bottom", ui.marginBottom],
      ["left", ui.marginLeft],
    ];
    return (
      <div className="grid gap-4">
        {selectionField}
        <div>
          <p className="text-sm font-medium text-navy">{ui.margins}</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            {edges.map(([key, label]) => (
              <Field key={key} label={label} htmlFor={`margin-${key}`}>
                <Input
                  id={`margin-${key}`}
                  type="number"
                  min={0}
                  value={props.margins[key]}
                  onChange={(event) =>
                    props.setMargins({ ...props.margins, [key]: Number(event.target.value) })
                  }
                  className="h-11"
                />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{ui.marginsHint}</p>
        </div>
      </div>
    );
  }

  // page-numbers
  const positions: [PagePosition, string][] = [
    ["bottom-center", ui.positionBottomCenter],
    ["bottom-left", ui.positionBottomLeft],
    ["bottom-right", ui.positionBottomRight],
    ["top-center", ui.positionTopCenter],
    ["top-left", ui.positionTopLeft],
    ["top-right", ui.positionTopRight],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {selectionField}
      <Field label={ui.position} htmlFor="position">
        <select
          id="position"
          className={SELECT_CLASS}
          value={props.position}
          onChange={(event) => props.setPosition(event.target.value as PagePosition)}
        >
          {positions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={ui.startAt} htmlFor="start-at">
        <Input
          id="start-at"
          type="number"
          value={props.startAt}
          onChange={(event) => props.setStartAt(Number(event.target.value))}
          className="h-11"
        />
      </Field>
      <Field label={ui.fontSize} htmlFor="font-size">
        <Input
          id="font-size"
          type="number"
          min={4}
          max={96}
          value={props.fontSize}
          onChange={(event) => props.setFontSize(Number(event.target.value))}
          className="h-11"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label={ui.numberFormat} htmlFor="number-format" hint={ui.numberFormatHint}>
          <Input
            id="number-format"
            value={props.numberFormat}
            onChange={(event) => props.setNumberFormat(event.target.value)}
            className="h-11"
            dir="ltr"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-navy">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Organize: the page list is the document                             */
/* ------------------------------------------------------------------ */

function PageOrder({
  pages,
  order,
  setOrder,
  ui,
}: {
  pages: PageInfo[];
  order: number[];
  setOrder: (value: number[]) => void;
  ui: ReturnType<typeof pdfToolsCopy>["ui"];
}) {
  const move = (at: number, by: number) => {
    const next = [...order];
    const target = at + by;
    const a = next[at];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[at] = b;
    next[target] = a;
    setOrder(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-navy">{ui.pagesLabel}</p>
        <button
          type="button"
          onClick={() => setOrder(pages.map((_, index) => index))}
          className="text-xs font-semibold text-muted-foreground hover:text-navy"
        >
          {ui.restore}
        </button>
      </div>

      <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pe-1">
        {order.map((pageIndex, at) => {
          const page = pages[pageIndex];
          return (
            <li
              key={`${pageIndex}-${at}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-navy">
                {ui.page.replace("{n}", String(pageIndex + 1))}
              </span>
              {page && (
                <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
                  {page.width} × {page.height}
                  {page.rotation ? ` · ${page.rotation}°` : ""}
                </span>
              )}
              <span className="flex shrink-0 gap-1">
                <IconButton label={ui.moveUp} disabled={at === 0} onClick={() => move(at, -1)}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={ui.moveDown}
                  disabled={at === order.length - 1}
                  onClick={() => move(at, 1)}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={ui.duplicate}
                  onClick={() =>
                    setOrder([...order.slice(0, at + 1), pageIndex, ...order.slice(at + 1)])
                  }
                >
                  <Copy className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={ui.removeFile}
                  disabled={order.length <= 1}
                  onClick={() => setOrder(order.filter((_, i) => i !== at))}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </IconButton>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
