import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently deletes the signed-in user. The caller can only ever delete
 * themselves — the user id comes from the verified bearer token, never from
 * request data.
 *
 * Most of the account cascades from the auth user record. analytics_events does
 * not, and that one table made deletion impossible for anyone whose email was
 * confirmed:
 *
 *   * analytics_events.user_id is declared ON DELETE SET NULL, so removing the
 *     user blanks the column instead of removing the row;
 *   * analytics_events_subject requires user_id IS NOT NULL OR anon_session_id
 *     IS NOT NULL, because an event attributable to nobody cannot be counted.
 *
 * A signup_completed row carries a user_id and no anon_session_id, so blanking
 * it left the row with no subject, the CHECK refused it, and the whole DELETE
 * rolled back with 23514. Confirmed by isolation: an unverified account, which
 * has no such row, deleted cleanly; a verified one never did. The right to
 * erasure had no working path.
 *
 * The rows are therefore removed first, which is exactly what a cascading
 * foreign key would have done. An event that exists only to record that this
 * person signed up has no meaning once they are gone, and erasure is what
 * deleting an account is supposed to mean. Anonymous events are untouched: they
 * are keyed by anon_session_id, carry no user_id, and no foreign key reaches
 * them.
 *
 * This stays correct once 20260823030000's companion migration switches that
 * key to ON DELETE CASCADE — the rows are simply already gone by then.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { serverDb } = await import("@/lib/db.server");

    const db = await serverDb();
    const { error: analyticsError } = await db
      .from("analytics_events")
      .delete()
      .eq("user_id", context.userId);

    // Deleting the account is the point; failing to clear its analytics is not
    // a reason to refuse. The delete below will surface the real problem if
    // this was the blocking one.
    if (analyticsError) {
      console.error("[account] could not clear analytics before deletion", analyticsError.code);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) {
      // The provider's message can name internal constraints; the caller gets a
      // stable code instead.
      console.error("[account] deletion failed", error.message);
      throw new Error("account_delete_failed");
    }
    return { ok: true };
  });
