import { describe, expect, it } from "vitest";
import { sdkUrl } from "./paypal-sdk";
import { locales } from "@/i18n";

/**
 * The SDK query string is the entire contract with PayPal: it decides which
 * buttons are drawn and in what language. Every failure it can produce is
 * silent — the page still renders, the checkout just quietly offers less than
 * it should — so the parameters are pinned here rather than left to inspection.
 */

describe("the card button is asked for, not hoped for", () => {
  it("requests card funding explicitly", () => {
    const params = new URL(sdkUrl("test-client", "en")).searchParams;
    // Without this, whether someone without a PayPal account can pay at all
    // depends on default eligibility rules that are not ours to rely on.
    expect(params.get("enable-funding")).toBe("card");
  });

  it("disables no funding source", () => {
    expect(new URL(sdkUrl("test-client", "en")).searchParams.get("disable-funding")).toBeNull();
  });
});

describe("the buttons speak the visitor's language", () => {
  it("maps every site locale to a PayPal locale", () => {
    const expected: Record<string, string> = { en: "en_US", fr: "fr_FR", ar: "ar_EG" };
    for (const locale of locales) {
      expect(new URL(sdkUrl("c", locale)).searchParams.get("locale"), locale).toBe(
        expected[locale],
      );
    }
  });

  it("gives each locale its own URL, so one cannot serve another", () => {
    // The loader caches by URL. If two locales shared one, whichever loaded
    // first would draw the buttons for both.
    const urls = locales.map((l) => sdkUrl("c", l));
    expect(new Set(urls).size).toBe(locales.length);
  });
});

describe("subscriptions, not one-off payments", () => {
  it("asks for the vaulted subscription intent", () => {
    const params = new URL(sdkUrl("c", "en")).searchParams;
    expect(params.get("intent")).toBe("subscription");
    expect(params.get("vault")).toBe("true");
  });

  it("carries the client id it was given", () => {
    expect(new URL(sdkUrl("abc123", "en")).searchParams.get("client-id")).toBe("abc123");
  });

  it("loads from PayPal over https and nowhere else", () => {
    const url = new URL(sdkUrl("c", "ar"));
    expect(url.protocol).toBe("https:");
    expect(url.host).toBe("www.paypal.com");
  });
});
