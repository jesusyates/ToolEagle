/**
 * Client-side AI text improvement.
 * Calls the /api/improve route.
 */

export type ImproveAction = "shorter" | "funnier" | "viral" | "emojis";

export async function improveText(text: string, action: ImproveAction): Promise<string> {
  const res = await fetch("/api/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text, action })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429 && data.limitReached) {
      throw new Error(data.error ?? "Daily limit reached");
    }
    throw new Error(data.error ?? "Improvement failed");
  }

  if (!data.result || typeof data.result !== "string") {
    throw new Error("Invalid AI response");
  }

  return data.result;
}
