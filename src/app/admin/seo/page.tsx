import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { SeoHubClient, type SeoHubRow } from "./SeoHubClient";
import type { HubPagination, HubTab } from "./types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO 内容后台 | ToolEagle 管理",
  robots: { index: false, follow: false }
};

const TABS = new Set(["auto", "pending", "published", "trash", "import"]);

const SEO_HUB_PAGE_SIZE = 20;

/** Old bookmarks → new hub */
const LEGACY_TAB: Record<string, string> = {
  drafts: "pending",
  new: "auto",
  preflight: "auto",
  seeds: "auto",
  scenarios: "auto",
  joblog: "auto"
};

type Search = Promise<{
  tab?: string;
  page?: string;
  dpage?: string;
  spage?: string;
  ids?: string | string[];
  ok?: string;
  inserted?: string;
  failed?: string;
  fixed?: string;
}>;

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
  const raw = sp.tab ?? "auto";
  if (LEGACY_TAB[raw]) {
    redirect(`/admin/seo?tab=${LEGACY_TAB[raw]}`);
  }

  const tab: HubTab = TABS.has(raw) ? (raw as HubTab) : "auto";

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const dpage = Math.max(1, parseInt(String(sp.dpage ?? "1"), 10) || 1);
  const spage = Math.max(1, parseInt(String(sp.spage ?? "1"), 10) || 1);

  const rawIds = sp.ids;
  const importIdsFromUrl = (Array.isArray(rawIds) ? rawIds[0] : rawIds) ?? "";

  const importSummary =
    sp.ok === "1" && sp.inserted !== undefined
      ? {
          inserted: Number(sp.inserted),
          failed: Number(sp.failed ?? "0"),
          fixed: Number(sp.fixed ?? "0")
        }
      : null;

  const db = createAdminClient();
  const selectPending =
    "id, title, slug, status, created_at, review_status, publish_scheduled_at, deleted";

  let draftRows: SeoHubRow[] = [];
  let scheduledRows: SeoHubRow[] = [];
  let publishedRows: SeoHubRow[] = [];
  let trashRows: SeoHubRow[] = [];

  let draftPagination: HubPagination | null = null;
  let scheduledPagination: HubPagination | null = null;
  let publishedPagination: HubPagination | null = null;
  let trashPagination: HubPagination | null = null;

  const ps = SEO_HUB_PAGE_SIZE;

  if (tab === "pending") {
    const draftBase = db.from("seo_articles").select("id", { count: "exact", head: true }).eq("deleted", false).eq("status", "draft");
    const { count: draftCount, error: dCountErr } = await draftBase;
    if (dCountErr) {
      console.error("[admin/seo] draft count", dCountErr.message);
    }
    const dTotal = draftCount ?? 0;
    const dTotalPages = Math.max(1, Math.ceil(dTotal / ps));
    const dpageClamped = Math.min(dpage, dTotalPages);
    const dFrom = (dpageClamped - 1) * ps;
    const { data: d } = await db
      .from("seo_articles")
      .select(selectPending)
      .eq("deleted", false)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .range(dFrom, dFrom + ps - 1);
    draftRows = (d ?? []) as SeoHubRow[];
    draftPagination = {
      page: dpageClamped,
      totalPages: dTotalPages,
      total: dTotal,
      pageSize: ps
    };

    const schedBase = db.from("seo_articles").select("id", { count: "exact", head: true }).eq("deleted", false).eq("status", "scheduled");
    const { count: schedCount, error: sCountErr } = await schedBase;
    if (sCountErr) {
      console.error("[admin/seo] scheduled count", sCountErr.message);
    }
    const sTotal = schedCount ?? 0;
    const sTotalPages = Math.max(1, Math.ceil(sTotal / ps));
    const spageClamped = Math.min(spage, sTotalPages);
    const sFrom = (spageClamped - 1) * ps;
    const { data: s } = await db
      .from("seo_articles")
      .select(selectPending)
      .eq("deleted", false)
      .eq("status", "scheduled")
      .order("publish_scheduled_at", { ascending: true })
      .range(sFrom, sFrom + ps - 1);
    scheduledRows = (s ?? []) as SeoHubRow[];
    scheduledPagination = {
      page: spageClamped,
      totalPages: sTotalPages,
      total: sTotal,
      pageSize: ps
    };
  } else if (tab === "published") {
    const { count: pubCount, error: pCountErr } = await db
      .from("seo_articles")
      .select("id", { count: "exact", head: true })
      .eq("deleted", false)
      .eq("status", "published");
    if (pCountErr) {
      console.error("[admin/seo] published count", pCountErr.message);
    }
    const pTotal = pubCount ?? 0;
    const pTotalPages = Math.max(1, Math.ceil(pTotal / ps));
    const pageClamped = Math.min(page, pTotalPages);
    const pFrom = (pageClamped - 1) * ps;
    const { data: p } = await db
      .from("seo_articles")
      .select("id, title, slug, status, created_at, review_status, deleted")
      .eq("deleted", false)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(pFrom, pFrom + ps - 1);
    publishedRows = (p ?? []) as SeoHubRow[];
    publishedPagination = {
      page: pageClamped,
      totalPages: pTotalPages,
      total: pTotal,
      pageSize: ps
    };
  } else if (tab === "trash") {
    const { count: tCount, error: tCountErr } = await db
      .from("seo_articles")
      .select("id", { count: "exact", head: true })
      .eq("deleted", true);
    if (tCountErr) {
      console.error("[admin/seo] trash count", tCountErr.message);
    }
    const tTotal = tCount ?? 0;
    const tTotalPages = Math.max(1, Math.ceil(tTotal / ps));
    const pageClamped = Math.min(page, tTotalPages);
    const tFrom = (pageClamped - 1) * ps;
    const { data: t } = await db
      .from("seo_articles")
      .select("id, title, slug, status, created_at, review_status, deleted")
      .eq("deleted", true)
      .order("created_at", { ascending: false })
      .range(tFrom, tFrom + ps - 1);
    trashRows = (t ?? []).map((row) => ({ ...(row as SeoHubRow), deleted: true }));
    trashPagination = {
      page: pageClamped,
      totalPages: tTotalPages,
      total: tTotal,
      pageSize: ps
    };
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-5xl">
        <Link href="/dashboard" className="text-sm text-sky-600 hover:underline">
          ← 仪表盘
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">SEO 内容后台</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          通过下方标签完成自动生产、待发布处理、已发布管理与回收站维护。无需使用 SQL。
        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">加载中…</p>}>
          <SeoHubClient
            tab={tab}
            draftRows={draftRows}
            scheduledRows={scheduledRows}
            publishedRows={publishedRows}
            trashRows={trashRows}
            draftPagination={draftPagination}
            scheduledPagination={scheduledPagination}
            publishedPagination={publishedPagination}
            trashPagination={trashPagination}
            importIdsFromUrl={importIdsFromUrl}
            importSummary={importSummary}
          />
        </Suspense>
      </div>
      <SiteFooter />
    </main>
  );
}
