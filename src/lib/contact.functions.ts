import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional().default(""),
  topic: z.string().trim().min(1).max(40),
  message: z.string().trim().min(20).max(2000),
  locale: z.string().trim().max(5).default("en"),
});

/**
 * Stores a contact request. The table is not readable or writable by any
 * client role, so the write happens through trusted server code only after
 * the payload has been validated again server-side.
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      topic: data.topic,
      message: data.message,
      locale: data.locale,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
