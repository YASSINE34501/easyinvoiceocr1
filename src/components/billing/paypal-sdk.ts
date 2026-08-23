/**
 * The PayPal JS SDK URL and loader.
 *
 * Separate from the component because the query string is the entire contract
 * with PayPal — which buttons get drawn, in what language, for what kind of
 * payment — and every way it can be wrong is silent: the page still renders,
 * the checkout just quietly offers less than it should. Worth being able to
 * test on its own.
 */

import type { Locale } from "@/i18n";

export type ButtonInstance = {
  render: (target: HTMLElement) => Promise<void>;
  close?: () => Promise<void> | void;
};

export type PayPalButtonsConfig = {
  style?: Record<string, string>;
  createSubscription: (
    data: unknown,
    actions: { subscription: { create: (input: { plan_id: string }) => Promise<string> } },
  ) => Promise<string>;
  onApprove: (data: { subscriptionID?: string | null }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
};

export type PayPalNamespace = {
  Buttons: (config: PayPalButtonsConfig) => ButtonInstance;
};

/** PayPal's own locale codes. Without one the buttons ignore the site language. */
const PAYPAL_LOCALE: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_EG",
};

export function sdkUrl(clientId: string, locale: Locale): string {
  const params = new URLSearchParams({
    "client-id": clientId,
    vault: "true",
    intent: "subscription",
    components: "buttons",
    // Asks PayPal for the card button explicitly, so someone without a PayPal
    // account can still pay. Card is normally eligible anyway, but "normally"
    // is not a guarantee to hang a checkout on.
    "enable-funding": "card",
    locale: PAYPAL_LOCALE[locale],
  });
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

// Keyed by the full URL: the locale is part of it, so switching language loads
// the right script instead of reusing a cached one drawn in another language.
const sdkPromises = new Map<string, Promise<PayPalNamespace>>();

/** Loads the PayPal JS SDK once per distinct URL. */
export function loadPayPalSdk(url: string): Promise<PayPalNamespace> {
  const cached = sdkPromises.get(url);
  if (cached) return cached;

  const promise = new Promise<PayPalNamespace>((resolve, reject) => {
    const existing = (window as unknown as { paypal?: PayPalNamespace }).paypal;
    if (existing && document.querySelector(`script[src="${url}"]`)) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => {
      const namespace = (window as unknown as { paypal?: PayPalNamespace }).paypal;
      if (namespace) resolve(namespace);
      else reject(new Error("paypal_sdk_unavailable"));
    };
    script.onerror = () => reject(new Error("paypal_sdk_unavailable"));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromises.delete(url);
    throw error;
  });

  sdkPromises.set(url, promise);
  return promise;
}
