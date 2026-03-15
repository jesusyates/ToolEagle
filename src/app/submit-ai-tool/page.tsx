import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SubmitAiToolForm } from "./SubmitAiToolForm";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "Submit Your AI Tool | ToolEagle Directory",
  description:
    "Submit your AI tool to the ToolEagle directory. Get featured and reach creators looking for AI tools.",
  alternates: { canonical: `${BASE_URL}/submit-ai-tool` },
  robots: { index: true, follow: true }
};

export default function SubmitAiToolPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-xl mx-auto">
            <Link href="/ai-tools-directory" className="text-sm font-medium text-sky-600 hover:underline">
              ← AI Tools Directory
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Submit your AI tool
            </h1>
            <p className="mt-3 text-slate-600">
              Have an AI tool for creators? Submit it to our directory. We&apos;ll review and add tools that help TikTok, YouTube and Instagram creators.
            </p>

            <SubmitAiToolForm />

            <p className="mt-6 text-sm text-slate-500">
              We review submissions within a few days. By submitting, you agree that we may feature your tool and link to your website.
            </p>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
