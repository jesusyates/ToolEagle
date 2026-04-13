import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { AutoGenerateOneClient } from "./AutoGenerateOneClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Publish | ToolEagle",
  robots: { index: false, follow: false }
};

type Search = Promise<{ published?: string; slug?: string }>;

export default async function AdminPublishPage({ searchParams }: { searchParams: Search }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/publish"));
    redirect("/");
  }

  const sp = await searchParams;
  const showOk = sp.published === "1" && sp.slug;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-2xl">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/dashboard" className="text-sky-600 hover:underline">
            ← Dashboard
          </Link>
          <Link href="/admin/seo" className="text-sky-600 hover:underline">
            SEO 内容中心（主入口）
          </Link>
        </div>
        <aside className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          日常 SEO 编排、导入/导出与草稿请优先使用{" "}
          <Link href="/admin/seo" className="font-medium underline">
            /admin/seo
          </Link>
          ；本页为旧版「直接发布」表单。
        </aside>
        <h1 className="mt-4 text-2xl font-semibold">Admin · Publish</h1>
        <p className="mt-2 text-slate-600">Insert into <code className="text-sm">seo_articles</code> (status published).</p>

        {showOk ? (
          <p className="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-green-900">
            Published. Slug used: <strong>{decodeURIComponent(sp.slug!)}</strong>
          </p>
        ) : null}

        <form
          method="POST"
          action="/api/admin/publish"
          className="mt-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input name="title" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug</label>
            <input name="slug" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <input name="description" className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Content</label>
            <textarea name="content" required rows={14} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Publish
          </button>
        </form>

        <AutoGenerateOneClient />
      </div>
      <SiteFooter />
    </main>
  );
}
