/**
 * V95: Reusable structured examples — niche, goal, pattern, example, why_it_works
 */

export type StructuredCreatorExample = {
  niche: string;
  goal: string;
  pattern: string;
  example: string;
  why_it_works: string;
};

export type ExampleCategory = "tiktok_caption" | "hook" | "ai_caption";

export const STRUCTURED_EXAMPLES: Record<ExampleCategory, StructuredCreatorExample[]> = {
  tiktok_caption: [
    {
      niche: "Fitness / fat loss",
      goal: "Drive saves",
      pattern: "Contrarian + proof",
      example: "Everyone says cardio first. I flipped the order — 2 weeks later my energy was unreal.",
      why_it_works: "Challenges common advice and promises a tangible payoff; saves signal intent to try."
    },
    {
      niche: "Small business",
      goal: "Comments",
      pattern: "POV + relatable pain",
      example: "POV: you film 10 Reels a week but your hooks still feel random.",
      why_it_works: "Names a specific creator pain; invites “same” comments and tips."
    },
    {
      niche: "Study / productivity",
      goal: "Shares",
      pattern: "Listicle hook",
      example: "3 study mistakes I stopped doing — my grades didn’t magically fix, but my focus did.",
      why_it_works: "Numbered promise feels scannable; humble payoff builds trust."
    },
    {
      niche: "Cooking",
      goal: "Watch time",
      pattern: "Before/after tension",
      example: "I made the same recipe 2 ways — one blew up, one flopped. Here’s the 12s difference.",
      why_it_works: "Creates a mystery gap; viewers stay for the reveal."
    },
    {
      niche: "Skincare",
      goal: "Trust",
      pattern: "Myth bust",
      example: "Dermatologists never said this — but creators keep repeating it. Let’s fix that.",
      why_it_works: "Authority framing + correction loop increases perceived value."
    },
    {
      niche: "Real estate",
      goal: "Leads",
      pattern: "Local specificity",
      example: "If you’re buying in [city] in 2026, this clause is costing people thousands.",
      why_it_works: "Local + stakes = high relevance for niche audience."
    },
    {
      niche: "Gaming",
      goal: "Engagement",
      pattern: "Hot take",
      example: "Unpopular opinion: this ‘meta’ build is overrated — try this instead.",
      why_it_works: "Polarization sparks debate in comments."
    },
    {
      niche: "Parenting",
      goal: "Saves",
      pattern: "Gentle reframe",
      example: "Stop calling it a ‘tantrum’ for a second — here’s what’s actually happening.",
      why_it_works: "Reframe hooks empathy; parents save for later calm moments."
    },
    {
      niche: "Finance",
      goal: "Follows",
      pattern: "Story + number",
      example: "I tracked every $5 purchase for 30 days — the pattern shocked me.",
      why_it_works: "Concrete experiment + curiosity about the pattern."
    },
    {
      niche: "Travel",
      goal: "Shares",
      pattern: "Mistake story",
      example: "The airport mistake that almost ruined our trip (and the 20s fix).",
      why_it_works: "Fear + quick fix is highly shareable to friends traveling."
    },
    {
      niche: "DIY / home",
      goal: "Saves",
      pattern: "Cost reveal",
      example: "We upgraded this room for under $80 — here’s the exact shopping list.",
      why_it_works: "Price anchor + list promise drives saves."
    },
    {
      niche: "Career / job search",
      goal: "DMs",
      pattern: "Template tease",
      example: "This 2-line LinkedIn opener got me 3 interviews last month — steal it.",
      why_it_works: "Offers a stealable asset; DMs ask for the template."
    }
  ],
  hook: [
    {
      niche: "Beauty",
      goal: "Stop scroll",
      pattern: "You’re doing X wrong",
      example: "You’re removing makeup wrong — here’s the 10s fix.",
      why_it_works: "Direct correction creates immediate curiosity."
    },
    {
      niche: "Tech tips",
      goal: "Watch",
      pattern: "Stop scrolling if…",
      example: "Stop scrolling if your phone storage is always full.",
      why_it_works: "Filters audience; qualified viewers stay."
    },
    {
      niche: "Fitness",
      goal: "Debate",
      pattern: "Unpopular opinion",
      example: "Unpopular opinion: rest days matter more than extra sets.",
      why_it_works: "Invites agreement/disagreement in comments."
    },
    {
      niche: "Food",
      goal: "Save",
      pattern: "Nobody talks about",
      example: "Nobody talks about this rice mistake — but it changes texture.",
      why_it_works: "Secret knowledge framing."
    },
    {
      niche: "Marketing",
      goal: "Follow",
      pattern: "If you sell…",
      example: "If you sell anything online, memorize this hook formula.",
      why_it_works: "Clear ICP + promise of a system."
    },
    {
      niche: "Study",
      goal: "Share",
      pattern: "POV",
      example: "POV: you finally found a note system that doesn’t fall apart after week 2.",
      why_it_works: "Aspiration + relatable failure story."
    },
    {
      niche: "Comedy",
      goal: "Rewatch",
      pattern: "Watch twice",
      example: "Watch this twice — the second line changes everything.",
      why_it_works: "Forces replay; boosts retention."
    },
    {
      niche: "Pets",
      goal: "Comments",
      pattern: "Vet says",
      example: "My vet said this about treats — I wish I knew sooner.",
      why_it_works: "Authority + pet parent emotion."
    },
    {
      niche: "Fashion",
      goal: "Saves",
      pattern: "3 outfits",
      example: "3 outfits from 5 basics — save this before your next trip.",
      why_it_works: "Concrete deliverable + travel relevance."
    },
    {
      niche: "Mental health (edu)",
      goal: "Trust",
      pattern: "Gentle myth",
      example: "You’re not ‘lazy’ — your brain might be overloaded. Here’s one reset.",
      why_it_works: "Validation reduces shame; viewers trust compassionate tone."
    },
    {
      niche: "Cars",
      goal: "Watch time",
      pattern: "Sound + mystery",
      example: "That noise means something — ignore it and this gets expensive.",
      why_it_works: "Fear of cost sustains attention."
    },
    {
      niche: "Music / creator",
      goal: "Follow",
      pattern: "One tweak",
      example: "One mixing tweak that makes vocals feel ‘expensive’ on phone speakers.",
      why_it_works: "Specific outcome for creators with phones as primary audience."
    }
  ],
  ai_caption: [
    {
      niche: "E-commerce",
      goal: "Click bio",
      pattern: "Problem → product",
      example: "Still guessing sizes? This fit checklist cut our returns in half — link in bio.",
      why_it_works: "Pain + proof + clear CTA path."
    },
    {
      niche: "Coaching",
      goal: "Book call",
      pattern: "Story + lesson",
      example: "I almost quit content — then I changed one thing about my hooks. Comment ‘HOOK’ and I’ll share.",
      why_it_works: "Comment CTA trains algorithm + lead gen."
    },
    {
      niche: "Local service",
      goal: "Calls",
      pattern: "Before/after",
      example: "Same room. Same budget. Different layout — swipe for the difference.",
      why_it_works: "Swipe structure fits carousel + Reels cover."
    },
    {
      niche: "SaaS",
      goal: "Trial",
      pattern: "Time saved",
      example: "We automated this report — now it’s 6 minutes instead of 45. Save this workflow.",
      why_it_works: "Quantified benefit is shareable to teams."
    },
    {
      niche: "Nonprofit",
      goal: "Donate",
      pattern: "One stat",
      example: "One stat that changed how we spend our donations — full breakdown in caption.",
      why_it_works: "Transparency builds trust for giving."
    },
    {
      niche: "Events",
      goal: "RSVP",
      pattern: "FOMO + clarity",
      example: "Last year sold out in 48h — here’s what’s different this year (and the link).",
      why_it_works: "Scarcity + update reduces decision friction."
    },
    {
      niche: "Personal brand",
      goal: "Newsletter",
      pattern: "Lesson of the week",
      example: "This week I learned: your niche isn’t a label — it’s a promise. Deep dive in newsletter (link).",
      why_it_works: "Philosophy hook pulls quality subscribers."
    },
    {
      niche: "Apps",
      goal: "Install",
      pattern: "Tiny habit",
      example: "A 20s habit that actually made me drink more water — app name in bio.",
      why_it_works: "Micro habit feels achievable; app as enabler."
    },
    {
      niche: "B2B",
      goal: "Lead magnet",
      pattern: "Mistake audit",
      example: "If your landing page does this, you’re leaking leads — free checklist in bio.",
      why_it_works: "Audit framing + free asset."
    },
    {
      niche: "Photography",
      goal: "Book",
      pattern: "Behind the scenes",
      example: "What clients don’t see: 12 minutes of chaos → 1 cover shot. Booking link pinned.",
      why_it_works: "BTS humanizes premium service."
    },
    {
      niche: "Education creator",
      goal: "Course",
      pattern: "Myth + framework",
      example: "Myth: you need fancy gear. Truth: you need this framing — class link in bio.",
      why_it_works: "Lowers barrier; pushes to paid depth."
    },
    {
      niche: "Health (general wellness)",
      goal: "Saves",
      pattern: "Checklist",
      example: "5-minute morning checklist — not ‘hustle’, just stable energy. Save for Monday.",
      why_it_works: "Save-oriented CTA + timing cue."
    }
  ]
};

export const CTA_PATTERNS: { pattern: string; use_when: string }[] = [
  { pattern: "Comment [KEYWORD] for…", use_when: "You can reply with a resource or DM automation." },
  { pattern: "Link in bio for…", use_when: "Single destination (shop, lead magnet, booking)." },
  { pattern: "Follow for part 2", use_when: "Serialized content; boosts return viewers." },
  { pattern: "Save this for later", use_when: "Reference / tutorial / list content." },
  { pattern: "Tag someone who…", use_when: "High share intent niches (jobs, relationships, money)." },
  { pattern: "Stitch this with…", use_when: "TikTok-native response format." },
  { pattern: "Duet if you disagree", use_when: "Debate hooks; drives split-screen engagement." },
  { pattern: "Which option: A or B?", use_when: "Fast comments; good for polls in comments." }
];
