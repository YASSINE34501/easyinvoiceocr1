/**
 * PayPal subscription buttons.
 *
 * These are PayPal's own Smart Payment Buttons, drawn by PayPal inside its own
 * iframes — the yellow PayPal button and, for anyone without a PayPal account,
 * the dark Debit or Credit Card button. The card funding source is requested
 * explicitly rather than left to default eligibility, because it is the one
 * most visitors here need and silently losing it looks like the site simply
 * does not take cards.
 *
 * The browser is given exactly two things by the server: the public client id
 * and the plan id it authorised. When PayPal returns a subscription id, that id
 * is sent back for server-side verification — the callback itself grants
 * nothing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  confirmSubscriptionApproval,
  createSubscriptionIntent,
} from "@/lib/billing/billing.functions";
import { useBilling } from "@/billing/BillingProvider";
import { loadPayPalSdk, sdkUrl, type ButtonInstance, type PayPalNamespace } from "./paypal-sdk";
import { useLocale, useT } from "@/i18n/useLocale";
import type { MessageKey } from "@/i18n";
import type { BillingState } from "@/lib/billing/types";

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
  const locale = useLocale();
  const { refresh } = useBilling();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "approving" | "verifying" | "unavailable"
  >("loading");
  const [message, setMessage] = useState<string | null>(null);

  // Callers pass an inline arrow, so onActivated is a new function on every
  // parent render. Held in a ref and kept out of the effect's dependencies:
  // when it was a dependency the effect re-ran on unrelated parent renders and
  // appended a second full set of buttons to the same container, leaving the
  // visitor looking at PayPal's buttons twice.
  const onActivatedRef = useRef(onActivated);
  useEffect(() => {
    onActivatedRef.current = onActivated;
  }, [onActivated]);

  const label = useCallback((key: MessageKey) => t(key), [t]);

  useEffect(() => {
    let cancelled = false;
    let instance: ButtonInstance | null = null;
    const container = containerRef.current;

    (async () => {
      const intent = await createSubscriptionIntent({ data: { planCode, interval } });
      if (cancelled) return;

      if (!intent.ok) {
        setStatus("unavailable");
        setMessage(label("billing.paypalUnavailable"));
        return;
      }

      let sdk: PayPalNamespace;
      try {
        sdk = await loadPayPalSdk(sdkUrl(intent.clientId, locale));
      } catch {
        if (!cancelled) {
          setStatus("unavailable");
          setMessage(label("billing.paypalUnavailable"));
        }
        return;
      }
      if (cancelled || !container) return;

      // Whatever a previous run drew is removed first. Rendering into a
      // container that still holds an old set is what produced duplicates.
      container.replaceChildren();
      setStatus("ready");
      setMessage(null);

      instance = sdk.Buttons({
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
            toast.success(label("billing.activated"));
            onActivatedRef.current?.(result.state);
          } else {
            setMessage(label("conv.err.internal_error"));
            setStatus("unavailable");
          }
        },
        onCancel: () => setStatus("ready"),
        onError: (error) => {
          console.error("[paypal] button error", (error as Error)?.name ?? "unknown");
          setStatus("ready");
        },
      });

      await instance.render(container);
    })().catch((error) => {
      console.error("[paypal] setup failed", (error as Error).name);
      if (!cancelled) setStatus("unavailable");
    });

    return () => {
      cancelled = true;
      // Closing tells PayPal to tear its iframes down; emptying the container
      // covers the case where close() is unavailable or already resolved.
      void Promise.resolve(instance?.close?.()).catch(() => {});
      container?.replaceChildren();
    };
  }, [planCode, interval, locale, refresh, label]);

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
