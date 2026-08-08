/**
 * The single place that decides what an account may do.
 *
 * Nothing here reads a client-supplied flag. Plan, status, billing period and
 * usage all come from the database with the service-role key, and the answer is
 * recomputed on every call — a user who edits local storage, replays an old
 * response or calls a server function directly gets exactly the same verdict.
 *
 * Server-only: importing this from a route or a *.functions.ts top level would
 * ship the service-role client to the browser. Load it inside a handler with
 * `await import(...)`.
 */

import { sortedProducts } from "@/config/products";
import { serverDb } from "@/lib/db.server";
import {
  EMPTY_ENTITLEMENTS,
  maskSubscriptionId,
  type BillingState,
  type Entitlements,
  type PlanCode,
  type PlanFeatures,
  type PublicPlan,
  type SubscriptionStatus,
  type UsageSummary,
} from "./types";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthly_price: string | number;
  yearly_price: string | number | null;
  currency: string;
  monthly_page_limit: number;
  max_file_size: number;
  batch_enabled: boolean;
  api_enabled: boolean;
  ads_enabled: boolean;
  trial_days: number;
  conversion_allowance: number | null;
  max_pages_per_conversion: number | null;
  batch_max_files: number | null;
  team_members: number | null;
  coming_soon: string[] | null;
  features: PlanFeatures | null;
  active: boolean;
  sort_order: number;
  paypal_monthly_plan_id: string | null;
  paypal_yearly_plan_id: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  provider: string;
  provider_subscription_id: string | null;
  status: SubscriptionStatus;
  billing_interval: "month" | "year";
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  grace_until: string | null;
  last_payment_failed_at: string | null;
};

// The row shapes above are the contract; the migration is what enforces them.
const admin = serverDb;

export async function listPlans(includeInactive = false): Promise<PlanRow[]> {
  const db = await admin();
  let query = db.from("subscription_plans").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PlanRow[];
}

export function toPublicPlan(row: PlanRow): PublicPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    monthlyPrice: Number(row.monthly_price),
    yearlyPrice: row.yearly_price === null ? null : Number(row.yearly_price),
    currency: row.currency,
    monthlyPageLimit: row.monthly_page_limit,
    maxFileSize: row.max_file_size,
    batchEnabled: row.batch_enabled,
    apiEnabled: row.api_enabled,
    adsEnabled: row.ads_enabled,
    trialDays: row.trial_days,
    conversionAllowance: row.conversion_allowance ?? null,
    maxPagesPerConversion: row.max_pages_per_conversion ?? 0,
    batchMaxFiles: row.batch_max_files ?? 1,
    teamMembers: row.team_members ?? 0,
    comingSoon: Array.isArray(row.coming_soon) ? row.coming_soon : [],
    features: row.features ?? {},
    sortOrder: row.sort_order,
    paypalConfigured: Boolean(row.paypal_monthly_plan_id || row.paypal_yearly_plan_id),
  };
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await admin();
  const { data, error } = await db
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return fallback;
  return (data.value ?? fallback) as T;
}

export async function getPlanByCode(code: string): Promise<PlanRow | null> {
  const db = await admin();
  const { data, error } = await db
    .from("subscription_plans")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PlanRow | null) ?? null;
}

export async function getSubscription(userId: string): Promise<SubscriptionRow | null> {
  const db = await admin();
  const { data, error } = await db
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SubscriptionRow | null) ?? null;
}

/** True when this account has never claimed a trial. Checked server-side only. */
export async function isTrialEligible(userId: string): Promise<boolean> {
  const db = await admin();
  const [{ data: claim }, enabled] = await Promise.all([
    db.from("trial_claims").select("user_id").eq("user_id", userId).maybeSingle(),
    getSetting<boolean>("trial.enabled", true),
  ]);
  return enabled && !claim;
}

export type TrialStatus = {
  claimed: boolean;
  allowed: number;
  used: number;
  remaining: number;
  exhausted: boolean;
};

/**
 * The one-time five-conversion allowance, read from the database.
 *
 * `used` counts committed `conversions` usage rows. A failed or cancelled
 * conversion has had its reservation deleted by release_quota, so it is not
 * counted here — which is what makes a failure cost nothing.
 */
export async function trialStatus(userId: string): Promise<TrialStatus> {
  const db = await admin();
  const { data, error } = await db.rpc("trial_status", { p_user_id: userId });
  if (error) throw new Error(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as TrialStatus | undefined;
  // A user with no claim row still gets a well-formed answer, so callers never
  // have to special-case "never claimed".
  return row ?? { claimed: false, allowed: 5, used: 0, remaining: 5, exhausted: false };
}

/** Claims the single trial. Every eligibility rule is enforced in the database. */
export async function claimTrial(
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const db = await admin();
  const { error } = await db.rpc("claim_trial", { p_user_id: userId });
  if (!error) return { ok: true };

  // The function raises named exceptions; the message is a stable code, never
  // user data, so it is safe to pass back for mapping to a localized string.
  const message = error.message ?? "";
  for (const code of [
    "email_not_verified",
    "trial_already_claimed",
    "not_trial_eligible",
    "trial_plan_missing",
  ]) {
    if (message.includes(code)) return { ok: false, reason: code };
  }
  return { ok: false, reason: "trial_claim_failed" };
}

/** Every tool a plan may run, derived from the product registry. */
function allowedToolsFor(code: string | null): string[] {
  if (!code) return [];
  const rank: Record<string, number> = { trial: 0, pro: 1, business: 2 };
  const level = rank[code] ?? 0;
  return sortedProducts.filter((p) => (rank[p.minPlan] ?? 0) <= level).map((p) => p.slug);
}

function entitlementsFrom(plan: PlanRow | null, status: SubscriptionStatus): Entitlements {
  if (!plan) return EMPTY_ENTITLEMENTS;

  const features = plan.features ?? {};
  const active = status === "trialing" || status === "active" || status === "past_due";

  if (!active) {
    // Access is withdrawn but the account and its files stay reachable, so the
    // ads flag falls back to the free-tier default rather than the paid one.
    return { ...EMPTY_ENTITLEMENTS, adsEnabled: true };
  }

  return {
    monthlyPageLimit: plan.monthly_page_limit,
    maxFileSize: plan.max_file_size,
    batchEnabled: plan.batch_enabled,
    apiEnabled: plan.api_enabled,
    // Paying customers are never shown advertising, whatever the plan row says.
    adsEnabled: Number(plan.monthly_price) > 0 ? false : plan.ads_enabled,
    exportFormats: features.exports ?? [],
    historyEnabled: features.history === true,
    teamMembers: features.team_members ?? 1,
    advancedOcr: features.advanced_ocr === true,
    allowedTools: allowedToolsFor(plan.code),
  };
}

/**
 * The billing period usage is measured against.
 *
 * A trial has exactly one period covering its whole length, which is why trial
 * usage does not reset. A paid subscription follows the period PayPal reports.
 */
export function billingPeriod(
  subscription: SubscriptionRow | null,
): { start: string; end: string; resets: boolean } | null {
  if (!subscription) return null;

  // The trial is one unbounded period: the allowance is a lifetime count, so it
  // must never roll over. trial_ends_at is no longer set, so the start doubles
  // as the end — usage rows are keyed on the start alone.
  if (subscription.status === "trialing" && subscription.trial_started_at) {
    return {
      start: subscription.trial_started_at,
      end: subscription.trial_ends_at ?? subscription.trial_started_at,
      resets: false,
    };
  }

  if (subscription.current_period_start && subscription.current_period_end) {
    return {
      start: subscription.current_period_start,
      end: subscription.current_period_end,
      resets: true,
    };
  }

  return null;
}

async function usageFor(
  userId: string,
  period: { start: string; end: string; resets: boolean } | null,
  limit: number,
): Promise<UsageSummary> {
  const empty: UsageSummary = {
    periodStart: period?.start ?? null,
    periodEnd: period?.end ?? null,
    pagesUsed: 0,
    pagesRemaining: Math.max(0, limit),
    documentsConverted: 0,
    apiRequests: 0,
    storageBytes: 0,
    resets: period?.resets ?? true,
  };
  if (!period) return empty;

  const db = await admin();
  const { data, error } = await db
    .from("usage_records")
    .select("usage_type, quantity")
    .eq("user_id", userId)
    .eq("billing_period_start", period.start);

  if (error) return empty;

  const totals = { pages: 0, documents: 0, api_requests: 0, storage_bytes: 0 };
  for (const row of (data ?? []) as { usage_type: string; quantity: number }[]) {
    if (row.usage_type in totals) {
      totals[row.usage_type as keyof typeof totals] += row.quantity;
    }
  }

  return {
    ...empty,
    pagesUsed: totals.pages,
    pagesRemaining: Math.max(0, limit - totals.pages),
    documentsConverted: totals.documents,
    apiRequests: totals.api_requests,
    storageBytes: totals.storage_bytes,
  };
}

/**
 * Resolves everything the billing surfaces and the conversion gate need.
 * Expired trials are flipped to trial_expired here, so an expired trial stops
 * working the moment it is next used even if no scheduled sweep has run.
 */
export async function resolveBillingState(userId: string): Promise<BillingState> {
  const db = await admin();

  const subscription = await getSubscription(userId);
  const plan = subscription?.plan_id
    ? ((
        await db.from("subscription_plans").select("*").eq("id", subscription.plan_id).maybeSingle()
      ).data as PlanRow | null)
    : null;

  let status: SubscriptionStatus = subscription?.status ?? "no_plan";

  // past_due keeps working until the configured grace period runs out.
  if (status === "past_due" && subscription?.grace_until) {
    if (new Date(subscription.grace_until).getTime() < Date.now()) status = "suspended";
  }

  const entitlements = entitlementsFrom(plan, status);
  const period = billingPeriod(subscription);
  const usage = await usageFor(userId, period, entitlements.monthlyPageLimit);
  const [trialEligible, trial] = await Promise.all([isTrialEligible(userId), trialStatus(userId)]);

  const onTrial = status === "trialing";
  const canProcessStatus = onTrial || status === "active" || status === "past_due";

  // A trial is limited by its conversion count; a paid plan by its page quota.
  // The two never mix: a trial user's page quota is zero by design, so testing
  // pages here would block them on their very first conversion.
  const quotaLeft = onTrial
    ? !trial.exhausted
    : entitlements.monthlyPageLimit < 0 || usage.pagesRemaining > 0;

  let blockedReason: BillingState["blockedReason"] = null;
  if (!canProcessStatus) {
    blockedReason =
      status === "trial_expired"
        ? "trial_expired"
        : status === "suspended"
          ? "suspended"
          : status === "cancelled" || status === "expired"
            ? "cancelled"
            : status === "approval_pending"
              ? "payment_required"
              : "no_plan";
  } else if (!quotaLeft) {
    blockedReason = onTrial ? "trial_exhausted" : "quota_exceeded";
  }

  return {
    status,
    planCode: (plan?.code as PlanCode | undefined) ?? null,
    planName: plan?.name ?? null,
    entitlements,
    usage,
    trialStartedAt: subscription?.trial_started_at ?? null,
    trialEndsAt: subscription?.trial_ends_at ?? null,
    // The trial no longer expires on a date, so there are no days to report.
    trialDaysRemaining: null,
    trialEligible,
    trialClaimed: trial.claimed,
    trialConversionsAllowed: trial.allowed,
    trialConversionsUsed: trial.used,
    trialConversionsRemaining: trial.remaining,
    currentPeriodStart: subscription?.current_period_start ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    nextBillingDate:
      status === "active" && !subscription?.cancel_at_period_end
        ? (subscription?.current_period_end ?? null)
        : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    cancelledAt: subscription?.cancelled_at ?? null,
    graceUntil: subscription?.grace_until ?? null,
    provider: subscription?.provider ?? "none",
    providerSubscriptionIdMasked: maskSubscriptionId(subscription?.provider_subscription_id),
    billingInterval: subscription?.billing_interval ?? "month",
    canProcess: canProcessStatus && quotaLeft,
    blockedReason,
  };
}

export type QuotaDecision = {
  allowed: boolean;
  used: number;
  remaining: number;
  reason: "ok" | "not_entitled" | "quota_exceeded" | "file_too_large";
};

/**
 * Reserves quota for a conversion. The check and the write happen inside one
 * database function holding a per-user lock, so two tabs cannot both spend the
 * last page.
 */
export async function reserveQuota(input: {
  userId: string;
  tool: string;
  pages: number;
  fileSize: number;
  jobId: string | null;
  idempotencyKey: string;
}): Promise<QuotaDecision> {
  const state = await resolveBillingState(input.userId);

  if (!state.canProcess && state.blockedReason !== "quota_exceeded") {
    return { allowed: false, used: state.usage.pagesUsed, remaining: 0, reason: "not_entitled" };
  }
  if (!state.entitlements.allowedTools.includes(input.tool)) {
    return { allowed: false, used: state.usage.pagesUsed, remaining: 0, reason: "not_entitled" };
  }
  if (input.fileSize > state.entitlements.maxFileSize) {
    return {
      allowed: false,
      used: state.usage.pagesUsed,
      remaining: state.usage.pagesRemaining,
      reason: "file_too_large",
    };
  }

  const period = billingPeriod(await getSubscription(input.userId));
  if (!period) {
    return { allowed: false, used: 0, remaining: 0, reason: "not_entitled" };
  }

  const db = await admin();

  // Reclaim anything abandoned before this attempt is charged.
  //
  // A browser that dies mid-conversion — crashed worker, closed tab, lost
  // network — leaves its job in 'processing' holding a reservation that nothing
  // else would ever give back. Sweeping here rather than on every gate read
  // keeps the cost on the rare path (starting a conversion) instead of the hot
  // one, and it runs at exactly the moment it matters: just before the user
  // spends another attempt.
  //
  // Best-effort by design. A sweep failure must never block a legitimate
  // conversion, so the error is logged and the reservation proceeds.
  try {
    await db.rpc("expire_stale_conversions", {
      p_timeout_minutes: await getSetting<number>("conversions.stale_timeout_minutes", 30),
    });
  } catch (error) {
    console.error("[quota] stale sweep failed", (error as Error).name);
  }

  const subscription = await getSubscription(input.userId);

  // A trial spends one conversion per job, whatever the page count; a paid plan
  // spends pages. Both go through the same advisory-locked function, so the
  // fifth conversion and the five-hundredth page are equally race-proof.
  const onTrial = state.status === "trialing";
  const usageType = onTrial ? "conversions" : "pages";
  const quantity = onTrial ? 1 : Math.max(1, input.pages);
  const limit = onTrial ? state.trialConversionsAllowed : state.entitlements.monthlyPageLimit;

  const { data, error } = await db.rpc("consume_quota", {
    p_user_id: input.userId,
    p_subscription_id: subscription?.id ?? null,
    p_job_id: input.jobId,
    p_usage_type: usageType,
    p_quantity: quantity,
    p_period_start: period.start,
    p_period_end: period.end,
    p_limit: limit,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as
    { used: number; remaining: number; allowed: boolean } | undefined;

  if (!row) return { allowed: false, used: 0, remaining: 0, reason: "quota_exceeded" };

  return {
    allowed: row.allowed,
    used: row.used,
    remaining: row.remaining,
    reason: row.allowed ? "ok" : "quota_exceeded",
  };
}

/** Gives quota back after a failed conversion. Failures must not cost pages. */
export async function releaseQuota(userId: string, idempotencyKey: string): Promise<void> {
  const db = await admin();
  await db.rpc("release_quota", { p_user_id: userId, p_idempotency_key: idempotencyKey });
}
