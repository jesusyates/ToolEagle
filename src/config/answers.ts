/**
 * AI Answer Engine - /answers
 * Question → Short Answer → Examples → Tips → Quick Tips → Common Mistakes → Generate CTA
 */

import { ALL_ANSWER_TEMPLATES, type AnswerTemplate } from "./answers-templates";

export type AnswerPage = AnswerTemplate;

export const ANSWER_PAGES: AnswerPage[] = ALL_ANSWER_TEMPLATES;

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
