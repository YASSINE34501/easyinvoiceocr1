import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/auth/AuthProvider";
import { PageLayout, PageHero, Section } from "@/components/site/PageLayout";
import { Field, PasswordInput } from "@/components/site/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteMyAccount } from "@/lib/account.functions";
import { locales, localeLabels, asLocale, type Locale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { useQueryClient } from "@tanstack/react-query";
import { robotsMeta } from "@/config/seo";

export const Route = createFileRoute("/$locale/app/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Account settings — EasyInvoiceOCR" },
      robotsMeta("app/settings"),
      {
        name: "description",
        content: "Manage your EasyInvoiceOCR profile, language and password.",
      },
      { property: "og:title", content: "Account settings — EasyInvoiceOCR" },
      { property: "og:description", content: "Manage your EasyInvoiceOCR account." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function SettingsPage() {
  const { user } = useAuth();
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    fullName: "",
    company: "",
    preferred: locale as Locale,
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [confirmWord, setConfirmWord] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, company, preferred_locale")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setProfile({
          fullName: data.full_name ?? "",
          company: data.company ?? "",
          preferred: asLocale(data.preferred_locale),
        });
      });
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const schema = z.object({
      fullName: z.string().trim().min(1, t("valid.nameRequired")).max(100, t("valid.nameTooLong")),
      company: z.string().trim().max(120),
    });
    const parsed = schema.safeParse(profile);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setProfileErrors(next);
      return;
    }
    setProfileErrors({});
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        company: parsed.data.company,
        preferred_locale: profile.preferred,
      })
      .eq("id", user!.id);
    setSavingProfile(false);
    if (error) {
      toast.error(t("auth.genericError"));
      return;
    }
    toast.success(t("account.profileSaved"));
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    if (profile.preferred !== locale) {
      navigate({ to: "/$locale/app/settings", params: { locale: profile.preferred } });
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    const schema = z
      .object({
        next: z
          .string()
          .min(1, t("valid.passwordRequired"))
          .min(8, t("valid.passwordShort"))
          .regex(/[A-Za-z]/, t("valid.passwordWeak"))
          .regex(/[0-9]/, t("valid.passwordWeak")),
        confirm: z.string(),
      })
      .refine((v) => v.next === v.confirm, {
        path: ["confirm"],
        message: t("valid.passwordMismatch"),
      });
    const parsed = schema.safeParse(passwords);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setPasswordErrors(next);
      return;
    }
    setPasswordErrors({});
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.next });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message || t("auth.genericError"));
      return;
    }
    setPasswords({ next: "", confirm: "" });
    toast.success(t("account.passwordUpdated"));
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
      toast.success(t("account.deleted"));
      navigate({ to: "/$locale", params: { locale }, replace: true });
    } catch {
      toast.error(t("auth.genericError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageLayout breadcrumbs={[{ label: t("cta.dashboard") }, { label: t("account.title") }]}>
      <PageHero title={t("account.title")} lede={t("account.lede")} />

      <Section title={t("account.profile")}>
        <form onSubmit={saveProfile} noValidate className="max-w-[520px] space-y-4">
          <Field id="email" label={t("account.emailReadOnly")}>
            <Input id="email" value={user?.email ?? ""} readOnly disabled className="h-11" />
          </Field>
          <Field id="fullName" label={t("auth.fullName")} error={profileErrors["fullName"]}>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
              aria-invalid={Boolean(profileErrors["fullName"])}
              className="h-11"
            />
          </Field>
          <Field id="company" label={t("auth.company")} error={profileErrors["company"]}>
            <Input
              id="company"
              value={profile.company}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
              className="h-11"
            />
          </Field>
          <div className="space-y-1.5">
            <label htmlFor="locale" className="text-sm font-medium text-navy">
              {t("account.language")}
            </label>
            <Select
              value={profile.preferred}
              onValueChange={(v) => setProfile((p) => ({ ...p, preferred: asLocale(v) }))}
            >
              <SelectTrigger id="locale" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((l) => (
                  <SelectItem key={l} value={l}>
                    {localeLabels[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={savingProfile} className="h-11 rounded-lg font-semibold">
            {savingProfile ? t("auth.submitting") : t("cta.save")}
          </Button>
        </form>
      </Section>

      <Section title={t("account.security")} muted>
        <form onSubmit={savePassword} noValidate className="max-w-[520px] space-y-4">
          <Field
            id="newPassword"
            label={t("account.newPassword")}
            error={passwordErrors["next"]}
            hint={t("valid.passwordWeak")}
          >
            <PasswordInput
              id="newPassword"
              value={passwords.next}
              onChange={(v) => setPasswords((s) => ({ ...s, next: v }))}
              error={passwordErrors["next"]}
              autoComplete="new-password"
            />
          </Field>
          <Field
            id="confirmPassword"
            label={t("auth.confirmPassword")}
            error={passwordErrors["confirm"]}
          >
            <PasswordInput
              id="confirmPassword"
              value={passwords.confirm}
              onChange={(v) => setPasswords((s) => ({ ...s, confirm: v }))}
              error={passwordErrors["confirm"]}
              autoComplete="new-password"
            />
          </Field>
          <Button type="submit" disabled={savingPassword} className="h-11 rounded-lg font-semibold">
            {savingPassword ? t("auth.submitting") : t("account.updatePassword")}
          </Button>
        </form>
      </Section>

      <Section title={t("account.danger")}>
        <div className="max-w-[520px] rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("account.dangerLede")}</p>
          <div className="mt-4 space-y-3">
            <Field id="confirmDelete" label={t("account.deleteConfirmLabel")}>
              <Input
                id="confirmDelete"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                className="h-11"
              />
            </Field>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmWord !== t("account.deleteConfirmWord") || deleting}
              onClick={deleteAccount}
              className="h-11 rounded-lg font-semibold"
            >
              {deleting ? t("auth.submitting") : t("account.deleteButton")}
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}
