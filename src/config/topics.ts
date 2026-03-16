/**
 * Topic pages - /topics/[slug]
 * 200 topics for creator content
 */

export type TopicConfig = {
  slug: string;
  title: string;
  intro: string;
  toolSlug: string;
  toolName: string;
};

const TOOL_MAP: Record<string, { slug: string; name: string }> = {
  caption: { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" },
  hook: { slug: "hook-generator", name: "Hook Generator" },
  instagram: { slug: "instagram-caption-generator", name: "Instagram Caption Generator" }
};

function topic(
  slug: string,
  title: string,
  type: "caption" | "hook" | "instagram" = "caption"
): TopicConfig {
  const t = TOOL_MAP[type];
  return {
    slug,
    title: `${title} Content`,
    intro: `${title} captions, hooks, and ideas for creators. Get inspiration and generate your own with AI.`,
    toolSlug: t.slug,
    toolName: t.name
  }
}

function buildTopics(): TopicConfig[] {
  const base = [
    "fitness", "motivation", "business", "food", "travel", "startup", "productivity",
    "gym", "workout", "health", "wellness", "mindset", "self-improvement", "goals",
    "entrepreneur", "marketing", "finance", "investing", "side-hustle", "freelance",
    "cooking", "recipes", "restaurant", "foodie", "baking", "meal-prep", "nutrition",
    "adventure", "wanderlust", "destinations", "vacation", "nature", "outdoors",
    "skincare", "makeup", "beauty", "hair", "fashion", "ootd", "style", "aesthetic",
    "gaming", "tech", "software", "coding", "ai", "digital", "social-media",
    "comedy", "funny", "humor", "relatable", "sarcastic", "meme",
    "education", "learning", "study", "tips", "hacks", "tutorial", "how-to",
    "lifestyle", "day-in-life", "vlog", "routine", "morning", "night",
    "family", "mom", "dad", "kids", "parenting", "home", "pets", "dog", "cat",
    "wedding", "relationship", "couple", "dating", "love", "friendship",
    "transformation", "before-after", "progress", "journey", "story",
    "grwm", "get-ready", "outfit", "getting-ready", "getting-ready-with-me",
    "dance", "music", "singing", "cover", "artist", "creative",
    "yoga", "meditation", "mental-health", "therapy", "self-care",
    "running", "marathon", "cycling", "crossfit", "weightlifting",
    "vegan", "plant-based", "keto", "diet", "weight-loss", "fitness-journey",
    "small-business", "ecommerce", "dropshipping", "shopify", "amazon",
    "real-estate", "property", "home-decor", "interior", "design",
    "photography", "photo", "camera", "editing", "lightroom",
    "art", "drawing", "painting", "craft", "diy", "handmade",
    "book", "reading", "writing", "author", "novel",
    "podcast", "interview", "conversation", "talk",
    "asmr", "relaxing", "sleep", "calm",
    "sports", "basketball", "soccer", "football", "tennis", "golf",
    "car", "automotive", "motorcycle", "bike",
    "science", "space", "nature-science", "experiment",
    "history", "culture", "documentary",
    "fashion-week", "runway", "streetwear", "sustainable-fashion",
    "luxury", "minimalist", "capsule-wardrobe",
    "coffee", "cafe", "barista", "tea", "drinks",
    "party", "nightlife", "club", "concert", "event",
    "birthday", "celebration", "holiday", "christmas", "halloween", "valentines",
    "summer", "winter", "spring", "fall", "seasonal",
    "minimalist", "clean", "simple", "organized", "declutter",
    "cottagecore", "y2k", "dark-academia", "light-academia", "aesthetic",
    "baddie", "clean-girl", "that-girl", "soft-girl", "edgy",
    "confidence", "self-love", "body-positive", "empowerment",
    "inspiration", "quotes", "motivational-quotes", "daily-motivation",
    "productivity-tips", "time-management", "focus", "discipline",
    "remote-work", "work-from-home", "digital-nomad", "laptop-life",
    "content-creation", "creator-economy", "influencer", "creator-tips",
    "branding", "personal-brand", "brand-voice", "niche",
    "collab", "partnership", "networking", "community",
    "launch", "launching", "product-launch", "business-launch",
    "testimonial", "review", "unboxing", "haul", "first-impression",
    "challenge", "trend", "viral", "trending", "fyp",
    "duet", "stitch", "remix", "sound",
    "storytime", "story", "experience", "lesson-learned",
    "day-in-my-life", "vlog", "routine", "schedule",
    "get-ready-with-me", "grwm", "morning-routine", "night-routine",
    "outfit-check", "try-on", "haul", "fashion-haul",
    "recipe", "cooking-tutorial", "meal-idea", "quick-meal",
    "workout-routine", "gym-session", "home-workout", "no-equipment",
    "travel-vlog", "travel-tips", "packing", "itinerary",
    "skincare-routine", "skincare-tips", "product-review", "skincare-hacks",
    "makeup-tutorial", "makeup-look", "makeup-tips", "makeup-transformation",
    "hair-tutorial", "hair-tips", "hair-transformation", "haircare",
    "room-tour", "apartment-tour", "home-tour", "organization",
    "desk-setup", "workspace", "office", "study-setup",
    "budget", "saving", "money-tips", "financial-freedom",
    "career", "job", "interview", "resume", "linkedin",
    "college", "university", "student", "student-life", "exams",
    "newborn", "baby", "toddler", "pregnancy", "mom-life",
    "gardening", "plants", "indoor-plants", "plant-care",
    "camping", "hiking", "backpacking", "road-trip",
    "beach", "pool", "summer-vibes", "sunset", "sunrise",
    "snow", "winter-vibes", "cozy", "hygge",
    "coffee-shop", "cafe-vibes", "study-with-me", "work-with-me",
    "asmr", "satisfying", "oddly-satisfying", "relaxing",
    "prank", "challenge", "dare", "fun",
    "reaction", "react", "first-time", "trying",
    "comparison", "vs", "versus", "difference",
    "top-10", "list", "ranking", "best-of",
    "beginner", "starter", "101", "basics", "intro",
    "advanced", "pro", "expert", "master",
    "mistakes", "errors", "what-not-to-do", "avoid",
    "secret", "hidden", "unknown", "discover",
    "2025", "new", "latest", "trending-now",
    "throwback", "nostalgia", "memory", "retro",
    "behind-the-scenes", "bts", "process", "how-its-made",
    "q-and-a", "faq", "questions", "ask-me",
    "announcement", "news", "update", "life-update"
  ];

  const seen = new Set<string>();
  const out: TopicConfig[] = [];

  for (const s of base) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = ["hook", "opening", "curiosity", "story", "viral", "intro"].some((x) => s.includes(x))
      ? "hook"
      : ["instagram", "reel", "feed", "carousel"].some((x) => s.includes(x))
        ? "instagram"
        : "caption";
    out.push(topic(s, title, toolType));
  }

  const extra = [
    "opening-hooks", "curiosity-hooks", "question-hooks", "story-hooks", "viral-hooks",
    "first-line-hooks", "controversial-hooks", "trending-hooks",
    "aesthetic-reels", "dance-reels", "comedy-reels", "tutorial-reels",
    "pov-content", "relatable-content", "savage-captions", "attitude-captions",
    "short-captions", "long-captions", "best-captions", "viral-captions",
    "caption-ideas", "hook-ideas", "content-ideas", "video-ideas",
    "niche-content", "trending-content", "evergreen-content",
    "personal-brand", "brand-story", "brand-values",
    "engagement-tips", "growth-tips", "algorithm-tips",
    "cta-ideas", "call-to-action", "engagement-cta",
    "hashtag-strategy", "caption-strategy", "content-strategy",
    "monetization", "sponsorship", "brand-deals",
    "analytics", "insights", "metrics", "performance",
    "sad-captions", "cute-captions", "romantic-captions", "sassy-captions",
    "confidence-captions", "self-love-captions", "lifestyle-captions",
    "pet-captions", "music-captions", "gaming-captions", "tech-captions",
    "cooking-captions", "skincare-captions", "makeup-captions", "hair-captions",
    "ootd-captions", "unboxing-captions", "review-captions", "tutorial-captions",
    "tips-captions", "hacks-captions", "life-hack-captions", "productivity-captions",
    "study-captions", "work-from-home-captions", "small-business-captions",
    "entrepreneur-captions", "mom-life-captions", "dad-captions", "family-captions",
    "wedding-captions", "vacation-captions", "adventure-captions", "nature-captions",
    "sunset-captions", "coffee-captions", "aesthetic-video", "soft-aesthetic",
    "dark-aesthetic", "y2k", "cottagecore", "minimalist-captions", "edgy-captions",
    "baddie-captions", "clean-girl-captions", "that-girl-captions",
    "morning-motivation", "evening-routine", "weekend-vibes", "monday-motivation",
    "friday-feels", "sunday-scaries", "self-care-sunday", "wellness-wednesday",
    "transformation-tuesday", "throwback-thursday", "fitness-friday",
    "money-mindset", "wealth-building", "passive-income", "multiple-streams",
    "email-marketing", "seo-tips", "social-strategy", "content-calendar",
    "repurposing-content", "cross-posting", "platform-specific",
    "first-post", "reels-tips", "tiktok-tips", "youtube-tips", "instagram-tips",
    "comment-ideas", "dm-strategies", "community-building", "audience-growth",
    "authenticity", "vulnerability", "storytelling", "narrative",
    "micro-influencer", "nano-influencer", "macro-influencer",
    "ugc-content", "user-generated", "brand-ambassador", "affiliate-marketing",
    "link-in-bio", "linktree", "bio-optimization", "profile-optimization",
    "reel-hooks", "tiktok-hooks", "youtube-intros", "attention-grabbers",
    "scroll-stoppers", "thumb-stoppers", "first-3-seconds", "first-frame"
  ];

  const expansion = [
    "fitness-motivation", "morning-routine", "self-discipline", "startup-ideas",
    "business-tips", "content-creation", "youtube-growth", "tiktok-marketing",
    "instagram-reels-ideas", "viral-content", "engagement-hacks", "algorithm-tips",
    "creator-monetization", "brand-deals", "sponsorship-tips", "affiliate-content",
    "ugc-creation", "collab-ideas", "duet-ideas", "stitch-ideas", "remix-ideas",
    "trending-sounds", "viral-sounds", "music-trends", "dance-trends",
    "pov-ideas", "storytime-ideas", "day-in-life", "get-ready-with-me",
    "outfit-of-day", "try-on-haul", "unboxing-ideas", "product-review",
    "recipe-share", "cooking-hack", "meal-prep", "healthy-eating",
    "workout-motivation", "gym-tips", "home-workout", "yoga-flow",
    "meditation-tips", "mental-health", "self-care-routine", "wellness-journey",
    "travel-destinations", "packing-tips", "travel-hacks", "adventure-tips",
    "photography-tips", "editing-tricks", "camera-angles", "lighting-tips",
    "skincare-routine", "makeup-tutorial", "hair-styling", "beauty-hacks",
    "fashion-trends", "style-tips", "outfit-ideas", "sustainable-fashion",
    "home-decor", "organization-tips", "minimalist-living", "declutter",
    "productivity-hacks", "time-management", "focus-tips", "work-life-balance",
    "remote-work-tips", "digital-nomad", "freelance-life", "side-hustle-ideas",
    "money-tips", "investing-basics", "saving-tips", "financial-freedom",
    "career-advice", "job-search", "interview-tips", "resume-tips",
    "study-tips", "exam-prep", "learning-hacks", "skill-building",
    "parenting-tips", "mom-life", "dad-jokes", "family-content",
    "pet-content", "dog-tricks", "cat-content", "animal-videos",
    "gaming-setup", "streaming-tips", "esports", "game-reviews",
    "tech-reviews", "gadget-unboxing", "software-tips", "ai-tools",
    "book-recommendations", "reading-tips", "writing-tips", "author-life",
    "podcast-ideas", "interview-format", "conversation-starters",
    "asmr-triggers", "relaxing-content", "sleep-tips", "calm-vibes",
    "sports-highlights", "fitness-challenges", "transformation-story",
    "before-after", "progress-pics", "journey-content", "growth-mindset",
    "confidence-tips", "self-love", "body-positivity", "empowerment",
    "motivational-speech", "inspirational-story", "success-tips",
    "failure-story", "lesson-learned", "mistakes-to-avoid",
    "behind-scenes", "bts-content", "process-video", "how-its-made",
    "q-and-a-format", "ask-me-anything", "faq-content", "tips-and-tricks",
    "life-update", "announcement", "news-share", "milestone-celebration",
    "birthday-content", "holiday-content", "seasonal-content", "trending-now",
    "throwback-content", "nostalgia", "memory-share", "retro-vibes",
    "comparison-video", "vs-content", "versus-format", "this-or-that",
    "top-10-list", "ranking-content", "best-of", "favorites-share",
    "beginner-guide", "101-tips", "basics-explained", "intro-content",
    "advanced-tips", "pro-tricks", "expert-advice", "master-class",
    "secret-revealed", "hidden-tips", "unknown-hacks", "discover-this",
    "challenge-accepted", "dare-content", "prank-ideas", "fun-content",
    "reaction-video", "first-time-trying", "trying-trend", "first-impression",
    "satisfying-content", "oddly-satisfying", "asmr-satisfying",
    "cozy-content", "hygge-vibes", "winter-cozy", "summer-vibes",
    "spring-content", "fall-aesthetic", "seasonal-trends", "holiday-prep",
    "valentines-ideas", "christmas-content", "halloween-ideas", "new-year",
    "resolution-ideas", "goal-setting", "habit-building", "routine-share",
    "morning-routine", "night-routine", "weekend-vibes", "monday-motivation",
    "friday-feels", "sunday-self-care", "wellness-wednesday", "transformation-tuesday"
  ];

  const v37Expansion = [
    "lifestyle-vlog", "lifestyle-tips", "lifestyle-content", "lifestyle-creator",
    "relationships-advice", "relationship-tips", "relationship-goals", "healthy-relationships",
    "money-management", "money-saving", "money-mindset", "make-money-online", "extra-income",
    "mindset-shift", "growth-mindset", "abundance-mindset", "positive-mindset", "mindset-hacks",
    "success-stories", "success-tips", "success-habits", "achieving-success", "success-mindset",
    "dating-tips", "dating-advice", "online-dating", "first-date", "dating-apps",
    "travel-blog", "travel-content", "solo-travel", "budget-travel", "luxury-travel",
    "food-content", "food-blog", "street-food", "healthy-recipes", "comfort-food",
    "self-improvement-tips", "self-growth", "personal-development", "self-awareness",
    "fitness-motivation", "fitness-tips", "fitness-journey", "home-fitness", "fitness-goals",
    "business-growth", "business-ideas", "business-tips", "startup-life", "scaling-business",
    "manifestation", "law-of-attraction", "vision-board", "affirmations",
    "anxiety-tips", "stress-relief", "burnout-recovery", "mental-wellness",
    "confidence-building", "public-speaking", "overcome-fear", "comfort-zone",
    "habit-stacking", "atomic-habits", "morning-habits", "evening-habits",
    "budgeting-tips", "debt-free", "investing-for-beginners", "crypto-basics",
    "long-distance-relationship", "marriage-tips", "engagement", "anniversary",
    "breakup-recovery", "self-worth", "boundaries", "toxic-relationships",
    "first-date-ideas", "date-night", "romantic-gestures", "love-languages",
    "backpacking-tips", "solo-female-travel", "travel-photography", "travel-hacks",
    "vegan-recipes", "meal-prep-ideas", "intermittent-fasting", "intuitive-eating",
    "strength-training", "cardio-tips", "flexibility", "recovery-tips",
    "online-business", "passive-income-ideas", "print-on-demand", "digital-products",
    "linkedin-tips", "networking-tips", "elevator-pitch", "personal-branding",
    "content-strategy", "content-planning", "batch-creation", "content-repurposing",
    "niche-down", "finding-your-niche", "audience-research", "creator-analytics",
    "reels-algorithm", "tiktok-algorithm", "youtube-algorithm", "instagram-algorithm",
    "best-time-to-post", "posting-schedule", "content-calendar-tips",
    "engagement-rate", "follower-growth", "organic-growth", "viral-strategy",
    "thumbnail-tips", "click-through-rate", "seo-for-creators", "keyword-research",
    "sponsorship-rates", "media-kit", "pitch-templates", "brand-partnerships",
    "affiliate-strategies", "amazon-affiliate", "course-creation", "coaching-business",
    "ugc-creator", "ugc-portfolio", "brand-collabs", "product-review-tips",
    "live-streaming", "youtube-live", "instagram-live", "tiktok-live",
    "newsletter-tips", "email-list", "lead-magnet", "conversion-tips",
    "podcast-launch", "podcast-growth", "guest-appearances", "podcast-equipment",
    "book-writing", "author-platform", "publishing-tips", "writing-routine",
    "photography-business", "photo-editing", "preset-tips", "client-work",
    "videography-tips", "video-editing", "premiere-pro", "final-cut-pro",
    "graphic-design", "canva-tips", "brand-design", "logo-design",
    "web-design", "portfolio-site", "landing-page", "sales-page",
    "seo-content", "blog-strategy", "long-form-content", "pillar-posts",
    "pinterest-strategy", "pinterest-growth", "pinterest-seo",
    "linkedin-content", "linkedin-growth", "thought-leadership", "b2b-content",
    "twitter-tips", "thread-strategy", "twitter-growth", "x-platform",
    "reddit-marketing", "community-building", "discord-server", "telegram-tips",
    "notion-templates", "productivity-apps", "automation-tips", "workflow-hacks",
    "no-code", "bubble", "webflow", "automation-tools",
    "ai-for-creators", "chatgpt-tips", "ai-writing", "ai-editing",
    "crypto-creators", "nft-content", "web3-creators", "blockchain-basics",
    "sustainability", "eco-friendly", "zero-waste", "sustainable-living",
    "minimalism", "decluttering", "capsule-wardrobe", "intentional-living",
    "slow-living", "mindful-living", "digital-detox", "screen-time",
    "sleep-hygiene", "circadian-rhythm", "morning-person", "night-owl",
    "journaling", "gratitude-practice", "reflection", "self-reflection",
    "therapy-tips", "mental-health-awareness", "self-care-routine", "boundaries-work",
    "imposter-syndrome", "perfectionism", "procrastination", "overwhelm",
    "adhd-creator", "neurodivergent", "accessibility", "inclusive-content",
    "body-neutrality", "intuitive-movement", "joyful-movement", "rest-days",
    "intuitive-eating", "anti-diet", "health-at-every-size", "food-freedom",
    "pregnancy-journey", "new-mom", "postpartum", "parenting-styles",
    "homeschooling", "unschooling", "education-alternatives", "learning-styles",
    "hobby-to-business", "monetize-passion", "creative-business", "artist-life",
    "musician-content", "music-production", "songwriting", "cover-artist",
    "dancer-life", "choreography", "dance-tutorial", "dance-trends",
    "comedian-content", "stand-up-tips", "sketch-comedy", "improv",
    "gamer-content", "streaming-setup", "gaming-rig", "esports-career",
    "tech-reviewer", "gadget-review", "unboxing-channel", "tech-tips",
    "fashion-influencer", "styling-tips", "trend-forecasting", "sustainable-fashion",
    "beauty-influencer", "skincare-science", "makeup-artist", "hair-stylist",
    "fitness-coach", "personal-trainer", "nutrition-coach", "wellness-coach",
    "life-coach", "business-coach", "mindset-coach", "career-coach",
    "real-estate-content", "house-hunting", "home-buying", "property-investment",
    "interior-design", "home-renovation", "diy-home", "small-space",
    "car-content", "car-review", "car-modification", "ev-content",
    "food-truck", "restaurant-review", "chef-life", "food-photography",
    "bartender-content", "cocktail-recipes", "wine-tips", "barista-life",
    "pet-influencer", "dog-training", "cat-content", "exotic-pets",
    "plant-parent", "plant-care", "indoor-garden", "succulent-tips",
    "outdoor-adventure", "camping-gear", "hiking-trails", "survival-tips",
    "water-sports", "surfing", "scuba-diving", "kayaking",
    "winter-sports", "skiing", "snowboarding", "ice-skating",
    "fashion-week", "runway-review", "designer-collab", "luxury-fashion",
    "thrifting", "vintage-fashion", "secondhand", "sustainable-shopping",
    "skincare-science", "dermatology-tips", "acne-journey", "anti-aging",
    "hair-care", "natural-hair", "hair-color", "hair-trends",
    "nail-art", "nail-tutorial", "nail-trends", "manicure-tips",
    "fragrance", "perfume-collection", "scent-tips", "niche-fragrance",
    "k-beauty", "j-beauty", "clean-beauty", "vegan-beauty",
    "supplements", "vitamins", "wellness-products", "health-hacks",
    "cbd-content", "wellness-trends", "holistic-health", "alternative-health",
    "meditation-apps", "breathing-exercises", "mindfulness", "stress-management",
    "yoga-styles", "yoga-for-beginners", "yoga-retreat", "yoga-philosophy",
    "pilates", "barre", "dance-fitness", "hiit-workouts",
    "marathon-training", "half-marathon", "running-tips", "trail-running",
    "cycling-tips", "bike-commuting", "indoor-cycling", "cycling-gear",
    "crossfit-life", "functional-fitness", "strength-basics", "powerlifting",
    "bodybuilding", "muscle-building", "bulking", "cutting",
    "weight-loss-journey", "transformation", "before-after", "progress-update",
    "vegan-fitness", "plant-based-athlete", "vegan-recipes", "plant-based-nutrition",
    "keto-recipes", "low-carb", "macro-counting", "meal-timing",
    "intermittent-fasting-tips", "fasting-protocol", "autophagy", "metabolic-health",
    "gut-health", "probiotics", "digestive-health", "food-sensitivities",
    "sleep-optimization", "sleep-tracking", "sleep-stages", "dreams",
    "biohacking", "longevity", "anti-aging-tips", "health-span",
    "cold-exposure", "sauna", "contrast-therapy", "recovery-protocols",
    "nootropics", "cognitive-enhancement", "brain-health", "focus-tips",
    "relationship-communication", "conflict-resolution", "love-advice", "dating-coach",
    "single-life", "self-partnership", "solo-living", "independence",
    "friendship-tips", "making-friends", "maintaining-friendships", "friend-groups",
    "family-dynamics", "sibling-content", "grandparent-content", "multi-generational",
    "blended-family", "co-parenting", "divorce-recovery", "single-parent",
    "wedding-planning", "bridal-content", "groom-tips", "wedding-vendor",
    "honeymoon", "destination-wedding", "elopement", "micro-wedding",
    "baby-shower", "gender-reveal", "nursery-tour", "baby-gear",
    "toddler-activities", "preschool-tips", "screen-time-kids", "parenting-hacks",
    "teen-content", "gen-z", "millennial-content", "generational-tips",
    "college-life", "dorm-life", "study-abroad", "grad-school",
    "career-change", "job-hopping", "remote-jobs", "freelance-career",
    "salary-negotiation", "promotion-tips", "leadership", "management-tips",
    "entrepreneur-life", "solopreneur", "founder-story", "startup-journey",
    "fundraising", "venture-capital", "bootstrapping", "revenue-model",
    "saas-business", "software-business", "app-development", "no-code-apps",
    "ecommerce-tips", "shopify-store", "amazon-seller", "etsy-shop",
    "dropshipping-tips", "product-sourcing", "fulfillment", "inventory-management",
    "email-marketing-tips", "newsletter-growth", "automation-sequences", "segmentation",
    "paid-ads", "meta-ads", "google-ads", "tiktok-ads",
    "influencer-marketing", "campaign-strategy", "roi-tracking", "attribution",
    "pr-tips", "press-release", "media-outreach", "brand-awareness",
    "crisis-management", "reputation-management", "handling-criticism", "cancel-culture",
    "legal-for-creators", "contracts", "copyright", "trademark",
    "tax-tips-creators", "llc-formation", "business-structure", "deductions",
    "insurance-creators", "liability", "health-insurance", "business-insurance",
    "retirement-creators", "investing-creators", "financial-planning", "wealth-building",
    "philanthropy", "giving-back", "social-impact", "cause-marketing",
    "sustainability-business", "b-corp", "carbon-neutral", "ethical-business",
    "remote-team", "hiring-tips", "virtual-assistant", "outsourcing",
    "team-building", "company-culture", "remote-culture", "async-work",
    "meeting-tips", "async-communication", "documentation", "knowledge-base",
    "project-management", "agile", "sprint-planning", "task-management",
    "customer-service", "support-tips", "retention", "churn-reduction",
    "product-development", "mvp", "user-feedback", "iteration",
    "launch-strategy", "product-launch", "beta-launch", "soft-launch",
    "growth-hacking", "viral-loops", "referral-program", "waitlist",
    "conversion-optimization", "landing-page-tips", "ab-testing", "copywriting",
    "sales-tips", "closing-deals", "objection-handling", "sales-funnel",
    "customer-journey", "buyer-persona", "pain-points", "value-proposition",
    "competitive-analysis", "market-research", "industry-trends", "competitor-tracking",
    "pricing-strategy", "value-based-pricing", "tiered-pricing", "discount-strategy",
    "subscription-model", "recurring-revenue", "churn-prevention", "lifetime-value",
    "community-led-growth", "user-community", "advocacy-program", "ambassador-program",
    "partnership-strategy", "strategic-alliances", "joint-ventures", "co-marketing",
    "international-expansion", "localization", "global-market", "cross-border",
    "diversity-inclusion", "inclusive-marketing", "representation", "authentic-diversity",
    "women-in-business", "female-founders", "women-entrepreneurs", "mompreneur",
    "bipoc-creators", "minority-owned", "representation-matters", "cultural-content",
    "lgbtq-content", "pride-content", "inclusive-branding", "allyship",
    "disability-advocacy", "accessibility-content", "adaptive-content", "inclusive-design",
    "age-diversity", "senior-creators", "gen-z-entrepreneurs", "multi-generational-brand",
    "faith-based", "spiritual-content", "religious-content", "values-driven",
    "political-content", "civic-engagement", "advocacy", "social-justice",
    "environmental-advocacy", "climate-action", "conservation", "eco-advocacy",
    "animal-welfare", "vegan-advocacy", "rescue-content", "pet-advocacy",
    "education-reform", "edtech", "online-learning", "skill-based-education",
    "career-advice-gen-z", "entry-level", "first-job", "internship-tips",
    "side-hustle-ideas", "multiple-income", "gig-economy", "flexible-work",
    "passion-project", "creative-pursuit", "hobby-business", "side-project",
    "failure-to-success", "pivot-story", "lesson-learned", "resilience",
    "imposter-to-confidence", "self-doubt", "building-confidence", "inner-critic",
    "perfectionism-recovery", "done-is-better", "good-enough", "progress-over-perfect",
    "boundaries-setting", "saying-no", "people-pleasing", "self-advocacy",
    "work-life-integration", "blending-work-life", "flexible-schedule", "location-independent",
    "digital-minimalism", "tech-boundaries", "notification-management", "focus-mode",
    "intentional-consumption", "conscious-spending", "minimalist-shopping", "quality-over-quantity",
    "slow-fashion", "ethical-fashion", "wardrobe-capsule", "outfit-formula",
    "sustainable-beauty", "clean-products", "refillable", "package-free",
    "zero-waste-kitchen", "food-waste", "composting", "sustainable-eating",
    "local-travel", "staycation", "day-trips", "explore-local",
    "solo-travel-tips", "safety-tips", "solo-female-travel", "solo-adventure",
    "family-travel", "travel-with-kids", "multigenerational-travel", "travel-planning",
    "luxury-travel-tips", "first-class", "five-star", "exclusive-travel",
    "budget-travel-tips", "backpacker", "hostel-life", "travel-hacking",
    "digital-nomad-life", "nomad-visa", "remote-work-travel", "workation",
    "travel-photography-tips", "travel-videography", "travel-content", "wanderlust-content",
    "food-travel", "culinary-travel", "food-tours", "local-cuisine",
    "adventure-travel", "extreme-sports", "adventure-tourism", "thrill-seeking",
    "wellness-retreat", "yoga-retreat", "detox-retreat", "healing-retreat",
    "cultural-immersion", "local-experiences", "authentic-travel", "responsible-travel",
    "sustainable-travel", "eco-tourism", "carbon-offset", "green-travel",
    "travel-gear", "packing-cubes", "travel-essentials", "minimalist-packing",
    "travel-insurance", "safety-tips", "emergency-prep", "travel-documents",
    "language-learning", "travel-phrases", "cultural-tips", "travel-etiquette",
    "travel-blogging", "travel-monetization", "travel-influencer", "destination-marketing",
    "sunday-funday", "self-care-saturday", "motivation-monday", "wellness-wednesday",
    "thirst-trap", "get-ready-with-me", "outfit-of-the-day", "what-i-eat-in-a-day",
    "get-unready-with-me", "skincare-shelfie", "makeup-bag", "favorite-things",
    "room-makeover", "desk-makeover", "closet-organization", "fridge-organization",
    "whats-in-my-bag", "pack-with-me", "shop-with-me", "target-haul",
    "amazon-finds", "shein-haul", "aliexpress-finds", "temu-haul",
    "dupe-finds", "affordable-luxury", "budget-friendly", "splurge-vs-save",
    "honest-review", "would-i-repurchase", "empties", "monthly-favorites",
    "new-in", "recent-purchases", "impulse-buys", "buyers-remorse",
    "no-buy", "low-buy", "minimalist-haul", "conscious-shopping",
    "outfit-repeating", "capsule-wardrobe-tour", "closet-tour", "wardrobe-essentials",
    "styling-tips", "outfit-formulas", "color-palette", "aesthetic-wardrobe",
    "trend-alert", "trend-try", "trend-ditch", "classic-vs-trend",
    "seasonal-trends", "spring-trends", "summer-trends", "fall-trends", "winter-trends",
    "body-type-styling", "petite-styling", "tall-girl-fashion", "plus-size-fashion",
    "modest-fashion", "professional-style", "casual-chic", "street-style",
    "date-night-outfit", "work-outfit", "vacation-outfit", "wedding-guest",
    "sneaker-collection", "handbag-collection", "jewelry-collection", "watch-collection",
    "scent-collection", "lipstick-collection", "palette-collection", "brush-collection",
    "skincare-storage", "makeup-storage", "bathroom-organization", "vanity-setup",
    "morning-skincare", "night-skincare", "double-cleanse", "retinol-journey",
    "spf-tips", "sunscreen-review", "vitamin-c", "hyaluronic-acid",
    "acne-routine", "hyperpigmentation", "dark-circles", "anti-aging-routine",
    "korean-skincare", "japanese-skincare", "french-skincare", "clean-skincare",
    "makeup-basics", "makeup-for-beginners", "everyday-makeup", "no-makeup-makeup",
    "glam-makeup", "editorial-makeup", "creative-makeup", "special-occasion-makeup",
    "eyeshadow-tutorial", "eyeliner-tips", "brow-tutorial", "contouring-tips",
    "lip-tutorial", "blush-placement", "highlight-tips", "bronzer-tips",
    "makeup-mistakes", "makeup-hacks", "makeup-organization", "makeup-expiry",
    "hair-routine", "hair-wash-day", "heatless-curls", "blowout-tips",
    "hair-color-journey", "balayage", "highlights", "color-correction",
    "hair-masks", "hair-oils", "scalp-care", "hair-growth-tips",
    "protective-styles", "natural-hair-journey", "curly-hair-tips", "straight-hair-tips",
    "nail-care", "cuticle-care", "gel-nails", "acrylic-nails",
    "press-on-nails", "nail-art-tutorial", "nail-trends", "manicure-at-home",
    "fragrance-collection", "signature-scent", "layering-fragrance", "niche-perfume",
    "body-care", "body-scrub", "body-lotion", "body-mist",
    "bath-routine", "shower-routine", "spa-at-home", "self-care-night",
    "workout-music", "gym-playlist", "running-playlist", "motivation-playlist",
    "pre-workout", "post-workout", "recovery-day", "active-rest-day",
    "form-check", "exercise-tutorial", "gym-etiquette", "home-gym-setup",
    "protein-recipes", "post-workout-meal", "pre-workout-meal", "meal-timing",
    "supplement-stack", "creatine", "bcaa", "protein-powder",
    "hydration-tips", "water-intake", "electrolytes", "sports-drinks",
    "sleep-routine", "wind-down", "sleep-environment", "sleep-tracking",
    "morning-pages", "journaling-prompts", "gratitude-journal", "bullet-journal",
    "reading-list", "book-club", "book-review", "reading-challenge",
    "podcast-recommendations", "audiobook-tips", "learning-resources", "skill-stack",
    "language-learning-tips", "duolingo", "immersion-tips", "conversation-practice",
    "coding-for-beginners", "web-development", "python-tips", "javascript-basics",
    "design-tools", "figma-tips", "adobe-tips", "design-inspiration",
    "photo-editing", "lightroom-presets", "vsco-tips", "photo-composition",
    "video-editing-tips", "editing-style", "color-grading", "transitions",
    "thumbnail-design", "ctr-optimization", "a-b-testing", "analytics-tips",
    "monetization-strategy", "revenue-breakdown", "income-report", "creator-economy",
    "platform-comparison", "tiktok-vs-instagram", "youtube-vs-tiktok", "platform-strategy",
    "cross-posting", "platform-specific", "repurposing-strategy", "content-pillars",
    "content-batching", "creation-schedule", "burnout-prevention", "creator-health",
    "equipment-setup", "camera-gear", "lighting-setup", "microphone-tips",
    "backdrop-ideas", "filming-location", "b-roll-tips", "filming-tips",
    "script-writing", "teleprompter", "talking-points", "outline-format",
    "thumbnail-psychology", "curiosity-gap", "pattern-interrupt", "scroll-stopper",
    "hook-formulas", "opening-lines", "first-sentence", "attention-grabber",
    "cta-formulas", "end-screen-cta", "comment-cta", "follow-cta",
    "engagement-tactics", "comment-strategy", "dm-strategy", "community-engagement",
    "collab-strategy", "duet-partners", "stitch-ideas", "collab-outreach",
    "brand-outreach", "cold-email", "pitch-strategy", "media-kit-tips",
    "contract-tips", "rate-negotiation", "deliverables", "revision-policy",
    "portfolio-tips", "case-studies", "testimonials", "social-proof",
    "pricing-strategy", "value-pricing", "package-tiers", "payment-terms",
    "client-communication", "project-timeline", "scope-creep", "boundaries-client",
    "workflow-optimization", "automation-tools", "zapier-tips", "notion-workflow",
    "time-blocking", "deep-work", "pomodoro", "focus-sessions",
    "email-management", "inbox-zero", "email-templates", "newsletter-tips",
    "calendar-management", "scheduling-tools", "meeting-tips", "async-communication",
    "delegation-tips", "hiring-first", "team-structure", "virtual-team",
    "goal-setting-tips", "okr-framework", "quarterly-goals", "annual-planning",
    "productivity-metrics", "time-tracking", "output-measurement", "efficiency-tips",
    "energy-management", "peak-hours", "energy-audit", "recovery-rituals",
    "decision-fatigue", "simplify-choices", "defaults", "automation-decisions",
    "information-diet", "content-consumption", "news-intake", "social-media-boundaries",
    "comparison-trap", "social-media-detox", "authentic-content", "real-life-content",
    "behind-the-scenes", "bloopers", "outtakes", "raw-content",
    "day-in-life", "routine-vlog", "productive-day", "lazy-day",
    "week-in-life", "monthly-vlog", "quarterly-recap", "year-in-review",
    "life-update", "big-news", "announcement", "milestone",
    "q-and-a", "ask-me-anything", "get-to-know-me", "frequently-asked",
    "opinion-piece", "hot-take", "unpopular-opinion", "controversial-topic",
    "storytime", "personal-story", "lesson-learned", "mistake-story",
    "transformation-story", "before-after", "progress-update", "journey-content",
    "advice-column", "tips-share", "what-i-wish-i-knew", "mentor-advice",
    "resource-share", "tool-recommendations", "app-recommendations", "course-review",
    "challenge-accepted", "30-day-challenge", "habit-challenge", "accountability",
    "community-challenge", "tag-challenge", "trend-participation", "sound-challenge",
    "reaction-content", "first-time-reaction", "trying-trend", "honest-review",
    "comparison-content", "vs-video", "dupe-comparison", "before-after",
    "list-content", "top-10", "ranking", "favorites-share",
    "tutorial-series", "how-to-series", "beginner-series", "masterclass",
    "live-qa", "live-tutorial", "live-unboxing", "live-reaction",
    "podcast-format", "interview-format", "conversation-format", "solo-episode",
    "newsletter-format", "weekly-digest", "curated-links", "exclusive-content",
    "membership-content", "patreon-content", "exclusive-community", "premium-content",
    "course-content", "lesson-preview", "module-overview", "student-success",
    "coaching-content", "session-preview", "client-success", "transformation",
    "template-share", "freebie", "downloadable", "resource-library",
    "tool-tutorial", "software-review", "app-tutorial", "tech-setup",
    "desk-tour", "workspace-tour", "setup-reveal", "organization-tour",
    "budget-breakdown", "income-breakdown", "expense-tracking", "savings-tips",
    "investment-basics", "portfolio-review", "retirement-planning", "financial-goals",
    "debt-payoff", "debt-free-journey", "snowball-method", "financial-freedom",
    "side-income", "passive-income-streams", "dividend-investing", "rental-income",
    "business-income", "revenue-streams", "diversification", "income-stability",
    "tax-strategies", "deduction-tips", "quarterly-taxes", "tax-planning",
    "insurance-basics", "coverage-types", "policy-review", "insurance-shopping",
    "estate-planning", "will-basics", "beneficiary", "legacy-planning",
    "giving-strategy", "donation-tips", "impact-investing", "charitable-giving",
    "money-mindset", "scarcity-vs-abundance", "money-beliefs", "financial-literacy",
    "negotiation-tips", "salary-negotiation", "price-negotiation", "deal-making",
    "networking-events", "conference-tips", "industry-events", "virtual-networking",
    "linkedin-strategy", "linkedin-content", "linkedin-growth", "professional-brand",
    "personal-website", "portfolio-site", "landing-page", "about-page",
    "resume-tips", "cover-letter", "application-strategy", "interview-prep",
    "job-search-strategy", "application-tracking", "follow-up-tips", "offer-negotiation",
    "career-pivot", "industry-change", "skill-transition", "career-reinvention",
    "freelance-portfolio", "freelance-rates", "freelance-contracts", "freelance-taxes",
    "client-acquisition", "lead-generation", "sales-funnel", "conversion-tips",
    "retention-strategy", "customer-success", "loyalty-program", "churn-prevention",
    "scaling-tips", "growth-strategy", "hiring-timeline", "delegation-strategy",
    "exit-strategy", "selling-business", "succession-planning", "legacy-business",
    "work-life-boundaries", "off-hours", "vacation-mode", "disconnect-tips",
    "stress-management", "anxiety-tips", "burnout-signs", "recovery-protocol",
    "imposter-syndrome", "confidence-building", "self-worth", "inner-work",
    "therapy-journey", "mental-health-awareness", "stigma-breaking", "support-resources",
    "mindfulness-practice", "meditation-apps", "breathing-tips", "grounding-techniques",
    "emotional-regulation", "trigger-awareness", "coping-strategies", "resilience-building",
    "relationship-communication", "conflict-resolution", "active-listening", "healthy-fighting",
    "love-languages", "attachment-styles", "relationship-goals", "partnership-tips",
    "friendship-maintenance", "adult-friendships", "long-distance-friends", "friend-breakup",
    "family-boundaries", "toxic-family", "family-dynamics", "healing-family",
    "parenting-philosophy", "gentle-parenting", "authoritative-parenting", "parenting-styles",
    "co-parenting", "blended-family", "step-parenting", "co-parenting-tips",
    "single-parenting", "single-dad", "single-mom", "solo-parenting",
    "child-development", "developmental-milestones", "age-appropriate", "child-psychology",
    "teen-parenting", "adolescence", "teen-communication", "teen-boundaries",
    "empty-nester", "adult-children", "multigenerational", "grandparenting",
    "pet-parenting", "dog-parenting", "cat-parenting", "pet-care-tips",
    "adoption-journey", "foster-care", "rescue-story", "pet-advocacy",
    "home-schooling", "homeschool-curriculum", "homeschool-schedule", "homeschool-community",
    "college-prep", "application-tips", "financial-aid", "college-decision",
    "grad-school", "masters-degree", "phd-journey", "continuing-education",
    "career-advancement", "promotion-strategy", "leadership-development", "executive-presence",
    "industry-trends", "future-of-work", "automation-impact", "skill-future",
    "remote-work-tips", "wfh-setup", "remote-productivity", "distributed-teams",
    "hybrid-work", "office-days", "flexibility-negotiation", "work-model",
    "company-culture", "culture-fit", "values-alignment", "employer-brand",
    "diversity-hiring", "inclusive-hiring", "bias-reduction", "equitable-process",
    "onboarding-tips", "new-job-tips", "first-90-days", "ramp-up",
    "mentorship", "finding-mentor", "being-mentor", "mentorship-program",
    "sponsorship", "career-sponsor", "advocacy-at-work", "visibility-tips",
    "feedback-culture", "giving-feedback", "receiving-feedback", "performance-review",
    "difficult-conversations", "having-hard-talks", "delivering-bad-news", "conflict-at-work",
    "boundaries-at-work", "saying-no-work", "overcommitment", "workload-management",
    "promotion-timeline", "when-to-ask", "promotion-conversation", "career-path",
    "lateral-move", "internal-transfer", "role-exploration", "career-exploration",
    "industry-switch", "transferable-skills", "career-transition", "starting-over",
    "retirement-planning", "financial-independence", "early-retirement", "retirement-income",
    "second-act", "encore-career", "semi-retirement", "retirement-transition"
  ];

  for (const s of v37Expansion) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = ["hook", "opening", "story", "viral", "intro", "pov"].some((x) => s.includes(x))
      ? "hook"
      : ["instagram", "reel", "feed"].some((x) => s.includes(x))
        ? "instagram"
        : "caption";
    out.push(topic(s, title, toolType));
  }

  for (const s of expansion) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = ["hook", "opening", "story", "viral", "intro", "pov"].some((x) => s.includes(x))
      ? "hook"
      : ["instagram", "reel", "feed"].some((x) => s.includes(x))
        ? "instagram"
        : "caption";
    out.push(topic(s, title, toolType));
  }

  for (const s of extra) {
    if (seen.has(s)) continue;
    seen.add(s);
    const title = s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const toolType = s.includes("hook") ? "hook" : s.includes("reel") ? "instagram" : "caption";
    out.push(topic(s, title, toolType));
  }

  const suffixes = ["tips", "ideas", "hacks", "strategy", "guide", "tutorial", "examples", "inspiration"];
  const coreTopics = ["fitness", "business", "travel", "food", "beauty", "fashion", "lifestyle", "money", "mindset", "dating", "career", "content", "marketing", "social-media"];
  for (const c of coreTopics) {
    for (const suf of suffixes) {
      const s = `${c}-${suf}`;
      if (seen.has(s)) continue;
      seen.add(s);
      const title = s.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
      const toolType = ["hook", "strategy"].some((x) => s.includes(x)) ? "hook" : "caption";
      out.push(topic(s, title, toolType));
    }
  }

  const platformTopics = ["tiktok", "youtube", "instagram", "reels", "shorts"];
  const platformSuffixes = ["captions", "hooks", "ideas", "tips", "growth", "algorithm"];
  for (const p of platformTopics) {
    for (const suf of platformSuffixes) {
      const s = `${p}-${suf}`;
      if (seen.has(s)) continue;
      seen.add(s);
      const title = s.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
      const toolType = suf === "hooks" ? "hook" : "caption";
      out.push(topic(s, title, toolType));
    }
  }

  const nicheList = ["gym", "cooking", "skincare", "makeup", "tech", "gaming", "mom", "travel", "fitness", "finance", "dating", "wedding", "pet", "food", "fashion", "beauty", "business", "startup", "yoga", "meditation"];
  const nicheSuffixes = ["content", "creator", "niche", "captions", "hooks", "ideas"];
  for (const n of nicheList) {
    for (const suf of nicheSuffixes) {
      const s = `${n}-${suf}`;
      if (seen.has(s)) continue;
      seen.add(s);
      const title = s.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
      out.push(topic(s, title, suf === "hooks" ? "hook" : "caption"));
    }
  }

  return out.slice(0, 3000);
}

export const TOPICS = buildTopics();

export function getTopic(slug: string): TopicConfig | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getAllTopicSlugs(): string[] {
  return TOPICS.map((t) => t.slug);
}

export const TOPIC_CLUSTER_TYPES = ["captions", "hooks", "ideas", "quotes", "hashtags", "scripts"] as const;

export type TopicClusterType = (typeof TOPIC_CLUSTER_TYPES)[number];

export function parseTopicClusterSlug(
  slug: string
): { baseSlug: string; clusterType: TopicClusterType } | null {
  for (const t of TOPIC_CLUSTER_TYPES) {
    const suffix = `-${t}`;
    if (slug.endsWith(suffix)) {
      const baseSlug = slug.slice(0, -suffix.length);
      if (getTopic(baseSlug)) return { baseSlug, clusterType: t };
    }
  }
  return null;
}

export function getAllTopicClusterSlugs(): string[] {
  const out: string[] = [];
  for (const t of TOPICS) {
    for (const ct of TOPIC_CLUSTER_TYPES) {
      out.push(`${t.slug}-${ct}`);
    }
  }
  return out;
}
