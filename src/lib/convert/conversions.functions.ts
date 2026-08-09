/**
 * Conversion job lifecycle.
 *
 * Conversion itself runs in the browser (see pipelines.ts) so documents are
 * never uploaded. What the server owns is the part that must not be
 * negotiable: whether this account is entitled to the tool at all, whether it
 * has quota left, and the record of what was used.
 *
 * Quota is reserved before processing and released when a job fails, so a
 * failure never costs the user pages. The idempotency key is generated once
 * per attempt and reused on retry, so a retried conversion is charged once.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { conversionJobInput } from "./validation";
import type { ErrorCode } from "./types";

type StartResult =
  | {
      ok: true;
      jobId: string;
      pagesRemaining: number;
      maxFileSize: number;
      batchEnabled: boolean;
    }
  | { ok: false; error: ErrorCode; pagesRemaining?: number; maxFileSize?: number };

/**
 * Authorises one conversion and opens a job for it.
 *
 * Runs the same file rules the browser ran, checks the tool against the plan's
 * entitlements, then reserves quota atomically. Only after all three pass does
 * a job row exist.
 */
export const startConversion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => conversionJobInput.parse(data))
  .handler(async ({ context, data }): Promise<StartResult> => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { reserveQuota, resolveBillingState } = await import("@/lib/billing/entitlements.server");
    const { TOOL_ACCEPT } = await import("./validation");

    const accept = TOOL_ACCEPT[data.tool];
    if (!accept.mime.includes(data.inputMimeType)) {
      return { ok: false, error: "unsupported_type" };
    }
    if (data.inputSize <= 0) return { ok: false, error: "file_empty" };

    const state = await resolveBillingState(context.userId);
    if (!state.canProcess && state.blockedReason !== "quota_exceeded") {
      return { ok: false, error: "not_entitled" };
    }
    if (data.inputSize > state.entitlements.maxFileSize) {
      return { ok: false, error: "file_too_large", maxFileSize: state.entitlements.maxFileSize };
    }

    // A retry reuses the key: hand back the job that already exists rather
    // than opening a second one.
    const { data: existing } = await db
      .from("conversion_jobs")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();

    const pages = Math.max(1, data.pageCount);

    const decision = await reserveQuota({
      userId: context.userId,
      tool: data.tool,
      pages,
      fileSize: data.inputSize,
      jobId: existing?.id ?? null,
      idempotencyKey: data.idempotencyKey,
    });

    if (!decision.allowed) {
      return {
        ok: false,
        error: decision.reason === "file_too_large" ? "file_too_large" : "quota_exceeded",
        pagesRemaining: decision.remaining,
        maxFileSize: state.entitlements.maxFileSize,
      };
    }

    if (existing) {
      await db
        .from("conversion_jobs")
        .update({ status: "processing", processing_started_at: new Date().toISOString() })
        .eq("id", existing.id);
      return {
        ok: true,
        jobId: existing.id,
        pagesRemaining: decision.remaining,
        maxFileSize: state.entitlements.maxFileSize,
        batchEnabled: state.entitlements.batchEnabled,
      };
    }

    const retentionHours = await retentionHoursSetting();
    const { data: created, error } = await db
      .from("conversion_jobs")
      .insert({
        user_id: context.userId,
        tool_type: data.tool,
        // Stored so the user can recognise the job in their history. Document
        // contents are never stored or logged.
        original_filename: data.originalFilename.slice(0, 255),
        input_mime_type: data.inputMimeType,
        input_size: data.inputSize,
        status: "processing",
        page_count: pages,
        idempotency_key: data.idempotencyKey,
        processing_started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + retentionHours * 3_600_000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Recorded only now: the quota is reserved and the job row exists, so this
    // is a conversion that genuinely started. Keyed on the job id, so a retry
    // that reuses the idempotency key cannot count twice.
    const { recordEventDetached } = await import("@/lib/analytics/analytics.server");
    const { buildIdempotencyKey } = await import("@/lib/analytics/events");
    recordEventDetached({
      type: "conversion_started",
      userId: context.userId,
      tool: data.tool,
      metadata: { page_count: pages },
      idempotencyKey: buildIdempotencyKey("conversion_started", created.id),
    });

    return {
      ok: true,
      jobId: created.id,
      pagesRemaining: decision.remaining,
      maxFileSize: state.entitlements.maxFileSize,
      batchEnabled: state.entitlements.batchEnabled,
    };
  });

const completeInput = z.object({
  jobId: z.string().uuid(),
  pageCount: z.number().int().min(0).max(5000),
  outputMimeType: z.string().trim().max(120),
});

export const completeConversion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => completeInput.parse(data))
  .handler(async ({ context, data }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    // The tool slug comes back from the update so the event can be attributed
    // to a product without a second query.
    const { data: job, error } = await db
      .from("conversion_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        page_count: data.pageCount,
        output_mime_type: data.outputMimeType,
      })
      .eq("id", data.jobId)
      // Ownership check: a job id from another account matches nothing.
      .eq("user_id", context.userId)
      .select("tool_type")
      .maybeSingle();

    if (error) throw new Error(error.message);

    // The job is committed and a downloadable result exists, so this is a
    // genuinely successful conversion.
    const { recordEventDetached } = await import("@/lib/analytics/analytics.server");
    const { buildIdempotencyKey } = await import("@/lib/analytics/events");
    recordEventDetached({
      type: "conversion_completed",
      userId: context.userId,
      tool: job?.tool_type ?? null,
      metadata: { page_count: data.pageCount },
      idempotencyKey: buildIdempotencyKey("conversion_completed", data.jobId),
    });

    // A trial that has just reached its allowance. Emitted here rather than on
    // every gate read so a refresh, or opening another product, cannot repeat
    // it — and the key is the user, so it can only ever exist once per account.
    await recordTrialExhaustedIfReached(context.userId);

    return { ok: true as const };
  });

/**
 * Records trial_exhausted the first time real usage reaches the allowance.
 *
 * The idempotency key is the user id alone, so the unique index guarantees one
 * row per account no matter how many products or tabs observe the transition.
 */
async function recordTrialExhaustedIfReached(userId: string): Promise<void> {
  try {
    const { trialStatus } = await import("@/lib/billing/entitlements.server");
    const status = await trialStatus(userId);
    if (!status.claimed || !status.exhausted) return;

    const { recordEventDetached } = await import("@/lib/analytics/analytics.server");
    const { buildIdempotencyKey } = await import("@/lib/analytics/events");
    recordEventDetached({
      type: "trial_exhausted",
      userId,
      metadata: { page_count: status.used },
      idempotencyKey: buildIdempotencyKey("trial_exhausted", userId),
    });
  } catch (error) {
    console.error("[analytics] trial_exhausted check failed", (error as Error).name);
  }
}

const failInput = z.object({
  jobId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(8).max(120),
  errorCode: z.string().trim().max(40),
});

export const failConversion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => failInput.parse(data))
  .handler(async ({ context, data }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { releaseQuota } = await import("@/lib/billing/entitlements.server");

    const { data: job } = await db
      .from("conversion_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_code: data.errorCode,
        // Only the code is stored. A provider message could echo document text.
        error_message: null,
      })
      .eq("id", data.jobId)
      .eq("user_id", context.userId)
      .select("tool_type")
      .maybeSingle();

    await releaseQuota(context.userId, data.idempotencyKey);

    // Recorded only after the reservation is released, so the event and the
    // quota can never disagree. A user-initiated abort is a distinct outcome
    // from a genuine failure and is counted separately.
    const cancelled = data.errorCode === "cancelled";
    const { recordEventDetached } = await import("@/lib/analytics/analytics.server");
    const { buildIdempotencyKey } = await import("@/lib/analytics/events");
    recordEventDetached({
      type: cancelled ? "conversion_cancelled" : "conversion_failed",
      userId: context.userId,
      tool: job?.tool_type ?? null,
      // The machine-readable code only — never OCR text or a filename.
      metadata: { error_code: data.errorCode },
      idempotencyKey: buildIdempotencyKey(
        cancelled ? "conversion_cancelled" : "conversion_failed",
        data.jobId,
      ),
    });

    return { ok: true as const };
  });

export const listMyConversions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();
    const { data } = await db
      .from("conversion_jobs")
      .select(
        "id, tool_type, original_filename, status, page_count, error_code, created_at, expires_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as {
      id: string;
      tool_type: string;
      original_filename: string;
      status: string;
      page_count: number;
      error_code: string | null;
      created_at: string;
      expires_at: string;
    }[];
  });

/**
 * Retention sweep: removes stored files and marks their jobs expired.
 *
 * Safe to run repeatedly — already-expired jobs are skipped — so it can be
 * wired to a scheduled trigger without extra bookkeeping.
 */
export const purgeExpiredConversions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { serverDb } = await import("@/lib/db.server");
    const db = await serverDb();

    const { data: isAdmin } = await db.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "forbidden" as const };

    const { data: due } = await db
      .from("conversion_jobs")
      .select("id, input_storage_path, output_storage_path")
      .lt("expires_at", new Date().toISOString())
      .in("status", ["completed", "failed"])
      .limit(500);

    const paths = (
      (due ?? []) as { input_storage_path: string | null; output_storage_path: string | null }[]
    )
      .flatMap((job) => [job.input_storage_path, job.output_storage_path])
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) await db.storage.from("conversions").remove(paths);

    const ids = ((due ?? []) as { id: string }[]).map((job) => job.id);
    if (ids.length > 0) {
      await db
        .from("conversion_jobs")
        .update({ status: "expired", input_storage_path: null, output_storage_path: null })
        .in("id", ids);
    }

    return { ok: true as const, purged: ids.length };
  });

async function retentionHoursSetting(): Promise<number> {
  const { getSetting } = await import("@/lib/billing/entitlements.server");
  const value = await getSetting<number>("retention.output_hours", 24);
  return Number.isFinite(value) && value > 0 ? value : 24;
}

/** Stable idempotency key for one conversion attempt. */
export function newIdempotencyKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `conv_${random}`;
}
