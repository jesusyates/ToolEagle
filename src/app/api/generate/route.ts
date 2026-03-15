import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const RESULT_SEPARATOR = "\n---\n";
const LIMIT_MESSAGE =
  "You've reached today's free limit. Upgrade to Pro for unlimited AI generation.";

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

async function checkAndRecordUsage(userId: string): Promise<{ allowed: boolean; used: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert({ id: userId, plan: "free" });
  }

  const plan = profile?.plan ?? "free";
  if (plan === "pro") {
    return { allowed: true, used: 0 };
  }

  const { data: usage } = await supabase
    .from("usage_stats")
    .select("generations_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const used = usage?.generations_count ?? 0;
  if (used >= FREE_DAILY_LIMIT) {
    return { allowed: false, used };
  }

  return { allowed: true, used };
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

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
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
      const { allowed, used } = await checkAndRecordUsage(user.id);
      if (!allowed) {
        return NextResponse.json(
          { error: LIMIT_MESSAGE, limitReached: true, used, limit: FREE_DAILY_LIMIT },
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
          {
            role: "user",
            content: prompt
          }
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

    const results = parseAIResponse(content);
    if (results.length < 3) {
      return NextResponse.json({ error: "Insufficient results" }, { status: 502 });
    }

    if (user) {
      await incrementUsage(user.id);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
