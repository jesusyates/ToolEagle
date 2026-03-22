/**
 * V94: Daily AI usage for anonymous users (cookie-backed, soft limit).
 */

import type { NextResponse } from "next/server";

export const ANON_AI_COOKIE = "te_daily_ai";

export function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseAnonAiCookie(raw: string | undefined): number {
  if (!raw) return 0;
  const [d, n] = raw.split("|");
  if (d !== utcDateKey()) return 0;
  const c = parseInt(n, 10);
  return Number.isFinite(c) && c >= 0 ? c : 0;
}

export function formatAnonAiCookie(count: number): string {
  return `${utcDateKey()}|${count}`;
}

export function applyAnonAiCookie(response: NextResponse, newCount: number): void {
  response.cookies.set(ANON_AI_COOKIE, formatAnonAiCookie(newCount), {
    path: "/",
    maxAge: 60 * 60 * 50,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false
  });
}
