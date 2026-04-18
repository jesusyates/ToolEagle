"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPaginationItems } from "@/lib/admin/pagination-ui";
import { friendlySeoListLabel } from "@/lib/seo/seo-hub-labels";
import { ImportExportClient } from "./import-export/ImportExportClient";
import type { HubPagination, HubTab } from "./types";

function parseIdsParam(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  return [...new Set(String(raw).split(",").map((s) => s.trim()).filter(Boolean))];
}

export type SeoHubRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  review_status?: string | null;
  publish_scheduled_at?: string | null;
  deleted?: boolean;
};

type Props = {
  tab: HubTab;
  draftRows: SeoHubRow[];
  scheduledRows: SeoHubRow[];
  publishedRows: SeoHubRow[];
  trashRows: SeoHubRow[];
  draftPagination: HubPagination | null;
  scheduledPagination: HubPagination | null;
  publishedPagination: HubPagination | null;
  trashPagination: HubPagination | null;
  importIdsFromUrl: string;
  importSummary: { inserted: number; failed: number; fixed: number } | null;
};

const TABS: { key: HubTab; label: string }[] = [
  { key: "auto", label: "自动生产" },
  { key: "pending", label: "待发布" },
  { key: "published", label: "已发布" },
  { key: "trash", label: "回收站" },
  { key: "import", label: "导入 / 导出 CSV" }
];

async function postSeoApi(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok?: boolean; applied?: number; skipped?: unknown; error?: string; deleted?: number }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    applied?: number;
    skipped?: unknown;
    error?: string;
    deleted?: number;
  };
  if (!res.ok) {
    throw new Error(j?.error ?? `HTTP ${res.status}`);
  }
  if (j && typeof j === "object" && "ok" in j && j.ok === false) {
    throw new Error(j?.error ?? "操作失败");
  }
  return j;
}

function HubPaginationNav({
  tab,
  paramName,
  pagination
}: {
  tab: HubTab;
  paramName: "page" | "dpage" | "spage";
  pagination: HubPagination;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { page, totalPages, total, pageSize } = pagination;

  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        共 <strong>{total}</strong> 条
        {total > 0 ? "（本页已显示全部；超过 " + pageSize + " 条时会自动分页）" : ""}
      </p>
    );
  }

  const items = buildPaginationItems(page, totalPages);

  function hrefForPage(n: number) {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    p.set("tab", tab);
    p.set(paramName, String(n));
    return `${pathname}?${p.toString()}`;
  }

  const prevHref = page > 1 ? hrefForPage(page - 1) : null;
  const nextHref = page < totalPages ? hrefForPage(page + 1) : null;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4 text-sm"
      aria-label="分页"
    >
      <span className="text-xs text-slate-500">
        {start}–{end} / 共 {total} 条
      </span>
      {prevHref ? (
        <Link href={prevHref} className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 hover:bg-slate-50">
          上一页
        </Link>
      ) : (
        <span className="rounded border border-transparent px-2 py-1 text-slate-400">上一页</span>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) =>
          item.type === "ellipsis" ? (
            <li key={`e-${idx}`} className="px-1 text-slate-400 select-none" aria-hidden>
              …
            </li>
          ) : (
            <li key={item.n}>
              {item.n === page ? (
                <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                  {item.n}
                </span>
              ) : (
                <Link
                  href={hrefForPage(item.n)}
                  className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
                >
                  {item.n}
                </Link>
              )}
            </li>
          )
        )}
      </ul>
      {nextHref ? (
        <Link href={nextHref} className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-800 hover:bg-slate-50">
          下一页
        </Link>
      ) : (
        <span className="rounded border border-transparent px-2 py-1 text-slate-400">下一页</span>
      )}
    </nav>
  );
}

function LastRunSummary({ lastRun }: { lastRun: unknown }) {
  const r = lastRun as
    | {
        planned?: number;
        approved?: number;
        generated?: number;
        queued?: number;
        scheduledForPublish?: number;
        drafts?: { rows?: Array<{ review_status?: string }> };
      }
    | null
    | undefined;
  if (!r) {
    return <p className="text-sm text-slate-500">暂无记录。请先运行一轮自动生产。</p>;
  }
  const rows = r.drafts?.rows ?? [];
  const publishReady = rows.filter((x) => x.review_status === "publish_ready").length;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 text-sm">
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt className="text-xs text-slate-500">计划</dt>
        <dd className="text-lg font-semibold text-slate-900">{r.planned ?? "—"}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt className="text-xs text-slate-500">预检通过</dt>
        <dd className="text-lg font-semibold text-slate-900">{r.approved ?? "—"}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt className="text-xs text-slate-500">生成成功</dt>
        <dd className="text-lg font-semibold text-slate-900">{r.generated ?? "—"}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt className="text-xs text-slate-500">可发布</dt>
        <dd className="text-lg font-semibold text-slate-900">{rows.length > 0 ? publishReady : "—"}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
        <dt className="text-xs text-slate-500">已排期</dt>
        <dd className="text-lg font-semibold text-slate-900">{r.scheduledForPublish ?? "—"}</dd>
      </div>
    </dl>
  );
}

function AutoTab() {
  const router = useRouter();
  const [wanted, setWanted] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<unknown>(null);

  const loadLast = useCallback(async () => {
    const res = await fetch("/api/admin/seo/run-auto");
    const j = (await res.json().catch(() => null)) as { ok?: boolean; lastRun?: unknown };
    if (res.ok && j?.lastRun) setLastRun(j.lastRun);
    else setLastRun(null);
  }, []);

  useEffect(() => {
    void loadLast();
  }, [loadLast]);

  async function runProduction() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo/run-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wanted,
          schedulePublish: true
        })
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        result?: unknown;
      };
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setLastRun(j?.result ?? null);
      setMsg(
        j?.ok === false
          ? "本轮已结束（请查看下方数字；部分步骤可能未全部完成）。"
          : "本轮自动生产已完成。"
      );
      router.refresh();
      await loadLast();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-8 max-w-3xl">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">生成设置</h2>
        <p className="mt-1 text-sm text-slate-600">设定本批目标数量，系统将自动完成缺口发现、预检与草稿生成。</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700">目标数量</label>
            <input
              type="number"
              min={1}
              max={500}
              value={wanted}
              onChange={(e) => setWanted(Number(e.target.value) || 1)}
              className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runProduction()}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {busy ? "执行中…" : "开始自动生产"}
          </button>
        </div>
        {msg ? <p className="mt-4 text-sm text-emerald-800">{msg}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">本轮结果</h2>
          <button type="button" onClick={() => void loadLast()} className="text-sm text-sky-700 hover:underline">
            刷新数字
          </button>
        </div>
        <LastRunSummary lastRun={lastRun} />
        <p className="mt-4 text-sm text-slate-600">系统会自动筛掉低质量内容，只保留值得发布的文章。</p>
      </section>
    </div>
  );
}

function RowActions({
  row,
  variant,
  onDone
}: {
  row: SeoHubRow;
  variant: "draft" | "scheduled" | "published" | "trash";
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const editHref = `/admin/seo/${row.id}`;
  const publicHref = `/guides/${encodeURIComponent(row.slug)}`;

  async function go(path: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    try {
      await postSeoApi(path, body);
      onDone(okMsg);
    } catch (e) {
      onDone(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (variant === "draft") {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href={editHref} className="text-sky-700 hover:underline text-xs font-medium">
          编辑
        </Link>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-emerald-800 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/publish-now", { articleIds: [row.id] }, "已立即发布")}
        >
          立即发布
        </button>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-red-700 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/move-to-trash", { articleIds: [row.id] }, "已移到回收站")}
        >
          移到回收站
        </button>
      </div>
    );
  }

  if (variant === "scheduled") {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href={editHref} className="text-sky-700 hover:underline text-xs font-medium">
          编辑
        </Link>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-emerald-800 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/publish-now", { articleIds: [row.id] }, "已立即发布")}
        >
          立即发布
        </button>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-slate-700 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/cancel-schedule", { articleIds: [row.id] }, "已取消排期")}
        >
          取消排期
        </button>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-slate-700 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/restore-to-draft", { articleIds: [row.id] }, "已移回草稿")}
        >
          移到草稿
        </button>
      </div>
    );
  }

  if (variant === "published") {
    return (
      <div className="flex flex-wrap gap-2">
        <a href={publicHref} className="text-sky-700 hover:underline text-xs font-medium" target="_blank" rel="noreferrer">
          前台
        </a>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-red-700 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/move-to-trash", { articleIds: [row.id] }, "已移到回收站")}
        >
          移到回收站
        </button>
        <button
          type="button"
          disabled={busy}
          className="text-xs text-slate-700 hover:underline disabled:opacity-50"
          onClick={() => void go("/api/admin/seo/restore-to-draft", { articleIds: [row.id] }, "已放回草稿")}
        >
          放回草稿
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={editHref} className="text-sky-700 hover:underline text-xs font-medium">
        编辑
      </Link>
      <button
        type="button"
        disabled={busy}
        className="text-xs text-sky-800 hover:underline disabled:opacity-50"
        onClick={() => void go("/api/admin/seo/restore-to-draft", { articleIds: [row.id] }, "已恢复到草稿")}
      >
        恢复到草稿
      </button>
    </div>
  );
}

function ArticleTable({
  rows,
  variant,
  selected,
  toggle,
  toggleAllOnPage,
  onBatchMessage,
  pagination,
  paginationTab,
  paginationParam
}: {
  rows: SeoHubRow[];
  variant: "draft" | "scheduled" | "published" | "trash";
  selected: Set<string>;
  toggle: (id: string) => void;
  toggleAllOnPage: () => void;
  onBatchMessage: (m: string) => void;
  pagination: HubPagination | null;
  paginationTab: HubTab;
  paginationParam: "page" | "dpage" | "spage";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  async function batch(
    path: string,
    ids: string[],
    confirmMsg: string | null,
    okMsg: (n: number) => string
  ) {
    if (ids.length === 0) {
      onBatchMessage("请先选择文章。");
      return;
    }
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      await postSeoApi(path, { articleIds: ids });
      onBatchMessage(okMsg(ids.length));
      router.refresh();
    } catch (e) {
      onBatchMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const selectCol = "border border-slate-200 bg-slate-100/90 border-r-2 border-r-slate-300";
  const bulkToggleLabel = allOnPage ? "取消全选" : "全选本页";
  const bulkToggleTitle = allOnPage ? "取消本页全部勾选" : "勾选本页全部文章";

  const thBase =
    "border border-slate-600/30 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-slate-100";

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          disabled={rows.length === 0}
          title={bulkToggleTitle}
          onClick={toggleAllOnPage}
          className={
            rows.length === 0
              ? "cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
              : allOnPage
                ? "rounded-lg border border-amber-500/70 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm hover:bg-amber-100"
                : "rounded-lg border border-sky-600/35 bg-white px-3 py-2 text-xs font-medium text-sky-950 shadow-sm hover:border-sky-600/55 hover:bg-sky-50"
          }
        >
          {bulkToggleLabel}
        </button>
        <span className="max-w-[min(100%,28rem)] text-[11px] leading-snug text-slate-500">
          表头仅作列名；勾选只在下方各行，全选用此按钮。
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-700">
          <tr>
            <th scope="col" className={`${thBase} w-[4.25rem] text-center text-slate-200`}>
              勾选
            </th>
            <th scope="col" className={thBase}>
              标题
            </th>
            <th scope="col" className={thBase}>
              状态
            </th>
            <th scope="col" className={thBase}>
              时间
            </th>
            <th scope="col" className={thBase}>
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={`${selectCol} px-2 py-2 text-center`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-sky-700"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={`勾选文章：${r.title.slice(0, 40)}`}
                />
              </td>
              <td className="border border-slate-200 bg-white px-2 py-2 font-medium text-slate-900">{r.title}</td>
              <td className="border border-slate-200 bg-white px-2 py-2">{friendlySeoListLabel(r)}</td>
              <td className="border border-slate-200 bg-white px-2 py-2 text-slate-600 whitespace-nowrap">
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td className="border border-slate-200 bg-white px-2 py-2">
                <RowActions
                  row={r}
                  variant={variant}
                  onDone={(m) => {
                    onBatchMessage(m);
                    router.refresh();
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {variant === "draft" ? (
          <>
            <button
              type="button"
              disabled={busy}
              className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white"
              onClick={() =>
                void batch(
                  "/api/admin/seo/publish-now",
                  [...selected],
                  `确定立即发布选中的 ${selected.size} 篇？`,
                  (n) => `已发布 ${n} 篇`
                )
              }
            >
              批量立即发布
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-900"
              onClick={() =>
                void batch(
                  "/api/admin/seo/move-to-trash",
                  [...selected],
                  `确定将 ${selected.size} 篇移到回收站？`,
                  (n) => `已移到回收站 ${n} 篇`
                )
              }
            >
              批量移到回收站
            </button>
          </>
        ) : null}
        {variant === "scheduled" ? (
          <>
            <button
              type="button"
              disabled={busy}
              className="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white"
              onClick={() =>
                void batch(
                  "/api/admin/seo/publish-now",
                  [...selected],
                  `确定立即发布选中的 ${selected.size} 篇？`,
                  (n) => `已发布 ${n} 篇`
                )
              }
            >
              批量立即发布
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs"
              onClick={() =>
                void batch("/api/admin/seo/cancel-schedule", [...selected], null, (n) => `已取消排期 ${n} 篇`)
              }
            >
              批量取消排期
            </button>
          </>
        ) : null}
      </div>
      {pagination ? (
        <HubPaginationNav tab={paginationTab} paramName={paginationParam} pagination={pagination} />
      ) : null}
    </div>
  );
}

export function SeoHubClient({
  tab,
  draftRows,
  scheduledRows,
  publishedRows,
  trashRows,
  draftPagination,
  scheduledPagination,
  publishedPagination,
  trashPagination,
  importIdsFromUrl,
  importSummary
}: Props) {
  const router = useRouter();
  const hubSearchParams = useSearchParams();
  const urlIdsParam = hubSearchParams?.get("ids") ?? "";
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedDrafts, setSelectedDrafts] = useState(() => new Set<string>());
  const [selectedScheduled, setSelectedScheduled] = useState(() => new Set<string>());
  const [selectedPub, setSelectedPub] = useState(() => new Set<string>());
  const [selectedTrash, setSelectedTrash] = useState(() => new Set<string>());

  function toggleDraft(id: string) {
    setSelectedDrafts((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleSched(id: string) {
    setSelectedScheduled((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function togglePub(id: string) {
    setSelectedPub((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleTrash(id: string) {
    setSelectedTrash((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAllDraftsPage() {
    const ids = draftRows.map((r) => r.id);
    setSelectedDrafts((prev) => {
      const next = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => next.has(id));
      for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }
  function toggleAllSchedPage() {
    const ids = scheduledRows.map((r) => r.id);
    setSelectedScheduled((prev) => {
      const next = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => next.has(id));
      for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }
  function toggleAllPubPage() {
    const ids = publishedRows.map((r) => r.id);
    setSelectedPub((prev) => {
      const next = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => next.has(id));
      for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }
  function toggleAllTrashPage() {
    const ids = trashRows.map((r) => r.id);
    setSelectedTrash((prev) => {
      const next = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => next.has(id));
      for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  async function emptyTrash() {
    if (!window.confirm("此操作将永久删除回收站中的所有文章，无法恢复，确认继续？")) {
      return;
    }
    setMsg(null);
    try {
      await postSeoApi("/api/admin/seo/empty-trash", { confirm: true });
      setMsg("已清空回收站。");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * 与顶栏「导入/导出」链接、导出 API 使用同一套 ID（按当前标签勾选，导入页可再读地址栏 ?ids=）。
   */
  const exportSelectionIds = useMemo(() => {
    let ids: string[] = [];
    if (tab === "pending") {
      ids = [...new Set([...selectedDrafts, ...selectedScheduled])];
    } else if (tab === "published") {
      ids = [...selectedPub];
    } else if (tab === "trash") {
      ids = [...selectedTrash];
    } else if (tab === "import") {
      if (urlIdsParam.trim()) {
        ids = parseIdsParam(urlIdsParam);
      } else {
        ids = [
          ...new Set([
            ...selectedDrafts,
            ...selectedScheduled,
            ...selectedPub,
            ...selectedTrash
          ])
        ];
      }
    } else {
      ids = [];
    }
    return ids;
  }, [tab, urlIdsParam, selectedDrafts, selectedScheduled, selectedPub, selectedTrash]);

  const importTabHref = useMemo(() => {
    const p = new URLSearchParams();
    p.set("tab", "import");
    if (exportSelectionIds.length) p.set("ids", exportSelectionIds.join(","));
    return `/admin/seo?${p.toString()}`;
  }, [exportSelectionIds]);

  const clearExportSelectionsAfterDownload = useCallback(() => {
    setSelectedDrafts(() => new Set());
    setSelectedScheduled(() => new Set());
    setSelectedPub(() => new Set());
    setSelectedTrash(() => new Set());
    router.replace("/admin/seo?tab=import");
  }, [router]);

  return (
    <div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "import" ? importTabHref : `/admin/seo?tab=${t.key}`}
            className={
              tab === t.key
                ? "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                : "rounded-md px-4 py-2 text-sm text-sky-800 hover:bg-slate-100"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {msg ? <p className="mt-4 text-sm text-slate-700">{msg}</p> : null}

      {tab === "auto" ? <AutoTab /> : null}

      {tab === "import" ? (
        <div className="mt-8 max-w-xl space-y-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">导入 / 导出 CSV</h2>
            <p className="mt-1 text-sm text-slate-600">
              <strong>上传 CSV 入库</strong>用下面「上传并导入」；<strong>下载已有文章</strong>用下方「导出所选」。两件事无关，不要混用。
            </p>
          </div>

          <section>
            <h3 className="text-base font-medium text-slate-900">导入（上传 CSV）</h3>
            <p className="mt-1 text-sm text-slate-600">
              CSV 列：<code className="text-xs">title,slug,description,content</code>（首行为表头）。过闸后以{" "}
              <strong>published</strong> 写入。
            </p>
            {importSummary ? (
              <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                成功：<strong>{importSummary.inserted}</strong>，失败：<strong>{importSummary.failed}</strong>
                {importSummary.fixed > 0 ? (
                  <>
                    ，自动修正：<strong>{importSummary.fixed}</strong> 处
                  </>
                ) : null}
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

          <section className="border-t border-slate-200 pt-8">
            <h3 className="text-base font-medium text-slate-900">导出（下载已有文章）</h3>
            <p className="mt-1 text-sm text-slate-600">
              在<strong>当前标签页</strong>（如仅回收站、仅待发布里的草稿/排期等）勾选后，点顶部「导入/导出 CSV」会带上<strong>该标签</strong>所选；或手动加{" "}
              <code className="text-xs">?ids=</code>。每篇一个 CSV，多篇为 ZIP。也可{" "}
              <Link href="/admin/seo/import-export" className="text-sky-700 hover:underline">
                独立页
              </Link>
              。
            </p>
            <ImportExportClient
              idsFromUrl={importIdsFromUrl}
              selectedIdsFromHub={exportSelectionIds}
              onExportSuccess={clearExportSelectionsAfterDownload}
              useSessionStorageFallback={false}
            />
          </section>
        </div>
      ) : null}

      {tab === "pending" ? (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">草稿区</h2>
            <p className="text-sm text-slate-600 mt-1">尚未排期的文章，可编辑、立即发布或移到回收站。</p>
            {draftPagination && draftPagination.total === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无草稿。</p>
            ) : (
              <ArticleTable
                rows={draftRows}
                variant="draft"
                selected={selectedDrafts}
                toggle={toggleDraft}
                toggleAllOnPage={toggleAllDraftsPage}
                onBatchMessage={setMsg}
                pagination={draftPagination}
                paginationTab="pending"
                paginationParam="dpage"
              />
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">已排期区</h2>
            <p className="text-sm text-slate-600 mt-1">已到排期队列的文章，可立即发布或改回草稿。</p>
            {scheduledPagination && scheduledPagination.total === 0 ? (
              <p className="mt-4 text-sm text-slate-500">暂无已排期。</p>
            ) : (
              <ArticleTable
                rows={scheduledRows}
                variant="scheduled"
                selected={selectedScheduled}
                toggle={toggleSched}
                toggleAllOnPage={toggleAllSchedPage}
                onBatchMessage={setMsg}
                pagination={scheduledPagination}
                paginationTab="pending"
                paginationParam="spage"
              />
            )}
          </section>
        </div>
      ) : null}

      {tab === "published" ? (
        <div className="mt-8">
          {publishedPagination && publishedPagination.total === 0 ? (
            <p className="text-sm text-slate-500">暂无已发布内容。</p>
          ) : (
            <ArticleTable
              rows={publishedRows}
              variant="published"
              selected={selectedPub}
              toggle={togglePub}
              toggleAllOnPage={toggleAllPubPage}
              onBatchMessage={setMsg}
              pagination={publishedPagination}
              paginationTab="published"
              paginationParam="page"
            />
          )}
        </div>
      ) : null}

      {tab === "trash" ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => void emptyTrash()}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
          >
            清空回收站
          </button>
          {trashPagination && trashPagination.total === 0 ? (
            <p className="mt-6 text-sm text-slate-500">回收站为空。</p>
          ) : (
            <div className="mt-6">
              <ArticleTable
                rows={trashRows}
                variant="trash"
                selected={selectedTrash}
                toggle={toggleTrash}
                toggleAllOnPage={toggleAllTrashPage}
                onBatchMessage={setMsg}
                pagination={trashPagination}
                paginationTab="trash"
                paginationParam="page"
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
