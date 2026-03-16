/**
 * Answer Engine - Question data config (500 pages) v38
 * TikTok | YouTube | Instagram | Cross-platform
 * Types: how many hashtags, best time to post, how to go viral, caption length, hook strategies, algorithm tips
 */

import { getExpandedAnswerQuestions } from "./answer-questions-expansion";

export type AnswerQuestion = {
  slug: string;
  question: string;
  platform: "tiktok" | "youtube" | "instagram";
  tool: string;
  isPopular?: boolean;
};

const BASE_QUESTIONS: AnswerQuestion[] = [
  // TikTok (20)
  { slug: "how-to-write-tiktok-captions", question: "How to Write TikTok Captions That Get Engagement?", platform: "tiktok", tool: "tiktok-caption-generator", isPopular: true },
  { slug: "tiktok-caption-length", question: "What's the Best TikTok Caption Length?", platform: "tiktok", tool: "tiktok-caption-generator", isPopular: true },
  { slug: "tiktok-hook-ideas", question: "How to Write TikTok Hooks That Stop the Scroll?", platform: "tiktok", tool: "hook-generator", isPopular: true },
  { slug: "tiktok-hashtag-strategy", question: "What's the Best Hashtag Strategy for TikTok?", platform: "tiktok", tool: "hashtag-generator", isPopular: true },
  { slug: "how-many-hashtags-on-tiktok", question: "How many hashtags should you use on TikTok?", platform: "tiktok", tool: "hashtag-generator", isPopular: true },
  { slug: "tiktok-bio-tips", question: "How to Write a TikTok Bio That Converts?", platform: "tiktok", tool: "tiktok-bio-generator" },
  { slug: "tiktok-viral-captions", question: "What Makes TikTok Captions Go Viral?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "do-tiktok-captions-matter", question: "Do captions matter on TikTok?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-username-ideas", question: "How to Choose a TikTok Username?", platform: "tiktok", tool: "tiktok-username-generator" },
  { slug: "tiktok-caption-emojis", question: "Should You Use Emojis in TikTok Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-cta-captions", question: "What CTAs Work Best in TikTok Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-funny-captions", question: "How to Write Funny TikTok Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-pov-captions", question: "How to Use POV in TikTok Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-trending-sounds-captions", question: "How to Write Captions for Trending TikTok Sounds?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-engagement-captions", question: "How to Write TikTok Captions That Get Comments?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-duet-captions", question: "How to Write Captions for TikTok Duets?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-storytime-captions", question: "How to Write TikTok Storytime Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-tutorial-captions", question: "How to Write TikTok Tutorial Captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
  { slug: "tiktok-series-captions", question: "How to Write Captions for TikTok Series?", platform: "tiktok", tool: "tiktok-caption-generator" },
  // YouTube (20)
  { slug: "how-to-write-youtube-hooks", question: "How to Write YouTube Hooks That Keep Viewers Watching?", platform: "youtube", tool: "hook-generator", isPopular: true },
  { slug: "youtube-title-tips", question: "How to Write YouTube Titles That Get Clicks?", platform: "youtube", tool: "youtube-title-generator", isPopular: true },
  { slug: "youtube-shorts-hooks", question: "How to Write Hooks for YouTube Shorts?", platform: "youtube", tool: "hook-generator", isPopular: true },
  { slug: "youtube-description-seo", question: "How to Write YouTube Descriptions for SEO?", platform: "youtube", tool: "youtube-description-generator", isPopular: true },
  { slug: "youtube-viral-hooks", question: "What Makes YouTube Hooks Go Viral?", platform: "youtube", tool: "hook-generator", isPopular: true },
  { slug: "youtube-thumbnail-title-match", question: "Should YouTube Title and Thumbnail Match?", platform: "youtube", tool: "youtube-title-generator" },
  { slug: "youtube-intro-hooks", question: "How Long Should a YouTube Intro Be?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-ctr-titles", question: "How to Improve YouTube CTR with Titles?", platform: "youtube", tool: "youtube-title-generator" },
  { slug: "how-to-write-viral-hooks", question: "How to Write Viral Hooks for Short-Form Video?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-video-ideas", question: "How to Come Up with YouTube Video Ideas?", platform: "youtube", tool: "youtube-video-idea-generator" },
  { slug: "youtube-script-hooks", question: "How to Write a Hook for a YouTube Script?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-retention-hooks", question: "How Do Hooks Help YouTube Retention?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-outro-cta", question: "What CTA Should I Use in YouTube Outros?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-shorts-vs-long-form-hooks", question: "Are Hooks Different for YouTube Shorts vs Long-Form?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-keywords-in-title", question: "How to Use Keywords in YouTube Titles?", platform: "youtube", tool: "youtube-title-generator" },
  { slug: "youtube-thumbnail-text", question: "How Much Text Should Be on a YouTube Thumbnail?", platform: "youtube", tool: "youtube-title-generator" },
  { slug: "youtube-first-48-hours", question: "How Important Are the First 48 Hours for YouTube?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-end-screen-cta", question: "What Should I Say in a YouTube End Screen?", platform: "youtube", tool: "hook-generator" },
  { slug: "youtube-community-post-ideas", question: "What to Post in YouTube Community Tab?", platform: "youtube", tool: "youtube-video-idea-generator" },
  // Instagram (20)
  { slug: "how-to-write-instagram-captions", question: "How to Write Instagram Captions That Drive Engagement?", platform: "instagram", tool: "instagram-caption-generator", isPopular: true },
  { slug: "instagram-caption-length", question: "What's the Best Instagram Caption Length?", platform: "instagram", tool: "instagram-caption-generator", isPopular: true },
  { slug: "instagram-reel-captions", question: "How to Write Instagram Reel Captions?", platform: "instagram", tool: "instagram-caption-generator", isPopular: true },
  { slug: "instagram-hashtag-strategy", question: "What's the Best Hashtag Strategy for Instagram?", platform: "instagram", tool: "hashtag-generator", isPopular: true },
  { slug: "instagram-bio-tips", question: "How to Write an Instagram Bio That Converts?", platform: "instagram", tool: "tiktok-bio-generator", isPopular: true },
  { slug: "instagram-carousel-captions", question: "How to Write Captions for Instagram Carousels?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-story-captions", question: "How to Write Instagram Story Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-cta-captions", question: "What CTAs Work Best in Instagram Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-aesthetic-captions", question: "How to Write Aesthetic Instagram Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-first-line-hook", question: "Why Does the First Line of an Instagram Caption Matter?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-brand-voice-captions", question: "How to Match Your Brand Voice in Instagram Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-save-worthy-captions", question: "How to Write Instagram Captions That Get Saved?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-storytelling-captions", question: "How to Tell a Story in an Instagram Caption?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-caption-templates", question: "Where Can I Find Instagram Caption Templates?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-reels-vs-feed-captions", question: "Are Reel Captions Different from Feed Post Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-caption-for-growth", question: "How Do Captions Help Instagram Growth?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-quote-captions", question: "How to Write Quote Captions for Instagram?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-product-captions", question: "How to Write Instagram Captions for Products?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-monday-captions", question: "What Are Good Monday Instagram Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  { slug: "instagram-collab-captions", question: "How to Write Instagram Collab Captions?", platform: "instagram", tool: "instagram-caption-generator" },
  // Cross-platform (1)
  { slug: "best-caption-length", question: "What's the Best Caption Length for TikTok, Instagram & YouTube?", platform: "tiktok", tool: "tiktok-caption-generator" }
];

/** v38: Merge base + expanded = 500 questions */
export const answerQuestions: AnswerQuestion[] = (() => {
  const seen = new Set<string>();
  const out: AnswerQuestion[] = [];
  for (const q of BASE_QUESTIONS) {
    if (!seen.has(q.slug)) {
      seen.add(q.slug);
      out.push(q);
    }
  }
  for (const q of getExpandedAnswerQuestions()) {
    if (!seen.has(q.slug)) {
      seen.add(q.slug);
      out.push(q as AnswerQuestion);
    }
  }
  return out.slice(0, 500);
})();

export function getAnswerQuestion(slug: string): AnswerQuestion | undefined {
  return answerQuestions.find((q) => q.slug === slug);
}

export function getAllAnswerQuestionSlugs(): string[] {
  return answerQuestions.map((q) => q.slug);
}
