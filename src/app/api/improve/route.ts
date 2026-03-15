import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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
    const { text, action } = body as { text: string; action: ImproveAction };

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

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      const plan = profile?.plan ?? "free";
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
              error: "You've reached today's free limit. Upgrade to Pro for unlimited AI generation.",
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

    const instruction = IMPROVE_ACTIONS[action];
    const prompt = `Original text:\n${text}\n\nInstruction: ${instruction}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
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
    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Improve API error:", error);
    return NextResponse.json({ error: "Improvement failed" }, { status: 500 });
  }
}
