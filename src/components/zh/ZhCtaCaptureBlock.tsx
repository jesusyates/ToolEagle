"use client";

import { useState } from "react";

type Props = {
  keyword?: string;
  onSuccess?: () => void;
};

export function ZhCtaCaptureBlock({ keyword, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/zh/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), keyword: keyword || null })
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
        onSuccess?.();
        // Track email_submit
        fetch("/api/zh/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "email_submit",
            event_data: { keyword: keyword || null }
          })
        }).catch(() => {});
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6"
      aria-label="获取更多爆款内容"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        🚀 获取更多爆款内容
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        输入邮箱，免费获取爆款文案模板、钩子库和创作技巧。
      </p>
      {status === "success" ? (
        <p className="mt-4 text-sm font-medium text-green-700">✓ 已发送，请查收邮箱！</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === "loading"}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60"
          >
            {status === "loading" ? "提交中…" : "获取免费资源"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">提交失败，请稍后重试。</p>
      )}
    </section>
  );
}
