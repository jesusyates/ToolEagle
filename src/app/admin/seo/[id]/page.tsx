import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SeoArticleEditForm } from "../SeoArticleEditForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "SEO 文章 · 编辑 | ToolEagle 管理",
  robots: { index: false, follow: false }
};

export default async function AdminSeoArticleEditPage({ params }: { params: Params }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const { id } = await params;
    if (!user) redirect(buildLoginRedirect(`/admin/seo/${id}`));
    redirect("/");
  }

  const { id } = await params;
  const db = createAdminClient();
  const { data, error } = await db
    .from("seo_articles")
    .select("id, title, slug, description, content, status, created_at, updated_at, deleted")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const row = data as {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    content: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted: boolean | null;
  };

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-3xl">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/seo" className="text-sky-600 hover:underline">
            ← SEO 内容中心
          </Link>
          <Link href="/admin/seo?tab=drafts" className="text-sky-600 hover:underline">
            草稿
          </Link>
          {row.deleted ? (
            <Link href="/admin/seo?tab=trash" className="text-amber-800 hover:underline">
              回收站
            </Link>
          ) : null}
        </div>
        <h1 className="mt-4 text-xl font-semibold">{row.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Slug：<code className="text-xs">{row.slug}</code> · 状态：<strong>{row.status}</strong>
          {row.deleted ? (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-900 text-xs">已入回收站</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          创建 {new Date(row.created_at).toLocaleString()} · 更新 {new Date(row.updated_at).toLocaleString()}
        </p>

        <SeoArticleEditForm
          articleId={row.id}
          initialTitle={row.title}
          initialSlug={row.slug}
          initialDescription={row.description ?? ""}
          initialContent={row.content}
          status={row.status}
          deleted={row.deleted === true}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
