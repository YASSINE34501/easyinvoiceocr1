/**
 * PayPal webhook receiver — POST /api/paypal/webhook
 *
 * Order matters here:
 *   1. verify the signature with PayPal before anything is stored, so a forged
 *      request cannot occupy an event id and block the real delivery;
 *   2. insert the event, whose unique (provider, provider_event_id) index is
 *      what makes redelivery a no-op;
 *   3. apply it by re-reading the subscription from PayPal, which makes
 *      out-of-order deliveries safe.
 *
 * The endpoint always answers 200 for events it has accepted, including
 * duplicates, so PayPal does not retry work that is already done.
 */

import { createFileRoute } from "@tanstack/react-router";

type PayPalEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource?: Record<string, unknown>;
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/paypal/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const raw = await request.text();
        if (raw.length === 0 || raw.length > 1_000_000) {
          return json({ error: "invalid_body" }, 400);
        }

        const { readWebhookHeaders, verifyWebhookSignature, readPayPalConfig } =
          await import("@/lib/paypal/client.server");

        if (!readPayPalConfig()) {
          console.error("[paypal-webhook] rejected: PayPal is not configured");
          return json({ error: "not_configured" }, 503);
        }

        const verified = await verifyWebhookSignature(readWebhookHeaders(request.headers), raw);
        if (!verified) {
          // No event id is recorded: an unverified request must not be able to
          // reserve an id that a genuine delivery would later collide with.
          console.error("[paypal-webhook] rejected: signature not verified");
          return json({ error: "signature_not_verified" }, 401);
        }

        let event: PayPalEvent;
        try {
          event = JSON.parse(raw) as PayPalEvent;
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        if (!event.id || !event.event_type) return json({ error: "invalid_event" }, 400);

        const { serverDb } = await import("@/lib/db.server");
        const db = await serverDb();

        const resource = event.resource ?? {};
        const providerSubscriptionId =
          typeof resource["id"] === "string" && event.event_type.startsWith("BILLING.SUBSCRIPTION")
            ? (resource["id"] as string)
            : typeof resource["billing_agreement_id"] === "string"
              ? (resource["billing_agreement_id"] as string)
              : null;

        const { data: inserted, error: insertError } = await db
          .from("subscription_events")
          .insert({
            provider: "paypal",
            provider_event_id: event.id,
            event_type: event.event_type,
            provider_subscription_id: providerSubscriptionId,
            // Kept for audit. The table is readable by admins only.
            payload: event,
            processing_status: "received",
          })
          .select("id")
          .maybeSingle();

        if (insertError) {
          // 23505 is a unique violation: this event was already delivered.
          if (insertError.code === "23505") {
            return json({ status: "duplicate_ignored" }, 200);
          }
          console.error("[paypal-webhook] could not record event", insertError.code);
          return json({ error: "storage_failed" }, 500);
        }

        try {
          const { applyWebhookEvent } = await import("@/lib/paypal/subscriptions.server");
          const result = await applyWebhookEvent({
            id: event.id,
            event_type: event.event_type,
            create_time: event.create_time ?? undefined,
            resource,
          });

          await db
            .from("subscription_events")
            .update({
              processing_status: result.handled ? "processed" : "ignored",
              processed_at: new Date().toISOString(),
              error_message: result.handled ? null : result.note,
            })
            .eq("id", inserted?.id);

          return json({ status: result.handled ? "processed" : "ignored" }, 200);
        } catch (error) {
          const message = error instanceof Error ? error.name : "unknown_error";
          console.error("[paypal-webhook] processing failed", message);
          await db
            .from("subscription_events")
            .update({
              processing_status: "failed",
              processed_at: new Date().toISOString(),
              // The reason, never the provider payload or any credential.
              error_message: message,
            })
            .eq("id", inserted?.id);
          return json({ error: "processing_failed" }, 500);
        }
      },
    },
  },
});
