"use client";

import {
  parseContentDispositionFilename,
  triggerAttachmentDownload
} from "@/lib/admin/client-attachment-download";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function parseIds(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  return [...new Set(String(raw).split(",").map((s) => s.trim()).filter(Boolean))];
}

const STORAGE_KEY = "seo-import-export-ids";

type IdSource = "url" | "session" | "hub" | "none";

export function ImportExportClient({
  idsFromUrl,
  /** When set (e.g. SEO hub), exclusively drives export list — stays in sync with table checkboxes. */
  selectedIdsFromHub,
  /** After a successful download: clear hub checkboxes / URL (hub passes handler). */
  onExportSuccess,
  /** When false (e.g. SEO hub tab), only URL `?ids=` counts — no sessionStorage auto-fill (avoids confusing “3 selected”). */
  useSessionStorageFallback = true
}: {
  idsFromUrl: string;
  selectedIdsFromHub?: string[];
  onExportSuccess?: () => void;
  useSessionStorageFallback?: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mergedFromUrl = useMemo(() => {
    if (selectedIdsFromHub !== undefined) {
      return [...new Set(selectedIdsFromHub.map((id) => String(id).trim()).filter(Boolean))];
    }
    const fromServer = parseIds(idsFromUrl);
    if (fromServer.length) return fromServer;
    return parseIds(searchParams?.get("ids"));
  }, [selectedIdsFromHub, idsFromUrl, searchParams]);

  const [ids, setIds] = useState<string[]>(mergedFromUrl);
  const [idSource, setIdSource] = useState<IdSource>("none");

  useEffect(() => {
    setIds(mergedFromUrl);
    if (selectedIdsFromHub !== undefined) {
      setIdSource(mergedFromUrl.length > 0 ? "hub" : "none");
    } else {
      setIdSource(mergedFromUrl.length > 0 ? "url" : "none");
    }
  }, [mergedFromUrl, selectedIdsFromHub]);

  useEffect(() => {
    if (selectedIdsFromHub !== undefined) return;
    if (!useSessionStorageFallback) return;
    if (mergedFromUrl.length > 0) return;
    try {
      const st = parseIds(sessionStorage.getItem(STORAGE_KEY));
      if (st.length) {
        setIds(st);
        setIdSource("session");
      }
    } catch {
      /* ignore */
    }
  }, [mergedFromUrl, useSessionStorageFallback, selectedIdsFromHub]);

  function clearSelection() {
    setIds([]);
    setIdSource("none");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setMsg(null);
  }

  async function handleExportSelected() {
    if (ids.length === 0) {
      setMsg("上传 CSV 请用上方「上传并导入」。此处按钮只用于把已有文章下载为 CSV/ZIP。");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
      const res = await fetch("/api/admin/seo-articles/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unique })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setMsg(t || `导出失败 HTTP ${res.status}`);
        return;
      }
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (ct.includes("application/json")) {
        setMsg("导出失败：服务器返回了 JSON。");
        return;
      }
      const cd = res.headers.get("content-disposition");
      const isZip = ct.includes("application/zip");
      const fallback = isZip ? `seo-articles-${unique.length}-export.zip` : "export.csv";
      const filename = parseContentDispositionFilename(cd, fallback);
      const blob = await res.blob();
      triggerAttachmentDownload(blob, filename);
      setIds([]);
      setIdSource("none");
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      onExportSuccess?.();
      if (selectedIdsFromHub === undefined) {
        const p = new URLSearchParams(searchParams?.toString() ?? "");
        if (p.has("ids")) {
          p.delete("ids");
          const qs = p.toString();
          const base = pathname ?? "";
          router.replace(qs ? `${base}?${qs}` : base || "/");
        }
      }
      setMsg(
        isZip
          ? `已下载 ZIP，内含 ${unique.length} 个独立 CSV（与原列表导出一致）。`
          : `已下载单篇 CSV：${filename}`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const sourceHint =
    idSource === "hub"
      ? "来源：当前后台各标签勾选（与导出一致）"
      : idSource === "url"
        ? "来源：地址栏或本页链接中的 ?ids="
        : idSource === "session"
          ? "来源：浏览器本地缓存（旧版列表曾写入 seo-import-export-ids，与当前列表勾选无关）"
          : null;

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">
        导出所选：<strong>{ids.length}</strong> 篇
        {ids.length > 0 && sourceHint ? (
          <span className="ml-2 block mt-1 text-xs text-slate-500">{sourceHint}</span>
        ) : null}
        {ids.length === 0 ? (
          <span className="ml-2 text-xs text-slate-500">
            需文章 ID：在其它标签勾选后点顶部「导入/导出」进入本页（会自动带 ?ids），或手动加 <code className="text-xs">?ids=…</code>。CSV 入库请用上方「上传并导入」。
          </span>
        ) : null}
      </p>
      {ids.length > 0 ? (
        <button
          type="button"
          onClick={clearSelection}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50"
        >
          清空所选
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleExportSelected()}
        className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "导出中…" : "下载所选文章（CSV / ZIP）"}
      </button>
      {msg ? <p className="text-sm text-slate-800">{msg}</p> : null}
    </div>
  );
}
