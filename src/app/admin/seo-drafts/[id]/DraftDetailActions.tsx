"use client";

import type { PublishReadinessResult } from "@/lib/seo/publish-readiness";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  articleId: string;
  status: string;
  slug: string;
  deleted: boolean;
  /** After successful soft-delete, navigate here (default legacy list). */
  afterDeleteHref?: string;
  /** When set, Publish is blocked or requires confirmation per readiness level. */
  publishReadiness?: PublishReadinessResult | null;
};

export function DraftDetailActions({
  articleId,
  status,
  slug,
  deleted,
  afterDeleteHref,
  publishReadiness
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function publish() {
    if (publishReadiness?.level === "block") {
      setMsg("无法发布：请先处理发布就绪度中的阻塞项。");
      return;
    }
    if (publishReadiness?.level === "review") {
      const ok = window.confirm(
        `发布就绪度 ${publishReadiness.score}/100，仍有问题。确定仍要发布？`
      );
      if (!ok) return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-drafts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
      setMsg("已发布。公开站：/guides/" + slug);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-drafts/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
      setMsg("已改回草稿。");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function softDelete() {
    if (!window.confirm("软删除此文？可从回收站恢复；slug 仍保留。")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-drafts/soft-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.push(afterDeleteHref ?? "/admin/seo?tab=drafts");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-drafts/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
      setMsg("已恢复，主列表可见。");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {!deleted && status === "draft" ? (
        <button
          type="button"
          disabled={busy || publishReadiness?.level === "block"}
          title={
            publishReadiness?.level === "block"
              ? publishReadiness.blockReasons.join("; ") || "发布就绪度未通过"
              : undefined
          }
          onClick={() => void publish()}
          className="rounded bg-green-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "处理中…" : "发布"}
        </button>
      ) : null}
      {!deleted && status === "published" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void unpublish()}
          className="rounded border border-slate-400 px-4 py-2 text-sm text-slate-800 disabled:opacity-50"
        >
          {busy ? "处理中…" : "取消发布"}
        </button>
      ) : null}
      {!deleted && status === "published" ? (
        <a
          href={`/guides/${encodeURIComponent(slug)}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-sky-600 hover:underline"
        >
          打开公开页 /guides/{slug}
        </a>
      ) : null}
      {!deleted ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void softDelete()}
          className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-900 disabled:opacity-50"
        >
          {busy ? "处理中…" : "删除"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void restore()}
          className="rounded bg-sky-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? "处理中…" : "恢复"}
        </button>
      )}
      {msg ? <span className="text-sm text-slate-700">{msg}</span> : null}
    </div>
  );
}
