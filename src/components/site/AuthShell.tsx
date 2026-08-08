import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AppLink, Container } from "./AppLink";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useT } from "@/i18n/useLocale";

/** Centered card shell shared by every authentication screen. */
export function AuthShell({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {t("nav.skip")}
      </a>
      <Header />
      <main id="main" className="hero-glow flex-1 py-12 sm:py-16">
        <Container className="max-w-[480px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <h1 className="text-[24px] font-extrabold tracking-tight text-navy">{title}</h1>
            {lede && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lede}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-navy">
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  autoComplete?: string | undefined;
}) {
  const [shown, setShown] = useState(false);
  const t = useT();
  return (
    <div className="relative">
      <Input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("h-11 pe-11", error && "border-destructive")}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? t("auth.hidePassword") : t("auth.showPassword")}
        className="absolute end-1 top-1 grid size-9 place-items-center rounded-md text-muted-foreground hover:text-navy"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AuthAlert({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 rounded-xl border p-3 text-sm",
        kind === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-primary/30 bg-primary/5 text-navy",
      )}
    >
      {children}
    </div>
  );
}

export function AuthFooterLink({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <span>
      {text}{" "}
      <AppLink
        href={href}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {label}
      </AppLink>
    </span>
  );
}
