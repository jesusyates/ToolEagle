import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert at teaching people how to write better AI prompts. Given a user's prompt, provide:

1. **Feedback**: 2-3 sentences on what works and what could be improved (be constructive, not harsh)
2. **Optimization tips**: 2-4 specific suggestions to make the prompt clearer or more effective
3. **Better version**: A rewritten, optimized prompt that follows ROLE, TASK, CONTEXT, FORMAT

Output format (strict JSON):
{
  "feedback": "string - constructive feedback on the prompt",
  "tips": ["string", "string", ...],
  "betterVersion": "string - the improved prompt"
}

If the prompt is already good, acknowledge that and suggest minor refinements. Keep feedback educational and helpful.`;

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
        temperature: 0.6,
        max_tokens: 800
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", res.status, err);
      return NextResponse.json({ error: "Failed to analyze prompt" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed?.betterVersion) {
      return NextResponse.json({
        feedback: parsed?.feedback || "Your prompt could be improved with more context and structure.",
        tips: parsed?.tips || ["Add a clear role (e.g. Act as a copywriter)", "Specify the output format"],
        betterVersion: input
      });
    }

    return NextResponse.json({
      feedback: parsed.feedback || "",
      tips: Array.isArray(parsed.tips) ? parsed.tips : [parsed.tips].filter(Boolean),
      betterVersion: parsed.betterVersion
    });
  } catch (err) {
    console.error("playground-prompt error:", err);
    return NextResponse.json({ error: "Failed to analyze prompt" }, { status: 500 });
  }
}
