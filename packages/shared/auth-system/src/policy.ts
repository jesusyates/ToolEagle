/** Signup / login policy helpers (no I/O, no framework). */

import type { PasswordPolicyResult } from "./auth-types";
import { OTP_RULES } from "./auth-constants";

export const MIN_SIGNUP_PASSWORD_LENGTH = 8;

export function meetsSignupPasswordPolicy(password: string): boolean {
  return typeof password === "string" && password.length >= MIN_SIGNUP_PASSWORD_LENGTH;
}

/** Detailed password check for forms / APIs. */
export function evaluateSignupPassword(password: string): PasswordPolicyResult {
  const minLengthMet = typeof password === "string" && password.length >= MIN_SIGNUP_PASSWORD_LENGTH;
  return { ok: minLengthMet, minLengthMet };
}

/** Digits-only OTP / email code, capped length (default `OTP_RULES.MAX_DIGITS`). */
export function normalizeOtpDigits(input: unknown, maxDigits: number = OTP_RULES.MAX_DIGITS): string {
  if (typeof input !== "string") return "";
  return input.replace(/\D/g, "").slice(0, maxDigits);
}

/** Same as `normalizeOtpDigits` (email OTP naming). */
export function normalizeEmailOtpDigits(input: unknown, maxDigits: number = OTP_RULES.MAX_DIGITS): string {
  return normalizeOtpDigits(input, maxDigits);
}

/** True when string is digits-only and length is within OTP rules. */
export function isOtpValidFormat(digits: string): boolean {
  if (typeof digits !== "string") return false;
  const n = digits.length;
  return (
    n >= OTP_RULES.MIN_DIGITS &&
    n <= OTP_RULES.MAX_DIGITS &&
    /^\d+$/.test(digits)
  );
}

/** Supabase Auth: unconfirmed email on password sign-in. */
export function isSupabaseEmailNotConfirmedError(err: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  return code === "email_not_confirmed" || msg.includes("not confirmed");
}
