import type { AuthErrorCode } from "./auth-types";
import { AUTH_MSG } from "./messages";

/** Map normalized error code to user-facing copy (`AUTH_MSG`). */
export function mapAuthErrorToUserMessage(code: AuthErrorCode): string {
  switch (code) {
    case "invalid_email":
      return AUTH_MSG.INVALID_EMAIL;
    case "invalid_credentials":
      return AUTH_MSG.INVALID_CREDENTIALS;
    case "rate_limit":
      return AUTH_MSG.RATE_LIMIT;
    case "captcha_failed":
      return AUTH_MSG.CAPTCHA;
    case "invalid_code":
      return AUTH_MSG.INVALID_CODE;
    case "invalid_otp":
      return AUTH_MSG.INVALID_CODE;
    case "unverified_email":
      return "Your email is not verified yet. Use a verification code.";
    case "email_already_registered":
      return AUTH_MSG.SIGNUP_EMAIL_ALREADY_REGISTERED;
    case "request_failed":
      return AUTH_MSG.REQUEST_FAILED;
    case "generic":
    default:
      return AUTH_MSG.GENERIC;
  }
}

type SupabaseLike = { message?: string; code?: string };

/** Best-effort normalize unknown errors (e.g. Supabase Auth) to `{ code, message }`. */
export function normalizeAuthError(err: unknown): { code: AuthErrorCode; message: string } {
  if (err && typeof err === "object") {
    const o = err as SupabaseLike;
    const msg = (o.message ?? "").toLowerCase();
    const code = (o.code ?? "").toLowerCase();

    if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
      return { code: "unverified_email", message: mapAuthErrorToUserMessage("unverified_email") };
    }
    if (code === "user_already_registered" || msg.includes("already registered")) {
      return { code: "email_already_registered", message: mapAuthErrorToUserMessage("email_already_registered") };
    }
    if (code === "invalid_credentials" || msg.includes("invalid login")) {
      return { code: "invalid_credentials", message: mapAuthErrorToUserMessage("invalid_credentials") };
    }
    if (o.message && typeof o.message === "string") {
      return { code: "generic", message: o.message };
    }
  }
  return { code: "generic", message: AUTH_MSG.GENERIC };
}
