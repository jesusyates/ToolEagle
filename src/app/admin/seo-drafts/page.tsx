import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · SEO 草稿 | ToolEagle",
  robots: { index: false, follow: false }
};

type Search = Promise<{ status?: string }>;

export default async function AdminSeoDraftsPage({ searchParams }: { searchParams: Search }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/seo-drafts"));
    redirect("/");
  }

  const sp = await searchParams;
  const filter = sp.status === "all" ? null : sp.status === "published" ? "published" : "draft";

  const db = createAdminClient();
  let q = db
    .from("seo_articles")
    .select("id, title, slug, status, created_at")
    .eq("deleted", false)
    .order("created_at", { ascending: false });
  if (filter === "published") {
    q = q.eq("status", "published");
  } else if (filter === "draft") {
    q = q.in("status", ["draft", "scheduled"]);
  }
  const { data: rows, error } = await q;

  const list = (rows ?? []) as {
    id: string;
    title: string;
    slug: string;
    status: string;
    created_at: string;
  }[];

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-4xl">
        <Link href="/dashboard" className="text-sm text-sky-600 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">SEO 文章草稿</h1>
        <p className="mt-2 text-sm">
          <Link href="/admin/seo" className="font-medium text-sky-700 underline">
            SEO Content Center（主入口）
          </Link>
        </p>
        <p className="mt-2 text-slate-600 text-sm">
          默认显示 <code className="text-xs">draft</code> 与已排期 <code className="text-xs">scheduled</code>
          。预检/草稿生成写入的条目会出现在此。
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm items-center">
          <Link
            href="/admin/seo-drafts"
            className={filter === "draft" ? "font-semibold text-sky-700" : "text-sky-600 hover:underline"}
          >
            草稿
          </Link>
          <Link
            href="/admin/seo-drafts?status=published"
            className={filter === "published" ? "font-semibold text-sky-700" : "text-sky-600 hover:underline"}
          >
            已发布
          </Link>
          <Link
            href="/admin/seo-drafts?status=all"
            className={filter === null ? "font-semibold text-sky-700" : "text-sky-600 hover:underline"}
          >
            全部
          </Link>
          <Link href="/admin/seo-trash" className="text-amber-800 hover:underline">
            回收站
          </Link>
        </div>

        {error ? (
          <p className="mt-4 text-red-700 text-sm">加载失败：{error.message}</p>
        ) : list.length === 0 ? (
          <p className="mt-6 text-slate-500 text-sm">暂无记录。</p>
        ) : (
          <table className="mt-6 w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-2 py-2 text-left">标题</th>
                <th className="border border-slate-200 px-2 py-2 text-left">slug</th>
                <th className="border border-slate-200 px-2 py-2 text-left">状态</th>
                <th className="border border-slate-200 px-2 py-2 text-left">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="border border-slate-200 px-2 py-2">
                    <Link href={`/admin/seo/${r.id}`} className="text-sky-700 hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="border border-slate-200 px-2 py-2 font-mono text-xs">{r.slug}</td>
                  <td className="border border-slate-200 px-2 py-2">{r.status}</td>
                  <td className="border border-slate-200 px-2 py-2 text-slate-600">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
