/**
 * Supabase auth errors → localized message keys.
 *
 * Nothing from `error.message` is ever rendered. Supabase returns English
 * prose written for developers ("Password is known to be weak and easy to
 * guess"), which reaches a French or Arabic user untranslated and, worse,
 * sometimes tells an attacker whether an address exists. Every failure is
 * mapped to a key here, and anything unrecognised falls back to the generic
 * message with the raw text logged for us instead of shown to the user.
 */

import type { MessageKey } from "@/i18n";

export type SupabaseAuthError = {
  message?: string | undefined;
  status?: number | undefined;
  code?: string | undefined;
};

/**
 * Maps an error from any auth call. `context` only changes the wording for
 * cases where sign-up and sign-in should say different things.
 */
export function authErrorKey(
  error: SupabaseAuthError | null | undefined,
  context: "signup" | "login" | "recovery" | "update" = "login",
): MessageKey {
  if (!error) return "auth.genericError";

  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  // Supabase's leaked-password protection. This is a common real-world reason
  // a sign-up is refused, so it gets its own actionable message.
  if (code === "weak_password" || message.includes("password is known to be weak")) {
    return message.includes("pwned") || message.includes("known to be weak")
      ? "auth.passwordLeaked"
      : "valid.passwordWeak";
  }
  if (code === "weak_password") return "valid.passwordWeak";

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "auth.emailNotConfirmed";
  }

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "auth.invalidCredentials";
  }

  if (code === "over_email_send_rate_limit" || message.includes("only request this after")) {
    return "auth.emailRateLimited";
  }

  if (code === "over_request_rate_limit" || error.status === 429) {
    return "auth.rateLimited";
  }

  if (code === "signup_disabled" || message.includes("signups not allowed")) {
    return "auth.signupDisabled";
  }

  if (
    code === "otp_expired" ||
    code === "session_expired" ||
    message.includes("expired") ||
    message.includes("invalid or has expired")
  ) {
    return "auth.linkExpired";
  }

  if (code === "same_password" || message.includes("should be different from the old password")) {
    return "auth.samePassword";
  }

  if (code === "validation_failed" || error.status === 400) {
    return context === "signup" ? "auth.signupRejected" : "auth.genericError";
  }

  // Network failures surface as a TypeError with no status.
  if (error.status === undefined && message.includes("fetch")) return "auth.networkError";

  return "auth.genericError";
}

/**
 * Logs the underlying failure for us without putting it in front of the user.
 * Only the code and status are recorded — never the message, which can echo a
 * submitted address.
 */
export function logAuthError(where: string, error: SupabaseAuthError | null | undefined): void {
  if (!error) return;
  console.error(`[auth] ${where} failed`, {
    code: error.code ?? null,
    status: error.status ?? null,
  });
}

/**
 * Supabase deliberately answers a sign-up for an existing address with a
 * success-shaped body carrying an empty `identities` array, so the form cannot
 * be used to discover which addresses have accounts. Detecting it lets us keep
 * the response neutral rather than accidentally confirming the address exists.
 */
export function isObfuscatedExistingUser(user: { identities?: unknown[] } | null): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}
