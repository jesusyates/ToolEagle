"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lightbulb, MessageSquareText, BookOpen } from "lucide-react";

const TYPES = [
  { value: "prompt", label: "Prompt", icon: MessageSquareText },
  { value: "idea", label: "Idea", icon: Lightbulb },
  { value: "guide", label: "Guide", icon: BookOpen }
] as const;

const TOPIC_SUGGESTIONS = [
  "tiktok",
  "youtube",
  "instagram",
  "fitness",
  "beauty",
  "food",
  "travel",
  "business",
  "gaming",
  "education",
  "lifestyle",
  "marketing"
];

export function CreatePostClient() {
  const [type, setType] = useState<"prompt" | "idea" | "guide">("prompt");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [tools, setTools] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ url: string; slug: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const toolsArr = tools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/creator-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: content.trim(),
          topic: topic.trim() || undefined,
          tags: tagsArr,
          tools: toolsArr
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }

      setSuccess({ url: data.post.url, slug: data.post.slug });
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="container pt-10 pb-16 max-w-3xl">
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-900">Post saved as draft</h2>
          <p className="mt-2 text-emerald-700">
            Your post will be reviewed before it appears on the community feed.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="inline-flex rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Create another
            </button>
            <Link href="/community" className="inline-flex text-sm font-medium text-emerald-700 hover:underline">
              Community feed
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container pt-10 pb-16 max-w-3xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Community</p>
            <h1 className="text-2xl font-semibold text-slate-900">Publish content</h1>
            <p className="text-sm text-slate-600">
              Share a prompt, idea, or guide. Posts are saved as draft until approved.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <div className="flex gap-3">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                        type === t.value
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Viral TikTok caption prompt for fitness"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                placeholder="Write your prompt, idea, or guide. Plain text or Markdown."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
                Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. tiktok, fitness, marketing"
                list="topic-suggestions"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
              <datalist id="topic-suggestions">
                {TOPIC_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
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
                placeholder="e.g. viral, captions, hooks"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            <div>
              <label htmlFor="tools" className="block text-sm font-medium text-slate-700 mb-1">
                Recommended tools (comma-separated slugs)
              </label>
              <input
                id="tools"
                type="text"
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                placeholder="e.g. tiktok-caption-generator, hashtag-generator"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save draft"}
              </button>
              <Link href="/community" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </Link>
            </div>
          </form>
        </section>
  );
}
