import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { DistributionClient } from "./DistributionClient";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { getKeywordContent } from "@/lib/zh-keyword-content";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Distribution Dashboard | ToolEagle",
  description: "分发仪表盘 - 最新关键词分享内容与一键复制"
};

export default async function DistributionDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/distribution");
  }

  const keywords = getLatestKeywordPages(20);
  const items = keywords.map((k) => {
    const content = getKeywordContent(k.slug);
    const title = content?.title || content?.h1 || k.keyword;
    const oneLiner = content?.directAnswer || content?.description || "";
    const pageUrl = `${BASE_URL}/zh/search/${k.slug}`;
    const embedUrl = `${BASE_URL}/embed/${k.slug}`;

    return {
      slug: k.slug,
      keyword: k.keyword,
      title,
      oneLiner: oneLiner.slice(0, 120),
      pageUrl,
      embedUrl
    };
  });

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                🚀 分发仪表盘
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                最新 20 个关键词，一键复制分享到 Reddit、X、Quora
              </p>
            </div>
            <Link
              href="/dashboard/distribution/generate"
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              📝 生成分发内容
            </Link>
          </div>

          <DistributionClient items={items} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
