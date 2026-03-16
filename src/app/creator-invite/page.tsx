import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { CreatorInviteForm } from "./CreatorInviteForm";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Creator Invite | Free Pro Plan for Feedback",
  description:
    "TikTok and YouTube creators: Get free Pro plan access in exchange for feedback. Help us improve ToolEagle.",
  alternates: { canonical: `${BASE_URL}/creator-invite` },
  robots: { index: true, follow: true }
};

export default function CreatorInvitePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-16">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                Creator Invite
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                TikTok and YouTube creators: Get free Pro plan access in exchange for honest feedback and exposure.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl border border-slate-200 p-6 mb-8">
              <h2 className="font-semibold text-slate-900">What you get</h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>• Free Pro plan for 3 months</li>
                <li>• Unlimited AI generations</li>
                <li>• Early access to new features</li>
              </ul>
              <h2 className="mt-6 font-semibold text-slate-900">What we ask</h2>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li>• Honest feedback on the tools</li>
                <li>• Optional: mention ToolEagle in your content</li>
              </ul>
            </div>

            <CreatorInviteForm />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
