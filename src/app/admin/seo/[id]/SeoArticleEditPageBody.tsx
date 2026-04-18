"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SiteFooter } from "../../../_components/SiteFooter";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SeoArticleEditForm } from "../SeoArticleEditForm";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  cover_image: string | null;
  cover_image_alt: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted: boolean | null;
  publish_scheduled_at: string | null;
  publish_queue_source: string | null;
};

export function SeoArticleEditPageBody({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [row, setRow] = useState<ArticleRow | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errDetail, setErrDetail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    setErrDetail(null);
    try {
      const res = await fetch(`/api/admin/seo-articles/${encodeURIComponent(articleId)}`, {
        credentials: "same-origin",
        cache: "no-store"
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        article?: ArticleRow;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !j?.ok || !j.article) {
        setErrDetail(j?.detail ?? j?.error ?? `HTTP ${res.status}`);
        setPhase("error");
        return;
      }
      const a = j.article;
      if (a.status === "published" && a.deleted !== true) {
        router.replace("/admin/seo?tab=published");
        return;
      }
      setRow(a);
      setPhase("ready");
    } catch (e) {
      setErrDetail(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }, [articleId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (phase === "loading") {
    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 container py-12 max-w-3xl">
          <p className="text-sm text-slate-600">正在加载文章…</p>
        </div>
        <SiteFooter />
      </main>
    );
  }

  if (phase === "error" || !row) {
    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 container py-12 max-w-2xl">
          <h1 className="text-xl font-semibold">无法加载这篇文章</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            接口未返回数据。请确认本机已配置 <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> 或在 Supabase
            执行 <code className="text-xs">0048_seo_articles_admin_rls.sql</code> 后，用管理员账号登录再试。
          </p>
          {errDetail ? (
            <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-mono text-amber-950 break-all">
              {errDetail}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-slate-500">文章 ID：{articleId}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
              onClick={() => void load()}
            >
              重试
            </button>
            <Link href="/admin/seo?tab=pending" className="text-sky-700 hover:underline text-sm">
              ← 返回 SEO 内容后台
            </Link>
          </div>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-3xl">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/seo" className="text-sky-600 hover:underline">
            ← SEO 内容中心
          </Link>
          <Link href="/admin/seo?tab=pending" className="text-sky-600 hover:underline">
            待发布
          </Link>
          {row.deleted ? (
            <Link href="/admin/seo?tab=trash" className="text-amber-800 hover:underline">
              回收站
            </Link>
          ) : null}
        </div>
        <h1 className="mt-4 text-xl font-semibold">{row.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Slug：<code className="text-xs">{row.slug}</code> · 状态：<strong>{row.status}</strong>
          {row.deleted ? (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-900 text-xs">已入回收站</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          创建 {new Date(row.created_at).toLocaleString()} · 更新 {new Date(row.updated_at).toLocaleString()}
        </p>

        <SeoArticleEditForm
          articleId={row.id}
          initialTitle={row.title}
          initialSlug={row.slug}
          initialDescription={row.description ?? ""}
          initialContent={row.content}
          initialCoverImage={row.cover_image ?? ""}
          initialCoverImageAlt={row.cover_image_alt ?? ""}
          status={row.status}
          deleted={row.deleted === true}
          publishScheduledAt={row.publish_scheduled_at}
          publishQueueSource={row.publish_queue_source}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
