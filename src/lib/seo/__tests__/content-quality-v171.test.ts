import { evaluateAnswerTemplatePage, evaluateIdeasTopicPage } from "../content-quality-evaluate";
import type { AnswerTemplate } from "@/config/answers-templates";

describe("V171 content-quality-evaluate", () => {
  test("flags thin answer with placeholder", () => {
    const thin: AnswerTemplate = {
      platform: "tiktok",
      slug: "test-thin",
      question: "Test?",
      shortAnswer: "Short.",
      tldr: "Hi",
      examples: ["a"],
      tips: ["tip"],
      quickTips: [],
      commonMistakes: [],
      faq: [],
      toolSlug: "hook-generator",
      toolName: "Hook Generator"
    };
    const r = evaluateAnswerTemplatePage(thin);
    expect(r.signals.length).toBeGreaterThan(0);
    expect(r.actions).toContain("exclude_sitemap");
    expect(r.actions).toContain("internal_link_exclude");
  });

  test("passes healthy ideas topic with rich examples", () => {
    const r = evaluateIdeasTopicPage("tiktok", "hooks", [
      "Open with a pattern interrupt that makes viewers stop scrolling.",
      "Start mid-action so the feed feels like you caught a real moment."
    ]);
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.actions).toHaveLength(0);
  });
});
