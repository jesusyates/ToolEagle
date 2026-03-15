/**
 * AI Prompt Library - categorized prompts for /ai-prompts
 */

export type PromptCategory = "content" | "marketing" | "business" | "coding" | "study";

export type PromptItem = {
  title: string;
  description: string;
  prompt: string;
};

export const PROMPT_CATEGORIES: { id: PromptCategory; name: string; slug: string }[] = [
  { id: "content", name: "Content Creation", slug: "content" },
  { id: "marketing", name: "Marketing", slug: "marketing" },
  { id: "business", name: "Business", slug: "business" },
  { id: "coding", name: "Coding", slug: "coding" },
  { id: "study", name: "Study", slug: "study" }
];

export const PROMPTS: Record<PromptCategory, PromptItem[]> = {
  content: [
    {
      title: "TikTok video script",
      description: "Write a 15-second TikTok script with hook and CTA",
      prompt:
        "Write a TikTok video script. Topic: [your topic]. Audience: [your audience]. Hook: curiosity. Tone: motivational. Length: 15 seconds. Include opening hook, 2-3 beats, and clear CTA."
    },
    {
      title: "Instagram caption",
      description: "Create an engaging Instagram caption with emojis",
      prompt:
        "Write an Instagram caption. Topic: [your topic]. Tone: [casual/professional/inspirational]. Include 2-3 relevant emojis. End with a question or CTA. Max 150 characters for first line."
    },
    {
      title: "YouTube title",
      description: "Generate click-worthy YouTube titles",
      prompt:
        "Generate 5 YouTube video titles. Topic: [your topic]. Style: curiosity-driven. Include numbers or power words. Under 60 characters each."
    },
    {
      title: "Blog post outline",
      description: "Create a structured blog outline",
      prompt:
        "Create a blog post outline. Topic: [your topic]. Target: [beginners/experts]. Include: compelling intro, 5-7 H2 sections with key points, conclusion with CTA."
    },
    {
      title: "Short-form hook",
      description: "Write scroll-stopping opening hooks",
      prompt:
        "Write 5 short-form video hooks. Topic: [your topic]. Hook type: curiosity. First line must stop the scroll. Max 10 words each."
    },
    {
      title: "Email newsletter",
      description: "Draft a newsletter that gets opens",
      prompt:
        "Write an email newsletter. Subject: [topic]. Audience: [your audience]. Tone: [friendly/professional]. Include: compelling subject line, short intro, 3 value points, clear CTA."
    },
    {
      title: "Product description",
      description: "Write persuasive product copy",
      prompt:
        "Write a product description. Product: [name]. Benefits: [list]. Audience: [target]. Tone: [conversational/professional]. Include: headline, 3 benefits, social proof angle, CTA."
    },
    {
      title: "Storytelling post",
      description: "Craft a relatable story for social",
      prompt:
        "Write a storytelling social post. Theme: [your story]. Platform: [Instagram/LinkedIn]. Structure: hook, conflict, resolution, lesson. Emotional and relatable."
    },
    {
      title: "Carousel content",
      description: "Create a 10-slide carousel outline",
      prompt:
        "Create a 10-slide Instagram carousel. Topic: [your topic]. Format: tips/list/how-to. Each slide: one key point, supporting line. Slide 1: hook. Slide 10: CTA."
    },
    {
      title: "Reel script",
      description: "Script for Instagram Reels or Shorts",
      prompt:
        "Write a Reel script. Topic: [your topic]. Length: 30 seconds. Include: hook (first 3 sec), value delivery, trend/joke element, CTA. Natural speaking style."
    }
  ],
  marketing: [
    {
      title: "Ad copy",
      description: "Write high-converting ad copy",
      prompt:
        "Write 3 ad variations. Product: [name]. Platform: [Meta/Google/TikTok]. Goal: [awareness/conversions]. Include: headline, body, CTA. A/B test angles."
    },
    {
      title: "Landing page headline",
      description: "Create compelling landing page copy",
      prompt:
        "Write 5 landing page headlines. Offer: [your offer]. Audience: [target]. Benefit-focused. Include one with numbers, one with urgency, one with curiosity."
    },
    {
      title: "Social media calendar",
      description: "Plan a week of content",
      prompt:
        "Create a 7-day content calendar. Niche: [your niche]. Mix: 2 educational, 2 entertaining, 2 promotional, 1 engagement. Include post type and hook for each."
    },
    {
      title: "Influencer pitch",
      description: "Draft a collaboration pitch",
      prompt:
        "Write an influencer collaboration pitch. Brand: [name]. Influencer niche: [niche]. Offer: [collab type]. Tone: professional but personable. Include: intro, value prop, clear ask."
    },
    {
      title: "Hashtag strategy",
      description: "Generate niche hashtags",
      prompt:
        "Generate hashtag strategy. Niche: [your niche]. Platform: [Instagram/TikTok]. Include: 3 high-volume, 5 mid-volume, 5 niche-specific. Explain mix."
    },
    {
      title: "Launch announcement",
      description: "Announce a new product or service",
      prompt:
        "Write a launch announcement. Product: [name]. Key benefit: [benefit]. Channels: [social/email]. Include: teaser, full announcement, urgency element."
    },
    {
      title: "Testimonial request",
      description: "Ask for reviews the right way",
      prompt:
        "Write a testimonial request email. Product: [name]. Customer type: [happy user]. Tone: grateful, not pushy. Include: why their feedback matters, 2-3 simple questions."
    },
    {
      title: "Retargeting ad",
      description: "Convert warm audiences",
      prompt:
        "Write retargeting ad copy. Product: [name]. Audience: visited but didn't buy. Angle: address objection or add urgency. Include: headline, 2 body variants."
    },
    {
      title: "Brand voice guide",
      description: "Define your brand voice",
      prompt:
        "Create brand voice guidelines. Brand: [name]. Values: [list]. Include: 3 personality traits, do's and don'ts, example phrases, tone by channel."
    },
    {
      title: "SEO meta description",
      description: "Write meta descriptions that click",
      prompt:
        "Write 3 meta descriptions. Page: [topic]. Target keyword: [keyword]. Max 155 chars. Include: benefit, CTA or curiosity. No keyword stuffing."
    }
  ],
  business: [
    {
      title: "Meeting agenda",
      description: "Structure a productive meeting",
      prompt:
        "Create a meeting agenda. Purpose: [goal]. Attendees: [who]. Duration: [time]. Include: objectives, discussion points, decisions needed, action items."
    },
    {
      title: "Cold email",
      description: "Write outreach that gets replies",
      prompt:
        "Write a cold email. Goal: [meeting/sale]. Recipient: [role]. Company: [type]. Keep under 100 words. Personalize first line. One clear CTA."
    },
    {
      title: "Pitch deck outline",
      description: "Outline a startup pitch",
      prompt:
        "Create pitch deck outline. Startup: [name]. Problem: [problem]. Solution: [solution]. Include: problem, solution, market, traction, team, ask."
    },
    {
      title: "Job description",
      description: "Write a job posting",
      prompt:
        "Write a job description. Role: [title]. Company: [type]. Include: compelling intro, 5-7 responsibilities, 4-5 requirements, benefits, CTA."
    },
    {
      title: "Follow-up email",
      description: "Follow up without being pushy",
      prompt:
        "Write a follow-up email. Context: [previous interaction]. Goal: [next step]. Tone: helpful, not desperate. Include: brief reminder, new value, soft CTA."
    },
    {
      title: "Proposal summary",
      description: "Summarize a proposal",
      prompt:
        "Write a proposal executive summary. Project: [name]. Client: [type]. Include: problem, solution, deliverables, timeline, investment, next steps."
    },
    {
      title: "Feedback request",
      description: "Ask for feedback professionally",
      prompt:
        "Write a feedback request. Context: [project/collab]. Recipient: [client/partner]. Include: what you want feedback on, why it matters, 2-3 specific questions."
    },
    {
      title: "Apology email",
      description: "Handle mistakes professionally",
      prompt:
        "Write a professional apology. Situation: [what happened]. Impact: [on customer/partner]. Include: acknowledgment, apology, solution, prevention."
    },
    {
      title: "OKR draft",
      description: "Set objectives and key results",
      prompt:
        "Draft OKRs. Team: [name]. Quarter: [Q]. Include: 2-3 objectives, 2-3 key results per objective. Measurable. Ambitious but achievable."
    },
    {
      title: "SWOT analysis",
      description: "Analyze business position",
      prompt:
        "Create SWOT analysis. Business: [name]. Market: [context]. Include: 4 strengths, 4 weaknesses, 4 opportunities, 4 threats. Brief, actionable."
    }
  ],
  coding: [
    {
      title: "Code review prompt",
      description: "Get thorough code feedback",
      prompt:
        "Review this code. Focus on: bugs, performance, readability, security. Language: [lang]. Provide specific line suggestions. Rate 1-10 with explanation."
    },
    {
      title: "Debug helper",
      description: "Explain and fix errors",
      prompt:
        "I'm getting this error: [paste error]. Code context: [paste snippet]. Language: [lang]. Explain the cause and provide a fix. Step by step."
    },
    {
      title: "Refactor suggestion",
      description: "Improve code structure",
      prompt:
        "Refactor this code for better readability and maintainability. Language: [lang]. Keep same functionality. Explain each change."
    },
    {
      title: "API documentation",
      description: "Generate API docs",
      prompt:
        "Generate API documentation. Endpoint: [describe]. Include: purpose, parameters, request/response examples, error codes, usage notes."
    },
    {
      title: "Test cases",
      description: "Write unit tests",
      prompt:
        "Write unit tests for this function. Language: [lang]. Framework: [jest/jest/etc]. Cover: happy path, edge cases, errors. Include setup."
    },
    {
      title: "SQL query",
      description: "Write optimized SQL",
      prompt:
        "Write a SQL query. Database: [type]. Goal: [what you need]. Tables: [describe]. Include: query, explanation, index suggestions if needed."
    },
    {
      title: "Regex pattern",
      description: "Create regex patterns",
      prompt:
        "Create a regex pattern. Purpose: [e.g. validate email, extract dates]. Provide: pattern, explanation, 3 test cases (match/no match)."
    },
    {
      title: "Code comment",
      description: "Add clear comments",
      prompt:
        "Add comments to this code. Language: [lang]. Explain: purpose, complex logic, non-obvious decisions. Keep comments concise."
    },
    {
      title: "Migration script",
      description: "Plan a data migration",
      prompt:
        "Plan a data migration. From: [source]. To: [target]. Data: [describe]. Include: steps, validation, rollback plan, estimated time."
    },
    {
      title: "Architecture review",
      description: "Evaluate system design",
      prompt:
        "Review this architecture: [describe]. Consider: scalability, security, maintainability, cost. Provide 3 improvements with pros/cons."
    }
  ],
  study: [
    {
      title: "Study guide",
      description: "Create a study guide",
      prompt:
        "Create a study guide. Topic: [subject]. Level: [beginner/intermediate]. Include: key concepts, definitions, examples, practice questions."
    },
    {
      title: "Flashcards",
      description: "Generate flashcards",
      prompt:
        "Create 10 flashcards. Topic: [subject]. Format: term on front, definition + example on back. Mix easy and challenging."
    },
    {
      title: "Summary",
      description: "Summarize long content",
      prompt:
        "Summarize this: [paste text]. Include: main points, key takeaways, 3 bullet summary. Preserve critical details."
    },
    {
      title: "Explain like I'm 5",
      description: "Simplify complex topics",
      prompt:
        "Explain [topic] like I'm 5. Use simple words, analogies, no jargon. One paragraph. Then one paragraph for adult level."
    },
    {
      title: "Quiz questions",
      description: "Generate quiz questions",
      prompt:
        "Create 10 quiz questions. Topic: [subject]. Mix: 5 multiple choice, 3 short answer, 2 true/false. Include answers and explanations."
    },
    {
      title: "Compare and contrast",
      description: "Compare two concepts",
      prompt:
        "Compare and contrast [concept A] and [concept B]. Include: similarities, differences, when to use each, examples."
    },
    {
      title: "Step-by-step tutorial",
      description: "Break down a process",
      prompt:
        "Create a step-by-step tutorial. Topic: [skill/task]. Audience: [level]. Include: prerequisites, numbered steps, tips, common mistakes."
    },
    {
      title: "Vocabulary list",
      description: "Learn new terms",
      prompt:
        "Create a vocabulary list. Topic: [subject]. Include: term, definition, example sentence, related terms. 15 terms."
    },
    {
      title: "Mind map outline",
      description: "Structure knowledge",
      prompt:
        "Create a mind map outline. Topic: [subject]. Include: main branches, sub-branches, connections. Hierarchical structure."
    },
    {
      title: "Practice problems",
      description: "Generate practice",
      prompt:
        "Create 5 practice problems. Topic: [subject]. Difficulty: [level]. Include: problem, solution, explanation, similar problem suggestion."
    }
  ]
};
