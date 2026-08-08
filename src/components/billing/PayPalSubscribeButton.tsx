/**
 * PayPal subscription button.
 *
 * The browser is given exactly two things by the server: the public client id
 * and the plan id it authorised. When PayPal returns a subscription id, that id
 * is sent back for server-side verification — the callback itself grants
 * nothing. The screen then polls until PayPal (directly or by webhook) reports
 * the subscription active.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  confirmSubscriptionApproval,
  createSubscriptionIntent,
} from "@/lib/billing/billing.functions";
import { useBilling } from "@/billing/BillingProvider";
import { useT } from "@/i18n/useLocale";
import type { BillingState } from "@/lib/billing/types";

type PayPalButtonsConfig = {
  style?: Record<string, string>;
  createSubscription: (
    data: unknown,
    actions: { subscription: { create: (input: { plan_id: string }) => Promise<string> } },
  ) => Promise<string>;
  onApprove: (data: { subscriptionID?: string | null }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
};

type PayPalNamespace = {
  Buttons: (config: PayPalButtonsConfig) => { render: (target: HTMLElement) => Promise<void> };
};

let sdkPromise: Promise<PayPalNamespace> | null = null;

/** Loads the PayPal JS SDK once, with subscription intent. */
function loadPayPalSdk(clientId: string): Promise<PayPalNamespace> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<PayPalNamespace>((resolve, reject) => {
    const existing = (window as unknown as { paypal?: PayPalNamespace }).paypal;
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      vault: "true",
      intent: "subscription",
      components: "buttons",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => {
      const namespace = (window as unknown as { paypal?: PayPalNamespace }).paypal;
      if (namespace) resolve(namespace);
      else reject(new Error("paypal_sdk_unavailable"));
    };
    script.onerror = () => reject(new Error("paypal_sdk_unavailable"));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}

export function PayPalSubscribeButton({
  planCode,
  interval,
  onActivated,
}: {
  planCode: "pro" | "business";
  interval: "month" | "year";
  onActivated?: (state: BillingState) => void;
}) {
  const t = useT();
  const { refresh } = useBilling();
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [status, setStatus] = useState<
    "loading" | "ready" | "approving" | "verifying" | "unavailable"
  >("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderedRef.current = false;

    (async () => {
      const intent = await createSubscriptionIntent({ data: { planCode, interval } });
      if (cancelled) return;

      if (!intent.ok) {
        setStatus("unavailable");
        setMessage(t("billing.paypalUnavailable"));
        return;
      }

      let sdk: PayPalNamespace;
      try {
        sdk = await loadPayPalSdk(intent.clientId);
      } catch {
        if (!cancelled) {
          setStatus("unavailable");
          setMessage(t("billing.paypalUnavailable"));
        }
        return;
      }
      if (cancelled || !containerRef.current || renderedRef.current) return;

      renderedRef.current = true;
      setStatus("ready");

      await sdk
        .Buttons({
          style: { layout: "vertical", shape: "rect", label: "subscribe" },
          createSubscription: (_data, actions) => {
            setStatus("approving");
            // The plan id comes from the server's answer, never from the page.
            return actions.subscription.create({ plan_id: intent.paypalPlanId });
          },
          onApprove: async (data) => {
            if (!data.subscriptionID) return;
            setStatus("verifying");
            const result = await confirmSubscriptionApproval({
              data: { planCode, interval, subscriptionId: data.subscriptionID },
            });
            await refresh();
            if (result.ok) {
              toast.success(t("billing.activated"));
              onActivated?.(result.state);
            } else {
              setMessage(t("conv.err.internal_error"));
              setStatus("unavailable");
            }
          },
          onCancel: () => setStatus("ready"),
          onError: (error) => {
            console.error("[paypal] button error", (error as Error)?.name ?? "unknown");
            setStatus("ready");
          },
        })
        .render(containerRef.current);
    })().catch((error) => {
      console.error("[paypal] setup failed", (error as Error).name);
      if (!cancelled) setStatus("unavailable");
    });

    return () => {
      cancelled = true;
    };
  }, [planCode, interval, refresh, t, onActivated]);

  return (
    <div>
      {/* No ad unit is ever placed adjacent to this container. */}
      <div ref={containerRef} className="min-h-[52px]" />
      {status === "loading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          {t("state.loading")}
        </p>
      )}
      {status === "verifying" && (
        <p className="mt-2 text-xs text-muted-foreground">{t("billing.awaitingPayPal")}</p>
      )}
      {message && <p className="mt-2 text-xs text-destructive">{message}</p>}
    </div>
  );
}
