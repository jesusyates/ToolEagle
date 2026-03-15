/**
 * AI prompt templates for each tool.
 * Use {input} as placeholder for user input.
 */
export const aiPrompts: Record<string, string> = {
  "tiktok-caption-generator": `Generate 5 engaging TikTok captions for this idea: {input}
Make them short, catchy and optimized for social media. Include hooks, emojis and 3-4 relevant hashtags. Return each caption on a new line, separated by --- on its own line.`,

  "hashtag-generator": `Generate 5 sets of hashtags for this topic: {input}
Each set should have 10-14 relevant hashtags. Mix broad and niche tags. Return each set on a new line, separated by --- on its own line.`,

  "hook-generator": `Create 5 viral hooks for a short-form video about: {input}
Each hook should stop the scroll in 2 seconds. Keep them punchy and curiosity-driven. Return each hook on a new line, separated by --- on its own line.`,

  "title-generator": `Generate 5 clickable titles for a video about: {input}
Make them curiosity-driven and optimized for YouTube, TikTok, Reels and Shorts. Return each title on a new line, separated by --- on its own line.`,

  "tiktok-bio-generator": `Generate 5 catchy TikTok bios for: {input}
Keep each under 80 characters. Include emoji and a clear value proposition. Return each bio on a new line, separated by --- on its own line.`,

  "youtube-title-generator": `Generate 5 click-worthy YouTube video titles for: {input}
Make them curiosity-driven and under 60 characters. Return each title on a new line, separated by --- on its own line.`,

  "instagram-caption-generator": `Generate 5 scroll-stopping Instagram captions for: {input}
Include emojis and 3-5 relevant hashtags. Make them engaging and shareable. Return each caption on a new line, separated by --- on its own line.`,

  "youtube-description-generator": `Generate 5 SEO-friendly YouTube video description openings for: {input}
Each should be 2-3 sentences with keywords. Return each on a new line, separated by --- on its own line.`,

  "tiktok-username-generator": `Generate 5 unique TikTok username ideas for: {input}
Keep them short, memorable and brandable. Return each on a new line, separated by --- on its own line.`,

  "instagram-username-generator": `Generate 5 memorable Instagram username ideas for: {input}
Keep them under 30 characters. Return each on a new line, separated by --- on its own line.`,

  "tiktok-idea-generator": `Generate 5 viral TikTok content ideas for: {input}
Make them specific and actionable. Return each idea on a new line, separated by --- on its own line.`,

  "youtube-video-idea-generator": `Generate 5 YouTube video ideas that get views for: {input}
Make them evergreen and searchable. Return each idea on a new line, separated by --- on its own line.`,

  "tiktok-script-generator": `Generate 5 short TikTok script outlines for: {input}
Each should have: Hook (1 line), 3 beats, CTA. Return each script on a new line, separated by --- on its own line.`,

  "youtube-script-generator": `Generate 5 YouTube script outlines for: {input}
Each should have: Intro hook, 3 main points, Outro with CTA. Return each outline on a new line, separated by --- on its own line.`,

  "viral-hook-generator": `Create 5 viral hooks that stop the scroll for: {input}
Make them curiosity-driven and punchy. Return each hook on a new line, separated by --- on its own line.`,

  "story-hook-generator": `Create 5 story-style hooks for: {input}
Make them pull viewers into the content. Return each hook on a new line, separated by --- on its own line.`,

  "clickbait-title-generator": `Generate 5 curiosity-driven clickbait-style titles for: {input}
Make them compelling but deliverable. Return each title on a new line, separated by --- on its own line.`,

  "ai-video-title-generator": `Generate 5 algorithm-optimized video titles for: {input}
Make them searchable and click-worthy. Return each title on a new line, separated by --- on its own line.`,

  "social-media-post-generator": `Generate 5 ready-to-post social media captions for: {input}
Include emojis and hashtags. Return each caption on a new line, separated by --- on its own line.`,

  "instagram-hashtag-generator": `Generate 5 sets of Instagram hashtags for: {input}
Each set: 10-15 tags, mix broad and niche. Return each set on a new line, separated by --- on its own line.`,

  "youtube-tag-generator": `Generate 5 sets of YouTube SEO tags for: {input}
Each set: 10-15 comma-separated tags. Return each set on a new line, separated by --- on its own line.`,

  "tiktok-hashtag-generator": `Generate 5 sets of TikTok hashtags for: {input}
Each set: 5-8 trending and niche tags. Return each set on a new line, separated by --- on its own line.`,

  "reel-caption-generator": `Generate 5 Instagram Reel captions for: {input}
Make them hook-driven with emojis and hashtags. Return each caption on a new line, separated by --- on its own line.`,

  "shorts-title-generator": `Generate 5 YouTube Shorts titles for: {input}
Keep them short and punchy for the feed. Return each title on a new line, separated by --- on its own line.`,

  "tiktok-hook-generator": `Create 5 viral TikTok hooks for: {input}
Each hook should stop the scroll in 2 seconds. Keep them punchy and TikTok-native. Return each hook on a new line, separated by --- on its own line.`,

  "tiktok-comment-reply-generator": `Generate 5 engaging TikTok comment replies for: {input}
Make them friendly, on-brand and encourage further engagement. Return each reply on a new line, separated by --- on its own line.`,

  "tiktok-story-generator": `Generate 5 TikTok story ideas or captions for: {input}
Make them casual and engaging. Return each on a new line, separated by --- on its own line.`,

  "tiktok-trend-caption-generator": `Generate 5 trending TikTok captions for: {input}
Use current TikTok trends, sounds and formats. Include relevant hashtags. Return each caption on a new line, separated by --- on its own line.`,

  "tiktok-video-idea-generator": `Generate 5 viral TikTok video ideas for: {input}
Make them specific, actionable and trend-aware. Return each idea on a new line, separated by --- on its own line.`,

  "youtube-shorts-title-generator": `Generate 5 YouTube Shorts titles for: {input}
Keep them short, punchy and optimized for the Shorts feed. Return each title on a new line, separated by --- on its own line.`,

  "youtube-thumbnail-text-generator": `Generate 5 punchy thumbnail text options for a YouTube video about: {input}
Keep each under 4 words. Bold, high-contrast style. Return each on a new line, separated by --- on its own line.`,

  "youtube-hook-generator": `Create 5 YouTube video hooks for: {input}
Each should grab viewers in the first 5 seconds. Return each hook on a new line, separated by --- on its own line.`,

  "instagram-reels-caption-generator": `Generate 5 Instagram Reel captions for: {input}
Make them hook-driven with emojis and hashtags. Return each caption on a new line, separated by --- on its own line.`,

  "instagram-bio-generator": `Generate 5 catchy Instagram bios for: {input}
Keep each under 150 characters. Include emoji and a clear value. Return each bio on a new line, separated by --- on its own line.`,

  "instagram-comment-reply-generator": `Generate 5 engaging Instagram comment replies for: {input}
Make them friendly and encourage further engagement. Return each reply on a new line, separated by --- on its own line.`,

  "instagram-story-caption-generator": `Generate 5 Instagram Story captions or text overlays for: {input}
Keep them short and casual. Return each on a new line, separated by --- on its own line.`,

  "content-idea-bank": `Generate 5 content ideas for: {input}
Make them specific and actionable for short-form video. Return each idea on a new line, separated by --- on its own line.`,

  "script-outline-generator": `Generate 5 short-form script outlines for: {input}
Each should have: Hook (1 line), 3 beats, CTA. Return each outline on a new line, separated by --- on its own line.`,

  "tiktok-transition-generator": `Generate 5 TikTok transition ideas for: {input}
Make them trendy and easy to replicate. Return each on a new line, separated by --- on its own line.`,

  "youtube-community-post-generator": `Generate 5 YouTube Community tab post ideas for: {input}
Include polls, questions, updates. Return each on a new line, separated by --- on its own line.`,

  "instagram-carousel-caption-generator": `Generate 5 Instagram carousel captions for: {input}
Include swipe CTA and hooks. Return each on a new line, separated by --- on its own line.`,

  "tiktok-duet-idea-generator": `Generate 5 TikTok duet and stitch ideas for: {input}
Make them viral-worthy. Return each on a new line, separated by --- on its own line.`,

  "youtube-end-screen-generator": `Generate 5 YouTube end screen CTA ideas for: {input}
Include subscribe and video suggestions. Return each on a new line, separated by --- on its own line.`,

  "instagram-dm-generator": `Generate 5 Instagram DM templates for: {input}
Keep them friendly and professional. Return each on a new line, separated by --- on its own line.`,

  "tiktok-challenge-idea-generator": `Generate 5 TikTok challenge ideas for: {input}
Make them simple and shareable. Return each on a new line, separated by --- on its own line.`,

  "youtube-playlist-title-generator": `Generate 5 YouTube playlist titles for: {input}
Make them clear and searchable. Return each on a new line, separated by --- on its own line.`,

  "instagram-poll-idea-generator": `Generate 5 Instagram Story poll/question ideas for: {input}
Make them engaging. Return each on a new line, separated by --- on its own line.`,

  "short-form-script-generator": `Generate 5 short-form video scripts for: {input}
Each: Hook, 3 beats, CTA. For TikTok, Reels, Shorts. Return each on a new line, separated by --- on its own line.`,

  "viral-caption-generator": `Generate 5 viral captions for: {input}
Hook-driven, curiosity or emotion. For any short-form platform. Return each on a new line, separated by --- on its own line.`,

  "reel-hook-generator": `Create 5 Instagram Reel hooks for: {input}
Each should stop the scroll in 2 seconds. Return each hook on a new line, separated by --- on its own line.`
};

export const MAX_INPUT_LENGTH = 250;
