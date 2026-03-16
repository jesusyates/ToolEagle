/**
 * AI Answer Engine - /answers
 * Question → Short Answer → Examples → Tips → Quick Tips → Common Mistakes → Generate CTA
 * v38: Merge full templates + programmatic from answer-questions (500 pages)
 */

import { ALL_ANSWER_TEMPLATES, type AnswerTemplate } from "./answers-templates";
import { answerQuestions } from "./answer-questions";
import { answerQuestionToTemplate } from "./programmatic-answers";

export type AnswerPage = AnswerTemplate;

const templateSlugs = new Set(ALL_ANSWER_TEMPLATES.map((a) => a.slug));

const PROGRAMMATIC_PAGES: AnswerTemplate[] = answerQuestions
  .filter((q) => !templateSlugs.has(q.slug))
  .map((q) => answerQuestionToTemplate(q));

export const ANSWER_PAGES: AnswerPage[] = [...ALL_ANSWER_TEMPLATES, ...PROGRAMMATIC_PAGES];

export function getAnswerPage(slug: string): AnswerPage | undefined {
  return ANSWER_PAGES.find((a) => a.slug === slug);
}

export function getAllAnswerSlugs(): string[] {
  return ANSWER_PAGES.map((a) => a.slug);
}

/** Get answers by platform for index grouping */
export function getAnswersByPlatform(): {
  tiktok: AnswerPage[];
  youtube: AnswerPage[];
  instagram: AnswerPage[];
} {
  const tiktok = ANSWER_PAGES.filter((a) => a.platform === "tiktok");
  const youtube = ANSWER_PAGES.filter((a) => a.platform === "youtube");
  const instagram = ANSWER_PAGES.filter((a) => a.platform === "instagram");
  return { tiktok, youtube, instagram };
}
