/**
 * Contact form receiver — POST /api/contact
 *
 * This route previously exported a bare h3 `defineEventHandler`. TanStack
 * Start's route generator only registers files that export a `Route` built by
 * `createFileRoute`, so the handler was silently absent from every production
 * bundle and the endpoint answered 404 — the contact form could not deliver a
 * single message. It now follows the same shape as api.paypal.webhook.ts,
 * which is the one server route in this project that was reachable.
 *
 * The service-role client is imported inside the handler so it never reaches
 * the browser bundle.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().min(1).email(),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(["general", "support", "sales", "billing", "privacy", "security", "api"]),
  message: z.string().trim().min(20).max(2000),
  locale: z.enum(["en", "fr", "ar"]),
});

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      // Kept so a browser hitting the endpoint gets the same 405 the h3 version
      // sent, rather than the 404 that an unlisted method would produce.
      GET: () => json({ error: "method_not_allowed" }, 405, { allow: "POST" }),

      POST: async ({ request }: { request: Request }) => {
        const raw = await request.text();
        // Bounded before parsing: an unbounded body is a free memory hit on a
        // route that needs no authentication.
        if (raw.length === 0 || raw.length > 100_000) {
          return json({ error: "invalid_body" }, 400);
        }

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          return json({ error: "validation_error" }, 400);
        }

        // Everything past validation is wrapped: an API route must answer JSON
        // even when it fails. Without this a missing Supabase variable escapes as
        // an uncaught throw and the visitor's fetch() receives an HTML error page.
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { error } = await supabaseAdmin.from("contact_messages").insert({
            name: parsed.data.name,
            email: parsed.data.email,
            company: parsed.data.company || null,
            topic: parsed.data.topic,
            message: parsed.data.message,
            locale: parsed.data.locale,
            status: "new",
          });

          if (error) {
            // The Supabase error is logged but never returned: it can carry
            // schema and policy detail that an unauthenticated caller must not see.
            console.error("[contact] insert failed", error);
            return json({ error: "save_failed" }, 500);
          }
        } catch (err) {
          console.error("[contact] unexpected error", err);
          return json({ error: "save_failed" }, 500);
        }

        return json({ success: true }, 200);
      },
    },
  },
});
