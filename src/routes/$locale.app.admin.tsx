/**
 * /:locale/app/admin — plan, settings and operations console.
 *
 * The route is inside the authenticated area and every action it calls
 * re-checks the admin role on the server. A non-admin who reaches this URL
 * sees a refusal and can do nothing from here.
 *
 * No PayPal secret and no AdSense credential is ever displayed: the console
 * shows only whether each one is configured.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getAdminOverview,
  getIntegrationStatus,
  updatePlan,
  updateSetting,
  type AdminPlan,
} from "@/lib/admin/admin.functions";
import { formatDate } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";

export const Route = createFileRoute("/$locale/app/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — EasyInvoiceOCR" }, { name: "robots", content: "noindex" }],
  }),
});

function AdminPage() {
  const t = useT();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
    retry: false,
  });

  const integrations = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: () => getIntegrationStatus(),
    retry: false,
  });

  const savePlan = useMutation({
    mutationFn: (patch: { id: string } & Record<string, unknown>) =>
      updatePlan({ data: patch as never }),
    onSuccess: async () => {
      toast.success(t("account.profileSaved"));
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: () => toast.error(t("auth.genericError")),
  });

  const saveSetting = useMutation({
    mutationFn: (input: { key: string; value: string }) => updateSetting({ data: input }),
    onSuccess: async (result) => {
      if (result.ok) {
        toast.success(t("account.profileSaved"));
        await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      } else {
        toast.error("Invalid JSON value");
      }
    },
    onError: () => toast.error(t("auth.genericError")),
  });

  if (overview.isError) {
    return (
      <PageLayout>
        <PageHero
          title="Administrator access required"
          lede="This console is limited to accounts with the admin role."
        />
      </PageLayout>
    );
  }

  if (overview.isLoading || !overview.data) {
    return (
      <PageLayout>
        <PageHero title="Admin" lede={t("state.loading")} />
      </PageLayout>
    );
  }

  const { plans, settings, subscriptions, events, failedJobs } = overview.data;

  return (
    <PageLayout breadcrumbs={[{ label: "Admin" }]}>
      <PageHero
        eyebrow="Operations"
        title="Admin console"
        lede="Plans, prices, limits, trial rules, advertising configuration, subscriptions and webhook activity."
      />

      <Section title="Integration status">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-navy">PayPal</h3>
            <ul className="mt-3 space-y-2">
              <ConfigLine label="PAYPAL_CLIENT_ID" ok={integrations.data?.paypal.clientId} />
              <ConfigLine
                label="PAYPAL_CLIENT_SECRET"
                ok={integrations.data?.paypal.clientSecret}
              />
              <ConfigLine label="PAYPAL_WEBHOOK_ID" ok={integrations.data?.paypal.webhookId} />
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Environment: {integrations.data?.paypal.environment ?? "—"}. Secret values are never
              displayed here or sent to the browser.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-navy">Google AdSense</h3>
            <ul className="mt-3 space-y-2">
              <ConfigLine label="VITE_ADSENSE_ENABLED" ok={integrations.data?.adsense.enabled} />
              <ConfigLine label="VITE_ADSENSE_CLIENT_ID" ok={integrations.data?.adsense.clientId} />
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Keep the flag off until the AdSense account and this site are approved.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Plans" muted>
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanEditor
              key={plan.id}
              plan={plan}
              saving={savePlan.isPending}
              onSave={(patch) => savePlan.mutate({ id: plan.id, ...patch })}
            />
          ))}
        </div>
      </Section>

      <Section title="Application settings">
        <div className="grid gap-3">
          {settings.map((setting) => (
            <SettingEditor
              key={setting.key}
              settingKey={setting.key}
              description={setting.description}
              initial={setting.value}
              saving={saveSetting.isPending}
              onSave={(value) => saveSetting.mutate({ key: setting.key, value })}
            />
          ))}
        </div>
      </Section>

      <Section title="Subscriptions" muted>
        <SimpleTable
          columns={["Status", "Provider", "Trial ends", "Period ends", "Cancels"]}
          rows={subscriptions.map((row) => [
            String(row["status"] ?? ""),
            String(row["provider"] ?? ""),
            row["trial_ends_at"] ? formatDate(String(row["trial_ends_at"]), locale) : "—",
            row["current_period_end"] ? formatDate(String(row["current_period_end"]), locale) : "—",
            row["cancel_at_period_end"] ? "yes" : "no",
          ])}
          empty="No subscriptions yet."
        />
      </Section>

      <Section title="Webhook events">
        <SimpleTable
          columns={["Event", "Status", "Note", "Received"]}
          rows={events.map((row) => [
            String(row["event_type"] ?? ""),
            String(row["processing_status"] ?? ""),
            String(row["error_message"] ?? "—"),
            row["received_at"] ? formatDate(String(row["received_at"]), locale) : "—",
          ])}
          empty="No webhook events recorded yet."
        />
      </Section>

      <Section title="Failed conversions" muted>
        <SimpleTable
          columns={["Tool", "Error", "Pages", "When"]}
          rows={failedJobs.map((row) => [
            String(row["tool_type"] ?? ""),
            String(row["error_code"] ?? "—"),
            String(row["page_count"] ?? 0),
            row["created_at"] ? formatDate(String(row["created_at"]), locale) : "—",
          ])}
          empty="No failed conversions."
        />
      </Section>
    </PageLayout>
  );
}

function ConfigLine({ label, ok }: { label: string; ok?: boolean | undefined }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
      ) : (
        <XCircle className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
      <code className="text-xs">{label}</code>
      <Badge variant={ok ? "secondary" : "outline"} className="ms-auto text-[10px]">
        {ok ? "configured" : "missing"}
      </Badge>
    </li>
  );
}

function PlanEditor({
  plan,
  saving,
  onSave,
}: {
  plan: AdminPlan;
  saving: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState({
    name: String(plan["name"] ?? ""),
    monthly_price: Number(plan["monthly_price"] ?? 0),
    yearly_price: plan["yearly_price"] === null ? "" : String(plan["yearly_price"] ?? ""),
    currency: String(plan["currency"] ?? "USD"),
    monthly_page_limit: Number(plan["monthly_page_limit"] ?? 0),
    max_file_size: Number(plan["max_file_size"] ?? 0),
    trial_days: Number(plan["trial_days"] ?? 0),
    batch_enabled: Boolean(plan["batch_enabled"]),
    api_enabled: Boolean(plan["api_enabled"]),
    ads_enabled: Boolean(plan["ads_enabled"]),
    active: Boolean(plan["active"]),
    paypal_monthly_plan_id: String(plan["paypal_monthly_plan_id"] ?? ""),
    paypal_yearly_plan_id: String(plan["paypal_yearly_plan_id"] ?? ""),
  });

  const field = (key: keyof typeof draft, label: string, type: "text" | "number" = "text") => (
    <div>
      <Label htmlFor={`${plan.id}-${key}`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={`${plan.id}-${key}`}
        type={type}
        value={String(draft[key])}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            [key]: type === "number" ? Number(event.target.value) : event.target.value,
          }))
        }
        className="mt-1 h-10"
      />
    </div>
  );

  const toggle = (
    key: "batch_enabled" | "api_enabled" | "ads_enabled" | "active",
    label: string,
  ) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <Label htmlFor={`${plan.id}-${key}`} className="text-xs font-normal">
        {label}
      </Label>
      <Switch
        id={`${plan.id}-${key}`}
        checked={draft[key]}
        onCheckedChange={(checked) => setDraft((current) => ({ ...current, [key]: checked }))}
      />
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy">
          {String(plan["name"])} <code className="text-xs text-muted-foreground">{plan.code}</code>
        </h3>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {field("name", "Name")}
        {field("monthly_price", "Monthly price", "number")}
        {field("yearly_price", "Yearly price (blank = none)")}
        {field("currency", "Currency")}
        {field("monthly_page_limit", "Pages per period", "number")}
        {field("max_file_size", "Max file size (bytes)", "number")}
        {field("trial_days", "Trial days", "number")}
        {field("paypal_monthly_plan_id", "PayPal monthly plan id")}
        {field("paypal_yearly_plan_id", "PayPal yearly plan id")}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {toggle("batch_enabled", "Batch processing")}
        {toggle("api_enabled", "OCR API access")}
        {toggle("ads_enabled", "May show ads")}
        {toggle("active", "Active")}
      </div>

      <Button
        className="mt-4 min-h-11 rounded-lg"
        disabled={saving}
        onClick={() =>
          onSave({
            name: draft.name,
            monthly_price: draft.monthly_price,
            yearly_price: draft.yearly_price === "" ? null : Number(draft.yearly_price),
            currency: draft.currency.toUpperCase(),
            monthly_page_limit: draft.monthly_page_limit,
            max_file_size: draft.max_file_size,
            trial_days: draft.trial_days,
            batch_enabled: draft.batch_enabled,
            api_enabled: draft.api_enabled,
            ads_enabled: draft.ads_enabled,
            active: draft.active,
            paypal_monthly_plan_id: draft.paypal_monthly_plan_id || null,
            paypal_yearly_plan_id: draft.paypal_yearly_plan_id || null,
          })
        }
      >
        Save plan
      </Button>
    </div>
  );
}

function SettingEditor({
  settingKey,
  description,
  initial,
  saving,
  onSave,
}: {
  settingKey: string;
  description: string;
  initial: string;
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
      <div>
        <Label htmlFor={`setting-${settingKey}`} className="text-xs font-semibold text-navy">
          {settingKey}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Input
        id={`setting-${settingKey}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-10 font-mono text-xs"
      />
      <Button
        variant="outline"
        className="min-h-11 rounded-lg"
        disabled={saving}
        onClick={() => onSave(value)}
      >
        Save
      </Button>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldAlert className="size-4" aria-hidden="true" />
        {empty}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[620px] text-sm">
        <thead className="bg-surface text-navy">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-3 py-2 text-start text-xs font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="max-w-[280px] truncate px-3 py-2 text-muted-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
