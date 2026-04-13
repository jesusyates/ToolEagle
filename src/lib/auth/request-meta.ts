import type { NextRequest } from "next/server";

export function getRequestIp(request: NextRequest | Request): string {
  const h =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  if (h) {
    const first = h.split(",")[0]?.trim();
    if (first) return first.slice(0, 128);
  }
  return "unknown";
}

export function getUserAgent(request: NextRequest | Request): string | null {
  const ua = request.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}
