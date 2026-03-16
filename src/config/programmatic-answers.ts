/**
 * Programmatic AnswerTemplate from AnswerQuestion
 * Used for v38 expansion when no full template exists
 */

import type { AnswerTemplate } from "./answers-templates";
import type { AnswerQuestion } from "./answer-questions";
import { toolName } from "./answer-questions-expansion";

const SHORT_ANSWER_TEMPLATES: Record<string, string> = {
  hashtag: "Use 3–5 niche hashtags for TikTok and 5–15 for Instagram. Mix niche-specific and moderate-volume tags. Avoid banned or overused hashtags. Test and track which combinations drive the most reach.",
  "best-time": "Post when your audience is most active. Use analytics to find your peak times. Generally, evenings and weekends perform well. Test different times and double down on what works.",
  viral: "Create curiosity in the first 3 seconds. Use trending sounds and formats. Add a clear hook and CTA. Engage with comments early. Consistency and testing matter more than any single trick.",
  "caption-length": "TikTok: under 150 characters for feed visibility. Instagram: 125–150 chars for first line, longer is fine for full caption. Hook first, details after.",
  "hook-strategy": "Open with a question, bold claim, or POV. Create curiosity or emotion. No slow intros—viewers decide in 3 seconds. Test different hook types and track retention.",
  algorithm: "The algorithm rewards watch time, completion rate, saves, shares, and comments. Hook early, deliver value, and encourage engagement. Consistency builds momentum."
};

function inferShortAnswer(q: AnswerQuestion): string {
  const slug = q.slug.toLowerCase();
  const question = q.question.toLowerCase();
  if (slug.includes("hashtag") || question.includes("hashtag")) return SHORT_ANSWER_TEMPLATES.hashtag;
  if (slug.includes("best-time") || slug.includes("time-to-post") || question.includes("best time")) return SHORT_ANSWER_TEMPLATES["best-time"];
  if (slug.includes("viral") || question.includes("viral")) return SHORT_ANSWER_TEMPLATES.viral;
  if (slug.includes("length") || question.includes("length") || question.includes("long")) return SHORT_ANSWER_TEMPLATES["caption-length"];
  if (slug.includes("hook") || question.includes("hook")) return SHORT_ANSWER_TEMPLATES["hook-strategy"];
  if (slug.includes("algorithm") || question.includes("algorithm")) return SHORT_ANSWER_TEMPLATES.algorithm;
  return `Get the best results by using our ${toolName(q.tool)}. Focus on a strong hook, clear value, and engagement prompts. Test different approaches and track what works for your audience.`;
}

export function answerQuestionToTemplate(q: AnswerQuestion): AnswerTemplate {
  const shortAnswer = inferShortAnswer(q);
  const tldr = shortAnswer.slice(0, 80) + (shortAnswer.length > 80 ? "…" : "");
  return {
    slug: q.slug,
    question: q.question,
    shortAnswer,
    tldr,
    examples: [
      "Example 1: Use a hook that creates curiosity",
      "Example 2: Add a clear CTA to boost engagement",
      "Example 3: Match your tone to your audience"
    ],
    tips: [
      "Focus on the first 3 seconds—that's when viewers decide to stay or scroll",
      "Use analytics to see what works for your specific audience",
      "Test one variable at a time to learn what drives results",
      "Consistency matters more than perfection"
    ],
    quickTips: ["Hook first", "Add CTA", "Test and iterate"],
    commonMistakes: [
      "Generic openers that don't create curiosity",
      "Skipping the call-to-action",
      "Not tracking what actually works"
    ],
    faq: [
      { question: "What tool can help with this?", answer: `Try our ${toolName(q.tool)} for AI-generated options.` },
      { question: "How do I know if it's working?", answer: "Track engagement rate, watch time, and saves. Compare before and after." }
    ],
    toolSlug: q.tool,
    toolName: toolName(q.tool),
    platform: q.platform
  };
}
