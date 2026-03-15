import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { SubmitFormClient } from "./SubmitFormClient";

const BASE_URL = "https://www.tooleagle.com";

export const metadata: Metadata = {
  title: "Submit Your Content | ToolEagle",
  description:
    "Submit your best captions, hooks, or titles. Share with the creator community and get featured on ToolEagle.",
  alternates: { canonical: `${BASE_URL}/submit` },
  openGraph: {
    title: "Submit Your Content | ToolEagle",
    description: "Submit captions, hooks, and titles to the creator community.",
    url: `${BASE_URL}/submit`
  }
};

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Submit Your Content
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Share your best captions, hooks, or titles with the creator community. Get featured on ToolEagle.
            </p>
            <div className="mt-4">
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                Browse examples →
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <SubmitFormClient />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
