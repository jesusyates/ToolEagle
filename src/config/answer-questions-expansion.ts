/**
 * v38 - Question Expansion: 60 → 500
 * Programmatic question generation for /answers/[slug]
 */

export type AnswerQuestionExpanded = {
  slug: string;
  question: string;
  platform: "tiktok" | "youtube" | "instagram";
  tool: string;
  isPopular?: boolean;
};

const TOOL_NAMES: Record<string, string> = {
  "tiktok-caption-generator": "TikTok Caption Generator",
  "instagram-caption-generator": "Instagram Caption Generator",
  "hook-generator": "Hook Generator",
  "hashtag-generator": "Hashtag Generator",
  "youtube-title-generator": "YouTube Title Generator",
  "youtube-description-generator": "YouTube Description Generator",
  "tiktok-bio-generator": "TikTok Bio Generator",
  "tiktok-username-generator": "TikTok Username Generator",
  "youtube-video-idea-generator": "YouTube Video Idea Generator",
  "youtube-hook-generator": "YouTube Hook Generator",
  "instagram-hashtag-generator": "Instagram Hashtag Generator",
  "tiktok-hashtag-generator": "TikTok Hashtag Generator",
  "tiktok-script-generator": "TikTok Script Generator",
  "short-form-script-generator": "Short-Form Script Generator",
  "script-outline-generator": "Script Outline Generator",
  "viral-hook-generator": "Viral Hook Generator",
  "story-hook-generator": "Story Hook Generator",
  "tiktok-idea-generator": "TikTok Idea Generator",
  "reel-caption-generator": "Reel Caption Generator",
  "shorts-title-generator": "Shorts Title Generator"
};

function toolName(slug: string): string {
  return TOOL_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generate expanded questions: how many hashtags, best time to post, how to go viral, caption length, hook strategies, algorithm tips */
export function getExpandedAnswerQuestions(): AnswerQuestionExpanded[] {
  const platform = ["tiktok", "youtube", "instagram"] as const;
  const expanded: AnswerQuestionExpanded[] = [];

  const hashtagQuestions = [
    { slug: "how-many-hashtags-tiktok", question: "How many hashtags should you use on TikTok?", tool: "hashtag-generator" },
    { slug: "how-many-hashtags-instagram", question: "How many hashtags should you use on Instagram?", tool: "hashtag-generator" },
    { slug: "how-many-hashtags-reels", question: "How many hashtags work best for Reels?", tool: "hashtag-generator" },
    { slug: "hashtag-limit-tiktok", question: "What is the hashtag limit on TikTok?", tool: "hashtag-generator" },
    { slug: "hashtag-limit-instagram", question: "What is the hashtag limit on Instagram?", tool: "hashtag-generator" },
    { slug: "best-hashtag-count", question: "What is the best number of hashtags for engagement?", tool: "hashtag-generator" },
    { slug: "hashtag-vs-no-hashtag", question: "Should you use hashtags or no hashtags?", tool: "hashtag-generator" },
    { slug: "niche-hashtags-vs-trending", question: "Niche hashtags vs trending hashtags: which works better?", tool: "hashtag-generator" }
  ];
  hashtagQuestions.forEach((q, i) => {
    expanded.push({ slug: q.slug, question: q.question, platform: i % 2 === 0 ? "tiktok" : "instagram", tool: q.tool });
  });

  const bestTimeQuestions = [
    { slug: "best-time-to-post-tiktok", question: "What is the best time to post on TikTok?", tool: "tiktok-caption-generator" },
    { slug: "best-time-to-post-instagram", question: "What is the best time to post on Instagram?", tool: "instagram-caption-generator" },
    { slug: "best-time-to-post-youtube", question: "What is the best time to post on YouTube?", tool: "youtube-title-generator" },
    { slug: "best-time-to-post-reels", question: "What is the best time to post Reels?", tool: "instagram-caption-generator" },
    { slug: "best-time-to-post-shorts", question: "What is the best time to post YouTube Shorts?", tool: "hook-generator" },
    { slug: "posting-schedule-tips", question: "How to create a posting schedule that works?", tool: "tiktok-caption-generator" },
    { slug: "peak-engagement-times", question: "When do audiences engage most on social media?", tool: "instagram-caption-generator" },
    { slug: "timezone-posting-strategy", question: "How to post for different timezones?", tool: "tiktok-caption-generator" }
  ];
  bestTimeQuestions.forEach((q, i) => {
    const p = platform[i % 3];
    expanded.push({ slug: q.slug, question: q.question, platform: p, tool: q.tool });
  });

  const viralQuestions = [
    { slug: "how-to-go-viral-tiktok", question: "How to go viral on TikTok?", tool: "tiktok-caption-generator" },
    { slug: "how-to-go-viral-instagram", question: "How to go viral on Instagram?", tool: "instagram-caption-generator" },
    { slug: "how-to-go-viral-youtube", question: "How to go viral on YouTube?", tool: "youtube-title-generator" },
    { slug: "what-makes-content-viral", question: "What makes content go viral?", tool: "hook-generator" },
    { slug: "viral-formula-short-form", question: "What is the viral formula for short-form video?", tool: "hook-generator" },
    { slug: "viral-hook-formula", question: "What is the viral hook formula?", tool: "hook-generator" },
    { slug: "trending-sound-strategy", question: "How to use trending sounds to go viral?", tool: "tiktok-caption-generator" },
    { slug: "fyp-strategy", question: "How to get on the FYP?", tool: "tiktok-caption-generator" }
  ];
  viralQuestions.forEach((q, i) => {
    expanded.push({ slug: q.slug, question: q.question, platform: platform[i % 3], tool: q.tool });
  });

  const captionLengthQuestions = [
    { slug: "caption-length-tiktok", question: "What is the ideal caption length for TikTok?", tool: "tiktok-caption-generator" },
    { slug: "caption-length-instagram", question: "What is the ideal caption length for Instagram?", tool: "instagram-caption-generator" },
    { slug: "short-vs-long-captions", question: "Short vs long captions: which performs better?", tool: "instagram-caption-generator" },
    { slug: "first-line-caption-length", question: "How long should the first line of a caption be?", tool: "instagram-caption-generator" },
    { slug: "caption-character-limit", question: "What are the caption character limits by platform?", tool: "tiktok-caption-generator" }
  ];
  captionLengthQuestions.forEach((q, i) => {
    expanded.push({ slug: q.slug, question: q.question, platform: i < 2 ? "tiktok" : "instagram", tool: q.tool });
  });

  const hookStrategyQuestions = [
    { slug: "hook-strategies-tiktok", question: "What hook strategies work best on TikTok?", tool: "hook-generator" },
    { slug: "hook-strategies-youtube", question: "What hook strategies work best on YouTube?", tool: "hook-generator" },
    { slug: "hook-strategies-reels", question: "What hook strategies work best on Reels?", tool: "hook-generator" },
    { slug: "question-hook-vs-statement", question: "Question hook vs statement hook: which works better?", tool: "hook-generator" },
    { slug: "pattern-interrupt-hooks", question: "How to use pattern interrupt in hooks?", tool: "hook-generator" },
    { slug: "curiosity-gap-hooks", question: "How to create curiosity gap in hooks?", tool: "hook-generator" },
    { slug: "first-3-seconds-hook", question: "How to hook viewers in the first 3 seconds?", tool: "hook-generator" },
    { slug: "scroll-stopper-formula", question: "What is the scroll-stopper formula?", tool: "hook-generator" }
  ];
  hookStrategyQuestions.forEach((q, i) => {
    expanded.push({ slug: q.slug, question: q.question, platform: platform[i % 3], tool: q.tool });
  });

  const algorithmQuestions = [
    { slug: "tiktok-algorithm-tips", question: "How does the TikTok algorithm work?", tool: "tiktok-caption-generator" },
    { slug: "instagram-algorithm-tips", question: "How does the Instagram algorithm work?", tool: "instagram-caption-generator" },
    { slug: "youtube-algorithm-tips", question: "How does the YouTube algorithm work?", tool: "youtube-title-generator" },
    { slug: "algorithm-engagement-signals", question: "What engagement signals does the algorithm use?", tool: "tiktok-caption-generator" },
    { slug: "algorithm-watch-time", question: "How does watch time affect the algorithm?", tool: "hook-generator" },
    { slug: "algorithm-save-rate", question: "Does save rate affect the algorithm?", tool: "instagram-caption-generator" },
    { slug: "algorithm-comment-signals", question: "Do comments affect the algorithm?", tool: "tiktok-caption-generator" },
    { slug: "algorithm-share-signals", question: "How do shares affect the algorithm?", tool: "instagram-caption-generator" }
  ];
  algorithmQuestions.forEach((q, i) => {
    expanded.push({ slug: q.slug, question: q.question, platform: platform[i % 3], tool: q.tool });
  });

  const captionTypes = ["funny", "aesthetic", "savage", "short", "long", "viral", "engagement", "storytime", "tutorial", "pov", "trending", "cta", "emoji", "quote"];
  captionTypes.forEach((type, i) => {
    const p = platform[i % 3];
    const tool = p === "youtube" ? "hook-generator" : p === "instagram" ? "instagram-caption-generator" : "tiktok-caption-generator";
    expanded.push({
      slug: `${p}-${type}-captions`,
      question: `How to write ${type} captions for ${p === "tiktok" ? "TikTok" : p === "youtube" ? "YouTube" : "Instagram"}?`,
      platform: p,
      tool
    });
  });

  const hookTypes = ["opening", "question", "story", "curiosity", "controversial", "pattern-interrupt", "first-line", "scroll-stopper"];
  hookTypes.forEach((type, i) => {
    const p = platform[i % 3];
    expanded.push({
      slug: `${p}-${type}-hooks`,
      question: `How to write ${type.replace(/-/g, " ")} hooks for ${p === "tiktok" ? "TikTok" : p === "youtube" ? "YouTube" : "Reels"}?`,
      platform: p,
      tool: "hook-generator"
    });
  });

  const contentTypes = ["reels", "shorts", "duet", "stitch", "carousel", "story", "feed", "long-form"];
  contentTypes.forEach((type, i) => {
    const p = platform[i % 3];
    const tool = type.includes("reel") || type.includes("carousel") || type.includes("story") || type.includes("feed")
      ? "instagram-caption-generator"
      : type.includes("short") || type.includes("long")
        ? "hook-generator"
        : "tiktok-caption-generator";
    expanded.push({
      slug: `${p}-${type}-captions`,
      question: `How to write captions for ${type.replace(/-/g, " ")} content?`,
      platform: p,
      tool
    });
  });

  const strategyTopics = ["engagement", "growth", "algorithm", "ctr", "retention", "saves", "shares", "comments", "followers"];
  strategyTopics.forEach((topic, i) => {
    const p = platform[i % 3];
    const tool = topic === "retention" || topic === "ctr" ? "hook-generator" : "tiktok-caption-generator";
    expanded.push({
      slug: `${p}-${topic}-strategy`,
      question: `What is the best ${topic} strategy for ${p === "tiktok" ? "TikTok" : p === "youtube" ? "YouTube" : "Instagram"}?`,
      platform: p,
      tool
    });
  });

  const nicheCaptions = ["fitness", "food", "travel", "beauty", "fashion", "business", "mom", "dating", "comedy", "education"];
  nicheCaptions.forEach((niche, i) => {
    const p = platform[i % 3];
    expanded.push({
      slug: `${niche}-captions-${p}`,
      question: `How to write ${niche} captions for ${p === "tiktok" ? "TikTok" : p === "youtube" ? "YouTube" : "Instagram"}?`,
      platform: p,
      tool: p === "youtube" ? "hook-generator" : p === "instagram" ? "instagram-caption-generator" : "tiktok-caption-generator"
    });
  });

  const moreQuestions: Array<{ slug: string; question: string; platform: "tiktok" | "youtube" | "instagram"; tool: string }> = [
    { slug: "tiktok-first-post-tips", question: "How to make your first TikTok post stand out?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "instagram-first-reel", question: "How to create your first Instagram Reel?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "youtube-first-video", question: "How to optimize your first YouTube video?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "caption-emojis-yes-no", question: "Should you use emojis in captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "hashtags-in-caption-or-comment", question: "Put hashtags in caption or first comment?", platform: "instagram", tool: "hashtag-generator" },
    { slug: "link-in-bio-cta", question: "How to write a link in bio CTA?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "follow-cta-captions", question: "What follow CTA works best in captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "comment-cta-ideas", question: "What comment CTA gets the most engagement?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "save-cta-captions", question: "How to write captions that get saved?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "share-cta-captions", question: "How to encourage shares in captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "tiktok-description-tips", question: "How to write TikTok video descriptions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "youtube-description-length", question: "How long should YouTube descriptions be?", platform: "youtube", tool: "youtube-description-generator" },
    { slug: "youtube-tags-vs-keywords", question: "YouTube tags vs keywords: what matters more?", platform: "youtube", tool: "youtube-tag-generator" },
    { slug: "thumbnail-ctr-tips", question: "How do thumbnails affect CTR?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "title-thumbnail-match", question: "Should title and thumbnail match?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "tiktok-cover-photo", question: "Does TikTok cover photo matter?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "reels-cover-photo", question: "How to choose a Reels cover photo?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "series-captions", question: "How to write captions for a content series?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "collab-caption-tips", question: "How to write collaboration captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "branded-content-captions", question: "How to write captions for sponsored posts?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "ugc-caption-tips", question: "How to write UGC captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "affiliate-caption-disclosure", question: "How to disclose affiliate links in captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "product-launch-captions", question: "How to write product launch captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "giveaway-caption-tips", question: "How to write giveaway captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "announcement-captions", question: "How to write announcement captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "behind-scenes-captions", question: "How to write behind-the-scenes captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "day-in-life-captions", question: "How to write day-in-my-life captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "grwm-captions", question: "How to write get-ready-with-me captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "ootd-captions", question: "How to write outfit-of-the-day captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "unboxing-captions", question: "How to write unboxing captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "review-caption-structure", question: "How to structure review captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "tutorial-caption-format", question: "How to format tutorial captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "recipe-caption-tips", question: "How to write recipe captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "workout-caption-ideas", question: "How to write workout captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "travel-caption-ideas", question: "How to write travel captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "motivation-caption-ideas", question: "How to write motivational captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "monday-captions", question: "What are good Monday captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "friday-captions", question: "What are good Friday captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "weekend-captions", question: "What are good weekend captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "holiday-captions", question: "How to write holiday captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "birthday-captions", question: "How to write birthday captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-line-breaks", question: "Should you use line breaks in captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-hashtag-placement", question: "Where to put hashtags in captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-mentions", question: "How to use @mentions in captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-call-out", question: "How to do call-outs in captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-tone-voice", question: "How to match caption tone to brand?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-accessibility", question: "How to make captions accessible?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-seo", question: "Do captions affect SEO?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-searchability", question: "Are captions searchable?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-translation", question: "Should you translate captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "multi-platform-caption", question: "Can you use the same caption on all platforms?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-scheduling", question: "How to schedule captions?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-templates", question: "Where to find caption templates?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "ai-caption-tools", question: "Are AI caption tools worth it?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "caption-a-b-testing", question: "How to A/B test captions?", platform: "tiktok", tool: "tiktok-caption-generator" },
    { slug: "caption-analytics", question: "What caption metrics to track?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "youtube-title-formulas", question: "What are proven YouTube title formulas?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "youtube-title-keywords", question: "How to use keywords in YouTube titles?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "youtube-title-length", question: "What is the ideal YouTube title length?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "youtube-title-capitalization", question: "Should you use caps in YouTube titles?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "youtube-title-numbers", question: "Do numbers in titles get more clicks?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "youtube-title-questions", question: "Do question titles perform better?", platform: "youtube", tool: "youtube-title-generator" },
    { slug: "shorts-title-vs-long-form", question: "Are Shorts titles different from long-form?", platform: "youtube", tool: "shorts-title-generator" },
    { slug: "shorts-hook-formula", question: "What is the Shorts hook formula?", platform: "youtube", tool: "hook-generator" },
    { slug: "reels-vs-tiktok-captions", question: "Are Reels captions different from TikTok?", platform: "instagram", tool: "instagram-caption-generator" },
    { slug: "cross-posting-captions", question: "How to adapt captions when cross-posting?", platform: "tiktok", tool: "tiktok-caption-generator" }
  ];
  moreQuestions.forEach((q) => expanded.push(q));

  return expanded;
}

export { toolName };
