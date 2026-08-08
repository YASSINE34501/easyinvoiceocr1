/**
 * Billing vocabulary shared by the server resolver and the interface.
 *
 * These types travel over the wire, so they contain no secrets: the PayPal
 * subscription id is already abbreviated by the time it gets here.
 */

export const SUBSCRIPTION_STATUSES = [
  "no_plan",
  "trialing",
  "trial_expired",
  "approval_pending",
  "active",
  "past_due",
  "suspended",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type PlanCode = "trial" | "pro" | "business";

/**
 * The feature bag stored on a plan row. Concretely typed rather than an open
 * record so it survives the server-function serialization check and so a typo
 * in a feature name is a compile error.
 */
export type PlanFeatures = {
  exports?: string[];
  history?: boolean;
  team_members?: number;
  support?: string;
  advanced_ocr?: boolean;
  integrations?: boolean;
};

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  currency: string;
  monthlyPageLimit: number;
  maxFileSize: number;
  batchEnabled: boolean;
  apiEnabled: boolean;
  adsEnabled: boolean;
  /** Deprecated. Always 0 — the trial is counted in conversions, not days. */
  trialDays: number;
  /** Trial only: total successful conversions. null on paid plans. */
  conversionAllowance: number | null;
  /** Per-conversion page ceiling. 0 means no ceiling. */
  maxPagesPerConversion: number;
  /** Files per batch. 1 means one at a time. */
  batchMaxFiles: number;
  teamMembers: number;
  /** Advertised-but-unbuilt feature keys. Never grants entitlement. */
  comingSoon: string[];
  features: PlanFeatures;
  sortOrder: number;
  /** True when a PayPal plan id is configured, so the button can be rendered. */
  paypalConfigured: boolean;
};

/** What the server will actually allow, recomputed on every request. */
export type Entitlements = {
  monthlyPageLimit: number;
  maxFileSize: number;
  batchEnabled: boolean;
  apiEnabled: boolean;
  /** True when this user may be shown advertising. Paid plans are always false. */
  adsEnabled: boolean;
  exportFormats: string[];
  historyEnabled: boolean;
  teamMembers: number;
  advancedOcr: boolean;
  /** Tool slugs this plan may run. */
  allowedTools: string[];
};

export type UsageSummary = {
  periodStart: string | null;
  periodEnd: string | null;
  pagesUsed: number;
  pagesRemaining: number;
  documentsConverted: number;
  apiRequests: number;
  storageBytes: number;
  /** Trial allowances run for the whole trial and never reset. */
  resets: boolean;
};

export type BillingState = {
  status: SubscriptionStatus;
  planCode: PlanCode | null;
  planName: string | null;
  entitlements: Entitlements;
  usage: UsageSummary;
  trialStartedAt: string | null;
  /** Deprecated. Retained for historical rows; the trial has no end date. */
  trialEndsAt: string | null;
  /** Deprecated. Always null — the trial is counted in conversions, not days. */
  trialDaysRemaining: number | null;
  /** True only when this account has never claimed a trial. */
  trialEligible: boolean;
  /** True once this account has claimed its single trial. */
  trialClaimed: boolean;
  /** Successful conversions the trial grants in total. */
  trialConversionsAllowed: number;
  /** Successful conversions already committed. Failures are released, not counted. */
  trialConversionsUsed: number;
  trialConversionsRemaining: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  graceUntil: string | null;
  provider: string;
  /** e.g. "I-BW4…7DXA" — enough to match a PayPal receipt, not enough to act on. */
  providerSubscriptionIdMasked: string | null;
  billingInterval: "month" | "year";
  /** Whether paid processing is currently allowed, and why not when it is not. */
  canProcess: boolean;
  blockedReason:
    | null
    | "no_plan"
    | "trial_expired"
    /** The five free conversions are spent; Pro or Business is required. */
    | "trial_exhausted"
    | "quota_exceeded"
    | "payment_required"
    | "suspended"
    | "cancelled";
};

export const EMPTY_ENTITLEMENTS: Entitlements = {
  monthlyPageLimit: 0,
  maxFileSize: 0,
  batchEnabled: false,
  apiEnabled: false,
  adsEnabled: true,
  exportFormats: [],
  historyEnabled: false,
  teamMembers: 0,
  advancedOcr: false,
  allowedTools: [],
};

/** Statuses that still let a user run conversions. */
export const PROCESSING_STATUSES: SubscriptionStatus[] = ["trialing", "active", "past_due"];

/** Statuses that mean "you need to pick or fix a plan before continuing". */
export const BLOCKED_STATUSES: SubscriptionStatus[] = [
  "no_plan",
  "trial_expired",
  "approval_pending",
  "suspended",
  "cancelled",
  "expired",
];

export function maskSubscriptionId(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 9) return value;
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}
