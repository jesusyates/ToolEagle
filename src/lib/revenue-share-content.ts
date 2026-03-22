/**
 * V86: Generate share content for revenue/money pages
 */

import { BASE_URL } from "@/config/site";
import { getKeywordContent } from "@/lib/zh-keyword-content";

export function getShareContentForPage(slug: string, keyword: string): {
  title: string;
  oneLiner: string;
  pageUrl: string;
  reddit: string;
  xThread: string;
  quora: string;
} {
  const content = getKeywordContent(slug);
  const title = content?.h1 || content?.title || keyword || slug;
  const oneLiner = content?.directAnswer || content?.description || content?.intro?.slice(0, 120) || keyword;
  const pageUrl = `${BASE_URL}/zh/search/${slug}`;

  const redditBody = `分享一个我最近在用的方法：\n\n${oneLiner}\n\n完整指南：${pageUrl}`;
  const tweet1 = `🔥 ${title}`.slice(0, 280);
  const tweet2 = oneLiner.slice(0, 280);
  const tweet3 = `完整方法在这里 → ${pageUrl}`.slice(0, 280);
  const xThread = `${tweet1}\n\n---\n\n${tweet2}\n\n---\n\n${tweet3}`;
  const quoraAnswer = `根据我的实践，${oneLiner}\n\n详细步骤和案例可以看这个指南：${pageUrl}`;

  return {
    title,
    oneLiner,
    pageUrl,
    reddit: `${title}\n\n${redditBody}`,
    xThread,
    quora: quoraAnswer
  };
}
