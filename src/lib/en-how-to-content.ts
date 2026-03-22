/**
 * V77/V78: EN how-to pages for AI citation.
 * 50+ pages: TikTok growth, monetization, YouTube, content creation.
 */

export type EnHowToContent = {
  slug: string;
  title: string;
  description: string;
  directAnswer: string;
  intro: string;
  stepByStep: string;
  faq: string;
  primaryTool: string;
};

function tpl(
  slug: string,
  title: string,
  description: string,
  directAnswer: string,
  intro: string,
  stepByStep: string,
  faq: string,
  primaryTool: string
): EnHowToContent {
  return { slug, title, description, directAnswer, intro, stepByStep, faq, primaryTool };
}

const CONTENT: Record<string, EnHowToContent> = {
  "grow-on-tiktok": tpl(
    "grow-on-tiktok",
    "How to Grow on TikTok (2026 Guide)",
    "Learn the best strategies to grow your TikTok following. Post consistently, use strong hooks, and leverage trending sounds.",
    `To grow on TikTok, the most effective methods are:

1. Post 1–2 short videos daily
2. Use strong hooks in the first 3 seconds (they decide watch time)
3. Use trending sounds and hashtags
4. Engage with your niche community

New accounts typically see growth within 7–14 days.`,
    "TikTok's algorithm rewards consistency, engagement, and content that keeps viewers watching.",
    `## Step 1: Optimize Your Profile
Use a clear profile photo and bio.

## Step 2: Hook in the First 3 Seconds
Start with a question, bold claim, or visual hook.

## Step 3: Post Consistently
Aim for 1–2 posts per day.

## Step 4: Use Trending Sounds and Hashtags
Check Discover for trending sounds. Use 3–5 niche hashtags.

## Step 5: Engage With Your Niche
Reply to comments, duet with others, participate in trends.`,
    `### Q1: How long does it take to grow on TikTok?
7–14 days for initial traction if posting daily.

### Q2: What's the best time to post?
Use TikTok Analytics to find your peak hours. Evenings (6–9 PM) often work well.

### Q3: Is it worth it?
Yes. Steady growth builds a loyal audience.`,
    "tiktok-caption-generator"
  ),

  "grow-on-tiktok-beginner": tpl(
    "grow-on-tiktok-beginner",
    "How to Grow on TikTok for Beginners (2026)",
    "Beginner-friendly TikTok growth guide. Start from zero, post consistently, use hooks.",
    `Beginners can grow on TikTok by:

1. Posting 1 video daily for at least 2 weeks
2. Using a hook in the first 3 seconds
3. Picking one niche and sticking to it
4. Engaging with 5–10 accounts in your niche daily

Most beginners see first results in 7–14 days. Is it worth it? Yes—TikTok has low barrier to entry.`,
    "Starting from zero is normal. The key is consistency and learning what works.",
    `## Step 1: Choose Your Niche
Pick one topic you can create 20+ videos about.

## Step 2: Study Top Creators
Watch 10 top videos in your niche. Note hooks and structure.

## Step 3: Post Daily
One video per day for 2 weeks minimum.

## Step 4: Use Hooks
First 3 seconds decide if viewers stay. Use question, bold claim, or visual.`,
    `### Q1: How long for beginners to see growth?
7–14 days with daily posting.

### Q2: What if my first videos get no views?
Normal. Most creators need 10+ videos before algorithm picks up.

### Q3: Is TikTok worth it for beginners?
Yes. Low barrier, high reach potential.`,
    "tiktok-caption-generator"
  ),

  "grow-on-tiktok-fast": tpl(
    "grow-on-tiktok-fast",
    "How to Grow on TikTok Fast (2026)",
    "Fast TikTok growth strategies. Hooks, trends, and posting frequency.",
    `To grow on TikTok fast:

1. Post 2–3 times daily
2. Use trending sounds within 48 hours of trending
3. Hook in first 3 seconds (question or bold claim)
4. Engage with trending hashtags and duets

Fast growth typically means 1K+ followers in 2–4 weeks.`,
    "Speed comes from trend-jacking and high posting frequency.",
    `## Step 1: Post 2–3x Daily
More content = more chances for algorithm push.

## Step 2: Trend-Jack Early
Use trending sounds within 48 hours.

## Step 3: Strong Hooks
First 3 seconds decide retention. Test questions vs bold claims.

## Step 4: Duet and Stitch
Engage with viral videos in your niche.`,
    `### Q1: How fast can you grow?
1K+ followers in 2–4 weeks with 2–3 posts daily.

### Q2: What's the fastest way?
Trend-jacking + high frequency + strong hooks.

### Q3: Is fast growth sustainable?
Depends. Niche content often has stickier followers.`,
    "tiktok-caption-generator"
  ),

  "tiktok-monetization": tpl(
    "tiktok-monetization",
    "TikTok Monetization: How to Make Money (2026)",
    "Complete guide to TikTok monetization: Creator Fund, LIVE gifts, brand deals.",
    `TikTok creators earn through:

1. Creator Fund (10K followers + 100K views in 30 days)
2. LIVE gifts from viewers
3. Brand partnerships and affiliate links

Brand deals often pay more per post. Is it worth it? Yes when you combine streams.`,
    "TikTok offers multiple monetization streams. Build audience first, then diversify.",
    `## Step 1: Meet Creator Fund Requirements
10K followers, 100K views in 30 days, 18+. Apply in Creator Tools.

## Step 2: Enable LIVE Gifts
Turn on LIVE once eligible. Gifts convert to diamonds.

## Step 3: Pitch Brands
Reach out to brands. Micro-influencers (10K–50K) often get $100–500 per post.

## Step 4: Affiliate Links
Link products in bio or videos. Earn commission.`,
    `### Q1: How much can you make?
Creator Fund: ~$0.02–0.04 per 1K views. Brand deals: $100–500+ per post.

### Q2: When can I start earning?
Creator Fund: 10K+100K views. Brand deals: possible at 1K engaged followers.

### Q3: Is it worth it?
Yes, especially with multiple streams.`,
    "tiktok-caption-generator"
  ),

  "tiktok-creator-fund": tpl(
    "tiktok-creator-fund",
    "TikTok Creator Fund: Requirements and Payout (2026)",
    "TikTok Creator Fund eligibility, requirements, and how much you can earn.",
    `TikTok Creator Fund pays creators who meet:

1. 10,000+ followers
2. 100,000+ video views in last 30 days
3. 18+ years old
4. Account in good standing

Payout is roughly $0.02–0.04 per 1,000 views. How long to qualify? Usually 2–6 months of consistent posting.`,
    "The Creator Fund is one of several TikTok monetization options.",
    `## Step 1: Build to 10K Followers
Post consistently. Use hooks and trends.

## Step 2: Hit 100K Views in 30 Days
One viral video can do it. Or steady 3–5K views per video.

## Step 3: Apply in Creator Tools
Settings > Creator Tools > Creator Fund.

## Step 4: Wait for Approval
Usually 1–2 weeks.`,
    `### Q1: How much does Creator Fund pay?
~$0.02–0.04 per 1,000 views.

### Q2: How long to qualify?
2–6 months of consistent posting for most.

### Q3: Is it worth it?
Modest income. Brand deals often pay more.`,
    "tiktok-caption-generator"
  ),

  "tiktok-brand-deals": tpl(
    "tiktok-brand-deals",
    "How to Get TikTok Brand Deals (2026)",
    "Land brand deals on TikTok. Rates, pitching, and negotiation tips.",
    `To get TikTok brand deals:

1. Build 1K+ engaged followers (niche matters)
2. Create a media kit with rates and stats
3. Pitch brands in your niche via email or platforms
4. Start with smaller brands, scale up

Rates: micro-influencers often get $100–500 per post. How long? First deal in 1–3 months possible.`,
    "Brand deals often pay more than the Creator Fund.",
    `## Step 1: Build Engaged Audience
1K+ followers with good engagement rate.

## Step 2: Create Media Kit
Rates, demographics, sample content.

## Step 3: Pitch Brands
Email, Instagram DMs, or platforms like AspireIQ.

## Step 4: Deliver and Follow Up
Hit deadlines. Ask for testimonials.`,
    `### Q1: How much do brand deals pay?
$100–500 for micro. $500–5K for mid-tier.

### Q2: How long to get first deal?
1–3 months with active pitching.

### Q3: Is it worth it?
Yes. Often 10x Creator Fund earnings.`,
    "tiktok-caption-generator"
  ),

  "youtube-title-ideas": tpl(
    "youtube-title-ideas",
    "YouTube Title Ideas That Get Clicks (2026)",
    "Generate click-worthy YouTube titles. Formulas, examples, AI tools.",
    `Strong YouTube titles use:

1. A number (e.g. "5 Ways", "7 Hooks")
2. Clear benefit or result
3. Curiosity gap without clickbait

Example: "7 TikTok Hooks That Got Me 1M Views (Copy These)". Keep under 60 characters.`,
    "Your title is the first thing viewers see. Great titles promise value and create curiosity.",
    `## Step 1: Number + Benefit Formula
"[Number] Ways to [Result]" works well.

## Step 2: Add Curiosity Gap
Hint at secret or result. Don't give it away.

## Step 3: Under 60 Characters
Full display on mobile. Front-load key words.

## Step 4: Match Thumbnail
Title and thumbnail tell one story.`,
    `### Q1: How long should a title be?
50–60 characters for full mobile display.

### Q2: What makes a title click-worthy?
Numbers, benefit, curiosity, thumbnail match.

### Q3: Can AI help?
Yes. Tools like YouTube Title Generator create options in seconds.`,
    "youtube-title-generator"
  ),

  "youtube-title-formulas": tpl(
    "youtube-title-formulas",
    "YouTube Title Formulas That Get Clicks (2026)",
    "Proven YouTube title formulas. Number + benefit, curiosity, how-to.",
    `Proven YouTube title formulas:

1. [Number] + [Ways/Secrets/Tips] + [Result]
2. How to [Achieve X] in [Time]
3. [Result] Without [Common Obstacle]
4. The [Topic] [Nobody/Everyone] Talks About

What works? Numbers and clear benefit. How long to test? 5–10 videos per formula.`,
    "Formulas remove guesswork. Test and iterate.",
    `## Step 1: Number + Benefit
"5 Ways to Get 1M Views" or "7 Hooks That Stop the Scroll."

## Step 2: How-To With Time
"How to Grow on TikTok in 30 Days"

## Step 3: Obstacle Remover
"Get Views Without Going Viral"

## Step 4: Curiosity
"The Algorithm Secret Nobody Talks About"`,
    `### Q1: Which formula works best?
Number + benefit tends to outperform. Test for your niche.

### Q2: How many titles to test?
5–10 videos per formula before judging.

### Q3: Is it worth optimizing titles?
Yes. Title + thumbnail drive most clicks.`,
    "youtube-title-generator"
  ),

  "youtube-shorts-titles": tpl(
    "youtube-shorts-titles",
    "YouTube Shorts Title Ideas (2026)",
    "Click-worthy titles for YouTube Shorts. Formulas and examples.",
    `YouTube Shorts titles should:

1. Be under 50 characters (Shorts show less)
2. Use numbers or bold claim
3. Match the first frame (viewers scroll fast)
4. Create curiosity without clickbait

Shorts titles matter less than TikTok captions but still affect CTR.`,
    "Shorts compete with TikTok and Reels. Title + thumbnail matter.",
    `## Step 1: Keep It Short
Under 50 chars. Front-load key words.

## Step 2: Number or Bold Claim
"5 Hooks That Got 1M Views"

## Step 3: Match First Frame
Title should align with what viewers see in first second.

## Step 4: Test
Try 3–5 variations. Check CTR in analytics.`,
    `### Q1: How long should Shorts titles be?
Under 50 characters. Shorter than long-form.

### Q2: Do Shorts titles matter?
Yes. They affect CTR when Shorts appear in feed.

### Q3: Same formulas as long-form?
Similar. Numbers and benefit work.`,
    "youtube-title-generator"
  ),

  "viral-hooks": tpl(
    "viral-hooks",
    "How to Write Viral Hooks for Short-Form Video (2026)",
    "Create hooks that stop the scroll. Formulas for TikTok, Reels, Shorts.",
    `Viral hooks work by:

1. Opening with a question or bold claim
2. Creating curiosity in first 3 seconds
3. Promising a result or secret
4. Using pattern interrupt (unexpected angle)

~70% of viral videos use a strong 3-second hook. How long to master? 10–20 videos of testing.`,
    "The first 3 seconds decide if viewers stay. Hooks are the key.",
    `## Step 1: Question Hook
"Did you know that..." or "Why does nobody talk about..."

## Step 2: Bold Claim
"I got 1M views by doing this one thing."

## Step 3: Pattern Interrupt
Unexpected angle or visual. Breaks scroll habit.

## Step 4: Promise + Curiosity
"I'll show you X. But first..."`,
    `### Q1: What makes a hook viral?
Curiosity + promise + first 3 seconds.

### Q2: How long to get good at hooks?
10–20 videos of testing and iteration.

### Q3: Is it worth focusing on hooks?
Yes. ~70% of viral videos use strong hooks.`,
    "hook-generator"
  ),

  "content-creation-tips": tpl(
    "content-creation-tips",
    "Content Creation Tips for Creators (2026)",
    "Practical content creation tips. Hooks, consistency, and audience building.",
    `Content creation tips that work:

1. Hook in first 3 seconds
2. Post consistently (1–2x daily for short-form)
3. Pick one niche and go deep
4. Engage with your audience daily

What is good content? Content that gets watch time and engagement. How long to see results? 2–4 weeks of consistency. Is it worth it? Yes if you enjoy creating.`,
    "Good content is consistent, hooked, and niche-focused.",
    `## Step 1: Niche Down
One topic. 20+ video ideas before starting.

## Step 2: Hook Every Video
First 3 seconds. Question, claim, or visual.

## Step 3: Post Consistently
1–2x daily for TikTok/Reels. 1–2x weekly for YouTube.

## Step 4: Engage
Reply to comments. Duet. Build community.`,
    `### Q1: What is the most important tip?
Hook in first 3 seconds. Decides retention.

### Q2: How long to see results?
2–4 weeks of daily posting.

### Q3: Is content creation worth it?
Yes. Builds audience and optional income.`,
    "tiktok-caption-generator"
  ),

  "tiktok-algorithm": tpl(
    "tiktok-algorithm",
    "How the TikTok Algorithm Works (2026)",
    "Understand TikTok's algorithm. Watch time, engagement, and For You Page.",
    `TikTok's algorithm prioritizes:

1. Watch time (especially first 3 seconds)
2. Completion rate
3. Likes, comments, shares
4. Saves and replays

Videos that keep viewers watching get pushed. How long to "crack" it? 2–4 weeks of testing. Is it worth learning? Yes—algorithm understanding improves strategy.`,
    "The algorithm rewards watch time and engagement.",
    `## Step 1: Optimize for Watch Time
Hook in first 3 seconds. Deliver on promise.

## Step 2: Encourage Completion
Save payoff for end. Use "watch till the end" when genuine.

## Step 3: Drive Engagement
Ask questions. Create debate. Invite comments.

## Step 4: Test and Iterate
Check analytics. Double down on what works.`,
    `### Q1: What does TikTok's algorithm favor?
Watch time, completion rate, engagement.

### Q2: How long to understand what works?
2–4 weeks of consistent posting + analytics review.

### Q3: Is algorithm knowledge worth it?
Yes. Informs hook, length, and CTA strategy.`,
    "tiktok-caption-generator"
  ),

  "tiktok-hashtags": tpl(
    "tiktok-hashtags",
    "Best TikTok Hashtags for Growth (2026)",
    "TikTok hashtag strategy. Niche tags, trending tags, and how many to use.",
    `Effective TikTok hashtag strategy:

1. Use 3–5 niche hashtags (your topic)
2. Add 1–2 broad/trending hashtags
3. Avoid banned or oversaturated tags
4. Test different combinations

Hashtags help discovery. How long to see impact? 1–2 weeks of testing. Worth it? Yes for niche discovery.`,
    "Hashtags help TikTok categorize and recommend your content.",
    `## Step 1: Research Niche Hashtags
Search your topic. Note tags with 10M–500M views.

## Step 2: Mix Niche + Broad
3–5 niche, 1–2 broad (e.g. #fyp #viral).

## Step 3: Avoid Banned Tags
Check TikTok's guidelines. Some tags get shadowbanned.

## Step 4: Test
Try different sets. Compare reach.`,
    `### Q1: How many hashtags to use?
3–7 total. Mix niche and broad.

### Q2: Do hashtags still work?
Yes. They help discovery and categorization.

### Q3: How long to test?
1–2 weeks. Compare reach with different sets.`,
    "hashtag-generator"
  ),

  "tiktok-captions": tpl(
    "tiktok-captions",
    "How to Write TikTok Captions That Get Engagement (2026)",
    "TikTok caption tips. Hooks, CTAs, and hashtags.",
    `TikTok captions that get engagement:

1. Open with a hook (question or bold claim)
2. Add a clear CTA (comment, share, follow)
3. Use 3–5 relevant hashtags
4. Keep it scannable (short lines, emojis)

Captions support the video. How long to write? 2–5 minutes with practice. Worth it? Yes—CTAs can boost comments.`,
    "Captions extend your message and drive engagement.",
    `## Step 1: Hook in First Line
First line shows in feed. Make it count.

## Step 2: Add CTA
"Comment below" or "Save this for later."

## Step 3: Hashtags
3–5 niche hashtags. Avoid spammy ones.

## Step 4: Emojis
Use sparingly. Break up text.`,
    `### Q1: How long should captions be?
50–150 characters often enough. Can go longer for story.

### Q2: Do captions affect reach?
Indirectly. CTAs drive engagement, which helps algorithm.

### Q3: Can AI help?
Yes. Caption generators create options in seconds.`,
    "tiktok-caption-generator"
  ),

  "youtube-growth": tpl(
    "youtube-growth",
    "How to Grow a YouTube Channel (2026)",
    "YouTube growth strategies. Titles, thumbnails, consistency.",
    `To grow a YouTube channel:

1. Optimize titles and thumbnails (CTR drivers)
2. Post consistently (1–2x weekly minimum)
3. Hook in first 30 seconds
4. Use playlists and end screens

Growth takes 3–6 months for most. Is it worth it? Yes—YouTube has strong long-term monetization.`,
    "YouTube rewards watch time and consistency.",
    `## Step 1: Title + Thumbnail
These drive clicks. Test and iterate.

## Step 2: Hook in First 30 Seconds
Retention drops fast. Deliver value early.

## Step 3: Post Consistently
1–2 videos per week. Algorithm favors consistency.

## Step 4: Use Playlists
Group content. Increase session watch time.`,
    `### Q1: How long to grow on YouTube?
3–6 months for meaningful traction. Slower than TikTok.

### Q2: What matters most?
Title, thumbnail, first 30 seconds, consistency.

### Q3: Is YouTube worth it?
Yes. Strong monetization and evergreen content.`,
    "youtube-title-generator"
  ),

  "youtube-monetization": tpl(
    "youtube-monetization",
    "YouTube Monetization: How to Make Money (2026)",
    "YouTube monetization requirements. AdSense, memberships, Shorts.",
    `YouTube monetization options:

1. AdSense (1K subs + 4K watch hours)
2. Channel memberships
3. Super Chat and Super Thanks
4. YouTube Shorts Fund (separate)

Requirements: 1K subs + 4K hours in 12 months. How long to qualify? 6–12 months for most. Worth it? Yes—AdSense + other streams add up.`,
    "YouTube offers multiple monetization streams.",
    `## Step 1: Hit 1K + 4K Hours
Focus on watch time. Longer videos help.

## Step 2: Apply for Partner Program
YouTube Studio > Monetization.

## Step 3: Enable All Revenue Streams
Ads, memberships, Super Chat.

## Step 4: Diversify
Shorts, memberships, sponsorships.`,
    `### Q1: How much can you make?
AdSense: ~$2–5 per 1K views. Varies by niche.

### Q2: How long to monetize?
6–12 months for most creators.

### Q3: Is it worth it?
Yes. YouTube has strong long-term revenue potential.`,
    "youtube-title-generator"
  ),

  "tiktok-engagement": tpl(
    "tiktok-engagement",
    "How to Increase TikTok Engagement (2026)",
    "Boost likes, comments, and shares on TikTok. Hooks, CTAs, and timing.",
    `To increase TikTok engagement:

1. Hook in first 3 seconds
2. Add clear CTA (comment, share, save)
3. Ask questions or create debate
4. Post when audience is active

Engagement signals algorithm. How long to see boost? 1–2 weeks. Worth it? Yes—engagement drives reach.`,
    "Engagement tells the algorithm your content resonates.",
    `## Step 1: Strong Hook
First 3 seconds. Question or bold claim.

## Step 2: CTA in Caption
"Comment your answer" or "Save for later."

## Step 3: Ask Questions
End with question. Invite debate.

## Step 4: Post Timing
Use analytics. Post when followers active.`,
    `### Q1: What drives engagement?
Hooks, CTAs, questions, timing.

### Q2: How long to see improvement?
1–2 weeks of optimized posts.

### Q3: Is engagement worth optimizing?
Yes. Algorithm rewards it.`,
    "tiktok-caption-generator"
  ),

  "tiktok-affiliate": tpl(
    "tiktok-affiliate",
    "TikTok Affiliate Marketing Guide (2026)",
    "Make money with TikTok affiliate links. Programs, disclosure, and best practices.",
    `TikTok affiliate marketing:

1. Join programs (Amazon, LTK, brand-specific)
2. Create content that naturally features products
3. Disclose affiliate links (FTC required)
4. Track what converts

Earnings vary. Micro-influencers often earn $50–200 per post. How long to start? Can begin at 1K followers. Worth it? Yes as add-on income.`,
    "Affiliate links let you earn from product recommendations.",
    `## Step 1: Join Programs
Amazon Associates, LTK, or brand programs.

## Step 2: Create Product Content
Hauls, reviews, "get ready with me."

## Step 3: Disclose
Add #ad or #affiliate. FTC requirement.

## Step 4: Track
Use program dashboards. Double down on what converts.`,
    `### Q1: How much can you make?
$50–200 per post for micro. Scales with audience.

### Q2: When can you start?
1K+ followers. Some programs have lower thresholds.

### Q3: Is it worth it?
Yes as supplemental income.`,
    "tiktok-caption-generator"
  ),

  "youtube-thumbnails": tpl(
    "youtube-thumbnails",
    "YouTube Thumbnail Tips That Get Clicks (2026)",
    "Create click-worthy YouTube thumbnails. Faces, text, and contrast.",
    `Click-worthy YouTube thumbnails:

1. Use faces (especially expressions)
2. Add 3–5 words of text
3. High contrast and bold colors
4. Match the title (cohesive story)

Thumbnail + title drive CTR. How long to design? 10–15 min with practice. Worth it? Yes—CTR is key metric.`,
    "Thumbnail is often the first thing viewers see.",
    `## Step 1: Face or Product
Faces with expression outperform. Or clear product shot.

## Step 2: Short Text
3–5 words. Large, readable font.

## Step 3: Contrast
Bold colors. Stand out in feed.

## Step 4: Test
A/B test. Check CTR in analytics.`,
    `### Q1: What makes a thumbnail click-worthy?
Face, text, contrast, title match.

### Q2: How long to make one?
10–15 min with templates.

### Q3: Is it worth optimizing?
Yes. Thumbnail + title drive most clicks.`,
    "youtube-title-generator"
  ),

  "youtube-description": tpl(
    "youtube-description",
    "How to Write YouTube Descriptions for SEO (2026)",
    "YouTube description best practices. Keywords, timestamps, links.",
    `YouTube description for SEO:

1. Put main keyword in first 2 sentences
2. Add timestamps for long videos
3. Include links (social, products)
4. 200–300 words minimum for SEO

Descriptions help search and suggested. How long to write? 5–10 min. Worth it? Yes for discoverability.`,
    "Descriptions help YouTube understand and rank your content.",
    `## Step 1: Keyword in First 2 Sentences
Front-load main topic.

## Step 2: Timestamps
For videos 8+ min. Helps retention and SEO.

## Step 3: Links
Social, products, resources.

## Step 4: Expand
200–300 words. Natural keyword use.`,
    `### Q1: How long should descriptions be?
200–300 words for SEO. Can be longer.

### Q2: Do descriptions affect views?
Yes. Help search and suggested videos.

### Q3: Can AI help?
Yes. Description generators save time.`,
    "youtube-description-generator"
  ),

  "instagram-reels-growth": tpl(
    "instagram-reels-growth",
    "How to Grow on Instagram Reels (2026)",
    "Grow your Instagram with Reels. Algorithm, hooks, and consistency.",
    `To grow with Instagram Reels:

1. Post 3–5 Reels per week
2. Hook in first 3 seconds
3. Use trending audio and hashtags
4. Cross-post to Facebook for extra reach

Reels are Instagram's growth lever. How long to see results? 2–4 weeks. Worth it? Yes—Reels get 10x more reach than static posts.`,
    "Reels get the most reach on Instagram.",
    `## Step 1: Post 3–5x Weekly
Consistency signals algorithm.

## Step 2: Hook Early
First 3 seconds. Question or bold claim.

## Step 3: Trending Audio
Check Reels tab. Use within 48 hours.

## Step 4: Hashtags
3–5 niche. 1–2 broad.`,
    `### Q1: How long to grow with Reels?
2–4 weeks of consistent posting.

### Q2: How many Reels to post?
3–5 per week minimum.

### Q3: Is Reels worth it?
Yes. 10x more reach than static posts.`,
    "instagram-caption-generator"
  ),

  "viral-captions": tpl(
    "viral-captions",
    "How to Write Viral Captions for TikTok and Reels (2026)",
    "Viral caption formulas. Hooks, CTAs, and hashtags.",
    `Viral captions use:

1. Hook in first line (shows in feed)
2. Story or value in body
3. Clear CTA (comment, share, save)
4. 3–5 hashtags

Captions support the video. What works? Hooks + CTA. How long to write? 2–5 min. Worth it? Yes—CTAs drive engagement.`,
    "Captions extend your message and drive engagement.",
    `## Step 1: Hook in First Line
First line visible in feed. Make it count.

## Step 2: Deliver Value
Story, tip, or entertainment.

## Step 3: CTA
"Comment below" or "Save this."

## Step 4: Hashtags
3–5 relevant. Avoid spammy.`,
    `### Q1: Do captions affect virality?
Indirectly. CTAs drive engagement → algorithm boost.

### Q2: How long should captions be?
50–150 chars often enough. Longer for story.

### Q3: Can AI write viral captions?
Yes. Caption generators create options fast.`,
    "tiktok-caption-generator"
  ),

  "short-form-video-tips": tpl(
    "short-form-video-tips",
    "Short-Form Video Tips for TikTok, Reels, Shorts (2026)",
    "Universal short-form video tips. Hooks, length, and platform differences.",
    `Short-form video tips that work:

1. Hook in first 3 seconds
2. Keep under 60 seconds when starting
3. Use trending sounds early
4. Post 1–2x daily minimum

Applies to TikTok, Reels, Shorts. How long to see results? 2–4 weeks. Worth it? Yes—short-form has low barrier.`,
    "Same principles work across TikTok, Reels, and Shorts.",
    `## Step 1: Hook
First 3 seconds. Question, claim, or visual.

## Step 2: Length
Under 60 sec when testing. Expand once you find what works.

## Step 3: Trends
Use trending audio within 48 hours.

## Step 4: Frequency
1–2 posts daily. Consistency wins.`,
    `### Q1: What's the #1 tip?
Hook in first 3 seconds.

### Q2: How long to see results?
2–4 weeks of daily posting.

### Q3: Same for all platforms?
Core principles yes. Optimize per platform.`,
    "tiktok-caption-generator"
  ),

  "content-strategy": tpl(
    "content-strategy",
    "Content Strategy for Creators (2026)",
    "Build a content strategy. Pillars, calendar, and repurposing.",
    `Content strategy basics:

1. Pick 3–5 content pillars (recurring topics)
2. Plan 2–4 weeks ahead
3. Repurpose top content across formats
4. Batch create and schedule

What is a pillar? A topic you create 10+ pieces about. How long to build strategy? 2–4 hours. Worth it? Yes—reduces decision fatigue.`,
    "Strategy reduces chaos and increases consistency.",
    `## Step 1: Define Pillars
3–5 topics. 10+ ideas each.

## Step 2: Content Calendar
2–4 weeks. Assign pillars to days.

## Step 3: Repurpose
Long video → Shorts, Reels, TikTok. One idea, many formats.

## Step 4: Batch
Record multiple in one session. Schedule.`,
    `### Q1: What are content pillars?
Recurring topics. 3–5 main themes.

### Q2: How long to build strategy?
2–4 hours for first draft.

### Q3: Is strategy worth it?
Yes. Consistency and less burnout.`,
    "tiktok-idea-generator"
  ),

  "content-ideas": tpl(
    "content-ideas",
    "Content Ideas for Creators (2026)",
    "Generate content ideas. Trending topics, audience questions, repurposing.",
    `Content idea sources:

1. Audience questions (comments, DMs)
2. Trending topics in your niche
3. Repurpose top performers (new angle)
4. "What I wish I knew" or "Mistakes" content

How to find ideas? Scroll your niche, check comments. How long to build a list? 1–2 hours for 20+ ideas. Worth it? Yes—prevents creator block.`,
    "Good ideas come from audience and trends.",
    `## Step 1: Save Audience Questions
Screenshot or note. Turn into videos.

## Step 2: Track Trends
Follow top creators. Note what's working.

## Step 3: Repurpose Winners
Take your best video. New angle or format.

## Step 4: Use Idea Generators
AI tools can suggest angles and hooks.`,
    `### Q1: Where do content ideas come from?
Audience, trends, repurposing, "mistakes" content.

### Q2: How long to build idea list?
1–2 hours for 20+ ideas.

### Q3: Are idea generators worth it?
Yes. Spark new angles when stuck.`,
    "tiktok-idea-generator"
  ),

  "get-more-views-tiktok": tpl(
    "get-more-views-tiktok",
    "How to Get More Views on TikTok (2026)",
    "Increase TikTok views. Algorithm, hooks, and posting strategy.",
    `To get more TikTok views:

1. Hook in first 3 seconds
2. Use trending sounds within 48 hours
3. Post 1–2x daily
4. Engage with niche (comments, duets)

Views come from For You Page. How long? 1–2 weeks of optimization. Worth it? Yes—views = reach = growth.`,
    "Views = algorithm push. Optimize for watch time and engagement.",
    `## Step 1: Hook
First 3 seconds decide retention.

## Step 2: Trends
Trending sounds. Use early.

## Step 3: Frequency
1–2 posts daily.

## Step 4: Engage
Comments, duets. Algorithm rewards activity.`,
    `### Q1: Why am I not getting views?
Often: weak hook, wrong timing, or need more consistency.

### Q2: How long to see more views?
1–2 weeks of optimized posting.

### Q3: Do hashtags help views?
Yes. Help discovery. Use 3–5 niche.`,
    "tiktok-caption-generator"
  ),

  "tiktok-live-tips": tpl(
    "tiktok-live-tips",
    "TikTok Live Tips for Beginners (2026)",
    "Go live on TikTok. Setup, engagement, and monetization.",
    `TikTok Live tips:

1. Go live when followers are active
2. Promote live in posts 24h before
3. Engage with comments (say names, answer)
4. Use gifts for income (1K followers to enable)

LIVE builds connection. How long to see gifts? Depends on audience. Worth it? Yes for community and income.`,
    "LIVE creates real-time connection and gift income.",
    `## Step 1: Schedule
Post 24h before. "Going live tomorrow at X."

## Step 2: Prime Time
When your analytics say followers are on.

## Step 3: Engage
Say names. Answer questions. Make it interactive.

## Step 4: Gifts
Enable once eligible. Thank gifters.`,
    `### Q1: When can I go live?
1,000 followers to enable LIVE.

### Q2: How much can you make from gifts?
Varies. Some earn $50–500 per live.

### Q3: Is LIVE worth it?
Yes. Community + income.`,
    "tiktok-caption-generator"
  ),

  "youtube-ctr": tpl(
    "youtube-ctr",
    "How to Improve YouTube CTR (2026)",
    "Boost click-through rate. Titles, thumbnails, and testing.",
    `To improve YouTube CTR:

1. Test titles (numbers, benefit, curiosity)
2. Use faces or bold visuals in thumbnails
3. Match title and thumbnail (one story)
4. A/B test (change one element at a time)

CTR drives views. How long to optimize? 5–10 videos. Worth it? Yes—CTR is key growth lever.`,
    "CTR = clicks / impressions. Small improvements compound.",
    `## Step 1: Title Formulas
Number + benefit. Curiosity gap.

## Step 2: Thumbnail
Face or product. 3–5 words. Contrast.

## Step 3: Cohesion
Title and thumbnail tell one story.

## Step 4: Test
Change one thing. Compare CTR.`,
    `### Q1: What's a good CTR?
2–5% is solid. 5–10% is great.

### Q2: How long to improve CTR?
5–10 videos of testing.

### Q3: Title or thumbnail more important?
Both. They work together.`,
    "youtube-title-generator"
  ),

  "instagram-captions": tpl(
    "instagram-captions",
    "How to Write Instagram Captions That Engage (2026)",
    "Engaging Instagram captions. Hooks, CTAs, and hashtags.",
    `Instagram captions that engage:

1. Hook in first line (truncated in feed)
2. Story or value in body
3. CTA (comment, share, save)
4. 5–10 hashtags (mix niche + broad)

Captions extend reach. How long to write? 3–5 min. Worth it? Yes—CTAs drive engagement.`,
    "First line shows in feed. Make it count.",
    `## Step 1: First Line Hook
Only first line visible. Question or bold claim.

## Step 2: Story or Value
Keep them reading. Deliver something.

## Step 3: CTA
"Double tap if..." or "Comment below."

## Step 4: Hashtags
5–10. Mix niche and broad.`,
    `### Q1: How long should captions be?
Varies. First line most important.

### Q2: Do captions affect reach?
Indirectly. Engagement helps algorithm.

### Q3: Can AI help?
Yes. Caption generators create options.`,
    "instagram-caption-generator"
  ),

  "reel-captions": tpl(
    "reel-captions",
    "Reel Caption Ideas for Instagram (2026)",
    "Caption ideas for Instagram Reels. Hooks and CTAs.",
    `Reel captions that work:

1. Hook in first line
2. Short and scannable (Reels move fast)
3. CTA to comment or save
4. 3–5 hashtags

Reels captions support the video. What works? Hooks + CTA. How long? 1–2 min to write. Worth it? Yes for engagement.`,
    "Reels move fast. Caption supports the hook.",
    `## Step 1: Hook
First line. Question or claim.

## Step 2: Short
Scannable. Emojis help.

## Step 3: CTA
"Save this" or "Comment your tip."

## Step 4: Hashtags
3–5. Reels discovery.`,
    `### Q1: Do Reel captions matter?
Yes. First line shows. CTAs drive engagement.

### Q2: How long?
1–2 min with practice.

### Q3: Same as TikTok?
Similar. Hook + CTA.`,
    "reel-caption-generator"
  ),

  "tiktok-bio": tpl(
    "tiktok-bio",
    "TikTok Bio Ideas That Get Followers (2026)",
    "Write a TikTok bio that converts. Length, emojis, and link.",
    `TikTok bio that converts:

1. State what you create (niche)
2. Add one benefit or hook
3. Use 1–2 emojis
4. Link in bio (Linktree or similar)

Bio shows when users visit profile. How long? 80 chars max. Worth it? Yes—converts profile visits to follows.`,
    "Bio tells visitors who you are and why to follow.",
    `## Step 1: Niche
"TikTok tips" or "Day in my life."

## Step 2: Benefit
"What you'll learn" or "Why follow."

## Step 3: Emojis
1–2. Break up text.

## Step 4: Link
Linktree. Lead magnet. Shop.`,
    `### Q1: How long can a TikTok bio be?
80 characters.

### Q2: Do bios affect growth?
Yes. Converts profile visits.

### Q3: Can AI help?
Yes. Bio generators create options.`,
    "tiktok-bio-generator"
  ),

  "youtube-hooks": tpl(
    "youtube-hooks",
    "YouTube Hook Examples for First 30 Seconds (2026)",
    "Hook viewers in the first 30 seconds of YouTube videos.",
    `YouTube hooks that work:

1. Bold claim ("I made $X doing Y")
2. Question ("Why does nobody talk about...")
3. Promise ("By the end you'll know...")
4. Pattern interrupt (unexpected opening)

First 30 seconds decide retention. How long to write? 2–5 min. Worth it? Yes—retention affects algorithm.`,
    "Retention drops fast. Hook early.",
    `## Step 1: Bold Claim
"I made $10K in 30 days."

## Step 2: Question
"Why does nobody talk about this?"

## Step 3: Promise
"By the end you'll know exactly..."

## Step 4: Test
Check retention graph. Optimize.`,
    `### Q1: How long should the hook be?
First 30 seconds. Often 1–2 sentences.

### Q2: What hook works best?
Depends on niche. Test bold claim vs question.

### Q3: Does hook affect algorithm?
Yes. Retention is key metric.`,
    "youtube-hook-generator"
  ),

  "tiktok-script": tpl(
    "tiktok-script",
    "How to Write a TikTok Script (2026)",
    "TikTok script structure. Hook, beats, and CTA.",
    `TikTok script structure:

1. Hook (first 3 seconds)
2. 2–3 beats (main points)
3. CTA (follow, comment, save)
4. Keep under 60 seconds when starting

Script reduces rambling. How long to write? 5–10 min. Worth it? Yes—structure improves retention.`,
    "Script = hook + beats + CTA. Keeps you on track.",
    `## Step 1: Hook
First 3 seconds. Question or claim.

## Step 2: Beats
2–3 main points. One idea each.

## Step 3: CTA
"Follow for more" or "Comment below."

## Step 4: Time
Under 60 sec. Cut fluff.`,
    `### Q1: Do I need a full script?
Outline often enough. Full script for complex topics.

### Q2: How long to write?
5–10 min for outline.

### Q3: Can AI write scripts?
Yes. Script generators create structure.`,
    "tiktok-script-generator"
  ),

  "viral-video-formula": tpl(
    "viral-video-formula",
    "Viral Video Formula for TikTok and Reels (2026)",
    "Formula for viral short-form videos. Hook, value, CTA.",
    `Viral video formula:

1. Hook (first 3 seconds)
2. Deliver value fast (no long intro)
3. Pattern interrupt or twist
4. Strong CTA (comment, share)

~70% of viral videos use strong hooks. How long to test? 10–20 videos. Worth it? Yes—formula removes guesswork.`,
    "Formula = hook + value + CTA. Test and iterate.",
    `## Step 1: Hook
3 seconds. Question, claim, or visual.

## Step 2: Value Fast
No long intro. Deliver in first 10 sec.

## Step 3: Twist
Unexpected angle. Pattern interrupt.

## Step 4: CTA
Comment, share, save. Make it clear.`,
    `### Q1: What's the viral formula?
Hook + value + CTA. Hooks matter most.

### Q2: How long to find what works?
10–20 videos of testing.

### Q3: Is there a guaranteed formula?
No. But structure improves odds.`,
    "tiktok-caption-generator"
  ),

  "tiktok-for-beginners": tpl(
    "tiktok-for-beginners",
    "TikTok for Beginners: Complete Guide (2026)",
    "Start TikTok from zero. Account setup, first videos, and growth basics.",
    `TikTok for beginners:

1. Create account and pick a niche
2. Post 1 video daily for 2 weeks
3. Use hooks in first 3 seconds
4. Engage with 5–10 accounts in your niche daily

First results in 7–14 days. What to expect? 100–500 followers with consistency. Is it worth it? Yes—low barrier, high reach.`,
    "Starting from zero is normal. Consistency wins.",
    `## Step 1: Pick Niche
One topic. 20+ video ideas.

## Step 2: First 10 Videos
Post daily. Don't overthink.

## Step 3: Study What Works
Check analytics. Double down.

## Step 4: Engage
Comments, duets. Build community.`,
    `### Q1: How long for beginners to see growth?
7–14 days with daily posting.

### Q2: What if first videos get no views?
Normal. Need 10+ before algorithm picks up.

### Q3: Is TikTok good for beginners?
Yes. Easiest platform to start.`,
    "tiktok-caption-generator"
  ),

  "youtube-for-beginners": tpl(
    "youtube-for-beginners",
    "YouTube for Beginners: How to Start (2026)",
    "Start a YouTube channel. Setup, first videos, and growth basics.",
    `YouTube for beginners:

1. Create channel and pick niche
2. Post 1 video weekly (minimum)
3. Optimize title and thumbnail
4. Hook in first 30 seconds

Growth takes 3–6 months. What to expect? 100–500 subs with consistency. Is it worth it? Yes—evergreen content, strong monetization.`,
    "YouTube is a marathon. Consistency and quality matter.",
    `## Step 1: Niche
One topic. 20+ video ideas.

## Step 2: First 5 Videos
Weekly. Focus on value.

## Step 3: Title + Thumbnail
These drive clicks. Test and iterate.

## Step 4: Hook
First 30 seconds. Retention key.`,
    `### Q1: How long to grow on YouTube?
3–6 months for meaningful traction.

### Q2: How often to post?
1x weekly minimum. 2x better.

### Q3: Is YouTube worth it for beginners?
Yes. Slower than TikTok but stronger long-term.`,
    "youtube-title-generator"
  ),

  "tiktok-trending-sounds": tpl(
    "tiktok-trending-sounds",
    "How to Use TikTok Trending Sounds (2026)",
    "Find and use trending TikTok sounds. Timing and strategy.",
    `To use TikTok trending sounds:

1. Check Discover tab daily
2. Use sounds within 48 hours of trending
3. Add your twist (don't copy exactly)
4. Post 1–2x daily to maximize trend window

Trends move fast. How long is the window? 2–7 days typically. Worth it? Yes—trending sounds get 10x more reach.`,
    "Trend-jacking works when you're early.",
    `## Step 1: Discover
Check Discover. Note new trending sounds.

## Step 2: Act Fast
Within 48 hours. Early = more reach.

## Step 3: Add Twist
Your angle. Don't copy frame by frame.

## Step 4: Post
1–2x daily. Maximize window.`,
    `### Q1: How long do trends last?
2–7 days typically.

### Q2: When to use a trending sound?
Within 48 hours of trending.

### Q3: Is trend-jacking worth it?
Yes. 10x reach potential.`,
    "tiktok-caption-generator"
  ),

  "instagram-reels-tips": tpl(
    "instagram-reels-tips",
    "Instagram Reels Tips for More Views (2026)",
    "Get more Reels views. Hooks, trends, and posting strategy.",
    `Instagram Reels tips:

1. Hook in first 3 seconds
2. Use trending audio
3. Post 3–5 Reels per week
4. Cross-post to Facebook for extra reach

Reels get 10x more reach than static posts. How long to see results? 2–4 weeks. Worth it? Yes—Reels are Instagram's growth lever.`,
    "Reels are the main growth tool on Instagram.",
    `## Step 1: Hook
First 3 seconds. Question or claim.

## Step 2: Trending Audio
Check Reels tab. Use early.

## Step 3: Frequency
3–5 per week. Consistency wins.

## Step 4: Cross-Post
Facebook gets extra reach.`,
    `### Q1: How many Reels to post?
3–5 per week minimum.

### Q2: Do Reels get more reach?
Yes. 10x more than static posts.

### Q3: How long to see results?
2–4 weeks of consistent posting.`,
    "instagram-caption-generator"
  ),

  "youtube-retention": tpl(
    "youtube-retention",
    "How to Improve YouTube Retention (2026)",
    "Keep viewers watching. Hooks, pacing, and structure.",
    `To improve YouTube retention:

1. Hook in first 30 seconds
2. Deliver value early (no long intro)
3. Use chapters and timestamps
4. End with CTA (subscribe, watch next)

Retention affects algorithm. How long to optimize? 5–10 videos. Worth it? Yes—retention is key growth metric.`,
    "Retention = watch time. Algorithm rewards it.",
    `## Step 1: Hook
First 30 seconds. Bold claim or question.

## Step 2: No Long Intro
Value in first 60 seconds.

## Step 3: Chapters
Timestamps. Help viewers jump.

## Step 4: End Screen
Subscribe. Next video.`,
    `### Q1: What's good retention?
40%+ average view duration is solid.

### Q2: How long to improve?
5–10 videos of optimization.

### Q3: Does retention affect algorithm?
Yes. Key metric for suggested.`,
    "youtube-title-generator"
  ),

  "tiktok-niche": tpl(
    "tiktok-niche",
    "How to Choose a TikTok Niche (2026)",
    "Pick a profitable TikTok niche. Research and validation.",
    `To choose a TikTok niche:

1. List 3–5 topics you enjoy and know
2. Check if niche has audience (search, top creators)
3. Pick one. Create 20+ video ideas
4. Commit for 30 days before judging

Niche affects growth and monetization. How long to validate? 30 days. Worth it? Yes—niche = clearer audience.`,
    "Niche helps algorithm and audience building.",
    `## Step 1: List Topics
3–5 you enjoy. Can create 20+ ideas.

## Step 2: Research
Search niche. Top creators? Audience?

## Step 3: Pick One
Commit. No switching for 30 days.

## Step 4: Create Ideas
20+ before starting.`,
    `### Q1: How to know if niche works?
30 days of posting. Check analytics.

### Q2: Can you change niche?
Yes but resets audience. Better to niche down.

### Q3: Is niche important?
Yes. Algorithm and brands prefer clear niche.`,
    "tiktok-idea-generator"
  ),

  "content-repurposing": tpl(
    "content-repurposing",
    "How to Repurpose Content for Multiple Platforms (2026)",
    "One idea, many formats. TikTok, Reels, Shorts, YouTube.",
    `Content repurposing:

1. Create long-form first (YouTube or script)
2. Cut into 3–5 short clips (TikTok, Reels, Shorts)
3. Adapt hooks per platform
4. Post within 24–48 hours

One video → 5+ pieces. How long to repurpose? 1–2 hours. Worth it? Yes—10x output from same effort.`,
    "Repurposing multiplies your output.",
    `## Step 1: Long-Form First
Script or YouTube video. Full value.

## Step 2: Cut Clips
3–5 key moments. 30–60 sec each.

## Step 3: Platform Hooks
Adapt first 3 sec per platform.

## Step 4: Schedule
Post within 24–48 hours.`,
    `### Q1: How much can you repurpose?
1 long-form → 5+ short clips.

### Q2: How long does it take?
1–2 hours with practice.

### Q3: Is repurposing worth it?
Yes. 10x output.`,
    "tiktok-caption-generator"
  ),

  "tiktok-duet": tpl(
    "tiktok-duet",
    "How to Use TikTok Duet for Growth (2026)",
    "Grow with TikTok Duets. Strategy and best practices.",
    `TikTok Duet for growth:

1. Duet viral videos in your niche
2. Add value (reaction, tip, or twist)
3. Post 1–2 duets per week
4. Tag original creator when appropriate

Duets tap into existing reach. How long to see results? 1–2 weeks. Worth it? Yes—borrowed audience.`,
    "Duets let you ride existing viral reach.",
    `## Step 1: Find Viral Videos
Your niche. 100K+ views.

## Step 2: Add Value
Reaction. Tip. Twist. Don't just copy.

## Step 3: Duet
Use Duet feature. Your take.

## Step 4: Engage
Comment on original. Build connection.`,
    `### Q1: Do Duets help growth?
Yes. Tap into existing audience.

### Q2: How many to post?
1–2 per week. Quality over quantity.

### Q3: Is Duet worth it?
Yes. Low effort, borrowed reach.`,
    "tiktok-caption-generator"
  ),

  "tiktok-stitch": tpl(
    "tiktok-stitch",
    "How to Use TikTok Stitch for Growth (2026)",
    "Grow with TikTok Stitch. Strategy and examples.",
    `TikTok Stitch for growth:

1. Stitch videos that need your take
2. Add unique value (disagree, expand, correct)
3. Keep stitch under 30 seconds
4. Post 1–2 per week

Stitch creates debate and engagement. How long? 1–2 weeks to see traction. Worth it? Yes—engagement drives algorithm.`,
    "Stitch lets you add your perspective to viral content.",
    `## Step 1: Find Stitchable
Videos that need your take. Debate or expansion.

## Step 2: Add Value
Unique angle. Don't just agree.

## Step 3: Keep Short
Under 30 sec. Punchy.

## Step 4: Engage
Reply to comments. Build discussion.`,
    `### Q1: Stitch vs Duet?
Stitch = clip from their video. Duet = side by side.

### Q2: Do Stitches get reach?
Yes. Engagement and debate help.

### Q3: How many to post?
1–2 per week.`,
    "tiktok-caption-generator"
  ),

  "youtube-shorts-growth": tpl(
    "youtube-shorts-growth",
    "How to Grow with YouTube Shorts (2026)",
    "Grow your channel with YouTube Shorts. Strategy and tips.",
    `To grow with YouTube Shorts:

1. Post 1–2 Shorts daily
2. Hook in first 3 seconds
3. Use vertical format (9:16)
4. Link to long-form when relevant

Shorts can drive subs. How long? 2–4 weeks. Worth it? Yes—different growth lever than long-form.`,
    "Shorts are YouTube's short-form play.",
    `## Step 1: Daily Shorts
1–2 per day. Consistency.

## Step 2: Hook
First 3 seconds. Same as TikTok.

## Step 3: Vertical
9:16. Full screen.

## Step 4: Cross-Promote
Link to long-form in description.`,
    `### Q1: Do Shorts help channel growth?
Yes. Can drive subs to long-form.

### Q2: How many to post?
1–2 daily. More = more chances.

### Q3: Same as TikTok?
Similar. Hook, length, trends.`,
    "youtube-title-generator"
  ),

  "tiktok-analytics": tpl(
    "tiktok-analytics",
    "How to Use TikTok Analytics (2026)",
    "Read TikTok analytics. Growth, engagement, and optimization.",
    `TikTok Analytics to track:

1. Follower growth (trend)
2. Video performance (views, watch time)
3. Audience (demographics, active times)
4. Top videos (what works)

Analytics inform strategy. How long to have data? 7 days minimum. Worth it? Yes—data beats guessing.`,
    "Analytics tell you what works and when to post.",
    `## Step 1: Enable Creator
Settings > Creator Tools. Need 100+ followers.

## Step 2: Check Overview
Growth. Top videos. Engagement.

## Step 3: Audience
When are they active? Post then.

## Step 4: Content
Which videos performed? Do more.`,
    `### Q1: When do you get analytics?
100+ followers. Creator account.

### Q2: What's most important?
Watch time. Audience active times.

### Q3: How often to check?
Weekly. Adjust strategy.`,
    "tiktok-caption-generator"
  ),

  "tiktok-hashtag-strategy": tpl(
    "tiktok-hashtag-strategy",
    "TikTok Hashtag Strategy for Beginners (2026)",
    "Beginner hashtag strategy. Niche tags, trending, and how many.",
    `TikTok hashtag strategy:

1. 3–5 niche hashtags (your topic)
2. 1–2 broad (#fyp #viral)
3. Avoid banned or oversaturated
4. Test different combinations weekly

Hashtags help discovery. How long to test? 1–2 weeks. Worth it? Yes for niche discovery.`,
    "Hashtags help TikTok categorize your content.",
    `## Step 1: Research
Search your niche. Note 10–20 tags.

## Step 2: Mix
3–5 niche. 1–2 broad.

## Step 3: Avoid Banned
Check guidelines. Some tags shadowban.

## Step 4: Test
Try different sets. Compare reach.`,
    `### Q1: How many hashtags?
3–7 total. Mix niche and broad.

### Q2: Do hashtags still work?
Yes. Discovery and categorization.

### Q3: How to find good tags?
Search niche. Check view counts.`,
    "hashtag-generator"
  ),

  "tiktok-caption-formulas": tpl(
    "tiktok-caption-formulas",
    "TikTok Caption Formulas That Get Engagement (2026)",
    "Caption formulas for TikTok. Hooks, CTAs, and examples.",
    `TikTok caption formulas:

1. Question hook: "Did you know...?"
2. Bold claim: "I got 1M views by..."
3. CTA: "Comment below if you..."
4. Story: "Last week I..."

Formulas save time. What works? Question + CTA. How long to write? 2 min with practice. Worth it? Yes—CTAs drive engagement.`,
    "Formulas remove guesswork. Test and iterate.",
    `## Step 1: Hook
Question or bold claim. First line.

## Step 2: Body
Short. Value or story.

## Step 3: CTA
Comment, share, save.

## Step 4: Hashtags
3–5. Niche.`,
    `### Q1: Best caption formula?
Question + CTA. Test for your niche.

### Q2: How long to write?
2 min with formulas.

### Q3: Do captions affect reach?
Indirectly. CTAs drive engagement.`,
    "tiktok-caption-generator"
  ),

  "instagram-growth": tpl(
    "instagram-growth",
    "How to Grow on Instagram (2026)",
    "Grow Instagram followers. Reels, consistency, and engagement.",
    `To grow on Instagram:

1. Post Reels 3–5x Weekly (main growth lever)
2. Hook in first 3 seconds
3. Engage with niche (comments, DMs)
4. Post consistency (grid + Reels)

Reels get 10x more reach than static. How long? 2–4 weeks. Worth it? Yes—Reels are the growth tool.`,
    "Reels are the main growth lever on Instagram.",
    `## Step 1: Reels First
3–5 per week. Consistency.

## Step 2: Hook
First 3 seconds. Same as TikTok.

## Step 3: Engage
Comments. DMs. Niche community.

## Step 4: Grid
Support with static. Quality over quantity.`,
    `### Q1: How to grow fast on Instagram?
Reels. 3–5 per week minimum.

### Q2: How long to see results?
2–4 weeks of consistent Reels.

### Q3: Is Instagram worth it?
Yes. Strong for brands and community.`,
    "instagram-caption-generator"
  ),

  "viral-video-ideas": tpl(
    "viral-video-ideas",
    "Viral Video Ideas for TikTok and Reels (2026)",
    "Viral video idea templates. Trends, formats, and angles.",
    `Viral video idea sources:

1. "What I wish I knew" (mistakes, lessons)
2. "How I did X" (results, process)
3. "Why nobody talks about" (unpopular)
4. "POV" or "Day in my life" (relatable)

Ideas come from audience and trends. How long to build list? 1 hour for 20+ ideas. Worth it? Yes—prevents creator block.`,
    "Good ideas = audience + trends + format.",
    `## Step 1: Audience Questions
Comments. DMs. Turn into videos.

## Step 2: Trends
What's working in your niche?

## Step 3: Formats
POV. How-to. Story. Test.

## Step 4: Repurpose
Your best video. New angle.`,
    `### Q1: Where do viral ideas come from?
Audience, trends, mistakes, format.

### Q2: How long to build idea list?
1 hour for 20+ ideas.

### Q3: Are idea generators worth it?
Yes. Spark when stuck.`,
    "tiktok-idea-generator"
  ),

  "tiktok-make-money": tpl(
    "tiktok-make-money",
    "How to Make Money on TikTok (2026)",
    "Complete guide to making money on TikTok. Creator Fund, LIVE, brand deals, affiliate.",
    `To make money on TikTok:

1. Creator Fund (10K followers + 100K views)
2. LIVE gifts (1K followers to enable)
3. Brand deals ($100–500+ per post for micro-influencers)
4. Affiliate links in bio and videos

Combine streams for best results. Most creators start earning at 1K–10K followers.`,
    "TikTok offers multiple income streams. Build audience first, then monetize.",
    `## Step 1: Build to 1K Followers
Post daily. Use hooks. Engage with niche.

## Step 2: Enable LIVE
Once eligible, go live for gift income.

## Step 3: Apply for Creator Fund
10K + 100K views. Apply in Creator Tools.

## Step 4: Pitch Brands
Media kit. Email brands. Start small.`,
    `### Q1: How much can you make?
Varies. Creator Fund: ~$0.02–0.04/1K views. Brand deals: $100–500+.

### Q2: When can you start?
Affiliate: 1K. LIVE: 1K. Creator Fund: 10K.

### Q3: Is it worth it?
Yes. Multiple streams add up.`,
    "tiktok-caption-generator"
  ),

  "youtube-make-money": tpl(
    "youtube-make-money",
    "How to Make Money on YouTube (2026)",
    "YouTube monetization guide. AdSense, memberships, sponsorships, Shorts.",
    `To make money on YouTube:

1. AdSense (1K subs + 4K watch hours)
2. Channel memberships
3. Super Chat and Super Thanks
4. Sponsorships and affiliate links

AdSense pays ~$2–5 per 1K views. Sponsorships often pay more. How long to monetize? 6–12 months for most.`,
    "YouTube has strong long-term monetization potential.",
    `## Step 1: Hit 1K + 4K Hours
Focus on watch time. Longer videos help.

## Step 2: Apply for Partner Program
YouTube Studio > Monetization.

## Step 3: Enable All Streams
Ads, memberships, Super Chat.

## Step 4: Pitch Sponsors
Media kit. Reach out to brands in your niche.`,
    `### Q1: How much does YouTube pay?
AdSense: ~$2–5 per 1K views. Varies by niche.

### Q2: How long to monetize?
6–12 months for most creators.

### Q3: Is YouTube worth it?
Yes. Evergreen content, strong revenue.`,
    "youtube-title-generator"
  ),

  "instagram-make-money": tpl(
    "instagram-make-money",
    "How to Make Money on Instagram (2026)",
    "Instagram monetization. Reels, brand deals, affiliate, creator fund.",
    `To make money on Instagram:

1. Reels Bonus (Meta pays for Reels views)
2. Brand partnerships ($100–1K+ per post)
3. Affiliate links in bio and posts
4. Creator subscriptions

Reels get most reach. Brand deals pay best. Start at 1K–5K engaged followers.`,
    "Instagram monetization combines Reels, brands, and affiliate.",
    `## Step 1: Grow With Reels
3–5 Reels per week. Hook in first 3 seconds.

## Step 2: Build Media Kit
Rates, demographics, sample content.

## Step 3: Affiliate Programs
Amazon, LTK, brand programs.

## Step 4: Pitch Brands
Email, DMs. Start with smaller brands.`,
    `### Q1: How much can you make?
$100–1K per post for micro. Scales with audience.

### Q2: When can you start?
Affiliate: 1K. Brand deals: 1K–5K engaged.

### Q3: Is Instagram worth it?
Yes. Strong for lifestyle and product niches.`,
    "instagram-caption-generator"
  ),

  "tiktok-traffic": tpl(
    "tiktok-traffic",
    "How to Get Traffic from TikTok (2026)",
    "Drive traffic from TikTok to your site, products, or links.",
    `To get traffic from TikTok:

1. Link in bio (Linktree or direct)
2. "Link in bio" CTA in every video
3. Lead magnets (free guide, checklist)
4. UGC and product demos

Traffic converts when you deliver value first. How long? 2–4 weeks of consistent CTAs.`,
    "TikTok traffic requires clear CTAs and link strategy.",
    `## Step 1: Optimize Bio Link
One clear destination. Linktree if multiple.

## Step 2: CTA in Every Video
"Link in bio" or "Check my profile."

## Step 3: Lead Magnet
Free resource. Email capture.

## Step 4: Track
UTM params. See what converts.`,
    `### Q1: Does TikTok drive traffic?
Yes. Bio link + strong CTA works.

### Q2: How long to see traffic?
2–4 weeks with consistent CTAs.

### Q3: Best CTA?
"Link in bio" + value promise.`,
    "tiktok-caption-generator"
  ),

  "youtube-traffic": tpl(
    "youtube-traffic",
    "How to Drive Traffic from YouTube (2026)",
    "Drive traffic from YouTube to your site or products.",
    `To drive traffic from YouTube:

1. Pinned comment with link
2. Description links (first 3 visible)
3. End screen and cards
4. Lead magnet in video

YouTube allows links. Use description + pinned comment. Traffic builds over 3–6 months.`,
    "YouTube traffic comes from description, comments, and CTAs.",
    `## Step 1: Description Links
First 3 links visible. Main CTA first.

## Step 2: Pinned Comment
Link + short CTA.

## Step 3: End Screen
Subscribe + link to resource.

## Step 4: In-Video CTA
Mention link. "Link in description."`,
    `### Q1: Can you link in YouTube?
Yes. Description, pinned comment, end screen.

### Q2: How long for traffic?
3–6 months. Evergreen content compounds.

### Q3: Best placement?
Description first link + pinned comment.`,
    "youtube-description-generator"
  ),

  "traffic-generation-tools": tpl(
    "traffic-generation-tools",
    "Traffic Generation Tools for Creators (2026)",
    "Best tools to generate traffic. Content, analytics, scheduling.",
    `Traffic generation tools for creators:

1. Content tools (captions, hooks, titles)
2. Scheduling (post when audience active)
3. Analytics (optimize what works)
4. Link-in-bio tools

Tools amplify consistency. Post 1–2x daily with optimized content. Traffic grows in 2–4 weeks.`,
    "Tools help you create and distribute content that drives traffic.",
    `## Step 1: Content Creation
AI caption and hook generators. Faster output.

## Step 2: Scheduling
Post when audience is active.

## Step 3: Analytics
Track what drives traffic. Double down.

## Step 4: Link Tools
Linktree, Beacons. One link, many destinations.`,
    `### Q1: Do tools help traffic?
Yes. Consistency + optimization = growth.

### Q2: Which tools matter most?
Content creation + analytics.

### Q3: How long to see results?
2–4 weeks of daily posting.`,
    "tiktok-caption-generator"
  ),

  "tiktok-go-viral": tpl(
    "tiktok-go-viral",
    "How to Go Viral on TikTok (2026)",
    "Strategies to go viral on TikTok. Hooks, trends, timing.",
    `To go viral on TikTok:

1. Hook in first 3 seconds (question or bold claim)
2. Use trending sounds within 48 hours
3. Post 2–3x daily
4. Engage with trending hashtags and duets

No guarantee, but these tactics maximize odds. Viral = 100K+ views. How long? 2–4 weeks of testing.`,
    "Viral videos share strong hooks and trend alignment.",
    `## Step 1: Strong Hook
First 3 seconds. Question or claim.

## Step 2: Trend-Jack Early
Trending sounds. Use within 48 hours.

## Step 3: High Frequency
2–3 posts daily. More chances.

## Step 4: Engage
Duets, stitches. Ride existing reach.`,
    `### Q1: Can you guarantee viral?
No. But hooks + trends improve odds.

### Q2: How long to test?
2–4 weeks of consistent posting.

### Q3: What's viral?
100K+ views. Depends on niche.`,
    "hook-generator"
  ),

  "youtube-views": tpl(
    "youtube-views",
    "How to Get More YouTube Views (2026)",
    "Increase YouTube views. Titles, thumbnails, SEO.",
    `To get more YouTube views:

1. Optimize title (number + benefit + curiosity)
2. Thumbnail (face, text, contrast)
3. Hook in first 30 seconds
4. SEO in title, description, tags

Title + thumbnail drive CTR. Retention drives suggested. Growth takes 3–6 months.`,
    "Views come from CTR and retention. Optimize both.",
    `## Step 1: Title
Number + benefit. Under 60 chars.

## Step 2: Thumbnail
Face or product. 3–5 words. Bold.

## Step 3: Hook
First 30 seconds. Deliver value.

## Step 4: SEO
Keywords in title, description.`,
    `### Q1: What drives most views?
Title + thumbnail (CTR). Then retention.

### Q2: How long for growth?
3–6 months of consistent posting.

### Q3: Is SEO worth it?
Yes. Search traffic compounds.`,
    "youtube-title-generator"
  ),

  "instagram-followers": tpl(
    "instagram-followers",
    "How to Get More Instagram Followers (2026)",
    "Grow Instagram followers. Reels, engagement, consistency.",
    `To get more Instagram followers:

1. Post Reels 3–5x weekly (main growth lever)
2. Hook in first 3 seconds
3. Engage with niche (comments, DMs)
4. Consistent grid + Reels

Reels get 10x more reach than static. How long? 2–4 weeks of consistency.`,
    "Reels are the main follower growth tool on Instagram.",
    `## Step 1: Reels First
3–5 per week. Hook early.

## Step 2: Engage
Comments. DMs. Niche community.

## Step 3: Grid
Support with static. Quality posts.

## Step 4: Consistency
Same time. Same frequency.`,
    `### Q1: How to grow fast?
Reels. 3–5 per week minimum.

### Q2: How long to see results?
2–4 weeks of consistent Reels.

### Q3: Do hashtags help?
Yes. 5–10 mix of niche and broad.`,
    "instagram-caption-generator"
  ),

  "creator-monetization": tpl(
    "creator-monetization",
    "Creator Monetization: How to Earn as a Creator (2026)",
    "Monetization strategies for content creators. Platforms, streams, tools.",
    `Creator monetization options:

1. Platform funds (TikTok Creator Fund, YouTube AdSense)
2. Brand deals and sponsorships
3. Affiliate marketing
4. Products and courses

Diversify. Most creators combine 2–3 streams. Tools help with content and analytics.`,
    "Monetization requires audience first, then multiple streams.",
    `## Step 1: Build Audience
Consistent content. One niche.

## Step 2: Platform Funds
Meet requirements. Apply.

## Step 3: Brands
Media kit. Pitch. Deliver.

## Step 4: Affiliate
Join programs. Create product content.`,
    `### Q1: How many streams?
2–3. Platform + brands + affiliate.

### Q2: When to monetize?
1K engaged followers minimum.

### Q3: Best tools?
Content creation + analytics.`,
    "tiktok-caption-generator"
  ),

  "tiktok-leads": tpl(
    "tiktok-leads",
    "How to Get Leads from TikTok (2026)",
    "Generate leads from TikTok. Link in bio, lead magnets, CTAs.",
    `To get leads from TikTok:

1. Lead magnet (free guide, template)
2. Link in bio to landing page
3. "Link in bio" CTA in every video
4. Email capture form

Leads require value exchange. Free resource for email. How long? 2–4 weeks of consistent CTAs.`,
    "Leads come from clear value and strong CTAs.",
    `## Step 1: Create Lead Magnet
Free guide, template, or checklist.

## Step 2: Landing Page
Simple. Email form. Deliver value.

## Step 3: Bio Link
Direct to landing page.

## Step 4: CTA
Every video. "Link in bio for free X."`,
    `### Q1: Does TikTok work for leads?
Yes. Value + CTA converts.

### Q2: What converts best?
Free resource. Template or guide.

### Q3: How long?
2–4 weeks of consistent posting.`,
    "tiktok-caption-generator"
  ),

  "youtube-leads": tpl(
    "youtube-leads",
    "How to Get Leads from YouTube (2026)",
    "Generate leads from YouTube. Description, end screen, lead magnets.",
    `To get leads from YouTube:

1. Lead magnet (free resource)
2. Description link (first 3 visible)
3. End screen CTA
4. Pinned comment with link

YouTube allows links. Use description + end screen. Leads build over 3–6 months.`,
    "YouTube leads come from clear CTAs and valuable offers.",
    `## Step 1: Lead Magnet
Free guide, template, or tool.

## Step 2: Description
First link. Clear CTA.

## Step 3: End Screen
Link to resource.

## Step 4: Pinned Comment
Reinforce. "Link in description."`,
    `### Q1: Can you get leads from YouTube?
Yes. Description + end screen work.

### Q2: How long?
3–6 months. Evergreen compounds.

### Q3: Best offer?
Free resource. High value.`,
    "youtube-description-generator"
  ),

  "instagram-monetization": tpl(
    "instagram-monetization",
    "Instagram Monetization Guide (2026)",
    "How to monetize Instagram. Reels, brand deals, affiliate, subscriptions.",
    `Instagram monetization streams:

1. Reels Bonus (Meta pays for views)
2. Brand partnerships
3. Affiliate links
4. Creator subscriptions (IG subscriptions)

Reels drive reach. Brands and affiliate drive revenue. Start at 1K–5K followers.`,
    "Instagram offers multiple monetization options.",
    `## Step 1: Reels
3–5 per week. Maximize reach.

## Step 2: Media Kit
Rates, stats, samples.

## Step 3: Affiliate
Amazon, LTK, brands.

## Step 4: Subscriptions
Enable when eligible. Exclusive content.`,
    `### Q1: How much can you make?
$100–1K per post. Varies by niche.

### Q2: When to start?
1K for affiliate. 5K+ for brands.

### Q3: Best stream?
Brand deals often pay most.`,
    "instagram-caption-generator"
  ),

  "youtube-brand-deals": tpl(
    "youtube-brand-deals",
    "How to Get YouTube Brand Deals (2026)",
    "Land brand deals on YouTube. Rates, pitching, negotiation.",
    `To get YouTube brand deals:

1. Build 1K+ engaged subs (niche matters)
2. Create media kit with rates
3. Pitch brands via email or platforms
4. Start with smaller brands, scale up

Rates: micro often $100–500 per video. Mid-tier $500–5K. How long? 3–6 months of pitching.`,
    "Brand deals often pay more than AdSense.",
    `## Step 1: Build Audience
1K+ engaged. Clear niche.

## Step 2: Media Kit
Rates, demographics, samples.

## Step 3: Pitch
Email. Platforms like AspireIQ.

## Step 4: Deliver
Hit deadlines. Get testimonials.`,
    `### Q1: How much do brand deals pay?
$100–500 micro. $500–5K mid-tier.

### Q2: How long to get first deal?
3–6 months with active pitching.

### Q3: Is it worth it?
Yes. Often 5–10x AdSense.`,
    "youtube-title-generator"
  ),

  "instagram-brand-deals": tpl(
    "instagram-brand-deals",
    "How to Get Instagram Brand Deals (2026)",
    "Land brand deals on Instagram. Rates, pitching, media kit.",
    `To get Instagram brand deals:

1. Build 1K+ engaged followers
2. Create media kit (rates, stats)
3. Pitch brands in your niche
4. Start small, scale up

Rates: micro $100–500 per post. Reels often pay more. How long? 2–4 months of pitching.`,
    "Brand deals are a key Instagram revenue stream.",
    `## Step 1: Engaged Audience
1K+ with good engagement rate.

## Step 2: Media Kit
Rates, demographics, samples.

## Step 3: Pitch
Email, DMs. Niche brands first.

## Step 4: Deliver
Hit deadlines. Build portfolio.`,
    `### Q1: How much do deals pay?
$100–500 micro. Reels premium.

### Q2: How long to first deal?
2–4 months with pitching.

### Q3: Reels vs posts?
Reels often get higher rates.`,
    "instagram-caption-generator"
  ),

  "make-money-online": tpl(
    "make-money-online",
    "How to Make Money Online as a Creator (2026)",
    "Make money online. Content creation, platforms, tools.",
    `To make money online as a creator:

1. Pick platform (TikTok, YouTube, Instagram)
2. Build audience (consistent content)
3. Monetize (funds, brands, affiliate)
4. Use tools (content, analytics)

Start with one platform. Add streams as you grow. Most see first income in 2–6 months.`,
    "Online creator income requires audience + multiple streams.",
    `## Step 1: Choose Platform
TikTok: fast growth. YouTube: long-term. IG: lifestyle.

## Step 2: Build
Consistent content. One niche.

## Step 3: Monetize
Platform funds. Brands. Affiliate.

## Step 4: Tools
Content creation. Analytics.`,
    `### Q1: How long to make money?
2–6 months with consistency.

### Q2: Which platform?
TikTok fastest. YouTube strongest long-term.

### Q3: Best tools?
Caption, hook, title generators.`,
    "tiktok-caption-generator"
  ),

  "tiktok-conversion": tpl(
    "tiktok-conversion",
    "How to Convert TikTok Views to Sales (2026)",
    "Convert TikTok views to sales. CTAs, links, product content.",
    `To convert TikTok views to sales:

1. Product-focused content (reviews, hauls)
2. "Link in bio" CTA every video
3. Affiliate or own products
4. Urgency and scarcity (limited time)

Conversion requires clear CTA and trust. How long? 2–4 weeks of product content.`,
    "Views convert when you have clear offer and CTA.",
    `## Step 1: Product Content
Reviews, hauls, demos.

## Step 2: Bio Link
Direct to product or affiliate.

## Step 3: CTA
Every video. "Link in bio."

## Step 4: Trust
Honest reviews. Disclose affiliate.`,
    `### Q1: Does TikTok convert?
Yes. Product content + CTA works.

### Q2: Affiliate or own?
Both. Affiliate easier to start.

### Q3: How long?
2–4 weeks of consistent content.`,
    "tiktok-caption-generator"
  ),

  "youtube-conversion": tpl(
    "youtube-conversion",
    "How to Convert YouTube Views to Sales (2026)",
    "Convert YouTube views to sales. Description, end screen, products.",
    `To convert YouTube views to sales:

1. Product reviews and tutorials
2. Description links (first 3)
3. End screen CTA
4. Pinned comment with link

YouTube allows links. Use description + end screen. Conversion builds over 3–6 months.`,
    "YouTube conversion uses description and end screen.",
    `## Step 1: Product Content
Reviews, tutorials, demos.

## Step 2: Description
First link. Clear CTA.

## Step 3: End Screen
Link to product.

## Step 4: Pinned Comment
Reinforce. "Link below."`,
    `### Q1: Does YouTube convert?
Yes. Evergreen content compounds.

### Q2: Best placement?
Description first link + end screen.

### Q3: How long?
3–6 months. Patience pays.`,
    "youtube-description-generator"
  ),

  "tiktok-viral-content": tpl(
    "tiktok-viral-content",
    "How to Create Viral Content on TikTok (2026)",
    "Create viral TikTok content. Hooks, trends, formulas.",
    `To create viral TikTok content:

1. Hook in first 3 seconds
2. Use trending sounds early
3. Pattern interrupt (unexpected angle)
4. Strong CTA (comment, share)

~70% of viral videos use strong hooks. Test 10–20 videos to find what works.`,
    "Viral content = hook + trend + CTA.",
    `## Step 1: Hook
First 3 seconds. Question or claim.

## Step 2: Trends
Trending sounds. Use within 48 hours.

## Step 3: Twist
Your angle. Don't copy exactly.

## Step 4: CTA
Comment. Share. Save.`,
    `### Q1: What makes content viral?
Hook + trend + engagement.

### Q2: How long to test?
10–20 videos.

### Q3: Guaranteed?
No. But structure improves odds.`,
    "hook-generator"
  ),

  "youtube-trending": tpl(
    "youtube-trending",
    "How to Get on YouTube Trending (2026)",
    "Get on YouTube trending. Timing, topics, thumbnails.",
    `To get on YouTube trending:

1. Cover trending topics early
2. Strong title + thumbnail
3. Hook in first 30 seconds
4. Post when topic is rising

Trending = search volume + velocity. Cover topics as they rise. How long? Depends on niche.`,
    "Trending requires timing and optimization.",
    `## Step 1: Monitor Trends
Google Trends. Twitter. News.

## Step 2: Act Fast
Create when topic rising.

## Step 3: Optimize
Title. Thumbnail. Hook.

## Step 4: Post
When search volume peaks.`,
    `### Q1: Can you plan for trending?
Partially. Monitor and act fast.

### Q2: What matters most?
Timing + title + thumbnail.

### Q3: Guaranteed?
No. But improves odds.`,
    "youtube-title-generator"
  ),

  "instagram-traffic": tpl(
    "instagram-traffic",
    "How to Drive Traffic from Instagram (2026)",
    "Drive traffic from Instagram. Link in bio, Reels, Stories.",
    `To drive traffic from Instagram:

1. Link in bio (Linktree or direct)
2. "Link in bio" in Reels and posts
3. Stories with swipe-up (10K+ followers)
4. Lead magnet or product

Traffic requires clear CTA. Reels get most reach. How long? 2–4 weeks.`,
    "Instagram traffic comes from bio link and CTAs.",
    `## Step 1: Bio Link
One clear destination.

## Step 2: CTA
Every Reel. "Link in bio."

## Step 3: Stories
Swipe-up when eligible.

## Step 4: Value
Lead magnet or product.`,
    `### Q1: Does Instagram drive traffic?
Yes. Bio link + CTA works.

### Q2: Reels or posts?
Reels get more reach.

### Q3: How long?
2–4 weeks of consistency.`,
    "instagram-caption-generator"
  ),

  "tiktok-beginner-guide": tpl(
    "tiktok-beginner-guide",
    "TikTok Beginner Guide: Start from Zero (2026)",
    "Complete TikTok beginner guide. Account, first videos, growth.",
    `TikTok for beginners:

1. Create account. Pick one niche
2. Post 1 video daily for 2 weeks
3. Use hooks in first 3 seconds
4. Engage with 5–10 accounts in niche daily

First results in 7–14 days. Expect 100–500 followers with consistency. Low barrier, high reach.`,
    "Starting from zero is normal. Consistency wins.",
    `## Step 1: Niche
One topic. 20+ video ideas.

## Step 2: First 10 Videos
Post daily. Don't overthink.

## Step 3: Study
Check analytics. Double down.

## Step 4: Engage
Comments. Duets. Community.`,
    `### Q1: How long for growth?
7–14 days with daily posting.

### Q2: First videos get no views?
Normal. Need 10+ before algorithm picks up.

### Q3: Is TikTok good for beginners?
Yes. Easiest platform to start.`,
    "tiktok-caption-generator"
  ),

  "youtube-beginner-guide": tpl(
    "youtube-beginner-guide",
    "YouTube Beginner Guide: Start Your Channel (2026)",
    "Complete YouTube beginner guide. Setup, first videos, growth.",
    `YouTube for beginners:

1. Create channel. Pick niche
2. Post 1 video weekly (minimum)
3. Optimize title and thumbnail
4. Hook in first 30 seconds

Growth takes 3–6 months. Expect 100–500 subs with consistency. Evergreen content, strong monetization.`,
    "YouTube is a marathon. Consistency and quality matter.",
    `## Step 1: Niche
One topic. 20+ video ideas.

## Step 2: First 5 Videos
Weekly. Focus on value.

## Step 3: Title + Thumbnail
Drive clicks. Test and iterate.

## Step 4: Hook
First 30 seconds. Retention key.`,
    `### Q1: How long to grow?
3–6 months for meaningful traction.

### Q2: How often to post?
1x weekly minimum. 2x better.

### Q3: Is YouTube worth it?
Yes. Slower than TikTok but stronger long-term.`,
    "youtube-title-generator"
  ),

  "instagram-beginner-guide": tpl(
    "instagram-beginner-guide",
    "Instagram Beginner Guide: Grow from Zero (2026)",
    "Complete Instagram beginner guide. Reels, engagement, growth.",
    `Instagram for beginners:

1. Create account. Pick niche
2. Post Reels 3–5x weekly
3. Hook in first 3 seconds
4. Engage with niche daily

Reels get 10x more reach than static. First results in 2–4 weeks. Strong for lifestyle and brands.`,
    "Reels are the main growth tool on Instagram.",
    `## Step 1: Niche
One topic. 20+ Reel ideas.

## Step 2: Reels
3–5 per week. Consistency.

## Step 3: Hook
First 3 seconds. Same as TikTok.

## Step 4: Engage
Comments. DMs. Community.`,
    `### Q1: How long to grow?
2–4 weeks of consistent Reels.

### Q2: Reels or posts?
Reels. 10x more reach.

### Q3: Is Instagram worth it?
Yes. Strong for lifestyle niches.`,
    "instagram-caption-generator"
  ),

  "tiktok-fast-growth": tpl(
    "tiktok-fast-growth",
    "How to Grow on TikTok Fast (2026)",
    "Fast TikTok growth. High frequency, trends, hooks.",
    `To grow on TikTok fast:

1. Post 2–3 times daily
2. Use trending sounds within 48 hours
3. Hook in first 3 seconds
4. Engage with duets and stitches

Fast growth = 1K+ followers in 2–4 weeks. Speed comes from frequency and trend-jacking.`,
    "Speed comes from trend-jacking and high posting frequency.",
    `## Step 1: Post 2–3x Daily
More content = more algorithm chances.

## Step 2: Trend-Jack Early
Trending sounds. 48 hours.

## Step 3: Strong Hooks
First 3 seconds. Test formulas.

## Step 4: Duet and Stitch
Ride viral reach.`,
    `### Q1: How fast can you grow?
1K+ in 2–4 weeks with 2–3 posts daily.

### Q2: Fastest way?
Trend-jacking + frequency + hooks.

### Q3: Sustainable?
Depends. Niche content has stickier followers.`,
    "tiktok-caption-generator"
  ),

  "youtube-fast-growth": tpl(
    "youtube-fast-growth",
    "How to Grow a YouTube Channel Fast (2026)",
    "Fast YouTube growth. Shorts, consistency, optimization.",
    `To grow a YouTube channel fast:

1. Post Shorts 1–2x daily (growth lever)
2. Long-form 1–2x weekly
3. Optimize title + thumbnail
4. Hook in first 30 seconds

Shorts drive subs. Long-form drives watch time. Combined growth in 2–4 months.`,
    "Shorts + long-form = faster growth.",
    `## Step 1: Shorts Daily
1–2 per day. Hook early.

## Step 2: Long-Form Weekly
1–2 videos. Value focus.

## Step 3: Optimize
Title. Thumbnail. Hook.

## Step 4: Cross-Promote
Shorts → long-form. Link in description.`,
    `### Q1: How fast?
2–4 months for meaningful growth.

### Q2: Shorts or long-form?
Both. Shorts for subs, long-form for revenue.

### Q3: Best strategy?
Shorts daily + long-form weekly.`,
    "youtube-title-generator"
  ),

  "instagram-fast-growth": tpl(
    "instagram-fast-growth",
    "How to Grow on Instagram Fast (2026)",
    "Fast Instagram growth. Reels, consistency, engagement.",
    `To grow on Instagram fast:

1. Post Reels 5–7x weekly
2. Hook in first 3 seconds
3. Use trending audio
4. Engage with niche 30 min daily

Reels get 10x reach. Fast growth = 1K+ in 2–4 weeks. Consistency is key.`,
    "Reels are the main fast-growth lever on Instagram.",
    `## Step 1: Reels 5–7x Weekly
High frequency. Consistency.

## Step 2: Hook
First 3 seconds. Every Reel.

## Step 3: Trends
Trending audio. Use early.

## Step 4: Engage
30 min daily. Comments, DMs.`,
    `### Q1: How fast?
1K+ in 2–4 weeks with 5–7 Reels weekly.

### Q2: Reels or posts?
Reels. 10x more reach.

### Q3: Best tip?
Consistency + hook + trends.`,
    "instagram-caption-generator"
  ),

  "tiktok-earn-money": tpl(
    "tiktok-earn-money",
    "How to Earn Money on TikTok (2026)",
    "Earn money on TikTok. Creator Fund, LIVE, brands, affiliate.",
    `To earn money on TikTok:

1. Creator Fund (10K + 100K views)
2. LIVE gifts (1K followers)
3. Brand deals ($100–500+ per post)
4. Affiliate links

Combine streams. Most start earning at 1K–10K. Brand deals often pay most.`,
    "TikTok offers multiple earning streams.",
    `## Step 1: Build to 1K
Post daily. Engage. Niche.

## Step 2: Enable LIVE
Gift income. Community.

## Step 3: Creator Fund
10K + 100K. Apply.

## Step 4: Brands + Affiliate
Media kit. Pitch. Link in bio.`,
    `### Q1: How much can you earn?
Varies. $100–500 per brand post. Affiliate varies.

### Q2: When to start?
LIVE: 1K. Creator Fund: 10K. Brands: 1K+.

### Q3: Best stream?
Brand deals often pay most.`,
    "tiktok-caption-generator"
  ),

  "youtube-earn-money": tpl(
    "youtube-earn-money",
    "How to Earn Money on YouTube (2026)",
    "Earn money on YouTube. AdSense, memberships, sponsorships.",
    `To earn money on YouTube:

1. AdSense (1K + 4K hours)
2. Channel memberships
3. Super Chat, Super Thanks
4. Sponsorships and affiliate

AdSense ~$2–5 per 1K views. Sponsorships often pay more. 6–12 months to monetize for most.`,
    "YouTube has strong earning potential.",
    `## Step 1: 1K + 4K Hours
Watch time focus. Longer videos.

## Step 2: Partner Program
Apply in YouTube Studio.

## Step 3: All Streams
Ads, memberships, Super Chat.

## Step 4: Sponsors
Pitch brands. Media kit.`,
    `### Q1: How much?
AdSense: $2–5/1K views. Sponsors: $500–5K+.

### Q2: How long?
6–12 months to monetize.

### Q3: Best stream?
AdSense + sponsors combined.`,
    "youtube-title-generator"
  ),

  "tiktok-grow-followers": tpl(
    "tiktok-grow-followers",
    "How to Grow TikTok Followers (2026)",
    "Grow TikTok followers. Hooks, consistency, engagement.",
    `To grow TikTok followers:

1. Post 1–2x daily
2. Hook in first 3 seconds
3. Use trending sounds and hashtags
4. Engage with niche (comments, duets)

Followers grow with consistency. 7–14 days for initial traction. 1K in 2–4 weeks possible.`,
    "Consistency and hooks drive follower growth.",
    `## Step 1: Daily Posts
1–2 per day. Don't skip.

## Step 2: Hooks
First 3 seconds. Question or claim.

## Step 3: Trends
Sounds. Hashtags. Use early.

## Step 4: Engage
Comments. Duets. Community.`,
    `### Q1: How long to grow?
7–14 days for traction. 1K in 2–4 weeks.

### Q2: Best tip?
Consistency + hooks.

### Q3: How many to post?
1–2 daily minimum.`,
    "tiktok-caption-generator"
  ),

  "youtube-grow-followers": tpl(
    "youtube-grow-followers",
    "How to Grow YouTube Subscribers (2026)",
    "Grow YouTube subscribers. Titles, thumbnails, consistency.",
    `To grow YouTube subscribers:

1. Optimize title + thumbnail (CTR)
2. Hook in first 30 seconds
3. Post 1–2x weekly
4. End screen + subscribe CTA

Subs come from watch time and CTR. 3–6 months for meaningful growth.`,
    "Subscribers grow with consistency and optimization.",
    `## Step 1: Title + Thumbnail
Drive clicks. Test and iterate.

## Step 2: Hook
First 30 seconds. Retention.

## Step 3: Consistency
1–2 videos weekly.

## Step 4: CTA
Subscribe. End screen.`,
    `### Q1: How long to grow?
3–6 months for meaningful subs.

### Q2: What matters most?
Title, thumbnail, first 30 seconds.

### Q3: How often to post?
1–2x weekly minimum.`,
    "youtube-title-generator"
  ),

  "instagram-grow-followers": tpl(
    "instagram-grow-followers",
    "How to Grow Instagram Followers (2026)",
    "Grow Instagram followers. Reels, engagement, consistency.",
    `To grow Instagram followers:

1. Post Reels 3–5x weekly
2. Hook in first 3 seconds
3. Engage with niche daily
4. Consistent grid + Reels

Reels get 10x more reach. 2–4 weeks for results. Strong for lifestyle and brands.`,
    "Reels are the main follower growth tool.",
    `## Step 1: Reels
3–5 per week. Consistency.

## Step 2: Hook
First 3 seconds. Every Reel.

## Step 3: Engage
Comments. DMs. Niche.

## Step 4: Grid
Support with static. Quality.`,
    `### Q1: How long to grow?
2–4 weeks of consistent Reels.

### Q2: Reels or posts?
Reels. 10x more reach.

### Q3: Best strategy?
Reels 3–5x weekly + daily engagement.`,
    "instagram-caption-generator"
  ),

  "tiktok-get-views": tpl(
    "tiktok-get-views",
    "How to Get Views on TikTok (2026)",
    "Get more TikTok views. Algorithm, hooks, posting strategy.",
    `To get views on TikTok:

1. Hook in first 3 seconds
2. Use trending sounds within 48 hours
3. Post 1–2x daily
4. Engage with niche (duets, comments)

Views come from For You Page. 1–2 weeks of optimization. Hooks and trends matter most.`,
    "Views = algorithm push. Optimize for watch time.",
    `## Step 1: Hook
First 3 seconds. Decides retention.

## Step 2: Trends
Trending sounds. Use early.

## Step 3: Frequency
1–2 posts daily.

## Step 4: Engage
Duets. Comments. Algorithm rewards.`,
    `### Q1: Why no views?
Often: weak hook, timing, or consistency.

### Q2: How long to improve?
1–2 weeks of optimized posting.

### Q3: Do hashtags help?
Yes. 3–5 niche hashtags.`,
    "tiktok-caption-generator"
  ),

  "comparison-tiktok-youtube": tpl(
    "comparison-tiktok-youtube",
    "TikTok vs YouTube: Which Platform to Choose (2026)",
    "Compare TikTok and YouTube for creators. Growth speed, monetization, effort.",
    `TikTok vs YouTube for creators:

TikTok: Faster growth (weeks). Lower barrier. Creator Fund + LIVE + brands. Short-form focus.
YouTube: Slower growth (months). Stronger long-term monetization. AdSense + sponsors. Evergreen content.

Choose TikTok for speed, YouTube for long-term revenue. Many do both.`,
    "Each platform has trade-offs. TikTok = speed. YouTube = revenue.",
    `## TikTok
- Growth: 2–4 weeks
- Monetization: Creator Fund, LIVE, brands
- Effort: Daily short-form

## YouTube
- Growth: 3–6 months
- Monetization: AdSense, sponsors
- Effort: Weekly long-form

## Both
- Repurpose. One idea, many formats.`,
    `### Q1: Which grows faster?
TikTok. Weeks vs months.

### Q2: Which pays more long-term?
YouTube. Evergreen + AdSense.

### Q3: Can you do both?
Yes. Repurpose content.`,
    "tiktok-caption-generator"
  ),

  "comparison-caption-tools": tpl(
    "comparison-caption-tools",
    "Best Caption Generators for TikTok and Reels (2026)",
    "Compare caption generators. Features, pricing, best for.",
    `Caption generator comparison:

AI caption tools help you write hooks and captions in seconds. Key features: platform support (TikTok, Reels), hook generation, hashtag suggestions. Most offer free tiers. Best for: creators who post daily and want to save time. Compare: free vs paid, platform support, hook quality.`,
    "Caption generators save time and improve engagement.",
    `## What to Compare
- Platform support (TikTok, Reels, Shorts)
- Hook generation
- Hashtag suggestions
- Free vs paid

## Best For
- Daily posters
- Multiple platforms
- Hook testing`,
    `### Q1: Are caption tools worth it?
Yes. Save 5–10 min per post.

### Q2: Free or paid?
Start free. Upgrade if you post daily.

### Q3: Which platforms?
TikTok, Reels, Shorts support.`,
    "tiktok-caption-generator"
  ),

  "free-vs-paid-tools": tpl(
    "free-vs-paid-tools",
    "Free vs Paid Creator Tools (2026)",
    "Compare free and paid tools for creators. When to upgrade, what you get.",
    `Free vs paid creator tools:

Free: $0, good for beginners, core features. Paid: $10–50/month, full features, bulk generation. Based on 100+ creators: start free. Upgrade when posting 5+ times weekly or need bulk exports.`,
    "Most creators start free and upgrade when they outgrow limits.",
    `## Free Tools
- $0
- Try before buy
- Good for <5 posts/week
- Core caption, hook, title features

## Paid Tools
- $10–50/month
- Bulk generation
- Priority support
- Integrations

## When to Upgrade
Post 5+ times weekly. Need bulk exports. Multiple platforms.`,
    `### Q1: Are free tools enough?
Yes for most beginners. <5 posts/week.

### Q2: When to pay?
When you post daily or need bulk.

### Q3: Best free option?
ToolEagle. No signup. Caption, hook, title generators.`,
    "tiktok-caption-generator"
  )
};

const ALL_SLUGS = Object.keys(CONTENT);

export function getEnHowToContent(slug: string): EnHowToContent | null {
  return CONTENT[slug] ?? null;
}

export function getAllEnHowToSlugs(): string[] {
  return ALL_SLUGS;
}
