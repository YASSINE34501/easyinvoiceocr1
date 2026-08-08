import { defineEventHandler, readBody, setHeader, createError } from "h3";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().min(1).email(),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(["general", "support", "sales", "billing", "privacy", "security", "api"]),
  message: z.string().trim().min(20).max(2000),
  locale: z.enum(["en", "fr", "ar"]),
});

export default defineEventHandler(async (event) => {
  if (event.req.method !== "POST") {
    setHeader(event, "Allow", "POST");
    throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
  }

  try {
    const body = await readBody(event);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: "Validation error" });
    }

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
      console.error("[contact] insert failed", error);
      throw createError({ statusCode: 500, statusMessage: "Failed to save message" });
    }

    return { success: true };
  } catch (err) {
    if (err instanceof Error && "statusCode" in err) {
      throw err;
    }
    console.error("[contact] unexpected error", err);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
