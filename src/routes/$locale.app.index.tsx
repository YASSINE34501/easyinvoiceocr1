import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CreditCard, FileText, LogOut, Settings, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/auth/AuthProvider";
import { PageLayout, PageHero, Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { ExtractionWorkspace } from "@/components/extract/ExtractionWorkspace";
import { PlanStatusBanner } from "@/components/billing/PlanStatusBanner";
import { Button } from "@/components/ui/button";
import { authSlugs, path } from "@/config/nav";
import { converterProducts } from "@/config/products";
import { asLocale, formatDate } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { useNavigate } from "@tanstack/react-router";
import { robotsMeta } from "@/config/seo";

/** Tab title and description per locale; the page itself is noindex. */
const meta = {
  en: {
    title: "Dashboard — EasyInvoiceOCR",
    description: "Your workspace: process documents and review extractions.",
  },
  fr: {
    title: "Tableau de bord — EasyInvoiceOCR",
    description: "Votre espace de travail : traitez vos documents et relisez les extractions.",
  },
  ar: {
    title: "لوحة التحكم — EasyInvoiceOCR",
    description: "مساحة عملك: عالج مستنداتك وراجع نتائج الاستخراج.",
  },
} as const;

export const Route = createFileRoute("/$locale/app/")({
  component: Dashboard,
  head: ({ params }) => {
    const { title, description } = meta[asLocale(params.locale)];
    return {
      meta: [
        { title },
        robotsMeta("app"),
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
    };
  },
});

function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, company, preferred_locale")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, filename, doc_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/$locale/login", params: { locale }, replace: true });
  }

  const displayName = profile?.full_name || user?.email || "";

  return (
    <PageLayout breadcrumbs={[{ label: t("cta.dashboard") }]}>
      <PageHero
        eyebrow={t("cta.dashboard")}
        title={displayName ? t("dash.welcome", { name: displayName }) : t("cta.dashboard")}
        lede={t("dash.lede")}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-11 rounded-lg font-semibold text-navy">
            <AppLink href={path(authSlugs.billing, locale)}>
              <CreditCard className="size-4" aria-hidden="true" />
              {t("billing.title")}
            </AppLink>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-lg font-semibold text-navy">
            <AppLink href={path(authSlugs.settings, locale)}>
              <Settings className="size-4" aria-hidden="true" />
              {t("account.title")}
            </AppLink>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            className="h-11 rounded-lg font-semibold text-navy"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {t("cta.logout")}
          </Button>
        </div>
      </PageHero>

      <Section>
        <PlanStatusBanner />
      </Section>

      <Section title={t("nav.converters")} id="converters">
        <div className="mb-5">
          <AppLink
            href={path("pdf-tools", locale)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t("dash.allTools")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </AppLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {converterProducts.map((product) => {
            const Icon = product.icon;
            return (
              <AppLink
                key={product.slug}
                href={path(product.slug, locale)}
                className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-pale-green">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-navy">
                  {product.copy[locale].name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {product.copy[locale].card}
                </p>
              </AppLink>
            );
          })}
        </div>
      </Section>

      <Section title={t("dash.workspace")} id="workspace" muted>
        <ExtractionWorkspace kind="invoice" />
      </Section>

      <Section title={t("dash.recent")} muted>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <Upload className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
              {t("dash.empty")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 p-4">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(doc.created_at, locale)} · {doc.doc_type} · {doc.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageLayout>
  );
}
