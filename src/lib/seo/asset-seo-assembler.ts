/**
 * V159 — Inject AI citation blocks early in SEO markdown bodies.
 */

import {
  buildAiCitationBundleFromZhKeyword,
  renderAiCitationMarkdownBlock,
  type ZhKeywordLike
} from "./asset-seo-ai-citation-format";

export { buildMarkdownPreviewForAiCitationScore } from "./asset-seo-ai-citation-format";

/**
 * Insert citation markdown immediately after the first H1 (`# ...`), or at document start.
 */
export function injectAiCitationBlockEarly(markdown: string, citationBlockMd: string): string {
  const block = citationBlockMd.trim();
  if (!block) return markdown;
  const lines = markdown.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s+/.test(lines[i])) {
      insertAt = i + 1;
      break;
    }
  }
  while (insertAt < lines.length && lines[insertAt].trim() === "") {
    insertAt++;
  }
  const out = [...lines.slice(0, insertAt), "", block, "", ...lines.slice(insertAt)];
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Full assemble: build bundle from keyword row + merge with base page markdown.
 */
export function assembleAssetSeoMarkdownPage(input: {
  baseMarkdown: string;
  zhRow?: ZhKeywordLike | null;
}): string {
  const bundle = input.zhRow ? buildAiCitationBundleFromZhKeyword(input.zhRow) : null;
  if (!bundle) return input.baseMarkdown;
  const block = renderAiCitationMarkdownBlock(bundle);
  return injectAiCitationBlockEarly(input.baseMarkdown, block);
}
