import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { DashboardHistoryFromCore } from "@/components/dashboard/DashboardHistoryFromCore";

export const dynamic = "force-dynamic";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/dashboard/history",
  title: zhSeoTitle("生成记录"),
  description: "查看你在抖音专栏工具中的最近生成。",
  keywords: ["ToolEagle", "生成记录", "抖音"]
});

export default async function ZhDashboardHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/history"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <DashboardHistoryFromCore variant="zh" />
      </div>
    </main>
  );
}
