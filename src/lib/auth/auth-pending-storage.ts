/** Short-lived client storage between OTP steps (signup / reset). Cleared after success. */

const SIGNUP_KEY = "te_auth_signup_pending_v1";
const RESET_KEY = "te_auth_reset_email_v1";

export type SignupPending = { email: string; password: string };

export function writeSignupPending(data: SignupPending): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(data));
}

export function readSignupPending(): SignupPending | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<SignupPending>;
    if (typeof j.email === "string" && typeof j.password === "string") {
      return { email: j.email, password: j.password };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSignupPending(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SIGNUP_KEY);
}

export function writeResetEmail(email: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(RESET_KEY, email.trim());
}

export function readResetEmail(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(RESET_KEY);
}

export function clearResetEmail(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(RESET_KEY);
}
