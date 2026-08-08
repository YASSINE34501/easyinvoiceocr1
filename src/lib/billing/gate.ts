/**
 * The conversion gate.
 *
 * One shared allowance of five successful conversions per customer, across
 * every product. There is no time-based trial: the allowance is consumed by
 * successful conversions only and never refills. After the fifth, a paid Pro or
 * Business subscription is required.
 *
 * This module is deliberately pure — no database, no network, no clock. The
 * server resolves the inputs and calls in here, and the same function decides
 * the answer in tests. Nothing about the verdict depends on anything the
 * browser can tell us.
 */

import type { SubscriptionStatus } from "./types";

/** Total successful conversions a customer gets before paying. Not per product. */
export const FREE_CONVERSION_ALLOWANCE = 5;

export type GateState =
  "free_attempt_available" | "paid_subscription_active" | "limit_reached" | "subscription_inactive";

/** Only these two states may start a conversion. */
export const ALLOWED_GATE_STATES: readonly GateState[] = [
  "free_attempt_available",
  "paid_subscription_active",
];

export type GateInput = {
  /** Subscription status from the database, or null when there is no row. */
  subscriptionStatus: SubscriptionStatus | null;
  /** Successful conversions already committed against this customer. */
  freeConversionsUsed: number;
  /**
   * Pages left in the paid plan's period, or null when there is no paid plan.
   * Zero means the paid quota is exhausted for this period.
   */
  paidQuotaRemaining: number | null;
};

/** Paid statuses that still permit processing. */
const PAID_ACTIVE: readonly SubscriptionStatus[] = ["active", "past_due"];

/**
 * Statuses that mean a subscription exists but is not currently paying.
 * These must never fall back to the free allowance — that would let a customer
 * cancel and immediately collect five more conversions.
 */
const PAID_INACTIVE: readonly SubscriptionStatus[] = [
  "suspended",
  "cancelled",
  "expired",
  "approval_pending",
];

export function resolveGate(input: GateInput): GateState {
  const { subscriptionStatus, freeConversionsUsed, paidQuotaRemaining } = input;

  if (subscriptionStatus && PAID_ACTIVE.includes(subscriptionStatus)) {
    // An active subscriber is limited by their plan's quota, not the free five.
    if (paidQuotaRemaining !== null && paidQuotaRemaining <= 0) return "limit_reached";
    return "paid_subscription_active";
  }

  if (subscriptionStatus && PAID_INACTIVE.includes(subscriptionStatus)) {
    return "subscription_inactive";
  }

  // No subscription, or a status that carries no entitlement: the free five.
  if (freeConversionsUsed < FREE_CONVERSION_ALLOWANCE) return "free_attempt_available";
  return "limit_reached";
}

export function canConvert(state: GateState): boolean {
  return ALLOWED_GATE_STATES.includes(state);
}

/**
 * Free conversions left. Clamped at both ends so a ledger that somehow
 * over-counted cannot render a negative number in the interface.
 */
export function freeConversionsRemaining(used: number): number {
  return Math.max(0, Math.min(FREE_CONVERSION_ALLOWANCE, FREE_CONVERSION_ALLOWANCE - used));
}
