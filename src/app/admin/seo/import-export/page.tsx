import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { ImportExportClient } from "./ImportExportClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO 导入 / 导出 | ToolEagle 管理",
  robots: { index: false, follow: false }
};

type Search = Promise<{ inserted?: string; failed?: string; ok?: string; ids?: string | string[] }>;

export default async function AdminSeoImportExportPage({ searchParams }: { searchParams: Search }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/seo/import-export"));
    redirect("/");
  }

  const sp = await searchParams;
  const rawIds = sp.ids;
  const idsFromUrl = (Array.isArray(rawIds) ? rawIds[0] : rawIds) ?? "";
  const importSummary =
    sp.ok === "1" && sp.inserted !== undefined
      ? { inserted: Number(sp.inserted), failed: Number(sp.failed ?? "0") }
      : null;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-xl">
        <Link href="/admin/seo?tab=import" className="text-sm text-sky-600 hover:underline">
          ← SEO 内容后台
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">导入 / 导出</h1>
        <p className="mt-2 text-sm text-slate-600">
          CSV 列：<code className="text-xs">title,slug,description,content</code>（首行为表头）。导入与旧版一致（过闸后以{" "}
          <strong>published</strong> 写入）。
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-900">导入</h2>
          {importSummary ? (
            <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-sm">
              成功：<strong>{importSummary.inserted}</strong>，失败：<strong>{importSummary.failed}</strong>
            </p>
          ) : null}
          <form
            method="POST"
            action="/api/admin/import"
            encType="multipart/form-data"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="return_to" value="/admin/seo?tab=import" />
            <div>
              <label className="block text-sm font-medium text-slate-700">CSV 文件</label>
              <input name="file" type="file" accept=".csv,text/csv" required className="mt-1 text-sm" />
            </div>
            <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800">
              上传并导入
            </button>
          </form>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-medium text-slate-900">导出</h2>
          <p className="mt-1 text-sm text-slate-600">
            与内容中心列表一致：<strong>每篇文章单独一个 CSV</strong>（完整列）；选中 <strong>2 篇及以上</strong>打包为{" "}
            <strong>ZIP</strong>，仅 1 篇时下载单个 CSV。
          </p>
          <Suspense fallback={<p className="mt-4 text-sm text-slate-500">加载中…</p>}>
            <ImportExportClient idsFromUrl={idsFromUrl} />
          </Suspense>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
