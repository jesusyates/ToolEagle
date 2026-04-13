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
  title: "Admin · SEO 回收站 | ToolEagle",
  robots: { index: false, follow: false }
};

export default async function AdminSeoTrashPage() {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/seo-trash"));
    redirect("/");
  }

  const db = createAdminClient();
  const { data: rows, error } = await db
    .from("seo_articles")
    .select("id, title, slug, status, created_at, updated_at")
    .eq("deleted", true)
    .order("updated_at", { ascending: false });

  const list = (rows ?? []) as {
    id: string;
    title: string;
    slug: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-4xl">
        <Link href="/admin/seo?tab=trash" className="text-sm text-sky-600 hover:underline">
          ← SEO Content Center · Trash
        </Link>
        <p className="mt-2 text-sm">
          <Link href="/admin/seo" className="font-medium text-sky-700 underline">
            SEO Content Center（主入口）
          </Link>
        </p>
        <h1 className="mt-4 text-2xl font-semibold">SEO 回收站（软删除）</h1>
        <p className="mt-2 text-slate-600 text-sm">仅管理员可见；公开站与主列表不显示这些条目。slug 仍被占用。</p>

        {error ? (
          <p className="mt-4 text-red-700 text-sm">加载失败：{error.message}</p>
        ) : list.length === 0 ? (
          <p className="mt-6 text-slate-500 text-sm">回收站为空。</p>
        ) : (
          <table className="mt-6 w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-2 py-2 text-left">标题</th>
                <th className="border border-slate-200 px-2 py-2 text-left">slug</th>
                <th className="border border-slate-200 px-2 py-2 text-left">状态</th>
                <th className="border border-slate-200 px-2 py-2 text-left">更新时间</th>
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
                    {new Date(r.updated_at).toLocaleString()}
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
