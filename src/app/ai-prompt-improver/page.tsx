import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PromptImprover } from "./PromptImprover";
import { Sparkles } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "AI Prompt Improver | Turn rough ideas into powerful prompts",
  description:
    "Improve your AI prompts in seconds. Input your rough idea in any language, get an optimized prompt with role, task, context and format. Free tool.",
  alternates: { canonical: `${BASE_URL}/ai-prompt-improver` },
  openGraph: {
    title: "AI Prompt Improver | ToolEagle",
    description: "Turn rough ideas into powerful AI prompts. Free tool.",
    url: `${BASE_URL}/ai-prompt-improver`
  }
};

export default function AiPromptImproverPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                AI Prompt Improver
              </h1>
            </div>
            <p className="mt-3 text-slate-600">
              Don&apos;t know how to talk to AI? Enter your rough idea in any language. We&apos;ll turn it into a clear, structured prompt that gets better results.
            </p>

            <PromptImprover />

            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold text-slate-900">Example</h2>
              <p className="mt-2 text-sm text-slate-600">
                <strong>Input:</strong> 帮我写一个视频文案
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <strong>Output:</strong> Write a TikTok video script. Topic: content creation. Audience: creators. Hook: curiosity. Tone: motivational. Length: 15 seconds.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/learn-ai" className="text-sm font-medium text-sky-600 hover:underline">
                Learn to talk to AI better →
              </Link>
              <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
                Prompt Library →
              </Link>
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                Use this prompt in ToolEagle tools →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
