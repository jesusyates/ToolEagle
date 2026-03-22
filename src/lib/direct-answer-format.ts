/**
 * V78: Parse and structure direct answers for AI-dominant format.
 * Format: Opening summary + numbered list (2–4 points) + optional time/result expectation.
 */

export type StructuredAnswer = {
  summary: string;
  points: string[];
  expectation?: string;
};

/** Parse answer string into structured format. Handles "1. Point" patterns. */
export function parseStructuredAnswer(answer: string): StructuredAnswer | null {
  if (!answer?.trim()) return null;

  const trimmed = answer.trim();
  const lines = trimmed.split(/\n+/);

  const points: string[] = [];
  let summary = "";
  let expectation = "";
  let afterPoints = false;

  for (const line of lines) {
    const pointMatch = line.match(/^\s*(\d+)\.\s*(.+)$/);
    if (pointMatch) {
      points.push(pointMatch[2].trim());
      afterPoints = true;
    } else if (line.trim()) {
      if (points.length === 0) {
        summary = summary ? `${summary}\n${line.trim()}` : line.trim();
      } else if (afterPoints) {
        expectation = expectation ? `${expectation} ${line.trim()}` : line.trim();
      }
    }
  }

  if (points.length >= 2) {
    return {
      summary: summary || trimmed.split(/\n/)[0]?.trim() || "",
      points,
      expectation: expectation || undefined
    };
  }

  return null;
}

/** Check if answer already has structured format (numbered list). */
export function hasStructuredFormat(answer: string): boolean {
  return /^\s*\d+\.\s+.+/m.test(answer || "");
}
