import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/40 bg-pale-green">
        <ScanLine className="size-4 text-primary" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-[19px] font-extrabold tracking-tight text-navy">
          EasyInvoice<span className="text-primary">OCR</span>
        </span>
      )}
    </span>
  );
}
