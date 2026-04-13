import type { AuthAction, AuthErrorCode } from "./auth-types";

/** Stable string values for `AuthErrorCode` (use with `mapAuthErrorToUserMessage`). */
export const AUTH_ERROR_CODES: { readonly [K in AuthErrorCode]: K } = {
  invalid_email: "invalid_email",
  invalid_credentials: "invalid_credentials",
  rate_limit: "rate_limit",
  captcha_failed: "captcha_failed",
  invalid_code: "invalid_code",
  invalid_otp: "invalid_otp",
  unverified_email: "unverified_email",
  email_already_registered: "email_already_registered",
  generic: "generic",
  request_failed: "request_failed"
} as const;

/** All supported audit / rate-limit action keys. */
export const AUTH_ACTIONS: readonly AuthAction[] = [
  "signup_attempt",
  "signup_verify",
  "login_attempt",
  "reset_request",
  "reset_confirm",
  "login_otp_send",
  "login_otp_verify"
] as const;

/** Email / magic-link style OTP digit rules (Supabase email OTP is typically 6–8 digits). */
export const OTP_RULES = {
  MIN_DIGITS: 6,
  MAX_DIGITS: 8
} as const;
