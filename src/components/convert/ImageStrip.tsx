/**
 * Ordering, rotating and removing images before conversion.
 *
 * Shared by Image to Word and Image to PDF so both behave identically. Drag
 * and drop is offered for speed, and the arrow buttons do the same job for
 * keyboard and touch users — reordering never depends on a drag gesture alone.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, GripVertical, RotateCcw, RotateCw, X } from "lucide-react";
import { useT } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { rotateBy, type Rotation } from "@/lib/convert/images";

export type StripItem = { id: string; file: File; rotation: Rotation };

export function newStripItems(files: File[]): StripItem[] {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    rotation: 0 as Rotation,
  }));
}

export function ImageStrip({
  items,
  onChange,
}: {
  items: StripItem[];
  onChange: (next: StripItem[]) => void;
}) {
  const t = useT();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const urls = useObjectUrls(items);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
  };

  const rotate = (id: string, delta: 90 | -90) =>
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, rotation: rotateBy(item.rotation, delta) } : item,
      ),
    );

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">{t("conv.dragHint")}</p>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-border bg-card shadow-card",
              dragIndex === index && "opacity-60",
            )}
          >
            <div className="flex items-center justify-between border-b border-border bg-surface px-2 py-1.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-navy">
                <GripVertical className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {index + 1}
              </span>
              <button
                type="button"
                aria-label={`${t("conv.remove")} ${index + 1}`}
                onClick={() => remove(item.id)}
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid h-[150px] place-items-center overflow-hidden bg-surface/60 p-2">
              {urls[item.id] ? (
                <img
                  src={urls[item.id]}
                  alt=""
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                  className="max-h-full max-w-full object-contain transition-transform"
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-1 border-t border-border px-1.5 py-1.5">
              <div className="flex">
                <IconButton
                  label={`${t("conv.moveUp")} ${index + 1}`}
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={`${t("conv.moveDown")} ${index + 1}`}
                  onClick={() => move(index, index + 1)}
                  disabled={index === items.length - 1}
                >
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </IconButton>
              </div>
              <div className="flex">
                <IconButton
                  label={`${t("conv.rotateLeft")} ${index + 1}`}
                  onClick={() => rotate(item.id, -90)}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={`${t("conv.rotateRight")} ${index + 1}`}
                  onClick={() => rotate(item.id, 90)}
                >
                  <RotateCw className="size-3.5" aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:text-navy disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Object URLs for the thumbnails, revoked when an image is removed. */
function useObjectUrls(items: StripItem[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const createdRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const created = createdRef.current;
    const next: Record<string, string> = {};
    let changed = false;

    for (const item of items) {
      if (created[item.id]) {
        next[item.id] = created[item.id]!;
      } else {
        next[item.id] = URL.createObjectURL(item.file);
        changed = true;
      }
    }

    for (const [id, url] of Object.entries(created)) {
      if (!next[id]) {
        URL.revokeObjectURL(url);
        changed = true;
      }
    }

    createdRef.current = next;
    if (changed) setUrls(next);
  }, [items]);

  useEffect(
    () => () => {
      for (const url of Object.values(createdRef.current)) URL.revokeObjectURL(url);
      createdRef.current = {};
    },
    [],
  );

  return urls;
}
