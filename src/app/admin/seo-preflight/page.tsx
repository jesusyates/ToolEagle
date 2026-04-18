import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { SeoPreflightClient } from "./SeoPreflightClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · SEO 诊断预检 | ToolEagle",
  robots: { index: false, follow: false }
};

export default async function AdminSeoPreflightPage() {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/seo-preflight"));
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-3xl">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard" className="text-sky-600 hover:underline">
            ← Dashboard
          </Link>
          <Link href="/admin/seo" className="text-sky-700 font-medium hover:underline">
            SEO Content Center
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-semibold">SEO 诊断预检</h1>
        <p className="mt-2 text-slate-600">
          <strong className="text-slate-800">非常规生产入口。</strong>用于逐项检查候选、拒绝原因、手工种子与 API 参数实验。日常发布流请使用内容中心{" "}
          <Link href="/admin/seo?tab=auto" className="font-medium text-sky-700 underline">
            自动生成（生产）
          </Link>
          。
        </p>
        <p className="mt-2 text-sm text-slate-600">
          能力说明：单引擎参数化预检（候选 → 去重 → 大纲 → 结构校验 → 预算 → 通过/拒绝）。不写全文、不自动发布；与管线内预检规则一致。
        </p>
        <div className="mt-8">
          <SeoPreflightClient />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
