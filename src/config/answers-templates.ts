/**
 * Answer Engine templates - platform × topic combinations for 60 pages
 * Platforms: TikTok, YouTube, Instagram
 */

export type AnswerTemplate = {
  slug: string;
  question: string;
  shortAnswer: string;
  tldr: string;
  examples: string[];
  tips: string[];
  quickTips: string[];
  commonMistakes: string[];
  faq: { question: string; answer: string }[];
  toolSlug: string;
  toolName: string;
  platform: "tiktok" | "youtube" | "instagram";
  relatedTools?: { slug: string; name: string }[];
};

/** TikTok answers (~20) */
const TIKTOK_ANSWERS: AnswerTemplate[] = [
  {
    platform: "tiktok",
    slug: "how-to-write-tiktok-captions",
    question: "How to Write TikTok Captions That Get Engagement?",
    shortAnswer:
      "Write TikTok captions that hook in the first line, use emojis for personality, add a clear CTA, and keep them under 150 characters for best visibility. Match the tone to your video—funny, relatable, or inspiring—and use line breaks for readability.",
    tldr: "Hook first line, emojis, CTA, under 150 chars. Match tone to video.",
    examples: [
      "POV: You finally understand the assignment 😭✨",
      "When your coffee hits different ☕️ (link in bio)",
      "No thoughts just vibes 🎵 drop a 🔥 if you relate"
    ],
    tips: [
      "Start with a hook—first 3–5 words decide if they read more",
      "Use 1–3 emojis max; too many looks spammy",
      "Add a CTA: 'follow for more', 'comment below', 'link in bio'",
      "Keep under 150 chars so caption isn't cut off in feed",
      "Match your caption tone to the video mood"
    ],
    quickTips: ["Hook in first line", "Under 150 chars", "1–3 emojis", "Add CTA"],
    commonMistakes: [
      "Writing long captions that get cut off",
      "Using too many hashtags in the caption",
      "Generic openers like 'Check this out'",
      "No call-to-action"
    ],
    faq: [
      { question: "How long should a TikTok caption be?", answer: "Under 150 characters is ideal—longer captions get truncated in the feed." },
      { question: "Should I use hashtags in TikTok captions?", answer: "Yes, but sparingly. 3–5 niche hashtags work better than many generic ones." },
      { question: "What makes a TikTok caption go viral?", answer: "Relatability, a strong hook, and a clear CTA that invites comments." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }, { slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-caption-length",
    question: "What's the Best TikTok Caption Length?",
    shortAnswer:
      "Under 150 characters is ideal. TikTok truncates longer captions in the feed. Put your hook and key message in the first line. If you need more, use line breaks and put details after the fold.",
    tldr: "Under 150 chars. Hook first. Details after 'more'.",
    examples: ["POV: main character energy ✨", "When Monday hits different 😴", "No cap this changed everything"],
    tips: [
      "First 150 chars = what most people see",
      "Put the hook before any hashtags",
      "Use 'more' for story or context",
      "Test: does it make sense when truncated?"
    ],
    quickTips: ["<150 chars", "Hook first", "Test truncated view"],
    commonMistakes: [
      "Putting the punchline after 150 chars",
      "Starting with hashtags",
      "Writing essays that nobody expands"
    ],
    faq: [
      { question: "Why does TikTok cut off my caption?", answer: "TikTok shows roughly the first 150 characters. Put your hook there." },
      { question: "Can I write longer TikTok captions?", answer: "Yes, but the first 150 chars matter most. Rest is behind 'more'." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-hook-ideas",
    question: "How to Write TikTok Hooks That Stop the Scroll?",
    shortAnswer:
      "Open with a question, bold claim, or POV in the first 3 seconds. Create curiosity or emotion. Use pattern interrupts—unexpected visuals or tone. No slow intros; viewers decide in 3 seconds.",
    tldr: "Question, claim, or POV in 3 seconds. No slow intros.",
    examples: [
      "POV: You just discovered the secret",
      "Nobody talks about this...",
      "I wish someone told me this sooner"
    ],
    tips: [
      "First 3 seconds = everything",
      "Questions that your audience asks",
      "Bold claims need payoff in the video",
      "POV and 'nobody talks about' work across niches"
    ],
    quickTips: ["3-second hook", "Create curiosity", "No intro"],
    commonMistakes: [
      "Slow intro before the hook",
      "Generic 'Hey guys' openers",
      "Bold claim with no payoff"
    ],
    faq: [
      { question: "How long should a TikTok hook be?", answer: "The hook should land in the first 3 seconds—one sentence, 15–25 words max." },
      { question: "What hooks work best on TikTok?", answer: "POV, questions, bold claims, and 'nobody talks about' tend to perform well." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-hashtag-strategy",
    question: "What's the Best Hashtag Strategy for TikTok?",
    shortAnswer:
      "Use 3–5 niche hashtags. Mix of mid-size (100K–1M posts) and smaller niche tags. Avoid only huge hashtags. Put in caption or first comment. Research what top creators in your niche use.",
    tldr: "3–5 niche hashtags. Mix sizes. Research competitors.",
    examples: ["#fyp #foryou #viral #niche #tips", "#fitness #gym #workout #transformation"],
    tips: [
      "3–5 hashtags is the sweet spot",
      "Mix: 1–2 broad + 2–3 niche",
      "Check what's trending in your niche",
      "First comment keeps caption clean"
    ],
    quickTips: ["3–5 tags", "Niche mix", "First comment"],
    commonMistakes: [
      "Using only #fyp #foryou",
      "Too many hashtags (looks spammy)",
      "Irrelevant hashtags for reach"
    ],
    faq: [
      { question: "How many hashtags should I use on TikTok?", answer: "3–5 niche hashtags. Quality over quantity." },
      { question: "Should hashtags be in caption or comment?", answer: "Either works. First comment keeps the caption cleaner." }
    ],
    toolSlug: "hashtag-generator",
    toolName: "Hashtag Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }]
  },
  {
    platform: "tiktok",
    slug: "how-many-hashtags-on-tiktok",
    question: "How many hashtags should you use on TikTok?",
    shortAnswer:
      "3–5 hashtags is the sweet spot. Use a mix of niche and broader tags. More than 5 looks spammy. Put them in the caption or first comment. Quality over quantity.",
    tldr: "3–5 hashtags. Mix niche + broader. Quality over quantity.",
    examples: ["#fyp #foryou #viral #niche #tips", "#fitness #gym #workout"],
    tips: ["3–5 hashtags max", "Mix niche and broader", "First comment option", "Research competitors"],
    quickTips: ["3–5 tags", "Niche mix", "First comment"],
    commonMistakes: ["Too many hashtags", "Only #fyp #foryou", "Irrelevant tags"],
    faq: [
      { question: "How many hashtags should I use on TikTok?", answer: "3–5. Quality over quantity." },
      { question: "Should hashtags be in caption or comment?", answer: "Either. First comment keeps caption clean." }
    ],
    toolSlug: "hashtag-generator",
    toolName: "Hashtag Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }]
  },
  {
    platform: "tiktok",
    slug: "do-tiktok-captions-matter",
    question: "Do captions matter on TikTok?",
    shortAnswer:
      "Yes. Captions influence watch time (viewers read while watching), engagement (CTAs drive comments), and discoverability (keywords help search). A strong first line can reduce scroll-past.",
    tldr: "Yes. Watch time, engagement, discoverability.",
    examples: ["Hook + CTA", "Keywords in first line", "Comment prompt"],
    tips: ["First line = scroll stopper", "Keywords for search", "CTA for engagement"],
    quickTips: ["First line", "Keywords", "CTA"],
    commonMistakes: ["No caption", "Generic caption", "No CTA"],
    faq: [
      { question: "Do captions affect TikTok algorithm?", answer: "Indirectly. Engagement and watch time from captions can boost performance." },
      { question: "Should I use keywords in captions?", answer: "Yes. Helps with search and discoverability." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-bio-tips",
    question: "How to Write a TikTok Bio That Converts?",
    shortAnswer:
      "Keep it short and clear. State who you are and what you do in one line. Add a CTA (link in bio, follow for more). Use emojis sparingly. Match your content vibe.",
    tldr: "Who you are + what you do + CTA. One line.",
    examples: ["Fitness coach 💪 DM for 1:1", "Making money online 📈 Tips daily", "Your daily dose of chaos ✨"],
    tips: [
      "80 chars max—every word counts",
      "Lead with value or identity",
      "CTA: link, follow, DM",
      "Emojis: 1–2 max"
    ],
    quickTips: ["80 chars", "Value first", "CTA"],
    commonMistakes: [
      "Vague or generic bio",
      "No call-to-action",
      "Too many emojis"
    ],
    faq: [
      { question: "How long can a TikTok bio be?", answer: "80 characters. Make each word count." },
      { question: "What should a TikTok bio include?", answer: "Who you are, what you offer, and a CTA (link, follow, DM)." }
    ],
    toolSlug: "tiktok-bio-generator",
    toolName: "TikTok Bio Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-viral-captions",
    question: "What Makes TikTok Captions Go Viral?",
    shortAnswer:
      "Relatability, a strong hook, and a CTA that invites comments. Captions that ask questions, use 'drop a 🔥 if', or create curiosity get more engagement. Match trending formats.",
    tldr: "Relatable + hook + comment CTA. Match trends.",
    examples: [
      "Drop a 🔥 if you'd do this",
      "Comment YES if you agree",
      "POV: You're the main character"
    ],
    tips: [
      "Invite comments—'drop a 🔥', 'tag someone'",
      "Relatable = shareable",
      "Match trending sounds and formats",
      "Bold first line"
    ],
    quickTips: ["Comment CTA", "Relatable", "Trend match"],
    commonMistakes: [
      "No engagement ask",
      "Generic captions",
      "Ignoring trending formats"
    ],
    faq: [
      { question: "Do viral captions need to be short?", answer: "Usually yes. Hook in first line. CTA. Keep it punchy." },
      { question: "Should I use trending phrases?", answer: "Yes, when they fit your content. Don't force it." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-username-ideas",
    question: "How to Choose a TikTok Username?",
    shortAnswer:
      "Keep it short, memorable, and on-brand. Use your name, niche, or a catchy phrase. Avoid numbers unless they're part of your brand. Check availability across platforms.",
    tldr: "Short, memorable, on-brand. No random numbers.",
    examples: ["@fitwithjake", "@thecoffeelady", "@moneytipsdaily"],
    tips: [
      "Under 15 chars if possible",
      "Easy to spell and say",
      "Consistent with other platforms",
      "Avoid underscores and numbers"
    ],
    quickTips: ["Short", "Memorable", "On-brand"],
    commonMistakes: [
      "Random numbers (user123)",
      "Too long or hard to spell",
      "Inconsistent with Instagram/YouTube"
    ],
    faq: [
      { question: "Can I change my TikTok username?", answer: "Yes, but you can only change it every 30 days." },
      { question: "Should my username match my niche?", answer: "It helps. @fitwithjake is clearer than @jake123." }
    ],
    toolSlug: "tiktok-username-generator",
    toolName: "TikTok Username Generator",
    relatedTools: [{ slug: "tiktok-bio-generator", name: "TikTok Bio Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-caption-emojis",
    question: "Should You Use Emojis in TikTok Captions?",
    shortAnswer:
      "Yes, 1–3 emojis add personality and catch the eye. Don't overdo it—too many looks spammy. Match emojis to your tone. Use them to replace words sometimes (☕️ for coffee).",
    tldr: "1–3 emojis. Match tone. Don't spam.",
    examples: ["POV: main character energy ✨", "No thoughts just vibes 🎵", "Monday mood 😴"],
    tips: [
      "1–3 emojis per caption",
      "Reinforce the mood",
      "Replace words when natural",
      "Avoid emoji walls"
    ],
    quickTips: ["1–3 emojis", "Match mood", "No spam"],
    commonMistakes: [
      "Too many emojis (looks spammy)",
      "Random unrelated emojis",
      "Emojis that confuse the message"
    ],
    faq: [
      { question: "How many emojis should I use?", answer: "1–3. More than that can look unprofessional." },
      { question: "Do emojis help TikTok engagement?", answer: "They can catch the eye and add personality when used sparingly." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-cta-captions",
    question: "What CTAs Work Best in TikTok Captions?",
    shortAnswer:
      "'Follow for more', 'Comment below', 'Link in bio', 'Drop a 🔥 if', 'Tag someone who', 'Save this'. Simple, direct CTAs get more action. Match CTA to your goal.",
    tldr: "Follow, comment, link, tag. Simple and direct.",
    examples: [
      "Follow for more tips 👆",
      "Drop a 🔥 if you relate",
      "Tag someone who needs this"
    ],
    tips: [
      "One CTA per caption",
      "Match to goal: follows, comments, link clicks",
      "Keep it short",
      "Use emoji to highlight"
    ],
    quickTips: ["One CTA", "Match goal", "Short"],
    commonMistakes: [
      "No CTA at all",
      "Multiple conflicting CTAs",
      "Vague 'check it out'"
    ],
    faq: [
      { question: "What's the best CTA for TikTok?", answer: "Depends on goal. 'Follow for more' for growth, 'link in bio' for conversions." },
      { question: "Should every TikTok have a CTA?", answer: "Most should. It guides viewers to the next action." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-funny-captions",
    question: "How to Write Funny TikTok Captions?",
    shortAnswer:
      "Use self-deprecating humor, relatable observations, or unexpected punchlines. Keep it short. POV and 'when' formats work well. Match the video's comedic timing.",
    tldr: "Relatable + punchline. POV and 'when' formats.",
    examples: [
      "POV: You're pretending to have your life together",
      "When the WiFi goes out and you remember you have a personality",
      "Me: I'll be productive today. Also me: *naps*"
    ],
    tips: [
      "Relatable > try-hard funny",
      "POV and 'when' are easy formats",
      "Self-deprecating works",
      "Short punchlines"
    ],
    quickTips: ["Relatable", "POV format", "Short"],
    commonMistakes: [
      "Forced or cringe humor",
      "Too long before punchline",
      "Overexplaining the joke"
    ],
    faq: [
      { question: "What makes a TikTok caption funny?", answer: "Relatability and unexpected punchlines. Don't try too hard." },
      { question: "Should funny captions be short?", answer: "Yes. Punchy one-liners work best." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-pov-captions",
    question: "How to Use POV in TikTok Captions?",
    shortAnswer:
      "POV = point of view. Use for relatable scenarios: 'POV: You...', 'POV: When...'. Creates instant connection. Keep it short. Works for humor, relatability, and storytelling.",
    tldr: "POV: relatable scenario. Short. Instant connection.",
    examples: ["POV: You're the main character", "POV: When Monday hits", "POV: You finally understand"],
    tips: ["Relatable scenario", "Short and punchy", "Match video mood"],
    quickTips: ["Relatable", "Short", "Match video"],
    commonMistakes: ["Overused POV", "Unrelated to video", "Too long"],
    faq: [
      { question: "What does POV mean in TikTok?", answer: "Point of view. Used for relatable scenarios." },
      { question: "Should every caption use POV?", answer: "No. Use when it fits. Don't force it." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-trending-sounds-captions",
    question: "How to Write Captions for Trending TikTok Sounds?",
    shortAnswer:
      "Match the caption to the sound's vibe. Use the trend's format or add a twist. Keep it short. Relatable or funny works. Don't overexplain—let the sound do the work.",
    tldr: "Match sound vibe. Use trend format. Short. Relatable.",
    examples: ["When the sound hits different", "POV: This is your sign", "No thoughts just vibes"],
    tips: ["Match sound vibe", "Trend format", "Short"],
    quickTips: ["Match vibe", "Trend format", "Short"],
    commonMistakes: ["Mismatched caption", "Overexplaining", "Generic"],
    faq: [
      { question: "Should caption match the sound?", answer: "Yes. Caption and sound should reinforce each other." },
      { question: "How do I caption trend videos?", answer: "Use the trend's format or add a relatable twist." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-engagement-captions",
    question: "How to Write TikTok Captions That Get Comments?",
    shortAnswer:
      "Ask a question. Use 'drop a 🔥 if', 'comment YES or NO', 'tag someone who'. Create debate or relatability. End with an engagement prompt. Make it easy to respond.",
    tldr: "Ask question. Comment CTA. Easy to respond.",
    examples: ["Drop a 🔥 if you'd do this", "Comment YES or NO", "Tag someone who needs this"],
    tips: ["Ask a question", "Comment CTA", "Easy to respond"],
    quickTips: ["Question", "Comment CTA", "Easy reply"],
    commonMistakes: ["No engagement ask", "Hard to respond", "Generic"],
    faq: [
      { question: "What captions get the most comments?", answer: "Questions and 'comment X if' prompts. Make it easy to respond." },
      { question: "Should I ask for comments in every video?", answer: "Most videos. Vary the type—questions, polls, tags." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-duet-captions",
    question: "How to Write Captions for TikTok Duets?",
    shortAnswer:
      "Keep it short. Reference the original or add your twist. Use 'POV:', 'When...', or a reaction. Duets are about the interaction—caption should complement, not overpower.",
    tldr: "Short. Reference original. Complement the duet.",
    examples: ["POV: You're the other half", "When they said... and you...", "The duet we needed"],
    tips: ["Short caption", "Reference or twist", "Don't overpower"],
    quickTips: ["Short", "Reference", "Complement"],
    commonMistakes: ["Long caption", "Unrelated caption", "Overexplaining"],
    faq: [
      { question: "Should duet captions be different?", answer: "Shorter. Focus on the interaction or your twist." },
      { question: "Do duets need captions?", answer: "Helpful for context. Keep minimal." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-storytime-captions",
    question: "How to Write TikTok Storytime Captions?",
    shortAnswer:
      "Hook with the story premise. 'POV:', 'Storytime:', or 'So this happened...'. Tease the outcome. Keep first line under 150 chars. Use line breaks for longer stories.",
    tldr: "Story premise hook. Tease outcome. <150 chars first line.",
    examples: ["Storytime: How I...", "POV: You're about to hear the craziest...", "So this happened..."],
    tips: ["Tease the story", "Hook first", "Line breaks for long"],
    quickTips: ["Tease", "Hook", "Line breaks"],
    commonMistakes: ["Spoiling the story", "No hook", "Wall of text"],
    faq: [
      { question: "What makes a good storytime caption?", answer: "Hook that teases the story. Don't spoil the ending." },
      { question: "How long can storytime captions be?", answer: "First line <150 chars. Rest can expand with line breaks." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-tutorial-captions",
    question: "How to Write TikTok Tutorial Captions?",
    shortAnswer:
      "Lead with the outcome. 'How to X in 30 seconds', 'The easiest way to...'. Add steps or tips in caption. CTA: save, follow, comment. Clear value proposition.",
    tldr: "Outcome first. Steps/tips. Save/follow CTA.",
    examples: ["How to X in 30 sec", "The easiest way to...", "3 steps to..."],
    tips: ["Outcome in first line", "Steps or tips", "Save CTA"],
    quickTips: ["Outcome", "Steps", "Save CTA"],
    commonMistakes: ["Vague caption", "No value", "No CTA"],
    faq: [
      { question: "What should tutorial captions include?", answer: "Outcome, key steps, and a save or follow CTA." },
      { question: "How long should tutorial captions be?", answer: "First line = outcome. Rest = steps or tips." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  }
];

/** YouTube answers (~20) */
const YOUTUBE_ANSWERS: AnswerTemplate[] = [
  {
    platform: "youtube",
    slug: "how-to-write-youtube-hooks",
    question: "How to Write YouTube Hooks That Keep Viewers Watching?",
    shortAnswer:
      "Open with a question, bold claim, or surprising fact in the first 3–5 seconds. Promise value or create curiosity. Use pattern interrupts—unexpected visuals or tone shifts—to stop the scroll.",
    tldr: "Question, claim, or surprise in first 3–5 seconds. Promise value, create curiosity.",
    examples: [
      "What if I told you 90% of creators get this wrong?",
      "Stop scrolling. This changed everything for me.",
      "The one habit that doubled my views in 30 days"
    ],
    tips: [
      "Hook in 3–5 seconds—viewers decide to stay or leave fast",
      "Use questions that your audience already asks",
      "Bold claims need a payoff—deliver on the promise",
      "Pattern interrupt: unexpected visual or tone grabs attention"
    ],
    quickTips: ["3–5 sec hook", "Bold claim", "Deliver payoff"],
    commonMistakes: [
      "Slow intro before the hook",
      "Bold claim with no payoff",
      "Hook doesn't match thumbnail"
    ],
    faq: [
      { question: "How long should a YouTube hook be?", answer: "The verbal hook should land in the first 3–5 seconds. One sentence, 15–25 words max." },
      { question: "What's the best type of YouTube hook?", answer: "Questions for tutorials, bold claims for how-tos, story hooks for vlogs." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "title-generator", name: "Title Generator" }, { slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-title-tips",
    question: "How to Write YouTube Titles That Get Clicks?",
    shortAnswer:
      "50–60 characters for full display in search. Front-load keywords and the hook. Use numbers, power words, and curiosity. Match the thumbnail. A/B test.",
    tldr: "50–60 chars. Keywords first. Match thumbnail.",
    examples: [
      "I Tried X for 30 Days (Results Shocked Me)",
      "The #1 Mistake Most People Make",
      "How to X in 5 Minutes (2025 Guide)"
    ],
    tips: [
      "50–60 chars = full title in search",
      "Keywords in first half",
      "Numbers and power words work",
      "Thumbnail and title must align"
    ],
    quickTips: ["50–60 chars", "Keywords first", "Match thumbnail"],
    commonMistakes: [
      "Title too long (gets cut off)",
      "Clickbait with no delivery",
      "Title and thumbnail mismatch"
    ],
    faq: [
      { question: "What's the ideal YouTube title length?", answer: "50–60 characters so the full title shows in search and suggested." },
      { question: "Should I use keywords in the title?", answer: "Yes. Front-load them. First 3–5 words matter most for SEO." }
    ],
    toolSlug: "youtube-title-generator",
    toolName: "YouTube Title Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-shorts-hooks",
    question: "How to Write Hooks for YouTube Shorts?",
    shortAnswer:
      "Same as TikTok—hook in first 3 seconds. Question, bold claim, or POV. No intro. Create curiosity or emotion. Shorts viewers scroll fast; the hook decides everything.",
    tldr: "3-second hook. No intro. Question or claim.",
    examples: [
      "POV: You just learned the secret",
      "Nobody talks about this...",
      "This one habit changed everything"
    ],
    tips: [
      "First 3 seconds = everything",
      "No 'hey guys' or intro",
      "Curiosity or emotion",
      "Match the thumbnail"
    ],
    quickTips: ["3 sec hook", "No intro", "Curiosity"],
    commonMistakes: [
      "Slow build-up",
      "Generic opener",
      "Hook and thumbnail don't match"
    ],
    faq: [
      { question: "Are YouTube Shorts hooks different from long-form?", answer: "Shorts need faster hooks—3 seconds. Long-form can build slightly more." },
      { question: "What hooks work best on Shorts?", answer: "Questions, bold claims, POV, and 'nobody talks about' perform well." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-description-seo",
    question: "How to Write YouTube Descriptions for SEO?",
    shortAnswer:
      "First 2–3 sentences matter most—include keywords. Expand with timestamps, links, and context. Use natural keyword placement. Don't keyword stuff. 200–300 words is a good target.",
    tldr: "Keywords in first 2–3 sentences. Timestamps. 200–300 words.",
    examples: [
      "In this video I share the exact system I use to...",
      "0:00 Intro\n0:45 Main tip\n1:30 Example\n2:00 Conclusion"
    ],
    tips: [
      "First 2–3 sentences = visible in search",
      "Add timestamps for longer videos",
      "Natural keyword placement",
      "Include links and resources"
    ],
    quickTips: ["Keywords first", "Timestamps", "200–300 words"],
    commonMistakes: [
      "Keyword stuffing",
      "Empty or generic descriptions",
      "No timestamps for long videos"
    ],
    faq: [
      { question: "How long should a YouTube description be?", answer: "200–300 words with keywords in the first 2–3 sentences." },
      { question: "Do descriptions affect YouTube SEO?", answer: "Yes. The first 2–3 sentences are especially important for search." }
    ],
    toolSlug: "youtube-description-generator",
    toolName: "YouTube Description Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-viral-hooks",
    question: "What Makes YouTube Hooks Go Viral?",
    shortAnswer:
      "Curiosity gap, emotional trigger, or bold claim. The viewer must feel they'll miss something if they leave. Pattern interrupt—unexpected visual or tone. Deliver on the promise.",
    tldr: "Curiosity + emotion + bold claim. Deliver the payoff.",
    examples: [
      "What if I told you everything you know is wrong?",
      "I lost 50K subscribers doing this",
      "The algorithm doesn't want you to see this"
    ],
    tips: [
      "Create curiosity gap",
      "Bold claims need proof",
      "Pattern interrupt",
      "Payoff must match the hook"
    ],
    quickTips: ["Curiosity", "Bold claim", "Deliver payoff"],
    commonMistakes: [
      "Clickbait with no delivery",
      "Slow build before hook",
      "Hook doesn't match content"
    ],
    faq: [
      { question: "What makes a hook go viral?", answer: "Curiosity gap, emotional trigger, or bold claim. Plus delivering on the promise." },
      { question: "Should I use clickbait?", answer: "Create curiosity, but always deliver. Fake clickbait kills trust." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-thumbnail-title-match",
    question: "Should YouTube Title and Thumbnail Match?",
    shortAnswer:
      "Yes. Title and thumbnail should reinforce the same promise. Mismatch confuses viewers and hurts CTR and retention. Use complementary text and visuals—not identical, but aligned.",
    tldr: "Reinforce same promise. Aligned, not identical.",
    examples: [
      "Title: 'I Quit Social Media for 30 Days' + Thumbnail: shocked face",
      "Title: 'The #1 Mistake' + Thumbnail: big red X"
    ],
    tips: [
      "Same promise, different execution",
      "Thumbnail = visual hook, title = text hook",
      "Test combinations",
      "Avoid misleading either"
    ],
    quickTips: ["Same promise", "Complementary", "Test"],
    commonMistakes: [
      "Title and thumbnail say different things",
      "Misleading either element",
      "Generic thumbnail for strong title"
    ],
    faq: [
      { question: "Do title and thumbnail need to match exactly?", answer: "No. They should reinforce the same promise, not repeat each other." },
      { question: "What if my thumbnail and title don't match?", answer: "Fix it. Mismatch hurts CTR and viewer trust." }
    ],
    toolSlug: "youtube-title-generator",
    toolName: "YouTube Title Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-intro-hooks",
    question: "How Long Should a YouTube Intro Be?",
    shortAnswer:
      "0–15 seconds for the hook. No long intro before the value. Hook first, then brief intro if needed. Viewers drop off in the first 30 seconds—every second counts.",
    tldr: "Hook in 0–15 sec. No long intro. Value first.",
    examples: [
      "Hook → 5 sec intro → content",
      "No intro, straight into the tip",
      "Question → answer → expand"
    ],
    tips: [
      "Hook before intro",
      "15 sec max for intro",
      "Or skip intro entirely",
      "Value in first 30 sec"
    ],
    quickTips: ["Hook first", "<15 sec intro", "Value fast"],
    commonMistakes: [
      "Long intro before hook",
      "Generic 'hey guys welcome back'",
      "Delaying the value"
    ],
    faq: [
      { question: "Should I have a YouTube intro?", answer: "Optional. If you do, keep it under 15 seconds. Hook first." },
      { question: "When do viewers drop off?", answer: "Most drop-off happens in the first 30 seconds. Hook and value early." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-ctr-titles",
    question: "How to Improve YouTube CTR with Titles?",
    shortAnswer:
      "Use curiosity, numbers, and power words. Front-load the hook. Match thumbnail. A/B test with different angles. Avoid all caps or excessive punctuation. 50–60 chars for full display.",
    tldr: "Curiosity + numbers. Match thumbnail. A/B test.",
    examples: [
      "5 Secrets That Changed My Channel",
      "Why Nobody Talks About This",
      "The $0 to $10K Method (Step by Step)"
    ],
    tips: [
      "Curiosity + specificity",
      "Numbers perform well",
      "Power words: secret, mistake, how, why",
      "Test different angles"
    ],
    quickTips: ["Curiosity", "Numbers", "A/B test"],
    commonMistakes: [
      "Generic titles",
      "All caps or excessive punctuation",
      "Title and thumbnail mismatch"
    ],
    faq: [
      { question: "What improves YouTube CTR?", answer: "Curiosity, numbers, clear value, and thumbnail-title alignment." },
      { question: "How do I test titles?", answer: "Use YouTube Studio to compare. Try different angles on similar videos." }
    ],
    toolSlug: "youtube-title-generator",
    toolName: "YouTube Title Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "youtube",
    slug: "how-to-write-viral-hooks",
    question: "How to Write Viral Hooks for Short-Form Video?",
    shortAnswer:
      "Viral hooks create instant curiosity or emotion. Use open loops, bold claims, questions, or 'POV' setups. The first 3 seconds decide everything—no slow builds. Test different angles and double down on what works.",
    tldr: "Curiosity or emotion in 3 seconds. Open loops, bold claims, POV. No slow builds.",
    examples: [
      "Nobody talks about this...",
      "POV: You just discovered the secret",
      "I wish someone told me this sooner"
    ],
    tips: [
      "First 3 seconds = everything",
      "Open loops: promise an answer, delay the payoff",
      "Bold claims need proof—deliver in the video",
      "POV and 'nobody talks about' work across niches"
    ],
    quickTips: ["3 sec hook", "Curiosity", "Deliver payoff"],
    commonMistakes: [
      "Slow intro before hook",
      "Bold claim with no payoff",
      "Same hook every time"
    ],
    faq: [
      { question: "What makes a hook go viral?", answer: "Curiosity gap, emotional trigger, or bold claim. Viewer feels they'll miss something." },
      { question: "How do I write hooks for different platforms?", answer: "Same principles—3-second hook, curiosity or emotion. Adapt tone to platform." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }, { slug: "title-generator", name: "Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-video-ideas",
    question: "How to Come Up with YouTube Video Ideas?",
    shortAnswer:
      "Check comments on your and competitor videos. Use trending topics in your niche. Answer common questions. Repurpose best-performing content. Use 'what', 'how', 'why' frameworks.",
    tldr: "Comments, trends, questions. Repurpose winners.",
    examples: ["How to X in 2025", "Why X Doesn't Work", "What I Wish I Knew About X"],
    tips: ["Mine comments", "Trending topics", "Answer questions"],
    quickTips: ["Comments", "Trends", "Questions"],
    commonMistakes: ["Ignoring audience", "Generic topics", "No research"],
    faq: [
      { question: "Where do YouTube ideas come from?", answer: "Comments, trends, competitor content, and audience questions." },
      { question: "Should I repurpose old videos?", answer: "Yes. Update and re-release top performers." }
    ],
    toolSlug: "youtube-video-idea-generator",
    toolName: "YouTube Video Idea Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-script-hooks",
    question: "How to Write a Hook for a YouTube Script?",
    shortAnswer:
      "Open the script with the hook. No preamble. Question, claim, or story. 15–25 words. The hook should be the first thing you say. Then support it in the intro.",
    tldr: "Hook first in script. 15–25 words. No preamble.",
    examples: ["What if I told you...", "The one mistake everyone makes...", "I lost $X doing this..."],
    tips: ["Hook = first line of script", "No intro before hook", "15–25 words"],
    quickTips: ["First line", "No preamble", "15–25 words"],
    commonMistakes: ["Intro before hook", "Hook too long", "Generic opener"],
    faq: [
      { question: "Where does the hook go in a script?", answer: "First. Before any intro or context." },
      { question: "How long should a script hook be?", answer: "15–25 words. One sentence." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-script-generator", name: "YouTube Script Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-retention-hooks",
    question: "How Do Hooks Help YouTube Retention?",
    shortAnswer:
      "Hooks decide if viewers stay in the first 30 seconds. Strong hook = higher retention. Retention affects algorithm. No hook = viewers leave before they're counted. Hook and deliver.",
    tldr: "Hook = retention. First 30 sec. Algorithm cares.",
    examples: ["Promise value in 3 sec", "Create curiosity", "Bold claim"],
    tips: ["First 30 sec matter", "Hook = stay or leave", "Deliver on promise"],
    quickTips: ["30 sec", "Deliver", "Retention"],
    commonMistakes: ["Slow start", "No hook", "Broken promise"],
    faq: [
      { question: "Does retention affect YouTube algorithm?", answer: "Yes. Higher retention = better recommendations." },
      { question: "When do viewers drop off?", answer: "Most in first 30 seconds. Hook and value early." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-outro-cta",
    question: "What CTA Should I Use in YouTube Outros?",
    shortAnswer:
      "One primary CTA: subscribe, like, or link. Don't overload. 'Subscribe for more', 'Like if this helped', 'Link in description'. Clear, direct, easy to act on.",
    tldr: "One CTA. Subscribe, like, or link. Clear and direct.",
    examples: ["Subscribe for more", "Like if this helped", "Link in description"],
    tips: ["One primary CTA", "Clear and direct", "Easy to act"],
    quickTips: ["One CTA", "Clear", "Direct"],
    commonMistakes: ["Too many CTAs", "Vague ask", "No CTA"],
    faq: [
      { question: "How many CTAs in an outro?", answer: "One primary. Maybe two if one is subscribe and one is link." },
      { question: "What's the best outro CTA?", answer: "Subscribe for growth. Like for algorithm. Link for conversions." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-shorts-vs-long-form-hooks",
    question: "Are Hooks Different for YouTube Shorts vs Long-Form?",
    shortAnswer:
      "Shorts need faster hooks—3 seconds. Long-form can build in 5–15 seconds. Same principles: curiosity, emotion, or bold claim. Shorts = more aggressive, long-form = can breathe slightly.",
    tldr: "Shorts: 3 sec. Long: 5–15 sec. Same principles.",
    examples: ["Shorts: instant hook", "Long: hook + brief setup"],
    tips: ["Shorts = 3 sec", "Long = 5–15 sec", "Same principles"],
    quickTips: ["Shorts faster", "Long can breathe", "Same principles"],
    commonMistakes: ["Same pace for both", "Slow Shorts hook", "Long-form no hook"],
    faq: [
      { question: "Do Shorts need different hooks?", answer: "Faster. 3 seconds. More aggressive." },
      { question: "Can I use the same hook for both?", answer: "Adapt the pace. Shorts = punchier." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-keywords-in-title",
    question: "How to Use Keywords in YouTube Titles?",
    shortAnswer:
      "Front-load keywords. First 3–5 words matter for SEO and CTR. Balance: keyword + hook. Don't keyword stuff. Natural and readable wins.",
    tldr: "Front-load. First 3–5 words. Balance keyword + hook.",
    examples: ["How to X in 2025", "X Tutorial for Beginners", "Why X Doesn't Work"],
    tips: ["Front-load", "First 3–5 words", "Natural"],
    quickTips: ["Front-load", "Balance", "Natural"],
    commonMistakes: ["Keyword stuffing", "Keyword at end", "Unreadable"],
    faq: [
      { question: "Where should keywords go in the title?", answer: "Front. First 3–5 words." },
      { question: "How many keywords in a title?", answer: "1–2 primary. Don't stuff." }
    ],
    toolSlug: "youtube-title-generator",
    toolName: "YouTube Title Generator",
    relatedTools: [{ slug: "youtube-description-generator", name: "YouTube Description Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-thumbnail-text",
    question: "How Much Text Should Be on a YouTube Thumbnail?",
    shortAnswer:
      "3–5 words max. Big, bold, readable. One main idea. Thumbnail text should reinforce the title, not repeat it. Less is more.",
    tldr: "3–5 words. Big, bold. One idea.",
    examples: ["I QUIT", "SECRET REVEALED", "5 MIN TUTORIAL"],
    tips: ["3–5 words", "Big and bold", "One idea"],
    quickTips: ["3–5 words", "Bold", "One idea"],
    commonMistakes: ["Too much text", "Unreadable", "Repeating title"],
    faq: [
      { question: "What's the ideal thumbnail text length?", answer: "3–5 words. Readable at small size." },
      { question: "Should thumbnail match title?", answer: "Reinforce, not repeat. Same promise." }
    ],
    toolSlug: "youtube-title-generator",
    toolName: "YouTube Title Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-first-48-hours",
    question: "How Important Are the First 48 Hours for YouTube?",
    shortAnswer:
      "Very. Algorithm tests your video in the first 24–48 hours. Strong CTR + retention = more impressions. Weak start = limited reach. Hook, thumbnail, title matter most.",
    tldr: "Algorithm tests. CTR + retention. Hook and thumbnail.",
    examples: ["Strong hook", "Thumbnail-title match", "Value early"],
    tips: ["Hook = retention", "Thumbnail = CTR", "First 48 hours"],
    quickTips: ["48 hours", "CTR + retention", "Hook + thumbnail"],
    commonMistakes: ["Weak launch", "Poor thumbnail", "Slow hook"],
    faq: [
      { question: "Why do first 48 hours matter?", answer: "Algorithm tests your video. Performance decides reach." },
      { question: "Can a video recover after weak start?", answer: "Possible but harder. Strong launch helps." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  }
];

/** Instagram answers (~20) */
const INSTAGRAM_ANSWERS: AnswerTemplate[] = [
  {
    platform: "instagram",
    slug: "how-to-write-instagram-captions",
    question: "How to Write Instagram Captions That Drive Engagement?",
    shortAnswer:
      "Start with a hook, tell a micro-story or share a takeaway, and end with a CTA. Use line breaks for readability. Add 5–10 hashtags in the first comment or at the end. Match your brand voice.",
    tldr: "Hook + story/takeaway + CTA. Line breaks for readability. 5–10 hashtags.",
    examples: [
      "Monday mood: surviving on caffeine and hope ☕️\n\nHere's what I learned this week...",
      "This one's for everyone who's ever felt like giving up.\n\nYou're not alone. Keep going. 💪"
    ],
    tips: [
      "First line = hook. Make it scroll-stopping",
      "Use line breaks—walls of text get skipped",
      "Tell a mini story or share one clear takeaway",
      "End with a CTA: 'double tap if you agree', 'comment below'"
    ],
    quickTips: ["Hook first", "Line breaks", "CTA"],
    commonMistakes: [
      "Wall of text, no breaks",
      "No CTA",
      "Generic first line"
    ],
    faq: [
      { question: "How long should an Instagram caption be?", answer: "Short (1–2 lines) for aesthetics. Longer (100–300 words) for storytelling. Lead with a strong first line." },
      { question: "Where should I put hashtags on Instagram?", answer: "End of caption or first comment. 5–10 mix of niche and broader." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }, { slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-caption-length",
    question: "What's the Best Instagram Caption Length?",
    shortAnswer:
      "It varies. Short (1–2 lines) for aesthetic feeds. Longer (100–300 words) for storytelling and value posts. Always lead with a strong first line. Use line breaks for readability.",
    tldr: "Short for aesthetic. Long for story. Hook first. Line breaks.",
    examples: [
      "Short: 'Vibes only ✨'",
      "Long: Hook + 2–3 paragraphs + CTA"
    ],
    tips: [
      "First line = most important",
      "Line breaks for long captions",
      "Match length to content type",
      "CTA at the end"
    ],
    quickTips: ["Hook first", "Line breaks", "Match content"],
    commonMistakes: [
      "Wall of text",
      "Weak first line",
      "No structure"
    ],
    faq: [
      { question: "Do longer Instagram captions get more engagement?", answer: "Not always. Depends on relevance and hook. Long works for value; short for aesthetic." },
      { question: "How long should the first line be?", answer: "Punchy. 1–2 lines max. It decides if they read more." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-reel-captions",
    question: "How to Write Instagram Reel Captions?",
    shortAnswer:
      "Same as TikTok—hook in first line, under 150 chars for visibility. Add CTA. Use 3–5 hashtags. Reels captions are shorter than feed posts. Match the video's energy.",
    tldr: "Hook first. <150 chars. CTA. 3–5 hashtags.",
    examples: [
      "POV: You finally get it ✨",
      "When Monday hits different 😴",
      "No thoughts just vibes 🎵"
    ],
    tips: [
      "First line = hook",
      "Under 150 chars for feed",
      "CTA: follow, comment, save",
      "3–5 niche hashtags"
    ],
    quickTips: ["Hook first", "<150 chars", "CTA"],
    commonMistakes: [
      "Long captions for Reels",
      "No CTA",
      "Generic opener"
    ],
    faq: [
      { question: "Are Reel captions different from feed captions?", answer: "Reels work better with shorter captions—hook and CTA. Feed posts can be longer." },
      { question: "How many hashtags for Reels?", answer: "3–5 niche hashtags. Quality over quantity." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-hashtag-strategy",
    question: "What's the Best Hashtag Strategy for Instagram?",
    shortAnswer:
      "5–10 hashtags. Mix of niche (smaller) and broader. Put in first comment to keep caption clean. Research competitors. Avoid banned or spammy tags. Rotate sets for different posts.",
    tldr: "5–10 hashtags. Mix sizes. First comment. Rotate.",
    examples: [
      "#fitness #gym #workout #transformation #fitlife",
      "#travel #wanderlust #explore #adventure"
    ],
    tips: [
      "5–10 hashtags per post",
      "Mix: 2–3 niche + 2–3 broader",
      "First comment = cleaner caption",
      "Check for banned hashtags"
    ],
    quickTips: ["5–10 tags", "Mix sizes", "First comment"],
    commonMistakes: [
      "Too many hashtags (30)",
      "Only huge hashtags",
      "Same hashtags every post"
    ],
    faq: [
      { question: "How many hashtags should I use on Instagram?", answer: "5–10. Mix of niche and broader. Quality over quantity." },
      { question: "Should hashtags be in caption or comment?", answer: "Either. First comment keeps caption cleaner." }
    ],
    toolSlug: "hashtag-generator",
    toolName: "Hashtag Generator",
    relatedTools: [{ slug: "instagram-caption-generator", name: "Instagram Caption Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-bio-tips",
    question: "How to Write an Instagram Bio That Converts?",
    shortAnswer:
      "150 chars max. Who you are + what you do + CTA. Use line break for clarity. Emojis sparingly. Link in bio is key. Clear value proposition.",
    tldr: "Who + what + CTA. 150 chars. Link in bio.",
    examples: [
      "Fitness coach 💪\nHelping you get stronger\n↓ Free guide",
      "Your daily dose of design ✨\nTips & templates\nLink below 👇"
    ],
    tips: [
      "150 chars—every word counts",
      "Line break for structure",
      "CTA: link, DM, follow",
      "1–2 emojis max"
    ],
    quickTips: ["150 chars", "Value + CTA", "Line break"],
    commonMistakes: [
      "Vague bio",
      "No CTA",
      "Too many emojis"
    ],
    faq: [
      { question: "How long can an Instagram bio be?", answer: "150 characters. Use them wisely." },
      { question: "What should an Instagram bio include?", answer: "Who you are, what you offer, and a CTA (link, DM, follow)." }
    ],
    toolSlug: "tiktok-bio-generator",
    toolName: "Bio Generator",
    relatedTools: [{ slug: "instagram-caption-generator", name: "Instagram Caption Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-carousel-captions",
    question: "How to Write Captions for Instagram Carousels?",
    shortAnswer:
      "Hook in first line. Carousels often have more room—use it for value. Structure: hook, key points, CTA. Line breaks between sections. Match the carousel's topic.",
    tldr: "Hook + value + CTA. Structure with line breaks.",
    examples: [
      "5 tips that changed my workflow 👇\n\n1. ...\n2. ...\n\nSave this for later!",
      "The mistake everyone makes (and how to fix it)\n\nSwipe to see the full breakdown →"
    ],
    tips: [
      "Hook = first line",
      "Numbered lists work well",
      "CTA: save, share, follow",
      "Line breaks for readability"
    ],
    quickTips: ["Hook first", "Structure", "CTA"],
    commonMistakes: [
      "No hook",
      "Wall of text",
      "No CTA"
    ],
    faq: [
      { question: "Should carousel captions be longer?", answer: "Yes. Carousels often deliver value—use the space for tips, stories, or breakdowns." },
      { question: "What CTA works for carousels?", answer: "'Save this', 'Share with someone who needs this', 'Follow for more'." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-story-captions",
    question: "How to Write Instagram Story Captions?",
    shortAnswer:
      "Short and punchy. Stories are casual. Use text overlays, polls, questions. One idea per story. CTA: swipe up, DM, link. Match the casual vibe.",
    tldr: "Short. Casual. One idea. CTA.",
    examples: [
      "Swipe for the full list 👆",
      "DM me 'TIPS' for the guide",
      "Poll: Which one? 👇"
    ],
    tips: [
      "One idea per story",
      "Text overlay = key message",
      "Polls and questions = engagement",
      "CTA: link, DM, swipe"
    ],
    quickTips: ["Short", "One idea", "CTA"],
    commonMistakes: [
      "Too much text",
      "No CTA",
      "Too formal"
    ],
    faq: [
      { question: "How long should Story captions be?", answer: "Short. 1–2 lines. Stories are quick—get to the point." },
      { question: "Should I use stickers in Stories?", answer: "Yes. Polls, questions, and links boost engagement." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-cta-captions",
    question: "What CTAs Work Best in Instagram Captions?",
    shortAnswer:
      "'Double tap if', 'Comment below', 'Save this', 'Share with someone who', 'Link in bio', 'DM me'. Match CTA to goal. One CTA per caption. Clear and direct.",
    tldr: "Double tap, comment, save, share. One CTA. Clear.",
    examples: [
      "Double tap if you agree 👆",
      "Save this for later!",
      "Share with someone who needs this"
    ],
    tips: [
      "One CTA per caption",
      "Match to goal: engagement, saves, link clicks",
      "Clear and specific",
      "Place at end of caption"
    ],
    quickTips: ["One CTA", "Match goal", "End of caption"],
    commonMistakes: [
      "No CTA",
      "Multiple CTAs",
      "Vague 'check it out'"
    ],
    faq: [
      { question: "What's the best CTA for Instagram?", answer: "Depends. 'Save this' for value, 'link in bio' for conversions, 'comment' for engagement." },
      { question: "Should every post have a CTA?", answer: "Most should. It guides your audience to the next action." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-aesthetic-captions",
    question: "How to Write Aesthetic Instagram Captions?",
    shortAnswer:
      "Short, poetic, or mood-based. 1–3 lines. Minimal emojis. Match the visual. Quotes, song lyrics, or simple observations work. Less is more.",
    tldr: "Short. Poetic. Match the vibe. Less is more.",
    examples: [
      "Golden hour hits different ✨",
      "Where the light meets the shadows",
      "Soft days, slow moments"
    ],
    tips: [
      "1–3 lines max",
      "Match the visual mood",
      "Quotes or observations",
      "Minimal emojis"
    ],
    quickTips: ["Short", "Match vibe", "Minimal"],
    commonMistakes: [
      "Long captions for aesthetic posts",
      "Too many emojis",
      "Mismatched tone"
    ],
    faq: [
      { question: "How long should aesthetic captions be?", answer: "Short. 1–3 lines. The visual does the work." },
      { question: "Should I use emojis in aesthetic captions?", answer: "Sparingly. 0–2. Keep it minimal." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-first-line-hook",
    question: "Why Does the First Line of an Instagram Caption Matter?",
    shortAnswer:
      "The first line shows in the feed before 'more'. It decides if someone reads the rest. Make it scroll-stopping: question, bold claim, or intriguing statement. Never start with something generic.",
    tldr: "First line = feed preview. Hook or they scroll.",
    examples: [
      "Nobody talks about this...",
      "The one thing that changed everything",
      "POV: You finally get it"
    ],
    tips: [
      "First line = feed preview",
      "Question, claim, or intrigue",
      "Never generic 'Check this out'",
      "Test different openers"
    ],
    quickTips: ["Hook first", "No generic", "Test"],
    commonMistakes: [
      "Generic first line",
      "Starting with hashtags",
      "Burying the hook"
    ],
    faq: [
      { question: "How much of the caption shows in the feed?", answer: "Roughly the first 125 characters. Make them count." },
      { question: "What if my first line is weak?", answer: "Rewrite. The first line is your hook. Test different angles." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-brand-voice-captions",
    question: "How to Match Your Brand Voice in Instagram Captions?",
    shortAnswer:
      "Define your voice: professional, casual, funny, inspiring. Use consistent tone across posts. Same vocabulary and sentence structure. Match your audience. Write like you talk.",
    tldr: "Define voice. Consistent tone. Match audience.",
    examples: ["Professional: Clear, value-focused", "Casual: Conversational, relatable", "Funny: Witty, self-deprecating"],
    tips: ["Define 3–5 adjectives", "Consistent across posts", "Match audience"],
    quickTips: ["Define voice", "Consistent", "Audience match"],
    commonMistakes: ["Inconsistent tone", "Wrong audience voice", "Trying too hard"],
    faq: [
      { question: "What is brand voice?", answer: "The personality and tone of your captions. Consistent across all content." },
      { question: "Should I change my voice for different posts?", answer: "Stay consistent. Slight variations ok, but core voice should match." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-save-worthy-captions",
    question: "How to Write Instagram Captions That Get Saved?",
    shortAnswer:
      "Deliver value. Tips, lists, how-tos. Structure: hook, value, CTA. 'Save this for later' works. Make it useful—something they'll reference. Use numbered lists or steps.",
    tldr: "Value first. Tips, lists. 'Save this' CTA.",
    examples: ["5 tips that changed my workflow", "Save this for your next...", "The complete guide to..."],
    tips: ["Deliver value", "Lists and steps", "Save CTA"],
    quickTips: ["Value", "Lists", "Save CTA"],
    commonMistakes: ["No value", "Generic content", "No save CTA"],
    faq: [
      { question: "What makes people save Instagram posts?", answer: "Value—tips, guides, lists. Content they'll reference later." },
      { question: "Should I ask people to save?", answer: "Yes. 'Save this for later' increases saves." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-storytelling-captions",
    question: "How to Tell a Story in an Instagram Caption?",
    shortAnswer:
      "Hook first. Then: setup, conflict/tension, resolution. Use line breaks. One story per caption. Emotional arc. End with takeaway or CTA. 100–300 words for full story.",
    tldr: "Hook → setup → tension → resolution. Line breaks.",
    examples: ["Last year I...", "I almost gave up. Then...", "Here's what nobody tells you..."],
    tips: ["Hook first", "Emotional arc", "Line breaks"],
    quickTips: ["Hook", "Arc", "Breaks"],
    commonMistakes: ["No hook", "Too long", "No structure"],
    faq: [
      { question: "How long should a story caption be?", answer: "100–300 words. Hook first, then develop." },
      { question: "Should every post tell a story?", answer: "No. Mix stories with value posts and aesthetic." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-caption-templates",
    question: "Where Can I Find Instagram Caption Templates?",
    shortAnswer:
      "Use our AI generator for instant templates. Or: hook + [your story/takeaway] + CTA. 'When...', 'POV:', 'Hot take:'. Structure matters more than copying—adapt to your voice.",
    tldr: "AI generator. Structure: hook + value + CTA. Adapt.",
    examples: ["When [X] hits different", "POV: You finally...", "Hot take: [insight]"],
    tips: ["Use structure", "Adapt to voice", "Hook + value + CTA"],
    quickTips: ["Structure", "Adapt", "Voice"],
    commonMistakes: ["Copying verbatim", "Generic template", "No adaptation"],
    faq: [
      { question: "Are caption templates effective?", answer: "Structure works. Adapt to your voice and niche." },
      { question: "Should I use the same template every time?", answer: "Vary. Same structure, different angles." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-reels-vs-feed-captions",
    question: "Are Reel Captions Different from Feed Post Captions?",
    shortAnswer:
      "Yes. Reels: shorter, hook + CTA, under 150 chars. Feed: can be longer, storytelling, value. Reels = scroll-stopping. Feed = depth and connection.",
    tldr: "Reels: short, hook, CTA. Feed: longer, story, value.",
    examples: ["Reels: POV: main character ✨", "Feed: 2–3 paragraphs with story"],
    tips: ["Reels = short", "Feed = longer", "Match format"],
    quickTips: ["Reels short", "Feed longer", "Match format"],
    commonMistakes: ["Same length for both", "Long Reel caption", "Short feed story"],
    faq: [
      { question: "How long should Reel captions be?", answer: "Short. Hook + CTA. Under 150 chars." },
      { question: "Can I use the same caption for both?", answer: "Adapt. Reels need punchier; feed can be longer." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-caption-for-growth",
    question: "How Do Captions Help Instagram Growth?",
    shortAnswer:
      "Captions drive engagement (comments, saves, shares). Engagement signals the algorithm. Strong CTAs, value, and relatability = more reach. Saves and shares are especially valuable.",
    tldr: "Engagement = algorithm. CTAs, value, relatability.",
    examples: ["Save CTA", "Comment prompt", "Share ask"],
    tips: ["CTAs drive engagement", "Value = saves", "Relatable = shares"],
    quickTips: ["CTAs", "Value", "Relatable"],
    commonMistakes: ["No CTA", "No value", "Generic"],
    faq: [
      { question: "Do captions affect Instagram algorithm?", answer: "Yes. Engagement from captions drives reach." },
      { question: "What engagement matters most?", answer: "Saves and shares are strong signals. Comments help." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-quote-captions",
    question: "How to Write Quote Captions for Instagram?",
    shortAnswer:
      "Keep it short. The quote is the star. Add context in 1–2 lines if needed. Or let the quote stand alone. Match the visual. Attribution if relevant.",
    tldr: "Quote is star. Short. Context optional.",
    examples: ["Quote only", "Quote + 1 line context", "Quote + attribution"],
    tips: ["Quote first", "Short context", "Match visual"],
    quickTips: ["Quote first", "Short", "Match"],
    commonMistakes: ["Overexplaining", "Long intro", "Mismatched quote"],
    faq: [
      { question: "Should I add context to quote captions?", answer: "Optional. 1–2 lines max. Quote can stand alone." },
      { question: "How long should quote captions be?", answer: "Short. Quote + optional 1–2 lines." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-product-captions",
    question: "How to Write Instagram Captions for Products?",
    shortAnswer:
      "Lead with benefit or story. Not just features. 'Why you need this', 'How it changed my...', 'The one thing that...'. Add CTA: link in bio, DM, shop. Clear value.",
    tldr: "Benefit or story. Not just features. CTA.",
    examples: ["Why you need this", "How it changed my routine", "The one product that..."],
    tips: ["Benefit first", "Story over features", "CTAs"],
    quickTips: ["Benefit", "Story", "CTA"],
    commonMistakes: ["Feature dump", "No CTA", "Generic"],
    faq: [
      { question: "Should product captions be long?", answer: "Depends. Benefit + story. CTA. Not too long." },
      { question: "What CTA for product posts?", answer: "Link in bio, DM for details, shop now." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-monday-captions",
    question: "What Are Good Monday Instagram Captions?",
    shortAnswer:
      "Relatable, funny, or motivational. 'Monday mood', 'Surviving on caffeine', 'New week new goals'. Match your brand. Short for aesthetic, longer for motivational.",
    tldr: "Relatable, funny, or motivational. Match brand.",
    examples: ["Monday mood: surviving", "New week new goals", "Coffee and chaos"],
    tips: ["Relatable", "Match brand", "Short or long"],
    quickTips: ["Relatable", "Brand match", "Flexible length"],
    commonMistakes: ["Generic", "Mismatched tone", "Too long"],
    faq: [
      { question: "Should Monday captions be funny?", answer: "Depends on brand. Relatable works for most." },
      { question: "How long should Monday captions be?", answer: "Short for aesthetic. Longer for motivational." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-link-in-bio-captions",
    question: "How to Promote Link in Bio in TikTok Captions?",
    shortAnswer:
      "Mention naturally. '(link in bio)', 'Full guide in bio', 'Swipe up / link in bio'. One clear CTA. Don't overdo it. Match the video's value.",
    tldr: "Natural mention. One CTA. Match value.",
    examples: ["Link in bio for full guide", "(link in bio)", "Swipe up for more"],
    tips: ["Natural mention", "One CTA", "Match value"],
    quickTips: ["Natural", "One CTA", "Value match"],
    commonMistakes: ["Overpromoting", "Multiple links", "No context"],
    faq: [
      { question: "How often should I mention link in bio?", answer: "When relevant. Don't force it every video." },
      { question: "What's the best link-in-bio CTA?", answer: "Clear and specific. 'Full guide in bio' > 'link in bio'." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "tiktok-caption-generator", name: "TikTok Caption Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-end-screen-cta",
    question: "What Should I Say in a YouTube End Screen?",
    shortAnswer:
      "One clear CTA. 'Subscribe for more', 'Watch this next', 'Link in description'. Keep it short. Match the end screen visual. Don't list everything.",
    tldr: "One CTA. Short. Match visual.",
    examples: ["Subscribe for more", "Watch this next", "Link below"],
    tips: ["One CTA", "Short", "Match visual"],
    quickTips: ["One CTA", "Short", "Visual"],
    commonMistakes: ["Too many CTAs", "Long script", "No CTA"],
    faq: [
      { question: "How long should end screen CTA be?", answer: "Short. 5–10 seconds. One clear ask." },
      { question: "What's the best end screen CTA?", answer: "Subscribe for growth. Or 'watch next' for retention." }
    ],
    toolSlug: "hook-generator",
    toolName: "Hook Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  },
  {
    platform: "tiktok",
    slug: "tiktok-series-captions",
    question: "How to Write Captions for TikTok Series?",
    shortAnswer:
      "Number the part. 'Part 1:', 'POV series ep 3'. Add continuity—'if you missed part 1...'. Same hook style across parts. CTA: follow for part 2.",
    tldr: "Number parts. Continuity. Same hook style. Follow CTA.",
    examples: ["Part 1: How I...", "POV series ep 3", "Part 2 (link to part 1 in bio)"],
    tips: ["Number parts", "Continuity", "Follow CTA"],
    quickTips: ["Number", "Continuity", "Follow"],
    commonMistakes: ["No part number", "No continuity", "No follow CTA"],
    faq: [
      { question: "Should series captions be consistent?", answer: "Yes. Same structure. Number and continuity." },
      { question: "What CTA for series?", answer: "Follow for the next part. Or link to part 1." }
    ],
    toolSlug: "tiktok-caption-generator",
    toolName: "TikTok Caption Generator",
    relatedTools: [{ slug: "hook-generator", name: "Hook Generator" }]
  },
  {
    platform: "instagram",
    slug: "instagram-collab-captions",
    question: "How to Write Instagram Collab Captions?",
    shortAnswer:
      "Credit the collab. Tag them. Share the story or outcome. 'So grateful to...', 'When X and I...'. CTA: check out their page, follow both. Mutual value.",
    tldr: "Credit + tag. Share story. Mutual value CTA.",
    examples: ["So grateful to collab with @...", "When we finally met IRL", "Dream collab with..."],
    tips: ["Credit and tag", "Share story", "Mutual CTA"],
    quickTips: ["Credit", "Tag", "Mutual CTA"],
    commonMistakes: ["No credit", "No tag", "One-sided"],
    faq: [
      { question: "Should I tag in caption or just photo?", answer: "Both. Caption for context, tag for credit." },
      { question: "What CTA for collab posts?", answer: "Check out their page. Follow both." }
    ],
    toolSlug: "instagram-caption-generator",
    toolName: "Instagram Caption Generator",
    relatedTools: [{ slug: "hashtag-generator", name: "Hashtag Generator" }]
  },
  {
    platform: "youtube",
    slug: "youtube-community-post-ideas",
    question: "What to Post in YouTube Community Tab?",
    shortAnswer:
      "Polls, teasers, behind-the-scenes, updates. Short text + image or poll. 'Which should I do next?', 'Sneak peek', 'Update: video coming Friday'. Drives engagement between uploads.",
    tldr: "Polls, teasers, BTS. Short. Engagement between uploads.",
    examples: ["Which should I do next?", "Sneak peek of...", "Update: Friday"],
    tips: ["Polls work", "Teasers", "BTS"],
    quickTips: ["Polls", "Teasers", "BTS"],
    commonMistakes: ["Too long", "No engagement ask", "Generic"],
    faq: [
      { question: "How often should I post in Community?", answer: "1–3x per week. Between uploads." },
      { question: "What gets most engagement in Community?", answer: "Polls and teasers. Clear questions." }
    ],
    toolSlug: "youtube-video-idea-generator",
    toolName: "YouTube Video Idea Generator",
    relatedTools: [{ slug: "youtube-title-generator", name: "YouTube Title Generator" }]
  }
];

/** Cross-platform: best caption length */
const BEST_CAPTION_LENGTH: AnswerTemplate = {
  platform: "tiktok",
  slug: "best-caption-length",
  question: "What's the Best Caption Length for TikTok, Instagram & YouTube?",
  shortAnswer:
    "TikTok: under 150 chars for feed visibility. Instagram: 1–2 lines for aesthetic feeds, 100–300 words for storytelling. YouTube: title 50–60 chars, description 1–2 sentences for SEO. Match length to platform and goal.",
  tldr: "TikTok: <150 chars. IG: 1–2 lines or 100–300 words. YouTube: 50–60 char title.",
  examples: [
    "TikTok: 'POV: main character energy ✨' (short)",
    "Instagram: 2–3 paragraphs with line breaks (medium)",
    "YouTube: punchy title + 1–2 sentence description (short)"
  ],
  tips: [
    "TikTok truncates at ~150 chars—put the hook first",
    "Instagram: short for aesthetics, longer for value/story",
    "YouTube titles: 50–60 chars for full display in search",
    "When in doubt, lead with the strongest line and trim the rest"
  ],
  quickTips: ["TikTok <150", "IG varies", "YT 50–60"],
  commonMistakes: [
    "Same length for all platforms",
    "Putting punchline after truncation",
    "Ignoring platform norms"
  ],
  faq: [
    { question: "Why does TikTok cut off my caption?", answer: "TikTok shows roughly the first 150 characters. Put your hook there." },
    { question: "Do longer Instagram captions get more engagement?", answer: "Not always. Depends on relevance and hook." },
    { question: "What's the ideal YouTube title length?", answer: "50–60 characters for full display in search." }
  ],
  toolSlug: "tiktok-caption-generator",
  toolName: "Caption Generator",
  relatedTools: [{ slug: "title-generator", name: "Title Generator" }, { slug: "hook-generator", name: "Hook Generator" }]
};

/** Combined: 60 answer pages */
export const ALL_ANSWER_TEMPLATES: AnswerTemplate[] = [
  ...TIKTOK_ANSWERS,
  ...YOUTUBE_ANSWERS,
  ...INSTAGRAM_ANSWERS,
  BEST_CAPTION_LENGTH
];
