"use client";

import { useState } from "react";
import { ZhReturnVisitBlock } from "@/components/zh/ZhReturnVisitBlock";

function getResourcePromise(keyword?: string): string {
  const isMonetization = keyword && /赚钱|变现|引流|make money|monetization/i.test(keyword);
  if (isMonetization) return "50 爆款选题 + 20 病毒钩子 + 变现清单";
  return "50 爆款选题 + 20 病毒钩子 + 创作技巧";
}

type Props = {
  keyword?: string;
  onSuccess?: () => void;
  /** V85: Compact inline style for high-intent/share/tool pages */
  inline?: boolean;
};

export function ZhCtaCaptureBlock({ keyword, onSuccess, inline }: Props) {
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

  const resourcePromise = getResourcePromise(keyword);

  if (inline) {
    return (
      <section className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4" aria-label="免费资源">
        <h3 className="text-sm font-semibold text-slate-900">免费获取 {resourcePromise}</h3>
        {status === "success" ? (
          <>
            <p className="mt-2 text-sm text-green-700">✓ 已发送，请查收邮箱！</p>
            <ZhReturnVisitBlock context="email_success" />
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={status === "loading"} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              {status === "loading" ? "…" : "获取"}
            </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6"
      aria-label="获取更多爆款内容"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        🚀 获取更多爆款内容
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        输入邮箱，免费获取：{resourcePromise}
      </p>
      {status === "success" ? (
        <>
          <p className="mt-4 text-sm font-medium text-green-700">✓ 已发送，请查收邮箱！</p>
          <ZhReturnVisitBlock context="email_success" />
        </>
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
