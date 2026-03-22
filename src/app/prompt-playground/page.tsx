import { Metadata } from "next";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PromptPlaygroundClient } from "./PromptPlaygroundClient";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Prompt Playground | Learn to Write Better Prompts",
  description:
    "Paste your prompt and get AI feedback, optimization tips, and a better version. Learn how to write prompts that get better results.",
  alternates: { canonical: `${BASE_URL}/prompt-playground` },
  openGraph: {
    title: "Prompt Playground | ToolEagle",
    description: "Get AI feedback on your prompts. Learn and improve.",
    url: `${BASE_URL}/prompt-playground`
  }
};

export default function PromptPlaygroundPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Prompt Playground
            </h1>
            <p className="mt-3 text-slate-600">
              Paste your prompt and get AI feedback, optimization tips, and a better version. Learn how to write prompts that get better results.
            </p>

            <PromptPlaygroundClient />

            <div className="mt-10 flex flex-wrap gap-4">
              <a href="/learn-ai" className="text-sm font-medium text-sky-600 hover:underline">
                Learn to talk to AI better →
              </a>
              <a href="/ai-prompt-improver" className="text-sm font-medium text-sky-600 hover:underline">
                AI Prompt Improver →
              </a>
              <a href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
                Prompt Library →
              </a>
              <a href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                Use this prompt in ToolEagle tools →
              </a>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
