/**
 * SEO Engine v2 - Content templates
 * 1 template + topic replacement = many pages
 */
import { getBaseTopic } from "./intents";

export function getCaptionExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `You need to see this ${t} 👇`,
    `Nobody is talking about ${t}…`,
    `POV: your algorithm gets ${t}`,
    `Save this for later 📌`,
    `The one thing nobody tells you about ${t}`,
    `Stop scrolling for a sec 👇`,
    `Wait for it…`,
    `I tried ${t} so you don't have to`,
    `Real talk 💀`,
    `That's it. That's the post.`,
    `No caption needed`,
    `Vibes only ✨`,
    `Period.`,
    `Facts.`,
    `No cap.`,
    `This hit different 😂`,
    `Comment if you agree`,
    `Tag someone who needs this`,
    `Swipe for more 👉`,
    `The truth about ${t}`
  ];
}

export function getHashtagExamples(topic: string): string[] {
  const base = topic.replace(/-/g, "");
  return [
    `#${base} #fyp #viral #creators`,
    `#${base} #contentcreator #trending #foryou`,
    `#${base} #tiktok #reels #shorts`,
    `#${base} #explore #creator #niche`,
    `#${base} #viral #fyp #trending`,
    `#fyp #viral #${base} #contentcreator`,
    `#trending #${base} #creators #explore`,
    `#${base} #reels #shorts #tiktok`,
    `#contentcreator #${base} #foryou #viral`,
    `#${base} #fyp #explore #niche`,
    `#${base} #viral #fyp #content`,
    `#fyp #${base} #trending #explore`,
    `#${base} #creator #content #niche`,
    `#viral #${base} #foryou #shorts`,
    `#${base} #reels #tiktok #contentcreator`,
    `#explore #${base} #fyp #creators`,
    `#${base} #trending #viral #niche`,
    `#contentcreator #${base} #explore #fyp`,
    `#${base} #shorts #reels #foryou`,
    `#fyp #trending #${base} #creator`
  ];
}

export function getTitleExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `I Tried ${t} So You Don't Have To`,
    `The Truth About ${t} Nobody Talks About`,
    `7 ${t} No One Talks About`,
    `${t} in 10 Minutes: Full Guide`,
    `Stop Doing ${t} Wrong (Do This Instead)`,
    `The Secret to ${t}`,
    `How to ${t} in 2025`,
    `${t} for Beginners`,
    `What ${t} Experts Don't Tell You`,
    `5 ${t} That Actually Work`,
    `The Ultimate ${t} Guide`,
    `${t} That Get Views`,
    `Why ${t} Matters`,
    `${t} Explained`,
    `Best ${t} for Creators`,
    `${t} Tips That Work`,
    `How I Mastered ${t}`,
    `${t} Mistakes to Avoid`,
    `The ${t} Formula`,
    `${t} That Convert`
  ];
}

export function getHookExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `Stop scrolling if you want ${t}`,
    `You're doing ${t} wrong, here's why:`,
    `No one is talking about ${t}`,
    `If you ${t}, watch this`,
    `I tried ${t} so you don't have to`,
    `POV: ${t} without the struggle`,
    `Nobody tells you this about ${t}`,
    `The ${t} secret that changed everything`,
    `Stop scrolling if you ${t}`,
    `What happens when you ${t}`,
    `The truth about ${t}`,
    `Why ${t} matters`,
    `How to ${t} in 3 seconds`,
    `${t} that actually work`,
    `The ${t} hack nobody uses`,
    `If you ${t}, save this`,
    `POV: you finally get ${t}`,
    `The ${t} formula`,
    `Why your ${t} isn't working`,
    `The ${t} mistake everyone makes`
  ];
}

export function getBioExamples(topic: string): string[] {
  const t = topic.replace(/-/g, " ");
  return [
    `${t} creator | DM for collabs`,
    `Here for the ${t} vibes ✨`,
    `Making ${t} content that hits`,
    `${t} | Link in bio`,
    `Creator | ${t} | Follow for more`,
    `✨ ${t} content`,
    `${t} daily | Follow for more`,
    `Living for ${t} | Creator`,
    `${t} enthusiast | Collabs welcome`,
    `Here for ${t} | Link in bio`,
    `${t} content creator | DM for collabs`,
    `All about ${t} ✨`,
    `${t} lover | Creating daily`,
    `Your ${t} bestie | Link below`,
    `${t} | Creator | Collabs welcome`,
    `Making ${t} content ✨`,
    `${t} vibes only | Follow for more`,
    `Creator focused on ${t}`,
    `${t} content | Link in bio`,
    `Here for the ${t} content`
  ];
}

const CAPTION_POOL = [
  "You need to see this 👇", "Nobody is talking about this…", "POV: your algorithm gets it",
  "Save this for later 📌", "The one thing nobody tells you", "Stop scrolling for a sec 👇",
  "Wait for it…", "I tried this so you don't have to", "Real talk 💀", "That's it. That's the post.",
  "No caption needed", "Vibes only ✨", "Period.", "Facts.", "No cap.", "This hit different 😂",
  "Comment if you agree", "Tag someone who needs this", "Swipe for more 👉", "The truth about this",
  "POV: you finally get it", "Stop scrolling if you want this", "Nobody tells you this",
  "The secret that changed everything", "What happens when you try this", "Why this matters",
  "How to do this in 3 seconds", "The hack nobody uses", "If you want this, save this",
  "The formula that works", "Why yours isn't working", "The mistake everyone makes",
  "You're doing this wrong", "If you do this, watch this", "POV: without the struggle",
  "This that actually work", "Comment your thoughts", "Double tap if you agree",
  "Share with someone who needs this", "Bookmark for later", "Send to a friend",
  "Drop a 🔥 if you're still watching", "Which one? Comment below", "No one talks about this",
  "The thing that changed everything", "Try this and thank me later", "POV: plot twist",
  "Wait for the end", "This is the one", "Don't skip this", "You won't regret this",
  "Trust the process", "The glow up is real", "Main character energy", "That girl era",
  "Clean girl aesthetic", "Hot girl walk", "Soft life", "Hard launch", "It's giving",
  "Slay", "Iconic", "Unhinged", "Unpopular opinion", "Hot take", "Spill the tea",
  "Tea was spilled", "No thoughts just vibes", "Brain empty", "Autopilot mode",
  "Existing", "Surviving", "Thriving", "Living", "Bestie", "Periodt", "Slay queen",
  "Not me", "Literally me", "It's me hi", "It's giving main character", "POV: main character",
  "Main character moment", "Supporting character energy", "Plot twist", "Unexpected",
  "Did not see that coming", "The audacity", "The nerve", "The disrespect",
  "I can't", "I'm deceased", "Crying", "Screaming", "Shaking", "Vibrating",
  "Obsessed", "Addicted", "Hooked", "Can't stop", "Won't stop", "No cap fr fr",
  "Lowkey", "Highkey", "Mid", "Bussin", "Slaps", "Hits different", "Chef's kiss",
  "Underrated", "Overrated", "Slept on", "Deserves more", "Needs more recognition",
  "Hidden gem", "Gem", "Banger", "Bop", "Banger alert", "Fire", "Flames",
  "Heating up", "Trending", "Viral", "Going viral", "About to blow up",
  "Watch this blow up", "Save before it's gone", "Before it gets taken down",
  "Rare", "Limited", "Exclusive", "Behind the scenes", "BTS", "Raw", "Unfiltered",
  "Real", "Authentic", "Genuine", "Honest", "Transparent", "Keeping it real",
  "Keeping it 100", "No filter", "Unpopular opinion incoming", "Unpopular opinion",
  "Controversial take", "Hot take alert", "Don't @ me", "Fight me",
  "Change my mind", "Change my mind challenge", "Prove me wrong", "Change my view",
  "Agree or disagree?", "Yes or no?", "This or that?", "Pick one", "Choose your fighter",
  "Rate this", "Rate this 1-10", "Score this", "Judge this", "Roast this",
  "Compliment this", "Hype this up", "Support this", "Share this", "Repost this",
  "Duet this", "Stitch this", "Use this sound", "Try this trend", "Join this trend",
  "Jump on this", "Get on this", "Don't miss this", "Catch this", "Grab this",
  "Take this", "Use this", "Copy this", "Steal this", "Borrow this", "Adapt this",
  "Make it yours", "Put your spin on it", "Add your twist", "Make it viral",
  "Help this go viral", "Let's get this to 1M", "1M or we riot", "Goals",
  "Dream big", "Manifesting", "Speaking it into existence", "Claiming this",
  "This is mine now", "Adopted", "Adopting this", "Taking this", "Mine",
  "Yours truly", "Xoxo", "Ttyl", "Brb", "Gtg", "Otw", "Ngl", "Tbh", "Imo",
  "Fyi", "Asap", "Rn", "Rn vibes", "Current mood", "Mood", "Vibe check",
  "Vibe", "Aesthetic", "Aesthetic check", "Fit check", "Ootd", "Grwm",
  "Get ready with me", "Day in my life", "Diy", "Life hack", "Pro tip",
  "Tip", "Hack", "Trick", "Secret", "Formula", "Method", "Strategy",
  "Guide", "Tutorial", "How to", "Step by step", "Full process", "The process",
  "Before and after", "Transformation", "Results", "Proof", "Evidence",
  "Data", "Stats", "Numbers", "Facts", "Science", "Research", "Study",
  "Expert", "Professional", "Pro", "Beginner", "Advanced", "Intermediate",
  "Level up", "Upgrade", "Next level", "Unlocked", "Achievement unlocked",
  "New skill unlocked", "Learning", "Growing", "Evolving", "Progress",
  "Journey", "Story", "Chapter", "Era", "Phase", "Season", "Episode"
];

const HOOK_POOL = [
  "Stop scrolling if you want this", "You're doing this wrong, here's why",
  "No one is talking about this", "If you want this, watch this",
  "I tried this so you don't have to", "POV: without the struggle",
  "Nobody tells you this", "The secret that changed everything",
  "Stop scrolling if you want results", "What happens when you try",
  "The truth about this", "Why this matters", "How to do this in 3 seconds",
  "This that actually work", "The hack nobody uses", "If you want this, save this",
  "POV: you finally get it", "The formula that works", "Why yours isn't working",
  "The mistake everyone makes", "Wait for it", "You won't believe this",
  "This changed everything", "The one thing that matters", "Don't skip this",
  "This is important", "Listen up", "Pay attention", "You need to see this",
  "This will change your mind", "Game changer", "Life changer", "Mind blown",
  "You're welcome", "Thank me later", "Trust me on this", "Just try it",
  "One minute", "Quick tip", "Fast hack", "Easy trick", "Simple method",
  "No one talks about this", "Underrated tip", "Overlooked strategy",
  "Hidden gem", "Best kept secret", "Insider info", "Behind the scenes",
  "What they don't tell you", "The real truth", "Unpopular opinion",
  "Hot take", "Controversial", "Uncomfortable truth", "Hard truth",
  "Reality check", "Wake up call", "Let's be honest", "Real talk",
  "No cap", "Fr fr", "Dead serious", "Not joking", "100% real",
  "Proven", "Tested", "Tried", "Verified", "Legit", "Actual", "Real results",
  "Before you scroll", "Last one", "Important", "Must watch", "Must see",
  "Don't miss this", "You need this", "This is for you", "If this is you",
  "POV: you", "Relatable", "So real", "Too real", "Me", "Literally me",
  "It's me", "That's me", "Same", "Same energy", "Same vibe", "Mood",
  "Vibe", "Aesthetic", "Goals", "Dream", "Manifesting", "Claiming",
  "Adopting", "Taking notes", "Learning", "Growing", "Evolving",
  "Level up", "Upgrade", "Next level", "Unlocked", "Achievement",
  "Progress", "Journey", "Story", "Chapter", "Era", "Phase"
];

export function getMagnetExamples(type: "captions" | "hooks", count: number = 200): string[] {
  const pool = type === "captions" ? CAPTION_POOL : HOOK_POOL;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[i % pool.length]);
  }
  return result;
}

export function getSeoFaq(
  platformLabel: string,
  typeLabel: string,
  topicLabel: string
): { question: string; answer: string }[] {
  const typeLower = typeLabel.toLowerCase();
  return [
    {
      question: `What is a good ${platformLabel} ${typeLower}?`,
      answer: `A good ${platformLabel} ${typeLower} is short, engaging, and matches your content. ${topicLabel} ${typeLower} work best when they feel authentic and add value—whether that's humor, curiosity, or a clear call to action. Use our AI generator to create multiple options and pick the one that fits your voice.`
    },
    {
      question: `How long should a ${platformLabel} ${typeLower} be?`,
      answer: `For ${platformLabel}, keep ${typeLower} under 150 characters for best visibility. Shorter ${typeLower} (under 100 characters) often perform better because they're easier to read and don't get cut off. Our generator creates options in different lengths so you can choose what works.`
    },
    {
      question: `Do ${typeLower} affect ${platformLabel} views?`,
      answer: `Yes. Strong ${typeLower} can improve engagement, which signals to the algorithm to show your content to more people. ${topicLabel} ${typeLower} that spark curiosity or invite comments tend to get more views. Try our free AI tool to generate ${typeLower} optimized for engagement.`
    }
  ];
}

export function getExamples(
  contentType: string,
  topic: string
): string[] {
  const baseTopic = getBaseTopic(topic);
  switch (contentType) {
    case "captions":
      return getCaptionExamples(baseTopic);
    case "hashtags":
      return getHashtagExamples(baseTopic);
    case "titles":
      return getTitleExamples(baseTopic);
    case "hooks":
      return getHookExamples(baseTopic);
    case "bio":
      return getBioExamples(baseTopic);
    default:
      return getCaptionExamples(baseTopic);
  }
}

/** Returns exactly 20 real examples for SEO Real Content Block. Uses templates + pool fallback. */
export function getRealExamples(contentType: string, topic: string): string[] {
  const baseTopic = getBaseTopic(topic);
  let examples: string[];
  switch (contentType) {
    case "captions":
      examples = getCaptionExamples(baseTopic);
      break;
    case "hashtags":
      examples = getHashtagExamples(baseTopic);
      break;
    case "titles":
      examples = getTitleExamples(baseTopic);
      break;
    case "hooks":
      examples = getHookExamples(baseTopic);
      break;
    case "bio":
      examples = getBioExamples(baseTopic);
      break;
    default:
      examples = getCaptionExamples(baseTopic);
  }
  if (examples.length >= 20) return examples.slice(0, 20);
  const pool = contentType === "hooks" ? HOOK_POOL : CAPTION_POOL;
  while (examples.length < 20) {
    examples.push(pool[examples.length % pool.length]);
  }
  return examples.slice(0, 20);
}
