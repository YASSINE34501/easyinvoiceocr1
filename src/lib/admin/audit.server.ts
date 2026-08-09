/**
 * Admin audit trail.
 *
 * Server-only. Records who did what to which object, and nothing more: the
 * metadata is deliberately a description of the change, never the changed
 * content. An admin editing a plan writes "which fields changed", not the plan;
 * an admin viewing a document writes nothing about the document at all.
 *
 * Writes are best-effort in the same sense as analytics — a failed audit write
 * is logged loudly but does not fail the admin action, because an action that
 * has already taken effect must not appear to have failed.
 */

/** Actions worth recording. A closed set, so the log stays greppable. */
export const AUDIT_ACTIONS = [
  "plan.updated",
  "setting.updated",
  "subscription.status_changed",
  "subscription.cancelled",
  "subscription.refreshed",
  "conversion.purged",
  "user.role_granted",
  "user.role_revoked",
  "analytics.pruned",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditInput = {
  actorUserId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  /** Small scalar facts only: changed field names, counts, status transitions. */
  metadata?: Record<string, string | number | boolean> | undefined;
};

const METADATA_MAX_KEYS = 20;

/**
 * Keeps scalars, drops everything else, and caps the count.
 *
 * There is no allowlist of keys here — unlike visitor analytics, an admin
 * action's useful detail varies by action. The protection is that only trusted
 * server code calls this, and only scalars survive, so a document body or an
 * OCR result cannot be recorded even by mistake.
 */
function safeMetadata(input: AuditInput["metadata"]): Record<string, string | number | boolean> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string | number | boolean> = {};
  let keys = 0;
  for (const [key, value] of Object.entries(input)) {
    if (keys >= METADATA_MAX_KEYS) break;
    if (typeof value === "string") out[key.slice(0, 40)] = value.slice(0, 200);
    else if (typeof value === "number" && Number.isFinite(value)) out[key.slice(0, 40)] = value;
    else if (typeof value === "boolean") out[key.slice(0, 40)] = value;
    else continue;
    keys += 1;
  }
  return out;
}

export async function recordAdminAction(input: AuditInput): Promise<{ ok: boolean }> {
  try {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();

    // The email is resolved server-side and stored alongside the id so the log
    // stays readable after an account is deleted and the FK goes null.
    let actorEmail: string | null = null;
    try {
      const { data } = await db.auth.admin.getUserById(input.actorUserId);
      actorEmail = data?.user?.email ?? null;
    } catch {
      /* a missing email must not stop the record being written */
    }

    const { error } = await db.from("admin_audit_log").insert({
      actor_user_id: input.actorUserId,
      actor_email: actorEmail,
      action: input.action,
      target_type: input.targetType.slice(0, 60),
      target_id: input.targetId ? String(input.targetId).slice(0, 120) : null,
      metadata: safeMetadata(input.metadata),
    });

    if (error) {
      console.error("[audit] write failed", { code: error.code, action: input.action });
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error("[audit] unavailable", (error as Error).name);
    return { ok: false };
  }
}
