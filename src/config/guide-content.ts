/**
 * v40/v49 Guide page content
 * v49: 1200-2000 words per page, H2 Guide / Examples / AI Prompts / Tools / Strategy / Tips
 */

import type { GuidePageType } from "./traffic-topics";

function formatTopic(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getGuideContent(pageType: GuidePageType, topic: string): string {
  const t = formatTopic(topic);
  const tLower = t.toLowerCase();

  switch (pageType) {
    case "how-to":
      return `## Complete Guide to ${t}

### Understanding the Algorithm

The first step to ${tLower} is understanding how platform algorithms work. TikTok, YouTube, and Instagram all prioritize content that keeps users engaged. Key metrics include watch time, completion rate, saves, shares, and comments. Content that triggers these actions gets pushed to more users. Focus on creating videos that viewers watch until the end—the algorithm rewards retention above all else.

### Posting Strategy and Consistency

Consistency beats perfection. Post at least 3-5 times per week to stay visible. Use analytics to find when your audience is most active—typically early morning, lunch, and evening. Test different formats: tutorials, storytimes, POVs, and trending sounds. Track what resonates and double down. A content calendar helps you plan ahead and avoid last-minute stress.

### Hook Strategy: The First 3 Seconds

The first 2-3 seconds decide everything. Use curiosity gaps ("Nobody talks about this..."), bold statements ("I made $10k in 30 days"), or relatable questions ("Why does nobody tell you this?"). Your hook must stop the scroll. Avoid slow intros—get to the value immediately. Test multiple hooks for the same video to see what performs best.

### Caption and Hashtag Strategy

Captions add context and boost discoverability. Use relevant keywords naturally, 1-3 emojis for personality, and a clear call-to-action. Ask questions to encourage comments. For hashtags, mix 2-3 broad tags with 5-7 niche-specific ones. Avoid banned or oversaturated hashtags. Save your best-performing hashtag sets for reuse.

### Content Ideas That Convert

Create content that solves problems or entertains. Mix trending topics (20%) with evergreen content (80%). Build content pillars: 3-5 themes you can create endlessly. Use a content calendar that balances educational, entertaining, and personal posts. Repurpose top-performing content across platforms.

### Growth and Engagement Tactics

Engage with your niche community daily—comment, like, and reply. Collaborate with creators in your space for cross-pollination. Repurpose top content into carousels, threads, or blog posts. Use trending sounds and formats strategically. Analyze your analytics weekly and double down on what works.

## Strategy for Long-Term Growth

A sustainable ${tLower} strategy requires patience and systems. Set monthly goals for followers, engagement rate, and content output. Batch-create content to reduce decision fatigue. Build an email list or community outside the platform to own your audience. Diversify across 2-3 platforms to reduce algorithm risk. Track your progress and adjust based on data, not assumptions.

## Pro Tips for ${t} Success

1. Start with a strong hook—under 3 seconds to capture attention.
2. Deliver value quickly—don't make viewers wait for the payoff.
3. Use trending formats and sounds strategically—but add your unique twist.
4. Engage with your audience daily—reply to comments and DMs.
5. Analyze top performers in your niche—study their hooks, structure, and CTAs.
6. Repurpose your best content—one video can become a carousel, thread, or blog.
7. Stay consistent—even 2-3 posts per week beats sporadic bursts.
8. Test and iterate—what works changes; keep experimenting.`;
    case "ai-prompts":
      return `## AI Prompts for ${t} Creators

### Why AI Prompts Matter

AI prompts help you generate content 10x faster. The right prompt can produce viral captions, hooks, and ideas in seconds. ChatGPT, Claude, and our free AI tools all respond to well-crafted prompts. Learn to write prompts that get specific, on-brand results—and save the ones that work for reuse.

### Prompt Structure That Works

A good prompt includes: context (platform and niche), desired output type, tone, and specific constraints. Example: "Write a viral TikTok caption about fitness motivation, casual tone, under 100 characters, include 1 emoji." The more specific you are, the better the output. Iterate: if the first result isn't perfect, ask for "more casual" or "shorter."

### Best Practices for AI Content

Start with your niche and goal. Use example outputs to guide the AI: "Like this style: [paste example]." Refine based on output—small tweaks often yield big improvements. Save prompts that perform well and build a personal library. Never publish AI content raw—add your voice and personality.

### Platform-Specific Prompt Tips

${t} has unique requirements. TikTok needs punchy hooks under 80 characters. YouTube needs curiosity-driven titles. Instagram Reels need captions that complement the video. Match your prompts to the format. Include platform in the prompt: "Write for TikTok" vs "Write for Instagram" produces different results.

### Combining AI with Your Voice

Use AI to speed up creation, not replace your voice. Add personal stories, inside jokes, or brand-specific language. The best content feels authentic—AI handles the structure; you handle the soul. Edit and tweak every output before publishing.

## Strategy for AI-Assisted Content

Build a prompt library organized by content type: hooks, captions, ideas, scripts. Test prompts and save the winners. Create templates for recurring content—weekly tips, product reviews, storytimes. Use AI for first drafts, then refine. Track which AI-generated content performs best and refine your prompts accordingly.

## Tips for Better AI Prompts

1. Be specific—include niche, tone, length, and format.
2. Use examples—paste a sample output to guide the AI.
3. Iterate—refine prompts based on results.
4. Save what works—build a reusable prompt library.
5. Add your voice—never publish raw AI output.
6. Test variations—run the same prompt 3-5 times for options.
7. Include constraints—"under 100 chars" or "no emojis" helps.
8. Combine with trends—pair prompts with trending sounds or formats.`;
    case "content-strategy":
      return `## Content Strategy for ${t}

### Define Your Niche and Audience

A focused niche makes it easier to attract and retain audience. Choose something you're passionate about and can create consistently. Define your ideal viewer: demographics, pain points, and goals. Create content that speaks directly to them. Niche down until you can be the go-to expert—"fitness for busy moms" beats "fitness" alone.

### Content Pillars and Planning

Build 3-5 content pillars that support your main topic. Each pillar should have multiple subtopics for endless ideas. Example: fitness → workouts, nutrition, mindset, progress, gear. Plan 4-6 weeks ahead with a content calendar. Balance educational (60%), entertaining (20%), and personal (20%) content.

### Posting Cadence and Consistency

Consistency beats quality in the early stages. Start with what you can sustain—even 2-3 posts per week. Increase as you build systems. Batch-create content to reduce daily decisions. Use scheduling tools to maintain presence even during busy weeks. Missing a week hurts less than burning out.

### Content Mix and Value Delivery

Deliver value in every post. Tips, how-tos, lists, and tutorials build trust. Trending content drives discovery. Personal content builds connection. Mix formats: short-form, carousels, stories, long-form. Repurpose top content across platforms—one idea, multiple formats.

### Growth and Monetization Strategy

Identify your target audience and create content that solves their problems. Use SEO, hashtags, and keywords for discovery. Engage and build community—reply to comments, host Q&As. Repurpose top content. Plan monetization early: sponsorships, affiliates, products, or services. Build an email list to own your audience.

## Strategy for Sustainable Growth

Set quarterly goals for followers, engagement, and revenue. Track metrics that matter: watch time, saves, shares, comments. Diversify income streams. Collaborate with complementary creators. Invest in systems: templates, tools, and automation. Review and adjust strategy monthly based on data.

## Pro Tips for ${t} Content

1. Niche down—be known for one thing before expanding.
2. Create content pillars—endless ideas from 3-5 themes.
3. Batch-create—reduce decision fatigue and stay consistent.
4. Repurpose everything—one video becomes carousel, thread, email.
5. Engage daily—community builds loyalty and algorithm favor.
6. Track what works—double down on winning formats.
7. Plan monetization early—align content with revenue goals.
8. Own your audience—email list, community, or both.`;
    case "viral-examples":
      return `## Viral ${t} Examples

### What Makes Content Go Viral

${t} content goes viral when it taps into emotion, curiosity, or shared experience. Viral content often has: a strong hook in the first 2 seconds, clear value or payoff, emotional resonance, or trend alignment. Study top performers in your niche to understand patterns. Replicate the structure, not the content—add your unique angle.

### Format and Structure Patterns

Short-form viral content: hooks under 3 seconds, clear value delivery, strong CTA. Common structures: problem-solution, before-after, list, story, hot take. Long-form: storytelling with payoff at the end, curiosity gaps, pattern interrupts. Match format to platform—TikTok favors fast cuts; YouTube favors depth.

### Learning from Top Examples

Below are real viral examples from our community. Use them as inspiration for structure, hook style, and CTA. Don't copy—adapt to your niche and voice. Test different angles and track what resonates with your audience. Viral is repeatable when you understand the formula.

### Applying Viral Patterns to Your Content

Identify the hook type: curiosity, bold claim, question, or relatable moment. Match the structure: problem-solution, list, story. Add your twist: personal experience, niche-specific angle. End with engagement: question, CTA, or save prompt. Test and iterate—viral formulas evolve.

## Strategy for Viral-Ready Content

Create content with viral potential: strong hooks, clear value, emotional resonance. Use trending sounds and formats when they fit your brand. Post consistently to increase odds of hitting the algorithm. Analyze viral content in your niche weekly. Build a library of hooks and structures that work for you.

## Pro Tips for Viral ${t} Content

1. Hook in 2 seconds—curiosity, bold claim, or relatable moment.
2. Deliver value fast—don't make viewers wait.
3. Use trending formats—but add your unique twist.
4. Study top performers—replicate structure, not content.
5. Test multiple hooks—same video, different intros.
6. End with engagement—question or CTA.
7. Post consistently—viral is a numbers game.
8. Track what works—double down on winning patterns.`;
    default:
      return "";
  }
}

export function getGuidePrompts(pageType: GuidePageType, topic: string): { prompt: string; example?: string }[] {
  const t = formatTopic(topic);
  const tLower = t.toLowerCase();

  const base: { prompt: string; example?: string }[] = [
    { prompt: `Write a viral caption about ${tLower} for TikTok.`, example: "POV: when you finally..." },
    { prompt: `Create a YouTube hook for a ${tLower} video.`, example: "Nobody talks about this..." },
    { prompt: `Generate 5 Instagram captions for ${tLower} content.`, example: "Monday mood: ${tLower} edition" },
    { prompt: `Write a story-style hook for ${tLower}.`, example: "I used to think..." },
    { prompt: `Create a curiosity-driven caption for ${tLower}.`, example: "The secret to..." },
    { prompt: `Generate a TikTok caption with emojis for ${tLower}.`, example: "🔥 This changed everything" },
    { prompt: `Write a motivational caption about ${tLower}.`, example: "If you're struggling with..." },
    { prompt: `Create a short-form video hook for ${tLower}.`, example: "Stop scrolling. This matters." },
    { prompt: `Generate 5 hashtags for ${tLower} content.`, example: `#${tLower.replace(/\s/g, "")} #creator` },
    { prompt: `Write a CTA caption for ${tLower}.`, example: "Save this for later 👇" },
    { prompt: `Create a POV caption for ${tLower}.`, example: `POV: You're a ${tLower} creator` },
    { prompt: `Generate a before/after style caption for ${tLower}.`, example: "Before vs after..." },
    { prompt: `Write a question-based hook for ${tLower}.`, example: "Why does nobody talk about?" },
    { prompt: `Create a list-style caption for ${tLower}.`, example: "5 things I wish I knew..." },
    { prompt: `Generate a relatable caption for ${tLower}.`, example: `When you're a ${tLower} creator and...` },
    { prompt: `Write a trending sound caption for ${tLower}.`, example: `Using this sound for ${tLower}` },
    { prompt: `Create a carousel caption for ${tLower}.`, example: "Swipe for the full breakdown" },
    { prompt: `Generate a Reels caption for ${tLower}.`, example: "Reels algorithm loves this" },
    { prompt: `Write a Shorts title for ${tLower}.`, example: "You won't believe this..." },
    { prompt: `Create a bio-style description for ${tLower}.`, example: `${t} creator | Tips & ideas` }
  ];

  return base;
}
