import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { DashboardHistoryFromCore } from "@/components/dashboard/DashboardHistoryFromCore";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Generation History | ToolEagle",
  description: "View your AI generation history across all tools."
};

export default async function DashboardHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard/history"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <DashboardHistoryFromCore variant="en" />
      </div>
      <SiteFooter />
    </main>
  );
}
