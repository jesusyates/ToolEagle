"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  keyword?: string;
  onSuccess?: () => void;
};

export function ZhExitIntentPopup({ keyword, onSuccess }: Props) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [dismissed, setDismissed] = useState(false);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    if (dismissed || visible) return;
    // Desktop: mouse leaves viewport top
    if (e.clientY <= 0) {
      setVisible(true);
    }
  }, [dismissed, visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;

    document.addEventListener("mouseout", handleExitIntent);
    return () => document.removeEventListener("mouseout", handleExitIntent);
  }, [handleExitIntent]);

  const handleClose = () => {
    setVisible(false);
    setDismissed(true);
  };

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
            event_data: { source: "exit_intent", keyword: keyword || null }
          })
        }).catch(() => {});
        setTimeout(handleClose, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="关闭"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-slate-900">等一下！领取免费爆款内容模板</h3>
        <p className="mt-2 text-sm text-slate-600">
          输入邮箱，立即获取 5 条爆款内容模板 + 1 个工具推荐
        </p>
        {status === "success" ? (
          <p className="mt-4 text-sm font-medium text-green-600">✓ 已发送，请查收邮箱！</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {status === "loading" ? "提交中…" : "免费领取"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-2 text-sm text-red-600">提交失败，请稍后重试。</p>
        )}
      </div>
    </div>
  );
}
