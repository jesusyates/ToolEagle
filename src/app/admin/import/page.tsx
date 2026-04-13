import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Import | ToolEagle",
  robots: { index: false, follow: false }
};

type Search = Promise<{ inserted?: string; failed?: string; ok?: string }>;

export default async function AdminImportPage({ searchParams }: { searchParams: Search }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/import"));
    redirect("/");
  }

  const sp = await searchParams;
  const summary =
    sp.ok === "1" && sp.inserted !== undefined
      ? { inserted: Number(sp.inserted), failed: Number(sp.failed ?? "0") }
      : null;

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
          主入口已迁至{" "}
          <Link href="/admin/seo" className="font-medium underline">
            /admin/seo
          </Link>
          （导入/导出可在「导入 / 导出」标签完成）；本页为旧版独立导入。
        </aside>
        <h1 className="mt-4 text-2xl font-semibold">Admin · CSV import</h1>
        <p className="mt-2 text-slate-600">
          Columns: <code className="text-sm">title,slug,description,content</code> (header row required).
        </p>

        {summary ? (
          <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
            Inserted: <strong>{summary.inserted}</strong>, failed: <strong>{summary.failed}</strong>
          </p>
        ) : null}

        <form
          method="POST"
          action="/api/admin/import"
          encType="multipart/form-data"
          className="mt-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">CSV file</label>
            <input name="file" type="file" accept=".csv,text/csv" required className="mt-1 text-sm" />
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Import
          </button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
