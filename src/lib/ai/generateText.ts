/**
 * Client-side AI text generation.
 * Calls the /api/generate route. Falls back to template if AI fails.
 */

export async function generateAIText(prompt: string): Promise<string[]> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "AI generation failed");
  }

  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error("Invalid AI response");
  }

  return data.results.slice(0, 5);
}
