import { Suspense } from "react";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { CreatorDashboardClient } from "@/components/creator-dashboard/CreatorDashboardClient";
import { BASE_URL } from "@/config/site";

export const metadata = {
  title: "Creator | ToolEagle",
  description: "Score, issues, workflow, and one next step to a generator.",
  alternates: { canonical: `${BASE_URL}/creator` },
  openGraph: {
    title: "Creator | ToolEagle",
    description: "Score, issues, workflow, one next step.",
    url: `${BASE_URL}/creator`,
    type: "website" as const,
    siteName: "ToolEagle"
  }
};

export default function CreatorDashboardPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Suspense
          fallback={<div className="container py-16 text-center text-slate-600">Loading creator dashboard…</div>}
        >
          <CreatorDashboardClient />
        </Suspense>
      </div>
      <SiteFooter />
    </main>
  );
}
