/**
 * V104.1 — Single source for CN vs global when choosing platform rule merge.
 * Provider-agnostic: same market resolution whether output came from OpenAI, DeepSeek, or future models.
 */

import type { NextRequest } from "next/server";
import { COOKIE_PREFERRED_MARKET } from "@/config/market";

export type SafetyMarket = "cn" | "global";

export function resolveSafetyMarket(
  request: NextRequest,
  body: { market?: string; locale?: string }
): SafetyMarket {
  if (body.market === "cn") return "cn";
  if (body.market === "global") return "global";
  const cookieMarket = request.cookies.get(COOKIE_PREFERRED_MARKET)?.value;
  if (cookieMarket === "cn") return "cn";
  if (body.locale === "zh") return "cn";
  return "global";
}
