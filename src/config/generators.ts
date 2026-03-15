/**
 * Generator configs for tools that use the dynamic [slug] route.
 * Existing tools (tiktok-caption, hashtag, hook, title) have their own pageClient.
 */

export type GeneratorConfig = {
  inputLabel: string;
  placeholder: string;
  tryExample: string;
  buttonLabel: string;
  resultTitle: string;
  emptyMessage: string;
  howItWorks: { step: number; text: string }[];
  examples: { input: string; output: string }[];
  proTips: string[];
  generate: (input: string) => string[];
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

const BIO_TEMPLATES = [
  "{emoji} {niche} creator | {value}\n{link}",
  "{niche} | {value} ✨\n{link}",
  "Here for the {niche} vibes {emoji}\n{link}",
  "{value} | {niche} content daily"
];

const USERNAME_PREFIXES = ["the", "real", "official", "just", "its", "my"];
const USERNAME_SUFFIXES = ["hq", "tv", "daily", "vibes", "zone", "life", "world"];

export const generators: Record<string, GeneratorConfig> = {
  "tiktok-bio-generator": {
    inputLabel: "What do you create?",
    placeholder: "Example: fitness coach, cooking tips, travel vlogs",
    tryExample: "fitness coach sharing quick workout tips",
    buttonLabel: "Generate Bios",
    resultTitle: "Bio ideas",
    emptyMessage: "Your bio ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or what you create above." },
      { step: 2, text: "Generate bio variations you can use." },
      { step: 3, text: "Copy and paste into your TikTok profile." }
    ],
    examples: [
      { input: "fitness coach", output: "💪 Fitness coach | Quick workouts that work\nlink in bio" },
      { input: "cooking tips", output: "Foodie | Easy recipes in 60 sec ✨\nlink below" }
    ],
    proTips: [
      "Keep it under 80 characters so it doesn't get cut off.",
      "Include one clear value proposition.",
      "Add a call-to-action like 'link in bio'."
    ],
    generate: (input) => {
      const niche = input.trim() || "creator";
      const emojis = ["✨", "🔥", "💡", "🎯", "📌"];
      const values = ["daily tips", "real talk", "no fluff", "your vibe"];
      const link = "link in bio";
      return BIO_TEMPLATES.map((t) =>
        t
          .replace("{emoji}", pick(emojis, 1)[0])
          .replace(/\{niche\}/g, niche)
          .replace("{value}", pick(values, 1)[0])
          .replace("{link}", link)
      );
    }
  },

  "youtube-title-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: how to edit videos faster",
    tryExample: "how to grow on YouTube in 2025",
    buttonLabel: "Generate Titles",
    resultTitle: "Title ideas",
    emptyMessage: "Your title ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate click-worthy title ideas." },
      { step: 3, text: "Copy and paste into your YouTube upload." }
    ],
    examples: [
      { input: "video editing tips", output: "I Tried Video Editing Tips So You Don't Have To" },
      { input: "YouTube growth", output: "7 YouTube Growth Mistakes Killing Your Views" }
    ],
    proTips: [
      "Front-load the most interesting word.",
      "Use numbers when relevant (e.g. 5 Tips).",
      "Keep it under 60 characters for full display."
    ],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      const templates = [
        `I Tried ${topic} So You Don't Have To`,
        `7 ${topic} No One Talks About`,
        `The Truth About ${topic}`,
        `${topic} in 10 Minutes: Full Guide`,
        `Stop Doing ${topic} Wrong (Do This Instead)`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "instagram-caption-generator": {
    inputLabel: "Post idea",
    placeholder: "Example: morning coffee, sunset at the beach",
    tryExample: "cozy morning routine with coffee",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your post idea above." },
      { step: 2, text: "Generate captions with emojis and hashtags." },
      { step: 3, text: "Copy and paste into Instagram." }
    ],
    examples: [
      { input: "coffee morning", output: "Mornings hit different ☕️\n\n#coffee #morning #aesthetic" },
      { input: "beach sunset", output: "Golden hour never disappoints 🌅\n\n#sunset #beach #vibes" }
    ],
    proTips: [
      "First line should hook the reader.",
      "Use 3–5 relevant hashtags.",
      "Add a question to boost comments."
    ],
    generate: (input) => {
      const idea = input.trim() || "your moment";
      const hooks = ["Living for this ✨", "No caption needed but…", "POV:", "This hit different"];
      const emojis = ["✨", "🔥", "💫", "🌸", "☀️"];
      const tags = ["#instagram", "#vibes", "#aesthetic", "#fyp", "#explore"];
      return Array.from({ length: 4 }, () => {
        const hook = pick(hooks, 1)[0];
        const emoji = pick(emojis, 2).join(" ");
        const tagBlock = pick(tags, 4).join(" ");
        return `${hook}\n\n${idea} ${emoji}\n\n${tagBlock}`;
      });
    }
  },

  "youtube-description-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: 5 tips for better thumbnails",
    tryExample: "how to get more subscribers on YouTube",
    buttonLabel: "Generate Descriptions",
    resultTitle: "Description ideas",
    emptyMessage: "Your description ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate SEO-friendly descriptions." },
      { step: 3, text: "Copy and paste into YouTube." }
    ],
    examples: [
      { input: "thumbnail tips", output: "In this video I share 5 thumbnail tips that increased my CTR. Timestamps below." },
      { input: "subscriber growth", output: "Learn how to grow your YouTube channel with these proven strategies." }
    ],
    proTips: [
      "Include keywords in the first 2 lines.",
      "Add timestamps for longer videos.",
      "Link to related videos and resources."
    ],
    generate: (input) => {
      const topic = input.trim() || "this video";
      const intros = [
        `In this video, I cover ${topic}.`,
        `Learn ${topic} in under 10 minutes.`,
        `${topic} — everything you need to know.`
      ];
      const ctas = ["Subscribe for more.", "Drop a like if this helped.", "Comment your questions below."];
      return intros.map((intro) => `${intro}\n\n${pick(ctas, 1)[0]}`);
    }
  },

  "tiktok-username-generator": {
    inputLabel: "Your niche, name, or brand",
    placeholder: "Example: fitness, alex, cooking",
    tryExample: "fitness coach alex",
    buttonLabel: "Generate Usernames",
    resultTitle: "Username ideas",
    emptyMessage: "Your username ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or name above." },
      { step: 2, text: "Generate unique username ideas." },
      { step: 3, text: "Pick one and update your profile." }
    ],
    examples: [
      { input: "fitness alex", output: "alexfitness\nrealalexfit\nalexfitdaily" },
      { input: "cooking", output: "thecookinghq\ncookingvibes\njustcooking" }
    ],
    proTips: [
      "Keep it short and memorable.",
      "Avoid numbers unless they're part of your brand.",
      "Check availability before committing."
    ],
    generate: (input) => {
      const base = input.trim().toLowerCase().replace(/\s+/g, "") || "creator";
      const results: string[] = [];
      results.push(base, `the${base}`, `real${base}`);
      pick(USERNAME_PREFIXES, 2).forEach((p) => results.push(`${p}${base}`));
      pick(USERNAME_SUFFIXES, 2).forEach((s) => results.push(`${base}${s}`));
      return [...new Set(results)].slice(0, 5);
    }
  },

  "instagram-username-generator": {
    inputLabel: "Your niche, name, or brand",
    placeholder: "Example: travel, emma, photography",
    tryExample: "travel photographer emma",
    buttonLabel: "Generate Usernames",
    resultTitle: "Username ideas",
    emptyMessage: "Your username ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or name above." },
      { step: 2, text: "Generate memorable username ideas." },
      { step: 3, text: "Pick one and update your profile." }
    ],
    examples: [
      { input: "travel emma", output: "emmatravels\nrealemmagoes\nemmastravels" },
      { input: "photography", output: "thephotohq\nphotographyvibes\njustphoto" }
    ],
    proTips: [
      "Keep it under 30 characters.",
      "Use underscores sparingly.",
      "Make it easy to spell and say."
    ],
    generate: (input) => {
      const base = input.trim().toLowerCase().replace(/\s+/g, "") || "creator";
      const results: string[] = [];
      results.push(base, `the${base}`, `real${base}`);
      pick(USERNAME_PREFIXES, 2).forEach((p) => results.push(`${p}${base}`));
      pick(USERNAME_SUFFIXES, 2).forEach((s) => results.push(`${base}${s}`));
      return [...new Set(results)].slice(0, 5);
    }
  },

  "tiktok-idea-generator": {
    inputLabel: "Your niche or content type",
    placeholder: "Example: fitness, cooking, tech reviews",
    tryExample: "productivity tips for students",
    buttonLabel: "Generate Ideas",
    resultTitle: "Content ideas",
    emptyMessage: "Your content ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche above." },
      { step: 2, text: "Generate viral content ideas." },
      { step: 3, text: "Pick one and start filming." }
    ],
    examples: [
      { input: "fitness", output: "POV: 5 min workout that actually works\n\n3 things I wish I knew before starting" },
      { input: "cooking", output: "Recipe you can make in under 10 min\n\nWhat I eat in a day" }
    ],
    proTips: [
      "Trending sounds can boost reach.",
      "First 3 seconds decide if they stay.",
      "Post consistently to test what works."
    ],
    generate: (input) => {
      const niche = input.trim() || "content";
      const templates = [
        `POV: ${niche} hack nobody talks about`,
        `3 ${niche} mistakes I made so you don't have to`,
        `What I wish I knew about ${niche}`,
        `${niche} in 60 seconds`,
        `The ${niche} routine that changed everything`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "youtube-video-idea-generator": {
    inputLabel: "Your channel niche or topic",
    placeholder: "Example: tech reviews, vlogs, tutorials",
    tryExample: "productivity and time management",
    buttonLabel: "Generate Ideas",
    resultTitle: "Video ideas",
    emptyMessage: "Your video ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your channel niche above." },
      { step: 2, text: "Generate video ideas that get views." },
      { step: 3, text: "Pick one and start scripting." }
    ],
    examples: [
      { input: "tech reviews", output: "I Tried the New iPhone So You Don't Have To\n\n5 Laptops Under $500 Compared" },
      { input: "tutorials", output: "Complete Guide to X in 10 Minutes\n\nBeginner's Guide to Y" }
    ],
    proTips: [
      "Check search volume for your topic.",
      "Evergreen content performs long-term.",
      "Series and playlists boost watch time."
    ],
    generate: (input) => {
      const niche = input.trim() || "your niche";
      const templates = [
        `Complete ${niche} Guide for Beginners`,
        `I Tried ${niche} for 30 Days — Here's What Happened`,
        `5 ${niche} Tips That Actually Work`,
        `${niche} Explained in 10 Minutes`,
        `The Truth About ${niche} (Nobody Talks About This)`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "tiktok-script-generator": {
    inputLabel: "Your video topic",
    placeholder: "Example: morning routine, product review",
    tryExample: "how to stay productive working from home",
    buttonLabel: "Generate Scripts",
    resultTitle: "Script ideas",
    emptyMessage: "Your script ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate short-form scripts." },
      { step: 3, text: "Copy and adapt for your video." }
    ],
    examples: [
      { input: "morning routine", output: "Hook: Stop scrolling if you want a better morning.\n\nBeat 1: Wake up same time\nBeat 2: No phone first 30 min\nBeat 3: Move your body\nCTA: Save this and try tomorrow." },
      { input: "product review", output: "Hook: I tested this so you don't have to.\n\nBeat 1: First impressions\nBeat 2: Pros and cons\nBeat 3: Verdict\nCTA: Link in bio." }
    ],
    proTips: [
      "Hook in first 2 seconds.",
      "Keep each beat under 15 seconds.",
      "End with a clear CTA."
    ],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      const hooks = [
        `Stop scrolling if you want to learn ${topic}.`,
        `I tried ${topic} so you don't have to.`,
        `Nobody talks about ${topic} — here's why.`
      ];
      const beats = ["Setup", "Main point 1", "Main point 2", "Main point 3"];
      const ctas = ["Save this for later.", "Follow for more.", "Link in bio."];
      return Array.from({ length: 3 }, (_, i) => {
        const hook = pick(hooks, 1)[0];
        const beatList = beats.map((b, j) => `${j + 1}. ${b}`).join("\n");
        const cta = pick(ctas, 1)[0];
        return `Hook: ${hook}\n\n${beatList}\n\nCTA: ${cta}`;
      });
    }
  },

  "youtube-script-generator": {
    inputLabel: "Your video topic",
    placeholder: "Example: how to start a YouTube channel",
    tryExample: "how to edit videos like a pro",
    buttonLabel: "Generate Scripts",
    resultTitle: "Script outline",
    emptyMessage: "Your script outline will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate script outlines." },
      { step: 3, text: "Copy and expand for your video." }
    ],
    examples: [
      { input: "start YouTube", output: "Intro: Hook + what we're covering\n\nMain: 3-5 key points with examples\n\nOutro: Recap + CTA to subscribe" },
      { input: "video editing", output: "Intro: Why editing matters\n\nMain: Cuts, transitions, color\n\nOutro: Practice tip + subscribe" }
    ],
    proTips: [
      "Hook in first 30 seconds.",
      "Use timestamps for longer videos.",
      "End with a clear next step."
    ],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      const intros = [
        `Today we're covering ${topic}.`,
        `In this video, you'll learn ${topic}.`,
        `Let's talk about ${topic}.`
      ];
      const mains = ["Key point 1 with example", "Key point 2 with example", "Key point 3 with example"];
      const outros = ["Recap and subscribe CTA", "Question for comments", "Next video tease"];
      return intros.map(
        (intro) =>
          `Intro: ${intro}\n\nMain:\n${mains.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nOutro: ${pick(outros, 1)[0]}`
      );
    }
  },

  "viral-hook-generator": {
    inputLabel: "Your video topic",
    placeholder: "Example: productivity, fitness, money",
    tryExample: "how to go viral on TikTok",
    buttonLabel: "Generate Hooks",
    resultTitle: "Viral hook ideas",
    emptyMessage: "Your hook ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your topic above." },
      { step: 2, text: "Generate viral hook variations." },
      { step: 3, text: "Copy and use in your video." }
    ],
    examples: [
      { input: "productivity", output: "Stop scrolling if you want to 2x your productivity.\n\nPOV: you finally figured out productivity." },
      { input: "money", output: "Nobody talks about this money hack.\n\nI made $X doing this." }
    ],
    proTips: [
      "Say it out loud — if it's clunky, fix it.",
      "Test 2–3 hooks per video concept.",
      "Match the hook to your first frame."
    ],
    generate: (input) => {
      const topic = input.trim() || "this";
      const templates = [
        `Stop scrolling if you want ${topic}.`,
        `Nobody is talking about ${topic}.`,
        `POV: you finally get ${topic}.`,
        `I tried ${topic} so you don't have to.`,
        `If you're into ${topic}, watch this.`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "story-hook-generator": {
    inputLabel: "Your story theme or topic",
    placeholder: "Example: first day at work, travel mishap",
    tryExample: "the day everything changed",
    buttonLabel: "Generate Hooks",
    resultTitle: "Story hook ideas",
    emptyMessage: "Your story hooks will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your story theme above." },
      { step: 2, text: "Generate story-style hooks." },
      { step: 3, text: "Copy and open your story with one." }
    ],
    examples: [
      { input: "first day", output: "So it was my first day and...\n\nYou won't believe what happened on my first day." },
      { input: "travel", output: "I didn't expect this to happen.\n\nThis trip changed everything." }
    ],
    proTips: [
      "Create curiosity with the first line.",
      "Promise a payoff in the story.",
      "Use 'you' to pull the viewer in."
    ],
    generate: (input) => {
      const theme = input.trim() || "this story";
      const templates = [
        `So ${theme}... and you won't believe what happened.`,
        `I didn't expect ${theme} to go like this.`,
        `This is the story of how ${theme}.`,
        `POV: ${theme} and everything changes.`,
        `Let me tell you about the time ${theme}.`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "clickbait-title-generator": {
    inputLabel: "Your video or article topic",
    placeholder: "Example: diet tips, relationship advice",
    tryExample: "secrets to making money online",
    buttonLabel: "Generate Titles",
    resultTitle: "Click-worthy titles",
    emptyMessage: "Your title ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your topic above." },
      { step: 2, text: "Generate curiosity-driven titles." },
      { step: 3, text: "Copy and use — but deliver on the promise." }
    ],
    examples: [
      { input: "diet tips", output: "This One Diet Trick Changed Everything\n\nDoctors Don't Want You to Know This" },
      { input: "money", output: "I Made $10K Doing This (Here's How)\n\nThe Secret Nobody Tells You" }
    ],
    proTips: [
      "Curiosity gap works — but deliver value.",
      "Numbers increase click-through.",
      "Avoid misleading — you'll lose trust."
    ],
    generate: (input) => {
      const topic = input.trim() || "this";
      const templates = [
        `This One ${topic} Trick Changed Everything`,
        `I Tried ${topic} for 30 Days — Results Shocked Me`,
        `The ${topic} Secret Nobody Tells You`,
        `Do This for ${topic} (It Actually Works)`,
        `$X ${topic} Hacks That Changed My Life`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "ai-video-title-generator": {
    inputLabel: "Your video topic",
    placeholder: "Example: AI tools, automation",
    tryExample: "best AI tools for creators in 2025",
    buttonLabel: "Generate Titles",
    resultTitle: "AI-optimized titles",
    emptyMessage: "Your title ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate algorithm-friendly titles." },
      { step: 3, text: "Copy and paste into your upload." }
    ],
    examples: [
      { input: "AI tools", output: "5 AI Tools Every Creator Needs in 2025\n\nBest AI Video Tools Compared" },
      { input: "automation", output: "Automate Your Content in 10 Minutes\n\nAI Automation That Actually Works" }
    ],
    proTips: [
      "Include year for freshness signals.",
      "Use clear, searchable keywords.",
      "Front-load the main topic."
    ],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      const templates = [
        `5 ${topic} Tools for 2025`,
        `Best ${topic} Compared (2025)`,
        `${topic} — Complete Guide`,
        `How to Use ${topic} (Step by Step)`,
        `${topic} That Actually Work`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "social-media-post-generator": {
    inputLabel: "Your post idea or topic",
    placeholder: "Example: product launch, Monday motivation",
    tryExample: "Monday motivation for creators",
    buttonLabel: "Generate Posts",
    resultTitle: "Post ideas",
    emptyMessage: "Your post ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your post idea above." },
      { step: 2, text: "Generate ready-to-post content." },
      { step: 3, text: "Copy and adapt for your platform." }
    ],
    examples: [
      { input: "product launch", output: "It's here. ✨\n\n[Product] is live. Link in bio.\n\n#launch #new" },
      { input: "motivation", output: "Monday reminder: You've got this. 💪\n\n#motivation #monday" }
    ],
    proTips: [
      "Adapt length per platform.",
      "Use platform-specific hashtags.",
      "Include a clear CTA."
    ],
    generate: (input) => {
      const idea = input.trim() || "your post";
      const hooks = ["It's here. ✨", "Quick reminder:", "POV:", "Real talk:"];
      const emojis = ["✨", "🔥", "💡", "🎯"];
      const tags = ["#content", "#creator", "#viral", "#fyp"];
      return Array.from({ length: 4 }, () => {
        const hook = pick(hooks, 1)[0];
        const emoji = pick(emojis, 2).join(" ");
        const tagBlock = pick(tags, 3).join(" ");
        return `${hook}\n\n${idea} ${emoji}\n\n${tagBlock}`;
      });
    }
  },

  "instagram-hashtag-generator": {
    inputLabel: "Your niche or post topic",
    placeholder: "Example: fashion, food, travel",
    tryExample: "aesthetic fashion and lifestyle",
    buttonLabel: "Generate Hashtags",
    resultTitle: "Hashtag sets",
    emptyMessage: "Your hashtag sets will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or topic above." },
      { step: 2, text: "Generate Instagram hashtag sets." },
      { step: 3, text: "Copy and paste under your post." }
    ],
    examples: [
      { input: "fashion", output: "#fashion #ootd #style #instafashion #fashionblogger" },
      { input: "food", output: "#foodie #food #instafood #foodphotography #yummy" }
    ],
    proTips: [
      "Mix broad and niche hashtags.",
      "Use 15–20 for Reels.",
      "Rotate sets to avoid shadowban."
    ],
    generate: (input) => {
      const keywords = input
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((k) => k.replace(/[^a-z0-9]/g, ""));
      const base = ["instagram", "reels", "explore", "viral", "fyp", "contentcreator"];
      const all = [...keywords, ...base];
      return Array.from({ length: 4 }, () => {
        const set = shuffle([...new Set(all)]).slice(0, 12);
        return set.map((t) => `#${t}`).join(" ");
      });
    }
  },

  "youtube-tag-generator": {
    inputLabel: "Your video topic",
    placeholder: "Example: video editing tutorial",
    tryExample: "how to grow on YouTube",
    buttonLabel: "Generate Tags",
    resultTitle: "Tag sets",
    emptyMessage: "Your tag sets will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate SEO tags for YouTube." },
      { step: 3, text: "Copy and paste into YouTube tags." }
    ],
    examples: [
      { input: "video editing", output: "video editing, tutorial, how to edit, premiere pro" },
      { input: "YouTube growth", output: "youtube growth, subscribers, how to grow, youtube tips" }
    ],
    proTips: [
      "Use comma-separated tags.",
      "Include variations and long-tail.",
      "Don't repeat your title."
    ],
    generate: (input) => {
      const topic = input.trim().toLowerCase().replace(/\s+/g, " ") || "your topic";
      const words = topic.split(" ");
      const base = ["tutorial", "how to", "guide", "tips", "2025"];
      const all = [...words, ...base];
      return Array.from({ length: 3 }, () => shuffle([...new Set(all)]).slice(0, 15).join(", "));
    }
  },

  "tiktok-hashtag-generator": {
    inputLabel: "Your niche or video topic",
    placeholder: "Example: fitness, comedy, dance",
    tryExample: "fitness tips for beginners",
    buttonLabel: "Generate Hashtags",
    resultTitle: "Hashtag sets",
    emptyMessage: "Your hashtag sets will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or topic above." },
      { step: 2, text: "Generate TikTok hashtag sets." },
      { step: 3, text: "Copy and paste in your caption." }
    ],
    examples: [
      { input: "fitness", output: "#fitness #fyp #workout #gym #fit #tiktok" },
      { input: "comedy", output: "#comedy #fyp #funny #viral #laugh #tiktok" }
    ],
    proTips: [
      "Use 3–5 hashtags for TikTok.",
      "Mix trending and niche.",
      "Test different sets per video."
    ],
    generate: (input) => {
      const keywords = input
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 4)
        .map((k) => k.replace(/[^a-z0-9]/g, ""));
      const base = ["tiktok", "fyp", "viral", "foryou", "creator", "contentcreator"];
      const all = [...keywords, ...base];
      return Array.from({ length: 4 }, () => {
        const set = shuffle([...new Set(all)]).slice(0, 8);
        return set.map((t) => `#${t}`).join(" ");
      });
    }
  },

  "reel-caption-generator": {
    inputLabel: "Your Reel idea or theme",
    placeholder: "Example: morning routine, recipe, tip",
    tryExample: "quick breakfast recipe for busy mornings",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your Reel idea above." },
      { step: 2, text: "Generate Reel captions." },
      { step: 3, text: "Copy and paste into Instagram." }
    ],
    examples: [
      { input: "morning routine", output: "My morning in 60 sec ☀️\n\n#morningroutine #reels #aesthetic" },
      { input: "recipe", output: "You need to try this 👇\n\n#recipe #reels #foodie" }
    ],
    proTips: [
      "First line = hook for Explore.",
      "Use Reels-specific hashtags.",
      "Add a CTA to boost engagement."
    ],
    generate: (input) => {
      const idea = input.trim() || "your reel";
      const hooks = ["You need to try this 👇", "POV:", "Save this for later ✨", "No one talks about this…"];
      const emojis = ["✨", "🔥", "👀", "💫"];
      const tags = ["#reels", "#instagram", "#viral", "#explore", "#fyp"];
      return Array.from({ length: 4 }, () => {
        const hook = pick(hooks, 1)[0];
        const emoji = pick(emojis, 2).join(" ");
        const tagBlock = pick(tags, 5).join(" ");
        return `${hook}\n\n${idea} ${emoji}\n\n${tagBlock}`;
      });
    }
  },

  "shorts-title-generator": {
    inputLabel: "Your Shorts topic",
    placeholder: "Example: life hack, quick tip",
    tryExample: "3 productivity hacks that actually work",
    buttonLabel: "Generate Titles",
    resultTitle: "Title ideas",
    emptyMessage: "Your title ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your Shorts topic above." },
      { step: 2, text: "Generate Shorts-optimized titles." },
      { step: 3, text: "Copy and paste into YouTube." }
    ],
    examples: [
      { input: "life hack", output: "This life hack changed everything\n\n3 life hacks you need to know" },
      { input: "productivity", output: "Productivity hack that actually works\n\n5 min productivity routine" }
    ],
    proTips: [
      "Keep it short — Shorts scroll fast.",
      "Front-load the hook.",
      "Use curiosity or benefit."
    ],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      const templates = [
        `This ${topic} changed everything`,
        `${topic} in 60 seconds`,
        `You need to try this ${topic}`,
        `The ${topic} nobody talks about`,
        `POV: ${topic} actually works`
      ];
      return shuffle(templates).slice(0, 5);
    }
  },

  "tiktok-hook-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: morning routine, cooking hack",
    tryExample: "productivity tips for creators",
    buttonLabel: "Generate Hooks",
    resultTitle: "Hook ideas",
    emptyMessage: "Your hook ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate TikTok-native hooks." },
      { step: 3, text: "Use the best one in your first 2 seconds." }
    ],
    examples: [
      { input: "morning routine", output: "Stop scrolling if you want a better morning" },
      { input: "cooking", output: "POV: you finally found a recipe that works" }
    ],
    proTips: ["First 2 seconds decide if they stay.", "Use curiosity or pain point.", "Keep it under 15 words."],
    generate: (input) => {
      const t = input.trim() || "your topic";
      return [`Stop scrolling if you ${t}`, `POV: ${t} actually works`, `No one talks about ${t}`, `You're doing ${t} wrong`, `I tried ${t} so you don't have to`];
    }
  },

  "tiktok-comment-reply-generator": {
    inputLabel: "Comment or context",
    placeholder: "Example: Great video! Where did you get that?",
    tryExample: "Love this! How do I start?",
    buttonLabel: "Generate Replies",
    resultTitle: "Reply ideas",
    emptyMessage: "Your reply ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Paste the comment or describe the context." },
      { step: 2, text: "Generate engaging replies." },
      { step: 3, text: "Copy and post to boost engagement." }
    ],
    examples: [
      { input: "Great video!", output: "Thank you! 🙌 More coming soon" },
      { input: "Where to buy?", output: "Link in my bio! ✨" }
    ],
    proTips: ["Reply within 1 hour for best reach.", "Add value or a question.", "Use emojis sparingly."],
    generate: (input) => {
      const replies = ["Thanks! 🙌", "Appreciate you! ✨", "More coming soon!", "Link in bio!", "Glad it helped!"];
      return shuffle(replies).slice(0, 5);
    }
  },

  "tiktok-story-generator": {
    inputLabel: "Story idea or theme",
    placeholder: "Example: behind the scenes, day in my life",
    tryExample: "getting ready for a shoot",
    buttonLabel: "Generate Ideas",
    resultTitle: "Story ideas",
    emptyMessage: "Your story ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your story theme above." },
      { step: 2, text: "Generate story captions and ideas." },
      { step: 3, text: "Use in your TikTok Stories." }
    ],
    examples: [
      { input: "BTS", output: "POV: 2 hours of filming for 60 sec" },
      { input: "day in life", output: "A day in the life of a creator ✨" }
    ],
    proTips: ["Keep it casual.", "Use polls and questions.", "Behind-the-scenes performs well."],
    generate: (input) => {
      const theme = input.trim() || "your day";
      return [`POV: ${theme} ✨`, `A day in the life`, `BTS of ${theme}`, `No one talks about ${theme}`, `Real talk: ${theme}`];
    }
  },

  "tiktok-trend-caption-generator": {
    inputLabel: "Trend or sound",
    placeholder: "Example: POV trend, get ready with me",
    tryExample: "day in my life as a creator",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter the trend or sound you're using." },
      { step: 2, text: "Generate trend-optimized captions." },
      { step: 3, text: "Copy and add to your TikTok." }
    ],
    examples: [
      { input: "POV trend", output: "POV: you finally get it ✨ #pov #fyp" },
      { input: "GRWM", output: "Get ready with me for… #grwm #getreadywithme" }
    ],
    proTips: ["Use trending hashtags.", "Match the trend's vibe.", "First line = hook."],
    generate: (input) => {
      const trend = input.trim() || "trend";
      return [`POV: ${trend} ✨`, `${trend} but make it…`, `When ${trend} hits different`, `No one: Me: ${trend}`, `${trend} era`];
    }
  },

  "tiktok-video-idea-generator": {
    inputLabel: "Your niche or topic",
    placeholder: "Example: fitness, cooking, tech",
    tryExample: "productivity tips for students",
    buttonLabel: "Generate Ideas",
    resultTitle: "Video ideas",
    emptyMessage: "Your video ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or topic above." },
      { step: 2, text: "Generate viral video ideas." },
      { step: 3, text: "Pick one and create." }
    ],
    examples: [
      { input: "fitness", output: "5 exercises you can do in bed" },
      { input: "cooking", output: "One pot meal in 10 minutes" }
    ],
    proTips: ["Trend + your niche = viral.", "Solve a problem in 60 sec.", "Use hooks from the start."],
    generate: (input) => {
      const niche = input.trim() || "your niche";
      return [`5 ${niche} tips no one talks about`, `${niche} in 60 seconds`, `POV: ${niche} changed`, `The ${niche} hack that works`, `${niche} for beginners`];
    }
  },

  "youtube-shorts-title-generator": {
    inputLabel: "Shorts topic",
    placeholder: "Example: life hack, quick tip",
    tryExample: "3 productivity hacks",
    buttonLabel: "Generate Titles",
    resultTitle: "Title ideas",
    emptyMessage: "Your title ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your Shorts topic above." },
      { step: 2, text: "Generate Shorts-optimized titles." },
      { step: 3, text: "Copy into YouTube Shorts." }
    ],
    examples: [
      { input: "life hack", output: "This life hack changed everything" },
      { input: "productivity", output: "Productivity hack that actually works" }
    ],
    proTips: ["Keep it under 60 chars.", "Front-load the hook.", "Curiosity or benefit."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [`This ${topic} changed everything`, `${topic} in 60 sec`, `You need this ${topic}`, `The ${topic} no one talks about`, `POV: ${topic} works`];
    }
  },

  "youtube-thumbnail-text-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: secret revealed, tutorial",
    tryExample: "how I grew my channel",
    buttonLabel: "Generate Text",
    resultTitle: "Thumbnail text ideas",
    emptyMessage: "Your thumbnail text ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate punchy thumbnail text." },
      { step: 3, text: "Add to your thumbnail design." }
    ],
    examples: [
      { input: "secret", output: "THE SECRET" },
      { input: "tutorial", output: "EASY TUTORIAL" }
    ],
    proTips: ["Under 4 words.", "Bold, high contrast.", "Test different options."],
    generate: (input) => {
      const topic = input.trim() || "topic";
      const words = topic.split(/\s+/).slice(0, 3);
      return [words.join(" ").toUpperCase(), `HOW TO ${topic.toUpperCase()}`, `THE ${topic.toUpperCase()}`, `${topic.toUpperCase()} REVEALED`, `SECRET: ${topic.toUpperCase()}`];
    }
  },

  "youtube-hook-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: how to grow on YouTube",
    tryExample: "video editing tips for beginners",
    buttonLabel: "Generate Hooks",
    resultTitle: "Hook ideas",
    emptyMessage: "Your hook ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate opening hooks." },
      { step: 3, text: "Use in your first 5 seconds." }
    ],
    examples: [
      { input: "YouTube growth", output: "What if I told you your thumbnails are killing your growth?" },
      { input: "editing", output: "This one edit changed everything." }
    ],
    proTips: ["First 5 seconds = retention.", "Use a question or bold claim.", "Promise value."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [`What if I told you about ${topic}?`, `This ${topic} changed everything.`, `Stop doing ${topic} wrong.`, `The ${topic} no one talks about.`, `I tried ${topic} so you don't have to.`];
    }
  },

  "instagram-reels-caption-generator": {
    inputLabel: "Reel idea",
    placeholder: "Example: morning routine, recipe",
    tryExample: "quick breakfast for busy mornings",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your Reel idea above." },
      { step: 2, text: "Generate Reel captions." },
      { step: 3, text: "Copy into Instagram." }
    ],
    examples: [
      { input: "morning routine", output: "My morning in 60 sec ☀️ #morningroutine" },
      { input: "recipe", output: "You need to try this 👇 #recipe #reels" }
    ],
    proTips: ["First line = hook.", "Use Reels hashtags.", "Add a CTA."],
    generate: (input) => {
      const idea = input.trim() || "your reel";
      const hooks = ["You need to try this 👇", "POV:", "Save this for later ✨", "No one talks about this…"];
      return Array.from({ length: 5 }, () => `${pick(hooks, 1)[0]}\n\n${idea} ✨\n\n#reels #instagram #fyp`);
    }
  },

  "instagram-bio-generator": {
    inputLabel: "What do you do?",
    placeholder: "Example: fitness coach, food blogger",
    tryExample: "travel photographer sharing tips",
    buttonLabel: "Generate Bios",
    resultTitle: "Bio ideas",
    emptyMessage: "Your bio ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche or brand above." },
      { step: 2, text: "Generate Instagram bio options." },
      { step: 3, text: "Copy into your profile." }
    ],
    examples: [
      { input: "fitness", output: "💪 Fitness coach | Your transformation starts here" },
      { input: "food", output: "Foodie | Easy recipes ✨ Link below" }
    ],
    proTips: ["Under 150 characters.", "Include one CTA.", "Add emoji for personality."],
    generate: (input) => {
      const niche = input.trim() || "creator";
      return [
        `✨ ${niche} | Link in bio`,
        `${niche} | Your daily dose`,
        `Here for the ${niche} vibes`,
        `${niche} content daily 📌`,
        `Creating ${niche} ✨`
      ];
    }
  },

  "instagram-comment-reply-generator": {
    inputLabel: "Comment or context",
    placeholder: "Example: Love this! Where's the recipe?",
    tryExample: "So helpful, thank you!",
    buttonLabel: "Generate Replies",
    resultTitle: "Reply ideas",
    emptyMessage: "Your reply ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Paste the comment above." },
      { step: 2, text: "Generate engaging replies." },
      { step: 3, text: "Copy and post." }
    ],
    examples: [
      { input: "Love this!", output: "Thank you! 🙌 So glad it helped" },
      { input: "Where's the link?", output: "Link in my bio! ✨" }
    ],
    proTips: ["Reply within 1 hour.", "Add value.", "Use emojis sparingly."],
    generate: (input) => {
      const replies = ["Thanks! 🙌", "Appreciate you! ✨", "Link in bio!", "Glad it helped!", "More coming soon!"];
      return shuffle(replies).slice(0, 5);
    }
  },

  "instagram-story-caption-generator": {
    inputLabel: "Story idea",
    placeholder: "Example: poll, Q&A, behind the scenes",
    tryExample: "day in my life",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your story idea above." },
      { step: 2, text: "Generate story captions." },
      { step: 3, text: "Add to your Stories." }
    ],
    examples: [
      { input: "BTS", output: "POV: 2 hours for 1 post ✨" },
      { input: "poll", output: "Which one? 👇" }
    ],
    proTips: ["Keep it short.", "Use stickers and polls.", "Casual tone works."],
    generate: (input) => {
      const idea = input.trim() || "your story";
      return [`POV: ${idea} ✨`, `A day in the life`, `BTS of ${idea}`, `Real talk 👀`, `Which one? 👇`];
    }
  },

  "content-idea-bank": {
    inputLabel: "Niche or topic",
    placeholder: "Example: fitness, cooking, tech",
    tryExample: "productivity tips for creators",
    buttonLabel: "Generate Ideas",
    resultTitle: "Content ideas",
    emptyMessage: "Your content ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche above." },
      { step: 2, text: "Generate content ideas to save." },
      { step: 3, text: "Organize and recycle for your content calendar." }
    ],
    examples: [
      { input: "fitness", output: "5 exercises you can do in 5 minutes" },
      { input: "cooking", output: "One pot meal for busy weeknights" }
    ],
    proTips: ["Save ideas in a spreadsheet.", "Revisit seasonal ideas.", "Trend + niche = viral."],
    generate: (input) => {
      const niche = input.trim() || "your niche";
      return [`5 ${niche} tips`, `${niche} for beginners`, `POV: ${niche}`, `The ${niche} no one talks about`, `${niche} in 60 seconds`];
    }
  },

  "tiktok-transition-generator": {
    inputLabel: "Video theme",
    placeholder: "Example: morning routine, product reveal",
    tryExample: "get ready with me",
    buttonLabel: "Generate Ideas",
    resultTitle: "Transition ideas",
    emptyMessage: "Your transition ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video theme above." },
      { step: 2, text: "Generate smooth transition ideas." },
      { step: 3, text: "Use in your TikTok edits." }
    ],
    examples: [
      { input: "GRWM", output: "Wipe transition from messy to ready" },
      { input: "product", output: "Object drop transition" }
    ],
    proTips: ["Match transitions to your vibe.", "Keep it simple.", "Trending transitions get more reach."],
    generate: (input) => {
      const theme = input.trim() || "your video";
      return [`Wipe to ${theme}`, `Object drop ${theme}`, `Flash transition ${theme}`, `Spin into ${theme}`, `Zoom to ${theme}`];
    }
  },

  "youtube-community-post-generator": {
    inputLabel: "Post topic",
    placeholder: "Example: poll, update, question",
    tryExample: "what video should I make next",
    buttonLabel: "Generate Posts",
    resultTitle: "Community post ideas",
    emptyMessage: "Your post ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your post topic above." },
      { step: 2, text: "Generate Community tab posts." },
      { step: 3, text: "Post to your YouTube Community." }
    ],
    examples: [
      { input: "poll", output: "Which topic for my next video? A, B or C?" },
      { input: "update", output: "New video dropping tomorrow! What do you want to see?" }
    ],
    proTips: ["Use polls for engagement.", "Ask questions.", "Tease upcoming content."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [`Poll: ${topic}?`, `Update: ${topic}`, `Question: ${topic}`, `Teaser: ${topic}`, `Behind the scenes: ${topic}`];
    }
  },

  "instagram-carousel-caption-generator": {
    inputLabel: "Carousel topic",
    placeholder: "Example: tips, list, tutorial",
    tryExample: "5 productivity hacks",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your carousel topic above." },
      { step: 2, text: "Generate carousel captions." },
      { step: 3, text: "Add to your Instagram post." }
    ],
    examples: [
      { input: "tips", output: "Swipe for 5 tips that changed everything 👉" },
      { input: "list", output: "Save this for later! 📌" }
    ],
    proTips: ["First slide = hook.", "Use 'swipe' CTA.", "Add value in caption."],
    generate: (input) => {
      const topic = input.trim() || "your carousel";
      return [`Swipe for ${topic} 👉`, `Save this ${topic} 📌`, `${topic} you need to know`, `The ${topic} guide`, `${topic} that actually work`];
    }
  },

  "tiktok-duet-idea-generator": {
    inputLabel: "Niche or trend",
    placeholder: "Example: comedy, dance, reaction",
    tryExample: "reacting to cooking fails",
    buttonLabel: "Generate Ideas",
    resultTitle: "Duet ideas",
    emptyMessage: "Your duet ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche above." },
      { step: 2, text: "Generate duet and stitch ideas." },
      { step: 3, text: "Create and tag the original." }
    ],
    examples: [
      { input: "comedy", output: "Duet with a viral joke, add your punchline" },
      { input: "dance", output: "Stitch the dance, do your version" }
    ],
    proTips: ["Trend + your twist = viral.", "Credit the original.", "Add value."],
    generate: (input) => {
      const niche = input.trim() || "your niche";
      return [`Duet: react to ${niche}`, `Stitch: your take on ${niche}`, `Duet: add to ${niche}`, `Stitch: ${niche} but make it yours`, `Duet: ${niche} challenge`];
    }
  },

  "youtube-end-screen-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: tutorial, vlog",
    tryExample: "how to edit videos",
    buttonLabel: "Generate CTAs",
    resultTitle: "End screen ideas",
    emptyMessage: "Your end screen ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate end screen CTAs." },
      { step: 3, text: "Add to your YouTube video." }
    ],
    examples: [
      { input: "tutorial", output: "Subscribe for more tutorials" },
      { input: "vlog", output: "Watch next: [related video]" }
    ],
    proTips: ["Last 20 seconds.", "Subscribe + 1-2 videos.", "Keep it simple."],
    generate: (input) => {
      const topic = input.trim() || "your content";
      return [`Subscribe for more ${topic}`, `Watch next: ${topic} part 2`, `Check out my ${topic} playlist`, `Subscribe + like for ${topic}`, `More ${topic} coming soon`];
    }
  },

  "instagram-dm-generator": {
    inputLabel: "DM purpose",
    placeholder: "Example: outreach, reply, follow-up",
    tryExample: "collab request to a brand",
    buttonLabel: "Generate DMs",
    resultTitle: "DM ideas",
    emptyMessage: "Your DM ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your DM purpose above." },
      { step: 2, text: "Generate DM templates." },
      { step: 3, text: "Copy and personalize." }
    ],
    examples: [
      { input: "outreach", output: "Hey! Love your content. Would love to connect." },
      { input: "collab", output: "Hi! I think we could create something great together." }
    ],
    proTips: ["Be genuine.", "Keep it short.", "Clear ask."],
    generate: (input) => {
      const purpose = input.trim() || "connect";
      return [`Hey! ${purpose} - would love to chat.`, `Hi! ${purpose}. DM me if interested.`, `Love your work! ${purpose}`, `Quick question about ${purpose}`, `${purpose} - let me know!`];
    }
  },

  "tiktok-challenge-idea-generator": {
    inputLabel: "Your niche",
    placeholder: "Example: fitness, cooking, comedy",
    tryExample: "fitness for beginners",
    buttonLabel: "Generate Ideas",
    resultTitle: "Challenge ideas",
    emptyMessage: "Your challenge ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your niche above." },
      { step: 2, text: "Generate challenge ideas." },
      { step: 3, text: "Create and use a hashtag." }
    ],
    examples: [
      { input: "fitness", output: "7-day plank challenge" },
      { input: "cooking", output: "5 ingredients challenge" }
    ],
    proTips: ["Simple to replicate.", "Create a hashtag.", "Invite others."],
    generate: (input) => {
      const niche = input.trim() || "your niche";
      return [`${niche} 7-day challenge`, `${niche} in 60 sec challenge`, `Try this ${niche} challenge`, `${niche} no one talks about`, `${niche} challenge tag 3 friends`];
    }
  },

  "youtube-playlist-title-generator": {
    inputLabel: "Playlist topic",
    placeholder: "Example: tutorials, vlogs",
    tryExample: "video editing for beginners",
    buttonLabel: "Generate Titles",
    resultTitle: "Playlist title ideas",
    emptyMessage: "Your playlist titles will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your playlist topic above." },
      { step: 2, text: "Generate playlist titles." },
      { step: 3, text: "Use in YouTube." }
    ],
    examples: [
      { input: "tutorials", output: "Complete [Topic] Tutorial Series" },
      { input: "vlogs", output: "My [Topic] Journey" }
    ],
    proTips: ["Include topic.", "Use 'Complete' or 'Full'.", "Add number if relevant."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [`Complete ${topic} Guide`, `${topic} - Full Series`, `Best of ${topic}`, `${topic} Tutorials`, `Learn ${topic}`];
    }
  },

  "instagram-poll-idea-generator": {
    inputLabel: "Post or story topic",
    placeholder: "Example: preferences, opinions",
    tryExample: "which product to review next",
    buttonLabel: "Generate Ideas",
    resultTitle: "Poll ideas",
    emptyMessage: "Your poll ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your topic above." },
      { step: 2, text: "Generate poll questions." },
      { step: 3, text: "Add to your Stories." }
    ],
    examples: [
      { input: "preferences", output: "Which one? A or B?" },
      { input: "opinions", output: "Agree or disagree?" }
    ],
    proTips: ["Two clear options.", "Engage your audience.", "Use for content ideas."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [`Which ${topic}?`, `${topic} - yes or no?`, `Prefer ${topic} A or B?`, `Best ${topic}?`, `${topic} - vote below`];
    }
  },

  "short-form-script-generator": {
    inputLabel: "Video idea",
    placeholder: "Example: tip, tutorial, story",
    tryExample: "3 morning routine hacks",
    buttonLabel: "Generate Scripts",
    resultTitle: "Script ideas",
    emptyMessage: "Your script ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video idea above." },
      { step: 2, text: "Generate short-form scripts." },
      { step: 3, text: "Use for TikTok, Reels, Shorts." }
    ],
    examples: [
      { input: "tip", output: "Hook: Stop scrolling. Beat 1: Problem. Beat 2: Solution. CTA: Save this." },
      { input: "tutorial", output: "Hook: You need this. Beat 1: What. Beat 2: How. CTA: Try it." }
    ],
    proTips: ["Hook in 2 sec.", "3 beats max.", "Clear CTA."],
    generate: (input) => {
      const idea = input.trim() || "your idea";
      return [
        `Hook: Stop scrolling. Beat 1: ${idea} problem. Beat 2: Fix. CTA: Save.`,
        `Hook: POV ${idea}. Beat 1: Setup. Beat 2: Demo. CTA: Follow.`,
        `Hook: No one talks about ${idea}. Beat 1: Why. Beat 2: How. CTA: Try.`
      ];
    }
  },

  "reel-hook-generator": {
    inputLabel: "Reel topic",
    placeholder: "Example: tutorial, tip, story",
    tryExample: "morning routine for busy people",
    buttonLabel: "Generate Hooks",
    resultTitle: "Hook ideas",
    emptyMessage: "Your hook ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your Reel topic above." },
      { step: 2, text: "Generate Reel hooks." },
      { step: 3, text: "Use in your first 2 seconds." }
    ],
    examples: [
      { input: "tutorial", output: "Stop scrolling if you want to learn this" },
      { input: "tip", output: "POV: you finally found the hack" }
    ],
    proTips: ["First 2 sec = retention.", "Curiosity or pain.", "Under 15 words."],
    generate: (input) => {
      const topic = input.trim() || "your reel";
      return [`Stop scrolling if ${topic}`, `POV: ${topic} that works`, `No one talks about ${topic}`, `This ${topic} changed everything`, `Save this ${topic}`];
    }
  },

  "viral-caption-generator": {
    inputLabel: "Post idea",
    placeholder: "Example: tip, moment, product",
    tryExample: "morning routine that changed my life",
    buttonLabel: "Generate Captions",
    resultTitle: "Caption ideas",
    emptyMessage: "Your caption ideas will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your post idea above." },
      { step: 2, text: "Generate viral-style captions." },
      { step: 3, text: "Use on any short-form platform." }
    ],
    examples: [
      { input: "tip", output: "This changed everything 👇" },
      { input: "moment", output: "POV: when you finally get it" }
    ],
    proTips: ["First line = hook.", "Curiosity or emotion.", "Add emojis."],
    generate: (input) => {
      const idea = input.trim() || "your moment";
      return [`This ${idea} changed everything`, `POV: ${idea}`, `No one talks about ${idea}`, `Stop scrolling if ${idea}`, `${idea} that actually works`];
    }
  },

  "script-outline-generator": {
    inputLabel: "Video topic",
    placeholder: "Example: how to edit faster",
    tryExample: "3 productivity hacks",
    buttonLabel: "Generate Outline",
    resultTitle: "Script outlines",
    emptyMessage: "Your script outlines will appear here.",
    howItWorks: [
      { step: 1, text: "Enter your video topic above." },
      { step: 2, text: "Generate script outlines." },
      { step: 3, text: "Use hook, beats and CTA structure." }
    ],
    examples: [
      { input: "editing", output: "Hook: This edit changed everything. Beat 1: Setup. Beat 2: Demo. Beat 3: Result. CTA: Try it." },
      { input: "productivity", output: "Hook: Stop doing X. Beat 1: Why. Beat 2: What. Beat 3: How. CTA: Save this." }
    ],
    proTips: ["Hook in first 2 seconds.", "3 beats max for short-form.", "Clear CTA at the end."],
    generate: (input) => {
      const topic = input.trim() || "your topic";
      return [
        `Hook: Stop scrolling. Beat 1: ${topic} problem. Beat 2: Solution. Beat 3: Result. CTA: Try it.`,
        `Hook: POV ${topic}. Beat 1: Setup. Beat 2: Demo. Beat 3: Takeaway. CTA: Save this.`,
        `Hook: No one talks about ${topic}. Beat 1: Why. Beat 2: How. Beat 3: Proof. CTA: Follow.`,
        `Hook: I tried ${topic}. Beat 1: Before. Beat 2: After. Beat 3: Tip. CTA: Link in bio.`,
        `Hook: This ${topic} changed everything. Beat 1: Intro. Beat 2: Steps. Beat 3: Summary. CTA: Comment.`
      ];
    }
  }
};
