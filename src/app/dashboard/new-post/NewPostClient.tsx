"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { ArrowLeft } from "lucide-react";

const CATEGORIES_EN = ["TikTok", "YouTube", "Instagram", "Creator Tips", "AI Tools"];
const CATEGORIES_ZH = ["抖音", "小红书", "快手", "创作技巧", "AI 工具"];

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function NewPostClient({
  userEmail: _userEmail,
  variant = "en"
}: {
  userEmail: string;
  variant?: "en" | "zh";
}) {
  const isZh = variant === "zh";
  const dash = isZh ? "/zh/dashboard" : "/dashboard";
  const categories = isZh ? CATEGORIES_ZH : CATEGORIES_EN;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [recommendedTools, setRecommendedTools] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slug || slug === slugFromTitle(title)) {
      setSlug(slugFromTitle(v));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const toolsArr = recommendedTools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugFromTitle(title),
          content,
          description: description || title,
          status: "draft",
          category: category || undefined,
          tags: tagsArr,
          recommendedTools: toolsArr
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? (isZh ? "保存失败" : "Failed to save"));
        return;
      }

      setSuccess(true);
      window.location.href = dash;
    } catch (err) {
      setError(isZh ? "保存失败，请稍后重试。" : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isZh ? <SiteHeader /> : null}
      <div className="flex-1">
        <section className="container pt-10 pb-16 max-w-3xl">
          <Link
            href={dash}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回工作台" : "Back to dashboard"}
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              {isZh ? "创作者博客" : "Creator Blog"}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isZh ? "写文章" : "Write a new post"}
            </h1>
            <p className="text-sm text-slate-600">
              {isZh
                ? "保存为草稿；管理员审核通过后才会出现在博客。"
                : "All posts are saved as draft. Admin approval required before they appear on the blog."}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "标题" : "Title"} *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder={
                  isZh ? "例如：抖音文案怎么写才有人看" : "e.g. Best TikTok Captions 2026"
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "链接别名（英文，用于 URL）" : "Slug (URL)"} *
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={isZh ? "例如：douyin-wenan-2026" : "e.g. best-tiktok-captions-2026"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                {isZh ? "将显示为 /blog/你的别名" : "Will appear as /blog/your-slug"}
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "摘要（SEO）" : "Meta description (for SEO)"}
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isZh ? "用于搜索结果中的简短描述" : "Short description for search results"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "正文（Markdown）" : "Content (Markdown)"} *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={16}
                placeholder={
                  isZh
                    ? "使用 Markdown：## 标题、**粗体**、[链接](url)…"
                    : "Write your content in Markdown. Use ## for headings, **bold**, [links](url)..."
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                {isZh ? "支持 Markdown：标题、粗体、链接、列表、代码块" : "Supports Markdown: headings, bold, links, lists, code blocks"}
              </p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "分类" : "Category"}
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              >
                <option value="">{isZh ? "请选择…" : "Select..."}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "标签（逗号分隔）" : "Tags (comma-separated)"}
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={isZh ? "例如：抖音,文案,涨粉" : "e.g. tiktok, captions, viral"}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="recommendedTools" className="block text-sm font-medium text-slate-700 mb-1">
                {isZh ? "推荐工具（slug，逗号分隔）" : "Recommended tools (comma-separated slugs)"}
              </label>
              <input
                id="recommendedTools"
                type="text"
                value={recommendedTools}
                onChange={(e) => setRecommendedTools(e.target.value)}
                placeholder={
                  isZh
                    ? "例如：douyin-caption-generator, hook-generator"
                    : "e.g. tiktok-caption-generator, hashtag-generator"
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-600">{isZh ? "已保存" : "Saved successfully!"}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {isSubmitting ? (isZh ? "保存中…" : "Saving...") : isZh ? "保存草稿" : "Save draft"}
              </button>
            </div>
          </form>
        </section>
      </div>
      {!isZh ? <SiteFooter /> : null}
    </>
  );
}
