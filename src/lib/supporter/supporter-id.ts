/**
 * V100.1 — Anonymous supporter identity (cookie + optional sync from client).
 */

import type { NextResponse } from "next/server";
export const TE_SUPPORTER_ID_COOKIE = "te_supporter_id";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

export function isValidSupporterId(raw: string | undefined): raw is string {
  if (!raw || raw.length < 32 || raw.length > 48) return false;
  return /^[0-9a-f-]{36}$/i.test(raw);
}

export function readSupporterIdFromCookieStore(
  cookies: { get(name: string): { value: string } | undefined }
): string | null {
  const v = cookies.get(TE_SUPPORTER_ID_COOKIE)?.value;
  return isValidSupporterId(v) ? v : null;
}

/** Set persistent supporter cookie (httpOnly). */
export function applySupporterIdCookie(response: NextResponse, id: string): void {
  response.cookies.set(TE_SUPPORTER_ID_COOKIE, id, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true
  });
}

export function newSupporterId(): string {
  return crypto.randomUUID();
}
