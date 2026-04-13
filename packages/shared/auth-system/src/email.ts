/** Canonical auth email: trim, lowercase, basic RFC5322-ish local@domain check. */

export function normalizeAuthEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

export function isValidAuthEmailFormat(email: string): boolean {
  return normalizeAuthEmail(email) !== null;
}

/** Policy alias — same as `isValidAuthEmailFormat`. */
export function isEmailFormatValid(email: string): boolean {
  return isValidAuthEmailFormat(email);
}
