import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthAlert, AuthFooterLink, AuthShell } from "@/components/site/AuthShell";
import { authSlugs, path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

type VerifySearch = { email?: string };

export const Route = createFileRoute("/$locale/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifySearch =>
    typeof search["email"] === "string" ? { email: search["email"] } : {},
  component: VerifyEmailPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const title = "Confirm your email — EasyInvoiceOCR";
    const description = "Confirm your email address to activate your EasyInvoiceOCR account.";
    return {
      meta: [
        robotsMeta("verify-email"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("verify-email", locale),
    };
  },
});

function VerifyEmailPage() {
  const t = useT();
  const locale = useLocale();
  const { email } = Route.useSearch();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    if (!email) return;
    setStatus("sending");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/${locale}` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <AuthShell
      title={t("auth.verifyTitle")}
      lede={t("auth.verifyLede")}
      footer={
        <AuthFooterLink
          text={t("auth.haveAccount")}
          href={path(authSlugs.login, locale)}
          label={t("cta.login")}
        />
      }
    >
      {status === "sent" && <AuthAlert kind="success">{t("auth.verifyResent")}</AuthAlert>}
      {status === "error" && <AuthAlert kind="error">{t("auth.genericError")}</AuthAlert>}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-4">
        <MailCheck className="mt-0.5 size-5 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {email ? <span className="font-semibold text-navy">{email}</span> : t("auth.email")}
        </p>
      </div>

      {email && (
        <Button
          type="button"
          variant="outline"
          onClick={resend}
          disabled={status === "sending"}
          className="mt-5 h-11 w-full rounded-lg font-semibold text-navy"
        >
          {status === "sending" ? t("auth.sending") : t("auth.verifyResend")}
        </Button>
      )}
    </AuthShell>
  );
}
