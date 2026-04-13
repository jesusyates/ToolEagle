"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewArticleForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const content = String(fd.get("content") ?? "");
    const status = String(fd.get("status") ?? "draft");
    if (!title || !slug) {
      setMsg("请填写标题与 Slug。");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-articles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, description, content, status })
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !j?.ok || !j.id) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      router.push(`/admin/seo/${j.id}`);
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">标题</label>
        <input name="title" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Slug</label>
        <input name="slug" required className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">描述</label>
        <input name="description" className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">正文</label>
        <textarea name="content" rows={12} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">初始状态</label>
        <select name="status" className="mt-1 rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="draft">草稿 (draft)</option>
          <option value="published">已发布 (published)</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? "创建中…" : "创建"}
      </button>
      {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
    </form>
  );
}
