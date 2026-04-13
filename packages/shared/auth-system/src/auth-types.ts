/**
 * Policy-layer types only (no React, no I/O).
 * Distinct from gate `AuthStatus` / `ResolvedAuthFromGate` in `state-machine.ts`.
 */

/** Serializable high-level auth classification for APIs and tooling. */
export type AuthState = "signed_out" | "signed_in" | "blocked";

/** Normalized error taxonomy for mapping to `AUTH_MSG`. */
export type AuthErrorCode =
  | "invalid_email"
  | "invalid_credentials"
  | "rate_limit"
  | "captcha_failed"
  | "invalid_code"
  | "invalid_otp"
  | "unverified_email"
  | "email_already_registered"
  | "generic"
  | "request_failed";

/** Audit / rate-limit action keys (shared with server logging). */
export type AuthAction =
  | "signup_attempt"
  | "signup_verify"
  | "login_attempt"
  | "reset_request"
  | "reset_confirm"
  | "login_otp_send"
  | "login_otp_verify";

/** Common JSON body shapes for OTP routes (partial). */
export type OTPPayload = {
  email?: string;
  token?: string;
  password?: string;
  next?: string;
  turnstileToken?: string;
};

/** Result of evaluating password against signup policy. */
export type PasswordPolicyResult = {
  ok: boolean;
  minLengthMet: boolean;
};
