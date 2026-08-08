/**
 * PayPal REST client — server only.
 *
 * PAYPAL_CLIENT_SECRET is read here and nowhere else; it never reaches a
 * bundle that runs in a browser. The only value published to the client is the
 * public client id, and that goes through getPaymentConfig().
 *
 * Endpoints used (current PayPal Subscriptions API):
 *   POST /v1/oauth2/token
 *   POST /v1/catalogs/products
 *   POST /v1/billing/plans
 *   GET  /v1/billing/subscriptions/{id}
 *   POST /v1/billing/subscriptions/{id}/cancel
 *   POST /v1/notifications/verify-webhook-signature
 */

export type PayPalEnvironment = "sandbox" | "live";

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  environment: PayPalEnvironment;
  apiBase: string;
};

const API_BASE: Record<PayPalEnvironment, string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

export class PayPalNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`PayPal is not configured. Missing: ${missing.join(", ")}`);
    this.name = "PayPalNotConfiguredError";
  }
}

export class PayPalApiError extends Error {
  readonly status: number;
  /** PayPal's own error name, safe to log. The full body never is. */
  readonly issue: string;

  constructor(status: number, issue: string) {
    super(`PayPal request failed (${status}): ${issue}`);
    this.name = "PayPalApiError";
    this.status = status;
    this.issue = issue;
  }
}

/**
 * Reads the environment name.
 *
 * `PAYPAL_ENV` is the documented variable. `PAYPAL_ENVIRONMENT` is accepted as
 * a legacy alias because earlier code wrote it that way; without this the
 * documented name was ignored and a deployment holding *live* credentials
 * silently resolved to the sandbox host, which is exactly the sandbox/live
 * mixing the integration must never do.
 *
 * Anything that is not exactly "live" resolves to sandbox: an unreadable value
 * must never be treated as production.
 */
export function readPayPalEnvironment(): PayPalEnvironment {
  const raw = (process.env["PAYPAL_ENV"] ?? process.env["PAYPAL_ENVIRONMENT"] ?? "sandbox")
    .trim()
    .toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

export function readPayPalConfig(): PayPalConfig | null {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const clientSecret = process.env["PAYPAL_CLIENT_SECRET"];
  const webhookId = process.env["PAYPAL_WEBHOOK_ID"] ?? "";
  const environment = readPayPalEnvironment();

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    webhookId,
    environment,
    apiBase: API_BASE[environment],
  };
}

/** Every configuration value that must be present before checkout may open. */
export function missingPayPalConfig(): string[] {
  const required = [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "PAYPAL_PRO_MONTHLY_PLAN_ID",
    "PAYPAL_PRO_YEARLY_PLAN_ID",
    "PAYPAL_BUSINESS_MONTHLY_PLAN_ID",
    "PAYPAL_BUSINESS_YEARLY_PLAN_ID",
  ];
  return required.filter((name) => !process.env[name]);
}

/**
 * True only when every credential and plan id is present *and* the account
 * owner has explicitly opted in. Checkout fails closed: an incomplete or
 * un-opted-in configuration can never open a real payment window.
 */
export function isLiveCheckoutEnabled(): boolean {
  if (missingPayPalConfig().length > 0) return false;
  return (process.env["PAYPAL_LIVE_CHECKOUT_ENABLED"] ?? "").trim().toLowerCase() === "true";
}

export function requirePayPalConfig(): PayPalConfig {
  const config = readPayPalConfig();
  if (!config) {
    const missing = [
      ...(process.env["PAYPAL_CLIENT_ID"] ? [] : ["PAYPAL_CLIENT_ID"]),
      ...(process.env["PAYPAL_CLIENT_SECRET"] ? [] : ["PAYPAL_CLIENT_SECRET"]),
    ];
    throw new PayPalNotConfiguredError(missing);
  }
  return config;
}

/**
 * Plan ids may live in the database; these are the environment fallbacks.
 *
 * The documented variable names are `PAYPAL_<CODE>_<INTERVAL>_PLAN_ID`. The
 * older `PAYPAL_PLAN_ID_<CODE>_<INTERVAL>` spelling is still read so an
 * existing deployment does not lose its mapping on upgrade.
 */
export function envPlanId(code: string, interval: "month" | "year"): string | null {
  const suffix = interval === "year" ? "YEARLY" : "MONTHLY";
  const upper = code.toUpperCase();
  return (
    process.env[`PAYPAL_${upper}_${suffix}_PLAN_ID`] ??
    process.env[`PAYPAL_PLAN_ID_${upper}_${suffix}`] ??
    null
  );
}

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

async function accessToken(config: PayPalConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    cachedToken = null;
    throw new PayPalApiError(response.status, "oauth_failed");
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function paypalFetch<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const config = requirePayPalConfig();
  const token = await accessToken(config);

  const request: RequestInit = {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  };
  if (init.body !== undefined) request.body = JSON.stringify(init.body);

  const response = await fetch(`${config.apiBase}${path}`, request);

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!response.ok) {
    // The body can contain payer details, so only the machine-readable name is
    // surfaced; the full response is never logged or returned.
    let issue = "request_failed";
    try {
      const parsed = JSON.parse(text) as { name?: string; details?: { issue?: string }[] };
      issue = parsed.details?.[0]?.issue ?? parsed.name ?? issue;
    } catch {
      /* keep the generic issue */
    }
    throw new PayPalApiError(response.status, issue);
  }

  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

export type PayPalSubscription = {
  id: string;
  plan_id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string; amount?: { value: string; currency_code: string } };
    failed_payments_count?: number;
  };
  subscriber?: { email_address?: string };
  custom_id?: string;
};

export function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalFetch<PayPalSubscription>(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

export function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  return paypalFetch<void>(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    { method: "POST", body: { reason: reason.slice(0, 128) } },
  );
}

/* ------------------------------------------------------------------ */
/* Catalog and plan provisioning (used by the admin console)           */
/* ------------------------------------------------------------------ */

export function createCatalogProduct(input: {
  name: string;
  description: string;
}): Promise<{ id: string }> {
  return paypalFetch<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: {
      name: input.name,
      description: input.description,
      type: "SERVICE",
      category: "SOFTWARE",
    },
  });
}

export function createBillingPlan(input: {
  productId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
}): Promise<{ id: string }> {
  return paypalFetch<{ id: string }>("/v1/billing/plans", {
    method: "POST",
    body: {
      product_id: input.productId,
      name: input.name,
      description: input.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: input.interval === "year" ? "YEAR" : "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          // 0 means "until cancelled".
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: input.price.toFixed(2), currency_code: input.currency },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Webhook verification                                                */
/* ------------------------------------------------------------------ */

export type WebhookHeaders = {
  transmissionId: string | null;
  transmissionTime: string | null;
  transmissionSig: string | null;
  certUrl: string | null;
  authAlgo: string | null;
};

export function readWebhookHeaders(headers: Headers): WebhookHeaders {
  return {
    transmissionId: headers.get("paypal-transmission-id"),
    transmissionTime: headers.get("paypal-transmission-time"),
    transmissionSig: headers.get("paypal-transmission-sig"),
    certUrl: headers.get("paypal-cert-url"),
    authAlgo: headers.get("paypal-auth-algo"),
  };
}

/**
 * Asks PayPal to verify the signature on a delivered event.
 *
 * Returns false whenever verification does not come back as SUCCESS — a
 * missing header, an unconfigured webhook id, or a network failure all mean
 * "not verified", and an unverified event is never applied.
 */
export async function verifyWebhookSignature(
  headers: WebhookHeaders,
  rawBody: string,
): Promise<boolean> {
  const config = readPayPalConfig();
  if (!config || !config.webhookId) return false;
  if (
    !headers.transmissionId ||
    !headers.transmissionTime ||
    !headers.transmissionSig ||
    !headers.certUrl ||
    !headers.authAlgo
  ) {
    return false;
  }

  // PayPal's certificate host is fixed; refusing anything else stops a forged
  // cert_url from pointing verification at an attacker-controlled server.
  try {
    const certHost = new URL(headers.certUrl).hostname;
    if (!/(^|\.)paypal\.com$/.test(certHost)) return false;
  } catch {
    return false;
  }

  try {
    const result = await paypalFetch<{ verification_status: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: {
          auth_algo: headers.authAlgo,
          cert_url: headers.certUrl,
          transmission_id: headers.transmissionId,
          transmission_sig: headers.transmissionSig,
          transmission_time: headers.transmissionTime,
          webhook_id: config.webhookId,
          // Must be the parsed body, not the raw string, per PayPal's API.
          webhook_event: JSON.parse(rawBody),
        },
      },
    );
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("[paypal] webhook verification failed", {
      issue: error instanceof PayPalApiError ? error.issue : "unknown",
    });
    return false;
  }
}
