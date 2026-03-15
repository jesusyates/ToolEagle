import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert at improving AI prompts. Given a user's rough prompt in any language, output:
1. An optimized prompt in English (structured, clear, with role, task, context, format)
2. A "Why this prompt works" explanation covering: Role, Task, Goal, Audience, Format

Output format (strict JSON):
{
  "optimizedPrompt": "string - the improved prompt",
  "whyItWorks": "string - 2-3 sentences explaining why this prompt structure works"
}

If the user input is vague, infer reasonable defaults (e.g. TikTok, general audience, motivational tone).
Keep the optimized prompt concise but complete.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
  }

  const body = await req.json();
  const input = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!input) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", res.status, err);
      return NextResponse.json({ error: "Failed to improve prompt" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed?.optimizedPrompt) {
      return NextResponse.json({
        optimizedPrompt: text,
        whyItWorks: "This prompt structure helps the AI understand your role, task, and expected output format."
      });
    }

    return NextResponse.json({
      optimizedPrompt: parsed.optimizedPrompt,
      whyItWorks: parsed.whyItWorks || "Structured prompts get better results."
    });
  } catch (err) {
    console.error("improve-prompt error:", err);
    return NextResponse.json({ error: "Failed to improve prompt" }, { status: 500 });
  }
}
