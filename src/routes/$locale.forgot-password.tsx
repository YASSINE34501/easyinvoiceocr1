import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthAlert, AuthFooterLink, AuthShell, Field } from "@/components/site/AuthShell";
import { authSlugs, path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

export const Route = createFileRoute("/$locale/forgot-password")({
  component: ForgotPasswordPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const title = "Reset your password — EasyInvoiceOCR";
    const description = "Request a password reset link for your EasyInvoiceOCR account.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `/${locale}/forgot-password` }],
    };
  },
});

function ForgotPasswordPage() {
  const t = useT();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = z.string().trim().min(1, t("valid.emailRequired")).email(t("valid.emailInvalid"));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setError("");
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setSubmitting(false);

    // Always show the same confirmation so the form cannot be used to discover
    // which email addresses have accounts.
    if (resetError && resetError.status === 429) {
      setFormError(t("auth.rateLimited"));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title={t("auth.forgotTitle")}
      lede={t("auth.forgotLede")}
      footer={
        <AuthFooterLink
          text={t("auth.haveAccount")}
          href={path(authSlugs.login, locale)}
          label={t("cta.login")}
        />
      }
    >
      {formError && <AuthAlert kind="error">{formError}</AuthAlert>}
      {sent ? (
        <AuthAlert kind="success">{t("auth.forgotSent")}</AuthAlert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field id="email" label={t("auth.email")} error={error}>
            <Input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "email-error" : undefined}
              className="h-11"
            />
          </Field>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-lg font-semibold"
          >
            {submitting ? t("auth.sending") : t("auth.forgotTitle")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
