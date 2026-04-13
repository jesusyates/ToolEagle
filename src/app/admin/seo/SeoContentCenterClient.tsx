"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type SeoListRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
};

type TabKey =
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

type Props = {
  tab: TabKey;
  rows: SeoListRow[];
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "drafts", label: "草稿" },
  { key: "published", label: "已发布" },
  { key: "trash", label: "回收站" },
  { key: "new", label: "新建文章" },
  { key: "import", label: "导入 / 导出" },
  { key: "preflight", label: "预检" },
  { key: "seeds", label: "应用数据源" },
  { key: "scenarios", label: "选题生成" },
  { key: "auto", label: "自动生成" },
  { key: "joblog", label: "任务记录" }
];

async function downloadExport(ids: string[]) {
  const res = await fetch("/api/admin/seo-articles/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });
  if (!res.ok) throw new Error(`export ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seo-articles-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function SeoContentCenterClient({ tab, rows }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  async function runBatch(action: "soft_delete" | "restore" | "publish") {
    const ids = [...selected];
    if (ids.length === 0) {
      setMsg("请至少选择一行。");
      return;
    }
    if (action === "soft_delete" && !window.confirm(`确定软删除 ${ids.length} 篇文章？`)) return;
    if (action === "publish" && !window.confirm(`确定发布 ${ids.length} 篇草稿？（非草稿与回收站条目将跳过）`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-articles/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids })
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        applied?: number;
        skipped?: string[];
        error?: string;
      };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(`完成。已处理：${j.applied ?? 0}。跳过：${(j.skipped ?? []).length}。`);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportSelected() {
    const ids = [...selected];
    if (ids.length === 0) {
      setMsg("请选择要导出的行。");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await downloadExport(ids);
      setMsg(`已导出 ${ids.length} 行。`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const showBatch = tab === "drafts" || tab === "published" || tab === "trash";

  return (
    <div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/seo?tab=${t.key}`}
            className={
              tab === t.key
                ? "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-3 py-1.5 text-sm text-sky-700 hover:bg-slate-100"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {showBatch ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            disabled={busy}
            onClick={() => toggleAll()}
            className="rounded border border-slate-300 px-2 py-1 text-slate-800"
          >
            {allSelected ? "清除选择" : "全选"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportSelected()}
            className="rounded border border-slate-300 px-2 py-1 text-slate-800"
          >
            导出所选（CSV）
          </button>
          {tab === "drafts" || tab === "published" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runBatch("soft_delete")}
              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-red-900"
            >
              软删除所选
            </button>
          ) : null}
          {tab === "drafts" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runBatch("publish")}
              className="rounded bg-green-700 px-2 py-1 text-white"
            >
              发布所选（仅草稿）
            </button>
          ) : null}
          {tab === "trash" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runBatch("restore")}
              className="rounded bg-sky-700 px-2 py-1 text-white"
            >
              恢复所选
            </button>
          ) : null}
          {msg ? <span className="text-slate-600">{msg}</span> : null}
        </div>
      ) : null}

      {tab === "drafts" || tab === "published" || tab === "trash" ? (
        rows.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">暂无数据。</p>
        ) : (
          <table className="mt-6 w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-2 py-2 w-8" />
                <th className="border border-slate-200 px-2 py-2 text-left">标题</th>
                <th className="border border-slate-200 px-2 py-2 text-left">Slug</th>
                <th className="border border-slate-200 px-2 py-2 text-left">状态</th>
                <th className="border border-slate-200 px-2 py-2 text-left">创建时间</th>
                <th className="border border-slate-200 px-2 py-2 text-left">导出</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="border border-slate-200 px-2 py-2">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    <Link href={`/admin/seo/${r.id}`} className="text-sky-700 hover:underline font-medium">
                      {r.title}
                    </Link>
                  </td>
                  <td className="border border-slate-200 px-2 py-2 font-mono text-xs">{r.slug}</td>
                  <td className="border border-slate-200 px-2 py-2">{r.status}</td>
                  <td className="border border-slate-200 px-2 py-2 text-slate-600">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    <button
                      type="button"
                      className="text-sky-600 hover:underline"
                      onClick={() => void downloadExport([r.id]).catch(() => {})}
                    >
                      导出CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
    </div>
  );
}
