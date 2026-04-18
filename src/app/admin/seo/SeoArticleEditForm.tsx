"use client";

import {
  parseContentDispositionFilename,
  triggerAttachmentDownload
} from "@/lib/admin/client-attachment-download";
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
  initialCoverImage?: string;
  initialCoverImageAlt?: string;
  status: string;
  deleted: boolean;
  publishScheduledAt?: string | null;
  publishQueueSource?: string | null;
};

export function SeoArticleEditForm({
  articleId,
  initialTitle,
  initialSlug,
  initialDescription,
  initialContent,
  initialCoverImage = "",
  initialCoverImageAlt = "",
  status,
  deleted,
  publishScheduledAt = null,
  publishQueueSource = null
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [coverImageAlt, setCoverImageAlt] = useState(initialCoverImageAlt);
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
          content,
          cover_image: coverImage.trim(),
          cover_image_alt: coverImageAlt.trim()
        })
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        slug?: string;
      };
      if (!res.ok || !j?.ok) {
        const hint = [j?.error, j?.detail].filter(Boolean).join(" — ");
        setMsg(hint || `HTTP ${res.status}`);
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

  const scheduledIso = publishScheduledAt?.trim() || null;
  const queueSrc = publishQueueSource?.trim() || null;

  return (
    <div className="mt-6 space-y-6">
      {status === "scheduled" && scheduledIso ? (
        <div className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          <strong>已排期发布</strong>（UTC）：{" "}
          <code className="text-xs">{scheduledIso}</code>
          {queueSrc ? (
            <>
              {" "}
              · 来源 <code className="text-xs">{queueSrc}</code>
            </>
          ) : null}
        </div>
      ) : null}
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
          <label className="block font-medium text-slate-800">封面图 URL</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://… 或 /site/path/to/image.jpg"
          />
          <p className="mt-1 text-xs text-slate-500">留空表示不展示封面。仅支持 http(s) 或以 / 开头的站内路径。</p>
        </div>
        <div>
          <label className="block font-medium text-slate-800">封面图 alt 文案</label>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            value={coverImageAlt}
            onChange={(e) => setCoverImageAlt(e.target.value)}
            placeholder="简明描述图片内容（利于无障碍与 SEO）"
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
            onClick={() => void downloadOne(articleId, slug)}
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
        afterDeleteHref="/admin/seo?tab=pending"
        publishReadiness={
          (status === "draft" || status === "scheduled") && !deleted ? publishReadiness : null
        }
      />
    </div>
  );
}

async function downloadOne(id: string, slug: string) {
  const safe = (slug || "article").trim().toLowerCase().replace(/[^a-z0-9\-]+/g, "-").replace(/-+/g, "-") || "article";
  const fallback = `${safe}.csv`;
  const res = await fetch("/api/admin/seo-articles/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [id] })
  });
  if (!res.ok) return;
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("application/json")) return;
  const cd = res.headers.get("content-disposition");
  const filename = parseContentDispositionFilename(cd, fallback);
  const blob = await res.blob();
  triggerAttachmentDownload(blob, filename);
}
