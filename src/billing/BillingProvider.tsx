/**
 * Client-side view of the account's billing state.
 *
 * This exists so the interface can hide what a user cannot use. It is not a
 * security boundary: every limit it reflects is re-checked server-side before
 * anything happens, and this context is simply the copy the UI renders from.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { getBillingState } from "@/lib/billing/billing.functions";
import { EMPTY_ENTITLEMENTS, type BillingState } from "@/lib/billing/types";

type BillingContextValue = {
  state: BillingState | null;
  loading: boolean;
  /** True when this visitor may be shown advertising. */
  adsAllowed: boolean;
  refresh: () => Promise<void>;
};

const BillingContext = createContext<BillingContextValue>({
  state: null,
  loading: false,
  adsAllowed: true,
  refresh: async () => {},
});

export const BILLING_QUERY_KEY = ["billing-state"] as const;

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...BILLING_QUERY_KEY, user?.id ?? "anonymous"],
    enabled: Boolean(user),
    staleTime: 30_000,
    queryFn: () => getBillingState(),
  });

  const value = useMemo<BillingContextValue>(() => {
    const state = user ? (data ?? null) : null;
    return {
      state,
      loading: authLoading || (Boolean(user) && isLoading),
      // Signed-out visitors are treated as free-tier. A signed-in user's own
      // entitlements decide, so paid accounts never see an ad slot render.
      adsAllowed: state ? state.entitlements.adsEnabled : true,
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
      },
    };
  }, [user, data, authLoading, isLoading, queryClient]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  return useContext(BillingContext);
}

/** Entitlements with a safe empty default, for components that only read them. */
export function useEntitlements() {
  const { state } = useBilling();
  return state?.entitlements ?? EMPTY_ENTITLEMENTS;
}
