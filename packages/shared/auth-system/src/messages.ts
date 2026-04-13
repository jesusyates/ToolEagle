/** Normalized client-facing auth messages (policy differs per route: signup may enumerate; reset may not). */

export const AUTH_MSG = {
  RATE_LIMIT: "Too many attempts. Please try again later.",
  CAPTCHA: "Verification failed. Refresh the page and try again.",
  GENERIC: "Something went wrong. Please try again.",
  INVALID_CODE: "Invalid or expired code.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  REQUEST_FAILED: "Request could not be completed.",
  /** Signup path only — explicit enumeration allowed here (not used on reset-password). */
  SIGNUP_EMAIL_ALREADY_REGISTERED: "This email is already registered. Please log in."
} as const;

export type AuthMessageCode = keyof typeof AUTH_MSG;
