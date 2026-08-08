import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readWebhookHeaders, verifyWebhookSignature } from "./client.server";

const GOOD_HEADERS = {
  "paypal-transmission-id": "t-1",
  "paypal-transmission-time": "2026-08-03T10:00:00Z",
  "paypal-transmission-sig": "sig",
  "paypal-cert-url": "https://api.paypal.com/v1/notifications/certs/CERT-abc",
  "paypal-auth-algo": "SHA256withRSA",
};

const BODY = JSON.stringify({ id: "WH-1", event_type: "BILLING.SUBSCRIPTION.ACTIVATED" });

function headers(overrides: Record<string, string | null> = {}) {
  const merged = new Headers(GOOD_HEADERS);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) merged.delete(key);
    else merged.set(key, value);
  }
  return readWebhookHeaders(merged);
}

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env["PAYPAL_CLIENT_ID"] = "test-client";
  process.env["PAYPAL_CLIENT_SECRET"] = "test-secret";
  process.env["PAYPAL_WEBHOOK_ID"] = "WH-CONFIG";
  process.env["PAYPAL_ENVIRONMENT"] = "sandbox";
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("readWebhookHeaders", () => {
  it("reads every header PayPal signs with", () => {
    const parsed = headers();
    expect(parsed.transmissionId).toBe("t-1");
    expect(parsed.authAlgo).toBe("SHA256withRSA");
    expect(parsed.certUrl).toContain("paypal.com");
  });

  it("reports a missing header as null rather than guessing", () => {
    expect(headers({ "paypal-transmission-sig": null }).transmissionSig).toBeNull();
  });
});

describe("verifyWebhookSignature", () => {
  it("refuses when PayPal is not configured", async () => {
    delete process.env["PAYPAL_CLIENT_ID"];
    await expect(verifyWebhookSignature(headers(), BODY)).resolves.toBe(false);
  });

  it("refuses when no webhook id is configured", async () => {
    delete process.env["PAYPAL_WEBHOOK_ID"];
    await expect(verifyWebhookSignature(headers(), BODY)).resolves.toBe(false);
  });

  it.each([
    "paypal-transmission-id",
    "paypal-transmission-time",
    "paypal-transmission-sig",
    "paypal-cert-url",
    "paypal-auth-algo",
  ])("refuses when %s is missing", async (header) => {
    await expect(verifyWebhookSignature(headers({ [header]: null }), BODY)).resolves.toBe(false);
  });

  it("refuses a certificate URL that is not on a PayPal host", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(
      verifyWebhookSignature(
        headers({ "paypal-cert-url": "https://evil.example.com/cert.pem" }),
        BODY,
      ),
    ).resolves.toBe(false);
    // The forged URL is rejected before any network call is made.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a certificate URL that merely contains paypal.com", async () => {
    await expect(
      verifyWebhookSignature(
        headers({ "paypal-cert-url": "https://paypal.com.evil.example/cert.pem" }),
        BODY,
      ),
    ).resolves.toBe(false);
  });

  it("accepts only when PayPal itself answers SUCCESS", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ verification_status: "SUCCESS" }), { status: 200 });
    });

    await expect(verifyWebhookSignature(headers(), BODY)).resolves.toBe(true);
  });

  it("refuses when PayPal answers FAILURE", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ verification_status: "FAILURE" }), { status: 200 });
    });

    await expect(verifyWebhookSignature(headers(), BODY)).resolves.toBe(false);
  });

  it("refuses when the verification call itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    await expect(verifyWebhookSignature(headers(), BODY)).resolves.toBe(false);
  });

  it("never sends the client secret to the verification endpoint", async () => {
    const bodies: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (typeof init?.body === "string") bodies.push(init.body);
      if (url.endsWith("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ verification_status: "SUCCESS" }), { status: 200 });
    });

    await verifyWebhookSignature(headers(), BODY);
    for (const body of bodies) expect(body).not.toContain("test-secret");
  });
});
