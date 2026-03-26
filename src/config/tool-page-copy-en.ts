/**
 * Native English hero + one-line Steps for global tool pages (not translated from Chinese).
 * Keys = `tools` slugs where `cnOnly` is false.
 */
export type ToolPageCopy = { hero: string; steps: string };

export const TOOL_PAGE_COPY_EN: Record<string, ToolPageCopy> = {
  "tiktok-caption-generator": {
    hero: "Got a video idea? Generate a full TikTok-ready package in one shot you can paste today—hook, script beats, caption, CTA, and hashtags (copy each block).",
    steps: "Work here, copy the blocks you need, paste them into TikTok's Describe your post field, tap Post, then check your Profile."
  },
  "ai-caption-generator": {
    hero: "Turn one topic or offer into a cross-platform post package—hooks, beats, caption, CTA, hashtags, and talking points you can adapt for TikTok, Reels, or Shorts.",
    steps: "Generate here, copy a package, paste into each app’s caption or description field when you publish, then tweak the voice to match you."
  },
  "hashtag-generator": {
    hero: "Turn your niche or video topic into hashtag sets for TikTok, Reels, and Shorts—relevant to your clip, ready to paste.",
    steps: "Generate here, copy 1–2 hashtag lines, paste them into the caption field (or first comment), then publish."
  },
  "hook-generator": {
    hero: "Fix a weak cold open: get scroll-stopping first lines plus talking points you can say on camera or drop into your caption.",
    steps: "Generate here, copy a hook, speak it in the first 1–3 seconds of the video, then use the rest in your caption or script doc."
  },
  "title-generator": {
    hero: "Turn your topic into title angles for YouTube, TikTok, Reels, or Shorts—so your headline matches your thumbnail and first frame.",
    steps: "Generate here, copy a title, paste it into your upload title field, then tweak 1 phrase to match your voice."
  },
  "tiktok-bio-generator": {
    hero: "Shape a short TikTok bio that says who you are, what you post, and what viewers should do next—without a wall of text.",
    steps: "Generate here, copy one line, open TikTok → Profile → Edit profile → Bio, paste, save."
  },
  "youtube-title-generator": {
    hero: "Brainstorm click-worthy YouTube titles from one topic—tuned for search and browse, not generic filler.",
    steps: "Generate here, copy a title, open YouTube Studio → Content → your video → Details → Title, paste, save."
  },
  "instagram-caption-generator": {
    hero: "Turn your idea into feed captions with structure—hook, body, CTA, and hashtags—ready for Reels or photo posts.",
    steps: "Generate here, copy text, open Instagram → New post → paste into the Caption field, then publish."
  },
  "youtube-description-generator": {
    hero: "Draft a readable YouTube description with keywords, links, and CTAs—without staring at a blank box.",
    steps: "Generate here, copy, open YouTube Studio → your video → Details → Description, paste, save."
  },
  "tiktok-username-generator": {
    hero: "Get memorable handle ideas that match your niche—availability is still checked in TikTok when you change your username.",
    steps: "Generate here, copy a handle, open TikTok → Profile → Edit profile → Username, change if available, save."
  },
  "instagram-username-generator": {
    hero: "Brainstorm handle ideas that fit your brand; Instagram will tell you if a name is taken when you try to change it.",
    steps: "Generate here, copy, open Instagram → Profile → Edit profile → Username, paste or adjust, save."
  },
  "tiktok-idea-generator": {
    hero: "Break a vague niche into concrete video angles you can film this week—not generic “post more” advice.",
    steps: "Generate here, copy an idea into your shoot list or script doc, then build the hook and caption in your usual workflow."
  },
  "youtube-video-idea-generator": {
    hero: "Turn your channel topic into video concepts with angles people actually search and click—not one-word prompts.",
    steps: "Generate here, copy an idea into your content calendar or Studio upload flow when you’re ready to produce."
  },
  "tiktok-script-generator": {
    hero: "Outline a short TikTok with beats and lines so you’re not improvising from zero on camera.",
    steps: "Generate here, copy, paste into Notes or your teleprompter app, film, then paste the caption into Describe your post."
  },
  "youtube-script-generator": {
    hero: "Structure a YouTube video with intro, main beats, and outro—so editing and talking points stay coherent.",
    steps: "Generate here, copy into your script doc or teleprompter, record, then paste supporting lines into the description if you want."
  },
  "viral-hook-generator": {
    hero: "Pull a list of bold openers for short video—built to earn the first second, not to sound like a blog intro.",
    steps: "Generate here, copy, use as your first spoken line or on-screen text, then align the rest of the clip to match."
  },
  "story-hook-generator": {
    hero: "Get story-style openings that set stakes fast—good for narrative, recap, or “here’s what happened” formats.",
    steps: "Generate here, copy, place at the start of your story beat sheet or first clip, then continue the arc."
  },
  "clickbait-title-generator": {
    hero: "Explore curiosity-driven title angles—still edit so they match what’s actually in the video.",
    steps: "Generate here, copy, paste into the platform title field at upload time; avoid misleading viewers."
  },
  "ai-video-title-generator": {
    hero: "Produce title variants tuned for discovery and clarity on short-form and long-form uploads.",
    steps: "Generate here, copy, paste into the title field on the upload or Studio screen for that platform."
  },
  "social-media-post-generator": {
    hero: "Draft short posts you can drop into feed captions or text slots—then trim for each platform’s tone limit.",
    steps: "Generate here, copy, paste into the composer for TikTok, Instagram, YouTube Community, or LinkedIn as fits."
  },
  "instagram-hashtag-generator": {
    hero: "Build hashtag sets from your topic for Reels and feed posts—mix niche and broader tags without stuffing.",
    steps: "Generate here, copy, paste into your Instagram caption before you publish."
  },
  "youtube-tag-generator": {
    hero: "Suggest SEO-style tags from your topic to paste into YouTube’s tag field—supporting title and description, not replacing them.",
    steps: "Generate here, copy, open YouTube Studio → your video → Details → Tags (or show more), paste, save."
  },
  "tiktok-hashtag-generator": {
    hero: "Get hashtag lines tailored to your niche for TikTok’s caption box—keep them relevant to the actual clip.",
    steps: "Generate here, copy, paste into Describe your post on the TikTok publish screen."
  },
  "reel-caption-generator": {
    hero: "Write Reels captions with hook, CTA, and hashtags in one pass—ready for Instagram’s caption field.",
    steps: "Generate here, copy, open Instagram Reels → paste into Caption, then post."
  },
  "shorts-title-generator": {
    hero: "Brainstorm Shorts titles from your topic that read well on mobile browse and next to the thumbnail.",
    steps: "Generate here, copy, open YouTube Studio or the Shorts upload flow → Title field, paste, publish."
  },
  "tiktok-hook-generator": {
    hero: "Generate TikTok-specific openers you can say in the first second—paired with angles that fit vertical video.",
    steps: "Generate here, copy, lead your video with that line, then paste supporting text into Describe your post."
  },
  "tiktok-comment-reply-generator": {
    hero: "Draft quick, on-brand replies to comments so threads stay active without sounding robotic.",
    steps: "Generate here, copy, open the comment on TikTok → Reply, paste, send."
  },
  "tiktok-story-generator": {
    hero: "Ideas and short lines for TikTok Stories-style posts—tight phrasing for ephemeral or light-touch updates.",
    steps: "Generate here, copy, paste into TikTok’s story or text flow for that product surface, then post."
  },
  "tiktok-trend-caption-generator": {
    hero: "Pair trending sounds or formats with caption angles so your text matches the trend, not generic filler.",
    steps: "Generate here, copy, paste into Describe your post after you attach the trending sound or template."
  },
  "tiktok-video-idea-generator": {
    hero: "Turn your niche into shootable TikTok concepts—angles you can film with a phone, not vague themes.",
    steps: "Generate here, copy into your content calendar, then script the hook and caption in your usual tools."
  },
  "youtube-shorts-title-generator": {
    hero: "Title ideas optimized for Shorts discovery—short, readable, and aligned with your first frame.",
    steps: "Generate here, copy, paste into the Shorts title field in the YouTube app or Studio."
  },
  "youtube-thumbnail-text-generator": {
    hero: "Short punchy lines meant to sit on a thumbnail—few words, high contrast, easy to read on a phone.",
    steps: "Generate here, copy, place the text on your thumbnail in Canva, Photoshop, or CapCut, then upload with the video."
  },
  "youtube-hook-generator": {
    hero: "Openers for long-form or Shorts that grab attention in the first five seconds—voiceover or on-camera.",
    steps: "Generate here, copy, use at the start of your edit timeline or script, then keep the rest of the video on-promise."
  },
  "instagram-reels-caption-generator": {
    hero: "Captions tuned for Reels—hook, body, CTA, and tags in one block you can paste under the video.",
    steps: "Generate here, copy, paste into the Reels caption field before you share."
  },
  "instagram-bio-generator": {
    hero: "A tight Instagram bio that explains who you are and what to tap next—link, follow, or DM.",
    steps: "Generate here, copy, open Profile → Edit profile → Bio, paste, save."
  },
  "instagram-comment-reply-generator": {
    hero: "Replies that sound human for feed and Reels comments—good for FAQs and light engagement.",
    steps: "Generate here, copy, open the comment thread → Reply, paste, send."
  },
  "instagram-story-caption-generator": {
    hero: "Short lines for Stories—stickers, captions, or CTA text you can paste without cluttering the frame.",
    steps: "Generate here, copy, paste into Stories text or the caption sticker, then post."
  },
  "tiktok-transition-generator": {
    hero: "Shot and transition ideas so your edit has a clear before/after—not random effects with no story.",
    steps: "Generate here, copy cues into your shot list or CapCut timeline, then film and match the cuts."
  },
  "youtube-community-post-generator": {
    hero: "Community tab posts that announce, tease, or poll subscribers—plain text you can paste as-is.",
    steps: "Generate here, copy, open YouTube Studio → Community → create post, paste, publish."
  },
  "instagram-carousel-caption-generator": {
    hero: "Carousel copy with slide-aware hooks and a CTA—so each swipe still makes sense.",
    steps: "Generate here, copy, paste into the caption for your multi-image post, then upload slides in order."
  },
  "tiktok-duet-idea-generator": {
    hero: "Angles for duets and stitches—what to add so your side of the split screen earns attention.",
    steps: "Generate here, copy, pick the original video in TikTok → Duet or Stitch, then follow your idea while recording."
  },
  "youtube-end-screen-generator": {
    hero: "Short CTAs for outros—subscribe, next video, or playlist prompts you can speak or show on screen.",
    steps: "Generate here, copy, add to your end screen in YouTube Studio or speak it over your last 15–20 seconds."
  },
  "instagram-dm-generator": {
    hero: "DM openers and follow-ups for creators and small businesses—polite, direct, not spammy.",
    steps: "Generate here, copy, open Instagram DMs → paste into the message field, send."
  },
  "tiktok-challenge-idea-generator": {
    hero: "Challenge concepts with a clear action and hashtag angle—built for participation, not vague trends.",
    steps: "Generate here, copy, post your kickoff video with the challenge line in Describe your post, then stitch responses."
  },
  "youtube-playlist-title-generator": {
    hero: "Playlist names that explain the binge in a few words—good for series and topic bins.",
    steps: "Generate here, copy, open YouTube Studio → Playlists → create or edit playlist → Title, paste, save."
  },
  "instagram-poll-idea-generator": {
    hero: "Poll questions and options for Stories—binary or multi-choice ideas you can paste fast.",
    steps: "Generate here, copy, open Stories → Poll sticker, paste question and options, post."
  },
  "short-form-script-generator": {
    hero: "A compact script skeleton for vertical video—beats you can shoot in one sitting.",
    steps: "Generate here, copy into Notes or your teleprompter, film, then paste the caption into each platform’s post screen."
  },
  "viral-caption-generator": {
    hero: "Caption angles with energy and clarity for any short-form feed—trim per platform character habits.",
    steps: "Generate here, copy, paste into TikTok, Reels, or Shorts caption fields depending on where you post."
  },
  "reel-hook-generator": {
    hero: "First-line ideas for Reels that match how people preview sound-off and sound-on.",
    steps: "Generate here, copy, use as on-screen text or your first spoken line, then align the rest of the Reel."
  },
  "content-idea-bank": {
    hero: "A running list of angles you can schedule—not a random quote; each line is a shootable concept.",
    steps: "Generate here, copy lines into Notion, Sheets, or your calendar, then promote the best ones to full scripts."
  },
  "script-outline-generator": {
    hero: "Hook, beats, CTA, and caption notes in one outline—short-form friendly.",
    steps: "Generate here, copy into your script or teleprompter doc, film, then paste caption text when you publish."
  }
};

export function getToolPageCopyEn(slug: string): ToolPageCopy | undefined {
  return TOOL_PAGE_COPY_EN[slug];
}
