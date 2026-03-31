import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { FavoritesClient } from "@/app/dashboard/favorites/FavoritesClient";
import { Star } from "lucide-react";
import { ZH } from "@/lib/zh-site/paths";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { isZhDashboardDouyinSlug } from "@/lib/zh-dashboard-scope";

export const dynamic = "force-dynamic";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/dashboard/favorites",
  title: zhSeoTitle("收藏"),
  description: "查看在抖音专栏工具中保存的生成结果。",
  keywords: ["ToolEagle", "收藏", "抖音"]
});

export default async function ZhDashboardFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/favorites"));
  }

  const market = "cn";
  const rowsAttempt: any = await supabase
    .from("favorites")
    .select("id, tool_slug, tool_name, text, saved_at")
    .eq("user_id", user.id)
    .eq("market", market)
    .order("saved_at", { ascending: false })
    .limit(100);

  const rows =
    rowsAttempt.error?.message?.toLowerCase?.().includes("market")
      ? (
          await supabase
            .from("favorites")
            .select("id, tool_slug, tool_name, text, saved_at")
            .eq("user_id", user.id)
            .order("saved_at", { ascending: false })
            .limit(100)
        ).data ?? []
      : rowsAttempt.data ?? [];

  const favorites = (rows as any[])
    .filter((r) => isZhDashboardDouyinSlug(r.tool_slug))
    .map((r) => ({
      id: r.id,
      toolSlug: r.tool_slug,
      toolName: r.tool_name,
      text: r.text,
      savedAt: new Date(r.saved_at).getTime()
    }));

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href={ZH.dashboard}
                className="text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                ← 返回工作台
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <Star className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-semibold text-slate-900">我的收藏</h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">你在抖音专栏工具中保存的结果。</p>
            </div>
          </div>

          <FavoritesClient initialFavorites={favorites} variant="zh" />
        </section>
      </div>
    </main>
  );
}
