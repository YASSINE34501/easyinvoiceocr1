import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AuthAlert,
  AuthFooterLink,
  AuthShell,
  Field,
  PasswordInput,
} from "@/components/site/AuthShell";
import { authSlugs, path } from "@/config/nav";
import { asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/reset-password")({
  component: ResetPasswordPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const title = "Choose a new password — EasyInvoiceOCR";
    const description = "Set a new password for your EasyInvoiceOCR account.";
    return {
      meta: [
        robotsMeta("reset-password"),
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("reset-password", locale),
    };
  },
});

function ResetPasswordPage() {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();

  const [ready, setReady] = useState<"checking" | "valid" | "invalid">("checking");
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase turns the recovery link into a session; without one the link is
  // invalid or expired.
  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) setReady("valid");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReady(data.session ? "valid" : "invalid");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const schema = z
    .object({
      password: z
        .string()
        .min(1, t("valid.passwordRequired"))
        .min(8, t("valid.passwordShort"))
        .regex(/[A-Za-z]/, t("valid.passwordWeak"))
        .regex(/[0-9]/, t("valid.passwordWeak")),
      confirm: z.string(),
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
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      setFormError(error.message || t("auth.genericError"));
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/$locale/login", params: { locale } }), 1800);
  }

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      lede={t("auth.resetLede")}
      footer={
        <AuthFooterLink
          text={t("auth.haveAccount")}
          href={path(authSlugs.login, locale)}
          label={t("cta.login")}
        />
      }
    >
      {formError && <AuthAlert kind="error">{formError}</AuthAlert>}

      {ready === "checking" && (
        <p className="text-sm text-muted-foreground">{t("state.loading")}</p>
      )}

      {ready === "invalid" && (
        <>
          <AuthAlert kind="error">{t("auth.resetInvalid")}</AuthAlert>
          <Button asChild className="h-11 w-full rounded-lg font-semibold">
            <a href={path(authSlugs.forgot, locale)}>{t("auth.forgotTitle")}</a>
          </Button>
        </>
      )}

      {ready === "valid" &&
        (done ? (
          <AuthAlert kind="success">{t("auth.resetDone")}</AuthAlert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field
              id="password"
              label={t("account.newPassword")}
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
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg font-semibold"
            >
              {submitting ? t("auth.submitting") : t("account.updatePassword")}
            </Button>
          </form>
        ))}
    </AuthShell>
  );
}
