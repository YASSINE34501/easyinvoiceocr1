/**
 * Ties a browser conversion to its server-side job record.
 *
 * The order is deliberate: the server authorises and reserves quota *before*
 * any work starts, and the job is closed out afterwards. A failure releases the
 * reservation, so a user is never charged pages for a conversion that did not
 * produce a file. Retrying reuses the same idempotency key, so the retry is
 * free rather than double-charged.
 */

import { useCallback, useRef } from "react";
import {
  completeConversion,
  failConversion,
  newIdempotencyKey,
  startConversion,
} from "@/lib/convert/conversions.functions";
import { useBilling } from "@/billing/BillingProvider";
import type { QuotaTool } from "@/lib/convert/validation";
import type { ErrorCode } from "@/lib/convert/types";

export type BeginResult =
  { ok: true; jobId: string; pagesRemaining: number } | { ok: false; error: ErrorCode };

export function useConversionJob(tool: QuotaTool) {
  const { refresh } = useBilling();
  const jobIdRef = useRef<string | null>(null);
  const keyRef = useRef<string | null>(null);

  const begin = useCallback(
    async (input: {
      originalFilename: string;
      inputMimeType: string;
      inputSize: number;
      pageCount: number;
    }): Promise<BeginResult> => {
      // The key survives retries of the same attempt but not a new file.
      if (!keyRef.current) keyRef.current = newIdempotencyKey();

      try {
        const result = await startConversion({
          data: { ...input, tool, idempotencyKey: keyRef.current },
        });
        if (!result.ok) return { ok: false, error: result.error };
        jobIdRef.current = result.jobId;
        return { ok: true, jobId: result.jobId, pagesRemaining: result.pagesRemaining };
      } catch (error) {
        console.error("[conversion] could not open a job", (error as Error).name);
        return { ok: false, error: "unauthorized" };
      }
    },
    [tool],
  );

  const complete = useCallback(
    async (pageCount: number, outputMimeType: string) => {
      const jobId = jobIdRef.current;
      if (!jobId) return;
      try {
        await completeConversion({ data: { jobId, pageCount, outputMimeType } });
      } catch (error) {
        console.error("[conversion] could not close the job", (error as Error).name);
      }
      await refresh();
    },
    [refresh],
  );

  const fail = useCallback(
    async (errorCode: ErrorCode) => {
      const jobId = jobIdRef.current;
      const key = keyRef.current;
      if (!jobId || !key) return;
      try {
        await failConversion({ data: { jobId, idempotencyKey: key, errorCode } });
      } catch (error) {
        console.error("[conversion] could not record the failure", (error as Error).name);
      }
      await refresh();
    },
    [refresh],
  );

  /** Called when the user picks a different file: the next attempt is new work. */
  const resetAttempt = useCallback(() => {
    jobIdRef.current = null;
    keyRef.current = null;
  }, []);

  return { begin, complete, fail, resetAttempt };
}
