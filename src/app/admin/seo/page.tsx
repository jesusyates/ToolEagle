import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { SeoContentCenterClient, type SeoListRow } from "./SeoContentCenterClient";
import { NewArticleForm } from "./NewArticleForm";
import { SeoAutomationPanel } from "./SeoAutomationPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO 内容中心 | ToolEagle 管理",
  robots: { index: false, follow: false }
};

const TABS = new Set([
  "drafts",
  "published",
  "trash",
  "new",
  "import",
  "preflight",
  "seeds",
  "scenarios",
  "auto",
  "joblog"
]);
type Tab =
  | "drafts"
  | "published"
  | "trash"
  | "new"
  | "import"
  | "preflight"
  | "seeds"
  | "scenarios"
  | "auto"
  | "joblog";

const AUTOMATION_TABS = new Set<Tab>(["seeds", "scenarios", "auto", "joblog"]);

type Search = Promise<{ tab?: string; inserted?: string; failed?: string; ok?: string }>;

export default async function AdminSeoContentCenterPage({ searchParams }: { searchParams: Search }) {
  const admin = await isAdmin();
  if (!admin) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect(buildLoginRedirect("/admin/seo"));
    redirect("/");
  }

  const sp = await searchParams;
  const raw = sp.tab ?? "drafts";
  const tab: Tab = TABS.has(raw) ? (raw as Tab) : "drafts";

  const db = createAdminClient();
  let rows: SeoListRow[] = [];
  if (tab === "drafts") {
    const { data } = await db
      .from("seo_articles")
      .select("id, title, slug, status, created_at")
      .eq("deleted", false)
      .eq("status", "draft")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as SeoListRow[];
  } else if (tab === "published") {
    const { data } = await db
      .from("seo_articles")
      .select("id, title, slug, status, created_at")
      .eq("deleted", false)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as SeoListRow[];
  } else if (tab === "trash") {
    const { data } = await db
      .from("seo_articles")
      .select("id, title, slug, status, created_at")
      .eq("deleted", true)
      .order("created_at", { ascending: false });
    rows = (data ?? []) as SeoListRow[];
  }

  const importSummary =
    tab === "import" && sp.ok === "1" && sp.inserted !== undefined
      ? { inserted: Number(sp.inserted), failed: Number(sp.failed ?? "0") }
      : null;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-5xl">
        <Link href="/dashboard" className="text-sm text-sky-600 hover:underline">
          ← 仪表盘
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">SEO 内容中心</h1>
        <p className="mt-2 text-sm text-slate-600">
          SEO 文章与自动化的主入口（应用数据源 → 选题 → 预检 → 草稿）、导入/导出，以及旧版预检链接。
        </p>

        <aside className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">过渡地址（仍可用）</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <Link href="/admin/seo-drafts" className="text-sky-800 underline">
                /admin/seo-drafts
              </Link>{" "}
              （旧版列表）
            </li>
            <li>
              <Link href="/admin/seo-trash" className="text-sky-800 underline">
                /admin/seo-trash
              </Link>
            </li>
            <li>
              <Link href="/admin/seo-preflight" className="text-sky-800 underline">
                /admin/seo-preflight
              </Link>
            </li>
            <li>
              <Link href="/admin/import" className="text-sky-800 underline">
                /admin/import
              </Link>
            </li>
            <li>
              <Link href="/admin/publish" className="text-sky-800 underline">
                /admin/publish
              </Link>
            </li>
            <li>
              <Link href="/admin/seo-gsc" className="text-sky-800 underline">
                /admin/seo-gsc
              </Link>{" "}
              （Search Console 监控）
            </li>
          </ul>
        </aside>

        <SeoContentCenterClient tab={tab} rows={rows} />

        {tab === "new" ? (
          <section className="mt-8">
            <h2 className="text-lg font-medium text-slate-900">新建文章</h2>
            <p className="mt-1 text-sm text-slate-600">
              在 <code className="text-xs">seo_articles</code> 中新建一行。若需旧版发布表单与 SEO 闸口自动修复，请用{" "}
              <Link href="/admin/publish" className="text-sky-700 underline">
                /admin/publish
              </Link>
              。
            </p>
            <NewArticleForm />
          </section>
        ) : null}

        {tab === "import" ? (
          <section className="mt-8 max-w-xl">
            <h2 className="text-lg font-medium text-slate-900">导入 / 导出</h2>
            <p className="mt-2 text-sm text-slate-600">
              CSV 列：<code className="text-xs">title,slug,description,content</code>（首行为表头）。与旧版导入一致（过闸后以{" "}
              <strong>published</strong> 写入）。
            </p>
            {importSummary ? (
              <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 text-sm">
                成功：<strong>{importSummary.inserted}</strong>，失败：<strong>{importSummary.failed}</strong>
              </p>
            ) : null}
            <form
              method="POST"
              action="/api/admin/import"
              encType="multipart/form-data"
              className="mt-6 space-y-4"
            >
              <input type="hidden" name="return_to" value="/admin/seo?tab=import" />
              <div>
                <label className="block text-sm font-medium text-slate-700">CSV 文件</label>
                <input name="file" type="file" accept=".csv,text/csv" required className="mt-1 text-sm" />
              </div>
              <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
                导入
              </button>
            </form>
            <p className="mt-6 text-sm text-slate-600">
              导出：在「草稿 / 已发布 / 回收站」勾选行、单行点 <strong>CSV</strong>，或打开文章使用 <strong>导出CSV</strong>。
            </p>
          </section>
        ) : null}

        {tab === "preflight" ? (
          <section className="mt-8 max-w-xl space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-medium text-slate-900">预检</h2>
            <p>
              选题预检与草稿生成仍在独立页面（过渡 URL 不变）。
            </p>
            <p className="text-slate-600">
              主流程：使用 <strong>应用数据源</strong> → <strong>选题生成</strong> → <strong>自动生成</strong>{" "}
              标签。API 支持在 <code className="text-xs">POST /api/admin/seo-preflight</code> 上使用{" "}
              <code className="text-xs">useScenarioTopicsFile</code> 与 <code className="text-xs">seedsOnly</code>。
            </p>
            <Link
              href="/admin/seo-preflight"
              className="inline-flex rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white"
            >
              打开 SEO 预检 →
            </Link>
          </section>
        ) : null}

        {AUTOMATION_TABS.has(tab) ? (
          <SeoAutomationPanel activeTab={tab as "seeds" | "scenarios" | "auto" | "joblog"} />
        ) : null}
      </div>
      <SiteFooter />
    </main>
  );
}
