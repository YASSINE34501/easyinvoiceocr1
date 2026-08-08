/**
 * Admin console server functions.
 *
 * Every handler re-checks the admin role server-side through has_role. Being
 * able to reach the admin route in the browser grants nothing on its own.
 *
 * Nothing here can read or return a secret: PayPal's client secret and webhook
 * id are process environment values that this module never touches. The plan
 * mapping fields it does expose are public PayPal plan identifiers.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PlanFeatures } from "@/lib/billing/types";

/** Row shapes are declared concretely so the responses stay JSON-serializable. */
export type AdminPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_price: number | string;
  yearly_price: number | string | null;
  currency: string;
  monthly_page_limit: number;
  max_file_size: number;
  batch_enabled: boolean;
  api_enabled: boolean;
  ads_enabled: boolean;
  trial_days: number;
  features: PlanFeatures | null;
  active: boolean;
  sort_order: number;
  paypal_monthly_plan_id: string | null;
  paypal_yearly_plan_id: string | null;
};

export type AdminSetting = { key: string; value: unknown; description: string };

export type AdminSubscription = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  provider: string;
  cancel_at_period_end: boolean;
};

export type AdminEvent = {
  id: string;
  event_type: string;
  processing_status: string;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

export type AdminFailedJob = {
  id: string;
  tool_type: string;
  status: string;
  error_code: string | null;
  page_count: number;
  created_at: string;
};

async function assertAdmin(userId: string) {
  const { serverDb } = await import("@/lib/db.server");
  const db = await serverDb();

  const { data } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("forbidden");
  return db;
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await assertAdmin(context.userId);

    const [plans, settings, subscriptions, events, failedJobs] = await Promise.all([
      db.from("subscription_plans").select("*").order("sort_order", { ascending: true }),
      db.from("app_settings").select("key, value, description").order("key"),
      db
        .from("user_subscriptions")
        .select(
          "id, user_id, status, plan_id, trial_ends_at, current_period_end, provider, cancel_at_period_end",
        )
        .order("updated_at", { ascending: false })
        .limit(100),
      db
        .from("subscription_events")
        .select("id, event_type, processing_status, error_message, received_at, processed_at")
        .order("received_at", { ascending: false })
        .limit(50),
      db
        .from("conversion_jobs")
        .select("id, tool_type, status, error_code, page_count, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      plans: (plans.data ?? []) as AdminPlan[],
      // Settings values are arbitrary JSON, so they cross the wire as strings
      // and are parsed back where they are edited.
      settings: ((settings.data ?? []) as AdminSetting[]).map((setting) => ({
        key: setting.key,
        description: setting.description,
        value: JSON.stringify(setting.value),
      })),
      subscriptions: (subscriptions.data ?? []) as AdminSubscription[],
      events: (events.data ?? []) as AdminEvent[],
      failedJobs: (failedJobs.data ?? []) as AdminFailedJob[],
    };
  });

const planPatch = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  monthly_price: z.number().min(0).max(100000).optional(),
  yearly_price: z.number().min(0).max(1000000).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  monthly_page_limit: z.number().int().min(0).max(1000000).optional(),
  max_file_size: z
    .number()
    .int()
    .min(1024)
    .max(1024 * 1024 * 1024)
    .optional(),
  batch_enabled: z.boolean().optional(),
  api_enabled: z.boolean().optional(),
  ads_enabled: z.boolean().optional(),
  trial_days: z.number().int().min(0).max(365).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  paypal_monthly_plan_id: z.string().trim().max(64).nullable().optional(),
  paypal_yearly_plan_id: z.string().trim().max(64).nullable().optional(),
});

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => planPatch.parse(data))
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context.userId);
    const { id, ...patch } = data;
    const { error } = await db.from("subscription_plans").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const settingPatch = z.object({
  key: z.string().trim().min(1).max(80),
  // JSON-encoded so booleans, numbers, strings and objects share one field.
  value: z.string().max(4000),
});

export const updateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingPatch.parse(data))
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context.userId);

    let parsed: unknown;
    try {
      parsed = JSON.parse(data.value);
    } catch {
      return { ok: false as const, error: "invalid_json" as const };
    }

    const { error } = await db
      .from("app_settings")
      .update({ value: parsed, updated_by: context.userId })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const statusPatch = z.object({
  subscriptionId: z.string().uuid(),
  status: z.enum([
    "no_plan",
    "trialing",
    "trial_expired",
    "approval_pending",
    "active",
    "past_due",
    "suspended",
    "cancelled",
    "expired",
  ]),
});

/**
 * Manual status override, for support cases. Deliberately does not touch
 * PayPal: it changes what this application grants, not what the provider
 * believes, and the next provider sync will win.
 */
export const setSubscriptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => statusPatch.parse(data))
  .handler(async ({ context, data }) => {
    const db = await assertAdmin(context.userId);
    const { error } = await db
      .from("user_subscriptions")
      .update({ status: data.status })
      .eq("id", data.subscriptionId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Whether the current user is an admin, for showing the console link. */
export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { data } = await db.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

/**
 * Reports which payment and advertising integrations are configured, without
 * revealing any value. Used by the console to explain what is still missing.
 */
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return {
      paypal: {
        clientId: Boolean(process.env["PAYPAL_CLIENT_ID"]),
        clientSecret: Boolean(process.env["PAYPAL_CLIENT_SECRET"]),
        webhookId: Boolean(process.env["PAYPAL_WEBHOOK_ID"]),
        environment: process.env["PAYPAL_ENVIRONMENT"] ?? "sandbox",
      },
      adsense: {
        // Read from the build-time public config, so this reflects what the
        // browser would actually use.
        enabled: process.env["VITE_ADSENSE_ENABLED"] === "true",
        clientId: Boolean(process.env["VITE_ADSENSE_CLIENT_ID"]),
      },
    };
  });
