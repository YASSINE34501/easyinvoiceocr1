/* eslint-disable @typescript-eslint/no-explicit-any --
 * The generated Supabase Database type is produced from the schema that existed
 * before the billing and conversion tables were added, so the query builder
 * cannot be typed against them yet. Rather than scatter casts through every
 * server module, the gap is bridged once, here. Callers annotate their own row
 * shapes, so no `any` escapes past this boundary.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DbResult<T> = { data: T | null; error: { message: string; code?: string } | null };

export type ServerDb = {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<DbResult<any>>;
  storage: SupabaseClient["storage"];
  auth: SupabaseClient["auth"];
};

/**
 * Service-role client for trusted server code.
 *
 * Built here rather than reusing the generated `supabaseAdmin`, because that
 * client installs a fetch wrapper which strips the `Authorization` header for
 * `sb_secret_`/`sb_publishable_` keys. PostgREST resolves the request role from
 * that header: without it a request falls back to `anon`, and every
 * `SECURITY DEFINER` function this app depends on — consume_quota,
 * release_quota, has_role, claim_trial, trial_status — is correctly revoked
 * from `anon` and fails with 42501 "permission denied for function".
 *
 * Table reads happen to still work on the apikey header alone, which is why the
 * fault only surfaces on RPC. Verified directly against the project: apikey
 * alone returns 42501, apikey + Bearer returns the value.
 */
function createAdminClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    const missing = [
      ...(url ? [] : ["SUPABASE_URL"]),
      ...(serviceRoleKey ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}.`);
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Both headers, always. supabase-js sets these itself; they are restated
      // so a future change to the generated client cannot remove them.
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  });
}

let cached: SupabaseClient | undefined;

export async function serverDb(): Promise<ServerDb> {
  if (!cached) cached = createAdminClient();
  return cached as unknown as ServerDb;
}
