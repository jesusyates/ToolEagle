import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SeoArticleEditPageBody } from "./SeoArticleEditPageBody";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "SEO 文章 · 编辑 | ToolEagle 管理",
  robots: { index: false, follow: false }
};

/**
 * 文章数据改由客户端请求 GET /api/admin/seo-articles/[id] 加载（Cookie 在浏览器侧更稳定）。
 */
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
  return <SeoArticleEditPageBody articleId={id} />;
}
