import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, FileText, LogOut, Settings, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/auth/AuthProvider";
import { PageLayout, PageHero, Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { ExtractionWorkspace } from "@/components/extract/ExtractionWorkspace";
import { PlanStatusBanner } from "@/components/billing/PlanStatusBanner";
import { Button } from "@/components/ui/button";
import { authSlugs, path } from "@/config/nav";
import { converterProducts } from "@/config/products";
import { formatDate } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — EasyInvoiceOCR" },
      {
        name: "description",
        content: "Your EasyInvoiceOCR workspace: upload documents and review extractions.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — EasyInvoiceOCR" },
      { property: "og:description", content: "Your EasyInvoiceOCR workspace." },
      { property: "og:type", content: "website" },
    ],
  }),
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
        title={displayName ? `Welcome back, ${displayName}` : t("cta.dashboard")}
        lede="Upload a document to extract its data, then export it to Excel, CSV or JSON."
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

      <Section title="Converters" id="converters">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {converterProducts.map((product) => {
            const Icon = product.icon;
            return (
              <AppLink
                key={product.slug}
                href={path(product.slug, locale)}
                className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-pale-green">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-navy">
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

      <Section title="Process a document" id="workspace" muted>
        <ExtractionWorkspace kind="invoice" />
      </Section>

      <Section title="Recent documents" muted>
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Upload className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't saved any documents yet. Processed files you save will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
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
