/**
 * The only component in the app that renders advertising.
 *
 * Every rule lives here, so no page can accidentally place an ad somewhere it
 * should not be:
 *   - nothing renders unless the route is on the eligible list;
 *   - nothing renders for an account whose plan is advertisement-free;
 *   - nothing loads before the visitor has given advertising consent;
 *   - the AdSense script is injected once per document, never per slot;
 *   - the container reserves its height, so no layout shift;
 *   - below-the-fold slots are only filled once they approach the viewport;
 *   - the unit is labelled "Advertisement" and separated from page controls.
 *
 * In development a visible placeholder is drawn instead, so layout can be
 * checked without ever requesting a live ad.
 */

import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { adsConfig, adsRuntimeReady, isAdEligiblePath, type AdSlotName } from "@/config/ads";
import { useConsent } from "./CookieConsent";
import { useBilling } from "@/billing/BillingProvider";
import { useT } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  name: AdSlotName;
  /** Visual shape. Heights are reserved up front to avoid layout shift. */
  variant?: "in-article" | "banner" | "sidebar";
  className?: string;
  /** Label locale override; defaults to the interface language. */
  label?: string;
};

const RESERVED_HEIGHT: Record<NonNullable<AdSlotProps["variant"]>, string> = {
  "in-article": "min-h-[280px]",
  banner: "min-h-[110px] sm:min-h-[100px]",
  sidebar: "min-h-[600px]",
};

let scriptRequested = false;

/** Injects the AdSense loader exactly once per document. */
function ensureAdSenseScript(clientId: string): void {
  if (scriptRequested || typeof document === "undefined") return;
  scriptRequested = true;

  const existing = document.querySelector<HTMLScriptElement>("script[data-eio-adsense]");
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset["eioAdsense"] = "true";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  document.head.appendChild(script);
}

export function AdSlot({ name, variant = "in-article", className, label }: AdSlotProps) {
  const t = useT();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const consent = useConsent();
  const { adsAllowed, loading } = useBilling();
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const [near, setNear] = useState(false);

  const slotId = adsConfig.slotId(name);
  const eligibleRoute = isAdEligiblePath(pathname);
  // An explicit refusal is final. The non-personalised path may only apply
  // while the visitor has not decided yet; treating "no" as grounds to serve a
  // non-personalised ad would still put Google's script, and its cookies, on
  // the page of someone who declined advertising.
  const refusedMarketing = consent !== null && consent.marketing === false;
  const consented =
    !refusedMarketing &&
    (consent?.marketing === true ||
      (adsConfig.allowNonPersonalisedWithoutConsent && consent === null));

  const shouldRenderPlaceholder =
    adsConfig.isDevelopment && adsConfig.enabled && eligibleRoute && adsAllowed && !loading;

  const shouldRenderLive =
    adsRuntimeReady() && eligibleRoute && adsAllowed && !loading && consented && Boolean(slotId);

  // Only fill a slot once it is close to the viewport.
  useEffect(() => {
    if (!shouldRenderLive || near) return;
    const element = containerRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRenderLive, near]);

  useEffect(() => {
    if (!shouldRenderLive || !near || pushedRef.current) return;
    ensureAdSenseScript(adsConfig.clientId);
    try {
      const queue = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
      if (!consent?.marketing) {
        // Non-personalised request, used only where the deployment has opted in.
        (queue as unknown as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds = 1;
      }
      queue.push({});
      pushedRef.current = true;
    } catch (error) {
      console.error("[ads] slot could not be filled", (error as Error).name);
    }
  }, [shouldRenderLive, near, consent?.marketing]);

  if (!shouldRenderLive && !shouldRenderPlaceholder) return null;

  return (
    <aside
      ref={containerRef}
      aria-label={label ?? t("ads.label")}
      // Generous vertical spacing keeps the unit away from product controls,
      // and the border makes the separation from page content obvious.
      className={cn(
        "my-10 rounded-xl border border-dashed border-border/80 bg-surface/40 p-3",
        className,
      )}
    >
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label ?? t("ads.label")}
      </p>

      {shouldRenderLive ? (
        <ins
          className={cn("adsbygoogle block w-full", RESERVED_HEIGHT[variant])}
          style={{ display: "block" }}
          data-ad-client={adsConfig.clientId}
          data-ad-slot={slotId ?? undefined}
          data-ad-format={variant === "sidebar" ? "vertical" : "auto"}
          data-full-width-responsive={variant === "sidebar" ? "false" : "true"}
        />
      ) : (
        <div
          className={cn(
            "grid w-full place-items-center rounded-lg bg-muted/40 text-xs text-muted-foreground",
            RESERVED_HEIGHT[variant],
          )}
        >
          Ad placeholder ({name}) — live ads are disabled in development
        </div>
      )}
    </aside>
  );
}
