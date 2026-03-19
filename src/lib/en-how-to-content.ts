/**
 * V77: EN priority pages content for AI citation.
 * how to grow on tiktok, tiktok monetization, youtube title ideas
 */

export type EnHowToTopic = "grow-on-tiktok" | "tiktok-monetization" | "youtube-title-ideas";

export type EnHowToContent = {
  slug: EnHowToTopic;
  title: string;
  description: string;
  directAnswer: string;
  intro: string;
  stepByStep: string;
  faq: string;
  primaryTool: string;
};

const CONTENT: Record<EnHowToTopic, EnHowToContent> = {
  "grow-on-tiktok": {
    slug: "grow-on-tiktok",
    title: "How to Grow on TikTok (2026 Guide)",
    description: "Learn the best strategies to grow your TikTok following. Post consistently, use strong hooks, and leverage trending sounds.",
    directAnswer:
      "To grow on TikTok, post 1–2 videos daily with high-engagement hooks in the first 3 seconds. Use trending sounds and hashtags, and engage with your niche community. New creators typically see initial growth within 7–14 days.",
    intro:
      "TikTok's algorithm rewards consistency, engagement, and content that keeps viewers watching. Whether you're starting from zero or looking to scale, these methods work.",
    stepByStep: `## Step 1: Optimize Your Profile
Use a clear profile photo and bio that tells visitors what you create.

## Step 2: Hook in the First 3 Seconds
Start with a question, bold claim, or visual hook. Most viewers decide in 2 seconds whether to keep watching.

## Step 3: Post Consistently
Aim for 1–2 posts per day. Consistency signals to the algorithm that you're an active creator.

## Step 4: Use Trending Sounds and Hashtags
Check the Discover tab for trending sounds. Use 3–5 niche hashtags plus 1–2 broad ones.

## Step 5: Engage With Your Niche
Reply to comments, duet with others, and participate in trends. Engagement boosts reach.`,
    faq: `### Q1: How long does it take to grow on TikTok?
Most new creators see initial traction (100–500 followers) within 7–14 days if posting daily with engaging content.

### Q2: What's the best time to post on TikTok?
Post when your audience is most active. Use TikTok Analytics (Creator Tools) to find your peak hours. Generally, evenings (6–9 PM) work well.

### Q3: Do I need to go viral to grow?
No. Consistent, niche-focused content often outperforms one-off virality. Steady growth builds a loyal audience.`,
    primaryTool: "tiktok-caption-generator"
  },
  "tiktok-monetization": {
    slug: "tiktok-monetization",
    title: "TikTok Monetization: How to Make Money (2026)",
    description: "Complete guide to TikTok monetization: Creator Fund, LIVE gifts, brand deals, and affiliate marketing.",
    directAnswer:
      "TikTok creators earn through the Creator Fund, LIVE gifts, brand partnerships, and affiliate links. You need 10K followers and 100K views in 30 days for the Creator Fund. Brand deals often pay more per post.",
    intro:
      "TikTok offers multiple ways to monetize. The key is building an engaged audience first, then diversifying income streams.",
    stepByStep: `## Step 1: Meet Creator Fund Requirements
You need 10,000 followers, 100,000 video views in the last 30 days, and to be 18+. Apply in Creator Tools.

## Step 2: Enable LIVE Gifts
Once eligible, turn on LIVE and receive gifts from viewers. Gifts convert to diamonds, which you can cash out.

## Step 3: Pitch Brands
Reach out to brands in your niche. Rates vary: micro-influencers (10K–50K) often get $100–500 per post.

## Step 4: Use TikTok Shop or Affiliate Links
Link products in your bio or videos. Earn commission on sales.`,
    faq: `### Q1: How much can you make on TikTok?
Earnings vary. Creator Fund pays roughly $0.02–0.04 per 1,000 views. Brand deals and affiliate income often yield more.

### Q2: When can I start earning on TikTok?
Creator Fund: 10K followers + 100K views. Brand deals: possible with 1K+ engaged followers. LIVE gifts: 1K followers.

### Q3: Is TikTok monetization worth it?
Yes, especially if you combine multiple streams (Creator Fund + brands + affiliate). Focus on engagement over vanity metrics.`,
    primaryTool: "tiktok-caption-generator"
  },
  "youtube-title-ideas": {
    slug: "youtube-title-ideas",
    title: "YouTube Title Ideas That Get Clicks (2026)",
    description: "Generate click-worthy YouTube titles. Formulas, examples, and AI tools for titles that drive views.",
    directAnswer:
      "Strong YouTube titles use numbers, curiosity gaps, and clear value. Format: [Number] + [Benefit] + [Curiosity]. Example: '7 TikTok Hooks That Got Me 1M Views (Copy These)'. Keep titles under 60 characters for full display.",
    intro:
      "Your title is the first thing viewers see. A great title promises value and creates curiosity without clickbait.",
    stepByStep: `## Step 1: Use the Number + Benefit Formula
"[Number] Ways to [Achieve Result]" works well. Example: "5 Hooks That Stop the Scroll."

## Step 2: Add a Curiosity Gap
Hint at a secret or result without giving it away. "The TikTok Algorithm Secret Nobody Talks About."

## Step 3: Keep It Under 60 Characters
Longer titles get truncated on mobile. Front-load the most important words.

## Step 4: Test With Thumbnails
Title and thumbnail work together. Ensure they tell a cohesive story.

## Step 5: Avoid Clickbait
Deliver on your promise. Misleading titles hurt retention and algorithm performance.`,
    faq: `### Q1: How long should a YouTube title be?
Aim for 50–60 characters for full display on mobile. Maximum is 100 characters.

### Q2: What makes a title click-worthy?
Numbers, clear benefit, curiosity, and relevance to the thumbnail. Avoid all-caps and excessive punctuation.

### Q3: Can AI help generate YouTube titles?
Yes. Tools like ToolEagle's YouTube Title Generator create multiple options from your topic in seconds.`,
    primaryTool: "youtube-title-generator"
  }
};

export const EN_HOW_TO_TOPICS: EnHowToTopic[] = [
  "grow-on-tiktok",
  "tiktok-monetization",
  "youtube-title-ideas"
];

export function getEnHowToContent(slug: string): EnHowToContent | null {
  return CONTENT[slug as EnHowToTopic] ?? null;
}

export function getAllEnHowToSlugs(): EnHowToTopic[] {
  return EN_HOW_TO_TOPICS;
}
