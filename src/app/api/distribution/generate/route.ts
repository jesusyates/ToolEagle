import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const PROMPT = `You are a content distribution expert. Generate distribution content for a free AI creator tool (ToolEagle) targeting the keyword: "{keyword}"

Return a JSON object with exactly these keys (no extra keys):
{
  "reddit": {
    "title": "I made a free tool that [result] - max 300 chars",
    "body": "Problem paragraph. Struggle paragraph. Solution paragraph. Link to tool."
  },
  "x": {
    "tweet1": "Hook - max 280 chars",
    "tweet2": "Tip 1",
    "tweet3": "Tip 2",
    "tweet4": "Tip 3",
    "tweet5": "CTA with link - max 280 chars"
  },
  "quora": {
    "answer": "Long helpful step-by-step answer (3-5 paragraphs). Mention the free tool naturally. End with link."
  }
}

Tool URL: https://www.tooleagle.com/tools/tiktok-caption-generator (use this or /tools/hook-generator, /tools/youtube-title-generator as relevant)
Return ONLY valid JSON, no markdown.`;

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Missing keyword" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = PROMPT.replace(/\{keyword\}/g, keyword.trim());

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
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[distribution/generate] OpenAI error:", response.status, err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    let parsed: {
      reddit?: { title?: string; body?: string };
      x?: { tweet1?: string; tweet2?: string; tweet3?: string; tweet4?: string; tweet5?: string };
      quora?: { answer?: string };
    };
    try {
      const cleaned = content.replace(/```json?\s*/g, "").replace(/```\s*$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const reddit = parsed.reddit ?? {};
    const x = parsed.x ?? {};
    const quora = parsed.quora ?? {};

    return NextResponse.json({
      reddit: {
        title: String(reddit.title ?? "").slice(0, 300),
        body: String(reddit.body ?? "")
      },
      x: {
        tweet1: String(x.tweet1 ?? "").slice(0, 280),
        tweet2: String(x.tweet2 ?? "").slice(0, 280),
        tweet3: String(x.tweet3 ?? "").slice(0, 280),
        tweet4: String(x.tweet4 ?? "").slice(0, 280),
        tweet5: String(x.tweet5 ?? "").slice(0, 280)
      },
      quora: {
        answer: String(quora.answer ?? "")
      }
    });
  } catch (e) {
    console.error("[distribution/generate] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
