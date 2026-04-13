"use client";

import { computePublishReadiness } from "@/lib/seo/publish-readiness";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DraftDetailActions } from "../seo-drafts/[id]/DraftDetailActions";
import { PublishReadinessPanel } from "./PublishReadinessPanel";

type Props = {
  articleId: string;
  initialTitle: string;
  initialSlug: string;
  initialDescription: string;
  initialContent: string;
  status: string;
  deleted: boolean;
};

export function SeoArticleEditForm({
  articleId,
  initialTitle,
  initialSlug,
  initialDescription,
  initialContent,
  status,
  deleted
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const publishReadiness = useMemo(
    () => computePublishReadiness({ title, slug, description, content }),
    [title, slug, description, content]
  );

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-articles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: articleId,
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          content
        })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; slug?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      if (j.slug) setSlug(j.slug);
      setMsg("已保存。");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4 text-sm">
        <div>
          <label className="block font-medium text-slate-800">标题</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium text-slate-800">Slug（路径）</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium text-slate-800">描述</label>
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium text-slate-800">正文</label>
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? "保存中…" : "保存更改"}
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-slate-800"
            onClick={() => void downloadOne(articleId)}
          >
            导出CSV（本文）
          </button>
          {msg ? <span className="text-slate-700">{msg}</span> : null}
        </div>
      </div>

      <PublishReadinessPanel result={publishReadiness} />
      <DraftDetailActions
        articleId={articleId}
        status={status}
        slug={slug}
        deleted={deleted}
        afterDeleteHref="/admin/seo?tab=drafts"
        publishReadiness={status === "draft" && !deleted ? publishReadiness : null}
      />
    </div>
  );
}

async function downloadOne(id: string) {
  const res = await fetch("/api/admin/seo-articles/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [id] })
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seo-article.csv";
  a.click();
  URL.revokeObjectURL(url);
}
