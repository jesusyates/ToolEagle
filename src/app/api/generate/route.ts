/**
 * Transitional: Web primary simple generation uses shared-core POST /v1/ai/execute (Phase 3).
 * Route kept for rollback, direct API clients, and tests.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ANON_AI_COOKIE, applyAnonAiCookie, parseAnonAiCookie } from "@/lib/anon-ai-cookie";
import {
  checkSignedInFreeUsageWithSupporterBonus,
  getSupporterLimitContext
} from "@/lib/api/generation-usage";
import { sharedContentSafetyPrompt } from "@/lib/ai/prompts/shared/content-safety-prompt";
import { applyContentSafetyToStringArray } from "@/lib/content-safety/filter";
import { resolveSafetyMarket } from "@/lib/content-safety/resolve-market";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const RESULT_SEPARATOR = "\n---\n";
const LIMIT_MESSAGE =
  "You've reached today's free limit. Buy credits to continue AI generation.";

function parseAIResponse(text: string): string[] {
  const raw = text.trim();
  if (!raw) return [];

  const parts = raw.split(RESULT_SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 5);

  const fallback = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (fallback.length >= 3) return fallback.slice(0, 5);

  const lines = raw.split("\n").map((p) => p.trim()).filter((p) => p.length > 5);
  if (lines.length >= 3) return lines.slice(0, 5);

  return raw ? [raw] : [];
}

async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("usage_stats")
    .select("id, generations_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("usage_stats")
      .update({ generations_count: existing.generations_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_stats").insert({
      user_id: userId,
      date: today,
      generations_count: 1
    });
  }
}

const LOCALE_INSTRUCTIONS: Record<string, string> = {
  zh: "Output in Simplified Chinese. ",
  es: "Output in Spanish. ",
  pt: "Output in Portuguese. ",
  id: "Output in Indonesian. "
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, locale = "en", market: bodyMarket } = body as {
      prompt?: string;
      locale?: string;
      market?: string;
    };
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const loc = typeof locale === "string" ? locale : "en";
    const localePrefix = LOCALE_INSTRUCTIONS[loc] ?? "";
    const finalPrompt = localePrefix + prompt;
    const safetyMarket = resolveSafetyMarket(request, { locale: loc, market: bodyMarket });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const anonCount = parseAnonAiCookie(request.cookies.get(ANON_AI_COOKIE)?.value);
    const { effectiveFreeLimit } = await getSupporterLimitContext(request, user?.id ?? null);

    if (user) {
      const { allowed, used } = await checkSignedInFreeUsageWithSupporterBonus(
        user.id,
        effectiveFreeLimit
      );
      if (!allowed) {
        return NextResponse.json(
          { error: LIMIT_MESSAGE, limitReached: true, used, limit: effectiveFreeLimit },
          { status: 429 }
        );
      }
    } else {
      if (anonCount >= effectiveFreeLimit) {
        return NextResponse.json(
          {
            error: LIMIT_MESSAGE,
            limitReached: true,
            used: anonCount,
            limit: effectiveFreeLimit
          },
          { status: 429 }
        );
      }
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sharedContentSafetyPrompt() },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    let results = parseAIResponse(content);
    if (results.length < 3) {
      return NextResponse.json({ error: "Insufficient results" }, { status: 502 });
    }

    const cse = applyContentSafetyToStringArray(results, safetyMarket);
    results = cse.parts;
    try {
      console.info(
        "[cse_plain]",
        JSON.stringify({
          route: "/api/generate",
          market: safetyMarket,
          profile: cse.profile,
          content_safety_filtered_count: cse.filteredCount,
          content_safety_risk_detected: cse.riskDetected,
          ts: new Date().toISOString()
        })
      );
    } catch {
      /* ignore */
    }

    const json = NextResponse.json({ results });

    if (user) {
      await incrementUsage(user.id);
    } else {
      applyAnonAiCookie(json, anonCount + 1);
    }

    return json;
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
