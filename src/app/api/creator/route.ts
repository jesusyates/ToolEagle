import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const PROMPT_TEMPLATE = `You are a social media creator assistant.
Topic: {topic}
Platform: {platform}
Tone: {tone}

Generate the following. Return ONLY valid JSON with these exact keys. No markdown, no extra text.
- hook: 1 viral hook (string)
- caption: 1 caption (string)
- hashtags: 10 hashtags as array of strings
- videoIdea: 1 video idea (string)

Example format:
{"hook":"...","caption":"...","hashtags":["#a","#b",...],"videoIdea":"..."}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, platform, tone } = body as {
      topic?: string;
      platform?: string;
      tone?: string;
    };

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

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
        if (exp == null || exp === "" || new Date(exp).getTime() > Date.now()) plan = "pro";
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
              error: "You've reached today's free limit. Buy credits to continue AI generation.",
              limitReached: true
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
    }

    const prompt = PROMPT_TEMPLATE.replace("{topic}", topic.trim())
      .replace("{platform}", platform || "TikTok")
      .replace("{tone}", tone || "casual");

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
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
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    let parsed: { hook?: string; caption?: string; hashtags?: string[]; videoIdea?: string };
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    return NextResponse.json({
      hook: parsed.hook ?? "",
      caption: parsed.caption ?? "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      videoIdea: parsed.videoIdea ?? ""
    });
  } catch (error) {
    console.error("Creator API error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
