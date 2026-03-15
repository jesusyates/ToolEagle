"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "TikTok",
  "YouTube",
  "Instagram",
  "Creator Tips",
  "AI Tools"
];

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

}

export function NewPostClient({ userEmail }: { userEmail: string }) {
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
        setError(data.error ?? "Failed to save");
        return;
      }

      setSuccess(true);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="flex-1">
        <section className="container pt-10 pb-16 max-w-3xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Creator Blog
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Write a new post
            </h1>
            <p className="text-sm text-slate-600">
              All posts are saved as draft. Admin approval required before they appear on the blog.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="e.g. Best TikTok Captions 2026"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
                Slug (URL) *
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. best-tiktok-captions-2026"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                Will appear as /blog/your-slug
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Meta description (for SEO)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for search results"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                Content (Markdown) *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={16}
                placeholder="Write your content in Markdown. Use ## for headings, **bold**, [links](url)..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Supports Markdown: headings, bold, links, lists, code blocks
              </p>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              >
                <option value="">Select...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. tiktok, captions, viral"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="recommendedTools" className="block text-sm font-medium text-slate-700 mb-1">
                Recommended tools (comma-separated slugs)
              </label>
              <input
                id="recommendedTools"
                type="text"
                value={recommendedTools}
                onChange={(e) => setRecommendedTools(e.target.value)}
                placeholder="e.g. tiktok-caption-generator, hashtag-generator"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-600">Saved successfully!</p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save draft"}
              </button>
            </div>
          </form>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
