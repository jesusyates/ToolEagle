/**
 * Learn AI - articles for /learn-ai
 */

export type LearnAiArticle = {
  slug: string;
  title: string;
  description: string;
  faq: { question: string; answer: string }[];
};

export const LEARN_AI_ARTICLES: LearnAiArticle[] = [
  {
    slug: "how-to-talk-to-ai",
    title: "How to Talk to AI: A Beginner's Guide",
    description:
      "Learn the basics of communicating with AI. Clear instructions get better results.",
    faq: [
      {
        question: "Why does how I phrase my request matter?",
        answer:
          "AI responds to the exact words you use. Vague prompts get vague answers. Specific prompts with context, role, and format get precise, useful outputs."
      },
      {
        question: "What's the simplest way to improve my prompts?",
        answer:
          "Add context: who you are, what you need, and what format you want. For example: 'I'm a marketer. Write a 3-sentence email subject line for a product launch. Tone: professional.'"
      },
      {
        question: "Should I use long or short prompts?",
        answer:
          "It depends. Short prompts work for simple tasks. Longer prompts with role, task, context, and format work better for complex or creative work."
      }
    ]
  },
  {
    slug: "how-to-prompt-chatgpt",
    title: "How to Prompt ChatGPT for Better Results",
    description:
      "Get more useful outputs from ChatGPT with structured prompts and clear instructions.",
    faq: [
      {
        question: "What makes a good ChatGPT prompt?",
        answer:
          "A good prompt includes: a clear role (e.g. 'Act as a copywriter'), a specific task, relevant context, and desired format. Example: 'Act as a copywriter. Write 5 Instagram captions for a fitness brand. Tone: motivational. Max 150 chars each.'"
      },
      {
        question: "How do I get ChatGPT to follow a format?",
        answer:
          "Tell it explicitly. Use phrases like 'Format: bullet points', 'Output as a table', 'Use this structure: intro, 3 points, conclusion', or 'One sentence per line.'"
      },
      {
        question: "Why does ChatGPT give generic answers?",
        answer:
          "Usually because the prompt is too broad. Add audience, tone, length, examples, or constraints. The more specific you are, the more tailored the output."
      }
    ]
  },
  {
    slug: "prompt-tips",
    title: "10 Prompt Tricks That Actually Work",
    description:
      "Proven techniques to get better AI outputs: role-playing, examples, constraints, and more.",
    faq: [
      {
        question: "What is role-playing in prompts?",
        answer:
          "You assign the AI a role (e.g. 'You are a senior developer') so it responds with that expertise and perspective. It improves tone, depth, and relevance."
      },
      {
        question: "Should I give examples in my prompt?",
        answer:
          "Yes. One or two examples of the output you want (few-shot prompting) dramatically improve consistency. The AI mimics the style and structure."
      },
      {
        question: "How do constraints help?",
        answer:
          "Constraints like 'max 100 words', 'no jargon', 'bullet points only' force the AI to stay focused and avoid rambling or unwanted formats."
      }
    ]
  },
  {
    slug: "prompt-frameworks",
    title: "Prompt Frameworks: ROLE, TASK, CONTEXT, FORMAT",
    description:
      "Use the RTCF framework to structure prompts for consistent, high-quality AI outputs.",
    faq: [
      {
        question: "What is the RTCF framework?",
        answer:
          "ROLE (who the AI should act as), TASK (what to do), CONTEXT (background, audience, constraints), FORMAT (how to structure the output). Using all four improves clarity and results."
      },
      {
        question: "Do I need all four parts?",
        answer:
          "Not always. Simple tasks may need only TASK. Complex or creative work benefits from all four. Start with TASK, then add ROLE, CONTEXT, and FORMAT as needed."
      },
      {
        question: "Can I use other frameworks?",
        answer:
          "Yes. RTCF is one option. Others include: CRISPE (Capacity, Request, Intent, Style, Persona, Experiment), RISEN (Role, Instructions, Steps, End goal, Narrowing), or simple bullet lists."
      }
    ]
  },
  {
    slug: "common-prompt-mistakes",
    title: "Common Prompt Mistakes and How to Fix Them",
    description:
      "Avoid vague prompts, missing context, and unclear formats. Fix these to get better AI results.",
    faq: [
      {
        question: "What's the biggest prompt mistake?",
        answer:
          "Being too vague. 'Write something good' or 'Help me with marketing' gives generic output. Be specific: what exactly do you need, for whom, in what format?"
      },
      {
        question: "Why does my AI output keep changing?",
        answer:
          "Inconsistent prompts lead to inconsistent outputs. Use the same structure (role, task, context, format) each time. Save and reuse prompts that work."
      },
      {
        question: "How do I fix overly long AI responses?",
        answer:
          "Add length constraints: 'Max 3 sentences', 'Under 100 words', '5 bullet points only'. Be explicit about what you don't want: 'No intro, just the list.'"
      }
    ]
  }
];

export function getLearnAiArticle(slug: string): LearnAiArticle | undefined {
  return LEARN_AI_ARTICLES.find((a) => a.slug === slug);
}

export function getAllLearnAiSlugs(): string[] {
  return LEARN_AI_ARTICLES.map((a) => a.slug);
}
