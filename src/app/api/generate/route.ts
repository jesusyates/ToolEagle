import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const RESULT_SEPARATOR = "\n---\n";

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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
