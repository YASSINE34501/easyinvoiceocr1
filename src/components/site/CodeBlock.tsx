import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label }: { value: string; label?: string | undefined }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label ?? "Copy code to clipboard"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-navy"
    >
      {copied ? (
        <Check className="size-3.5 text-primary" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CodeBlock({
  code,
  title,
  className,
}: {
  code: string;
  title?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-navy", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-background/10 px-4 py-2">
        <span className="truncate text-xs font-medium text-background/70">
          {title ?? "Example"}
        </span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-background/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export type CodeSamples = { curl: string; javascript: string; python: string };

export function CodeTabs({ samples, title }: { samples: CodeSamples; title?: string | undefined }) {
  return (
    <Tabs defaultValue="curl" className="w-full">
      <TabsList className="h-auto justify-start gap-1 rounded-lg bg-surface p-1">
        {(
          [
            ["curl", "cURL"],
            ["javascript", "JavaScript"],
            ["python", "Python"],
          ] as const
        ).map(([value, label]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(samples) as (keyof CodeSamples)[]).map((k) => (
        <TabsContent key={k} value={k} className="mt-3">
          <CodeBlock code={samples[k]} title={title} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
