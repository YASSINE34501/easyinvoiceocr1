import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthAlert,
  AuthFooterLink,
  AuthShell,
  Field,
  PasswordInput,
} from "@/components/site/AuthShell";
import { AppLink } from "@/components/site/AppLink";
import { authSlugs, path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { authErrorKey, logAuthError } from "@/lib/auth/errors";
import { robotsMeta, seoLinks } from "@/config/seo";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/$locale/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    // Only same-origin relative paths are ever honoured.
    return redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? { redirect } : {};
  },
  component: LoginPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const title = "Log in — EasyInvoiceOCR";
    const description = "Log in to your EasyInvoiceOCR workspace to process invoices and receipts.";
    return {
      meta: [
        robotsMeta("login"),
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("login", locale),
    };
  },
});

function LoginPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const search = useSearch({ from: "/$locale/login" });

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    email: z.string().trim().min(1, t("valid.emailRequired")).email(t("valid.emailInvalid")),
    password: z.string().min(1, t("valid.passwordRequired")),
  });

  function goAfterLogin() {
    if (search.redirect) {
      window.location.assign(search.redirect);
      return;
    }
    navigate({ to: "/$locale/app", params: { locale } });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);

    if (error) {
      logAuthError("login", error);
      setFormError(t(authErrorKey(error, "login")));
      return;
    }
    goAfterLogin();
  }

  async function loginWithGoogle() {
    setFormError("");
    setSubmitting(true);
    // The locale and any ?redirect= destination are carried into the OAuth
    // round trip, so a French visitor comes back to the French app rather than
    // to the site root with their language re-guessed.
    const result = await signInWithGoogle(locale, search.redirect);
    if (!result.ok) {
      setSubmitting(false);
      setFormError(t("auth.genericError"));
      return;
    }
    // On success the browser is already navigating to Google; nothing below
    // this point runs.
  }

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      lede={t("auth.loginLede")}
      footer={
        <AuthFooterLink
          text={t("auth.noAccount")}
          href={path(authSlugs.signup, locale)}
          label={t("cta.signup")}
        />
      }
    >
      {formError && <AuthAlert kind="error">{formError}</AuthAlert>}

      <Button
        type="button"
        variant="outline"
        onClick={loginWithGoogle}
        className="h-11 w-full rounded-lg font-semibold text-navy"
      >
        Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="email" label={t("auth.email")} error={errors["email"]}>
          <Input
            id="email"
            type="email"
            value={values.email}
            autoComplete="email"
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            aria-invalid={Boolean(errors["email"])}
            aria-describedby={errors["email"] ? "email-error" : undefined}
            className="h-11"
          />
        </Field>

        <Field id="password" label={t("auth.password")} error={errors["password"]}>
          <PasswordInput
            id="password"
            value={values.password}
            onChange={(v) => setValues((s) => ({ ...s, password: v }))}
            error={errors["password"]}
            autoComplete="current-password"
          />
        </Field>

        <div className="text-sm">
          <AppLink
            href={path(authSlugs.forgot, locale)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.forgot")}
          </AppLink>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-lg font-semibold"
        >
          {submitting ? t("auth.submitting") : t("cta.login")}
        </Button>
      </form>
    </AuthShell>
  );
}
