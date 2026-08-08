import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { authErrorKey, isObfuscatedExistingUser, logAuthError } from "@/lib/auth/errors";

export const Route = createFileRoute("/$locale/signup")({
  component: SignupPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const title = "Create your EasyInvoiceOCR account";
    const description =
      "Create a free EasyInvoiceOCR account to extract invoice and receipt data and export it to Excel, CSV or JSON.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: `/${locale}/signup` }],
    };
  },
});

function SignupPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    company: "",
    password: "",
    confirm: "",
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const schema = z
    .object({
      fullName: z.string().trim().min(1, t("valid.nameRequired")).max(100, t("valid.nameTooLong")),
      email: z
        .string()
        .trim()
        .min(1, t("valid.emailRequired"))
        .email(t("valid.emailInvalid"))
        .max(255),
      company: z.string().trim().max(120).optional(),
      password: z
        .string()
        .min(1, t("valid.passwordRequired"))
        .min(8, t("valid.passwordShort"))
        .regex(/[A-Za-z]/, t("valid.passwordWeak"))
        .regex(/[0-9]/, t("valid.passwordWeak")),
      confirm: z.string(),
      terms: z.literal(true, { message: t("valid.termsRequired") }),
    })
    .refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: t("valid.passwordMismatch"),
    });

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

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}`,
        data: {
          full_name: parsed.data.fullName,
          company: parsed.data.company ?? "",
          preferred_locale: locale,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      logAuthError("signup", error);
      setFormError(t(authErrorKey(error, "signup")));
      return;
    }

    // Supabase returns success-shaped response for duplicate emails with empty
    // identities array to avoid leaking email existence. Detect it and refuse
    // with the generic form error.
    if (isObfuscatedExistingUser(data.user)) {
      setFormError(t("auth.haveAccount"));
      return;
    }

    // With email confirmation enabled signUp returns no session: the user is
    // not logged in until they click the link.
    if (data.session) {
      navigate({ to: "/$locale/app", params: { locale } });
    } else {
      navigate({
        to: "/$locale/verify-email",
        params: { locale },
        search: { email: parsed.data.email },
      });
    }
  }

  async function signUpWithGoogle() {
    setFormError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setFormError(t("auth.genericError"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/$locale/app", params: { locale } });
  }

  return (
    <AuthShell
      title={t("auth.signupTitle")}
      lede={t("auth.signupLede")}
      footer={
        <AuthFooterLink
          text={t("auth.haveAccount")}
          href={path(authSlugs.login, locale)}
          label={t("cta.login")}
        />
      }
    >
      {formError && <AuthAlert kind="error">{formError}</AuthAlert>}

      <Button
        type="button"
        variant="outline"
        onClick={signUpWithGoogle}
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
        <Field id="fullName" label={t("auth.fullName")} error={errors["fullName"]}>
          <Input
            id="fullName"
            value={values.fullName}
            autoComplete="name"
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            aria-invalid={Boolean(errors["fullName"])}
            aria-describedby={errors["fullName"] ? "fullName-error" : undefined}
            className="h-11"
          />
        </Field>

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

        <Field
          id="company"
          label={`${t("auth.company")} (${t("state.optional")})`}
          error={errors["company"]}
        >
          <Input
            id="company"
            value={values.company}
            autoComplete="organization"
            onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
            className="h-11"
          />
        </Field>

        <Field
          id="password"
          label={t("auth.password")}
          error={errors["password"]}
          hint={t("valid.passwordWeak")}
        >
          <PasswordInput
            id="password"
            value={values.password}
            onChange={(v) => setValues((s) => ({ ...s, password: v }))}
            error={errors["password"]}
            autoComplete="new-password"
          />
        </Field>

        <Field id="confirm" label={t("auth.confirmPassword")} error={errors["confirm"]}>
          <PasswordInput
            id="confirm"
            value={values.confirm}
            onChange={(v) => setValues((s) => ({ ...s, confirm: v }))}
            error={errors["confirm"]}
            autoComplete="new-password"
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms"
              checked={values.terms}
              onCheckedChange={(c) => setValues((v) => ({ ...v, terms: c === true }))}
              aria-describedby={errors["terms"] ? "terms-error" : undefined}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
              {t("auth.acceptTerms")}{" "}
              <AppLink
                href={path("terms", locale)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("link.terms")}
              </AppLink>{" "}
              ·{" "}
              <AppLink
                href={path("privacy", locale)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("link.privacy")}
              </AppLink>
            </label>
          </div>
          {errors["terms"] && (
            <p id="terms-error" role="alert" className="text-xs font-medium text-destructive">
              {errors["terms"]}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-lg font-semibold"
        >
          {submitting ? t("auth.submitting") : t("cta.signup")}
        </Button>
      </form>
    </AuthShell>
  );
}
