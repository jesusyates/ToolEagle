import { NextRequest, NextResponse } from "next/server";
import { sharedContentSafetyPrompt } from "@/lib/ai/prompts/shared/content-safety-prompt";
import { applyContentSafetyToPlainText } from "@/lib/content-safety/filter";
import { resolveSafetyMarket } from "@/lib/content-safety/resolve-market";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { ANON_AI_COOKIE, applyAnonAiCookie, parseAnonAiCookie } from "@/lib/anon-ai-cookie";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { isAnonymousProEntitlement } from "@/lib/payment/anon-pro-entitlement";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const LIMIT_MESSAGE =
  "You've reached today's free limit. Buy credits to continue AI generation.";

const IMPROVE_ACTIONS = {
  shorter: "Make it shorter. Keep the same meaning and tone. Return only the improved text, nothing else.",
  funnier: "Make it funnier and more engaging. Return only the improved text, nothing else.",
  viral: "Make it more viral and attention-grabbing for social media. Return only the improved text, nothing else.",
  emojis: "Add relevant emojis to make it more engaging. Return only the improved text with emojis, nothing else."
} as const;

export type ImproveAction = keyof typeof IMPROVE_ACTIONS;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, action, locale: bodyLocale, market: bodyMarket } = body as {
      text: string;
      action: ImproveAction;
      locale?: string;
      market?: string;
    };

    if (!text || typeof text !== "string" || !action || !(action in IMPROVE_ACTIONS)) {
      return NextResponse.json({ error: "Missing text or invalid action" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const anonCount = parseAnonAiCookie(request.cookies.get(ANON_AI_COOKIE)?.value);
    const anonSupporterId = readSupporterIdFromCookieStore(request.cookies);
    const anonProEntitled = user ? false : await isAnonymousProEntitlement(anonSupporterId);

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, plan_expire_at")
        .eq("id", user.id)
        .single();

      let plan: "free" | "pro" = "free";
      if (profile?.plan === "pro") {
        const exp = profile.plan_expire_at as string | null | undefined;
        if (exp == null || exp === "" || new Date(exp).getTime() > Date.now()) {
          plan = "pro";
        }
      }

      if (plan === "free") {
        const { data: usage } = await supabase
          .from("usage_stats")
          .select("generations_count")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();

        const used = usage?.generations_count ?? 0;
        if (used >= FREE_DAILY_LIMIT) {
          return NextResponse.json(
            {
              error: LIMIT_MESSAGE,
              limitReached: true,
              used,
              limit: FREE_DAILY_LIMIT
            },
            { status: 429 }
          );
        }
      }

      if (plan === "free") {
        const { data: existing } = await supabase
          .from("usage_stats")
          .select("id, generations_count")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();

        if (existing) {
          await supabase
            .from("usage_stats")
            .update({ generations_count: existing.generations_count + 1 })
            .eq("id", existing.id);
        } else {
          await supabase.from("usage_stats").insert({
            user_id: user.id,
            date: today,
            generations_count: 1
          });
        }
      }
    } else {
      const sid = readSupporterIdFromCookieStore(request.cookies);
      const anonPro = await isAnonymousProEntitlement(sid);
      if (!anonPro && anonCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: LIMIT_MESSAGE,
            limitReached: true,
            used: anonCount,
            limit: FREE_DAILY_LIMIT
          },
          { status: 429 }
        );
      }
    }

    const instruction = IMPROVE_ACTIONS[action];
    const prompt = `Original text:\n${text}\n\nInstruction: ${instruction}`;
    const safetyMarket = resolveSafetyMarket(request, { locale: bodyLocale, market: bodyMarket });

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
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return NextResponse.json({ error: "AI improvement failed" }, { status: 502 });
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    const cse = applyContentSafetyToPlainText(result, safetyMarket);
    result = cse.text;
    try {
      console.info(
        "[cse_plain]",
        JSON.stringify({
          route: "/api/improve",
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

    const json = NextResponse.json({ result });

    if (!user && !anonProEntitled) {
      applyAnonAiCookie(json, anonCount + 1);
    }

    return json;
  } catch (error) {
    console.error("Improve API error:", error);
    return NextResponse.json({ error: "Improvement failed" }, { status: 500 });
  }
}
