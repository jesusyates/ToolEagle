"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSupportClientAnalyticsId } from "@/lib/supporter/client-analytics-id";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedback/constants";
import { CONTACT_EMAIL } from "@/config/site";
import { SupportContactModal } from "@/components/support/SupportContactModal";

export type FeedbackContextPayload = {
  route: string;
  market: string;
  locale: string;
  toolType?: string | null;
  userPlan?: string | null;
  sourcePage?: string;
};

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  context: FeedbackContextPayload;
  localeUi: "en" | "zh";
};

const LABELS_ZH: Record<FeedbackCategory, string> = {
  bug: "Bug / 异常",
  feature_request: "功能建议",
  output_quality: "生成效果 / 质量",
  payment_support: "支付 / 订阅",
  general_feedback: "其他反馈"
};

const LABELS_EN: Record<FeedbackCategory, string> = {
  bug: "Bug / something broke",
  feature_request: "Feature request",
  output_quality: "Output quality",
  payment_support: "Payment / billing",
  general_feedback: "General feedback"
};

export function FeedbackModal({ open, onClose, context, localeUi }: FeedbackModalProps) {
  const zh = localeUi === "zh";
  const labels = zh ? LABELS_ZH : LABELS_EN;
  const [category, setCategory] = useState<FeedbackCategory>("general_feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    trackEvent("feedback_modal_open", {
      route: context.route,
      market: context.market,
      locale: context.locale,
      source_page: context.sourcePage ?? context.route,
      supporter_id: getSupportClientAnalyticsId(),
      tool_slug: context.toolType ?? undefined
    });
  }, [open, context]);

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) setSupportOpen(false);
  }, [open]);

  async function submit() {
    if (message.trim().length < 3) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          title: title.trim() || undefined,
          message: message.trim(),
          contact: contact.trim() || undefined,
          route: context.route,
          source_page: context.sourcePage ?? context.route,
          tool_type: context.toolType ?? undefined,
          user_plan: context.userPlan ?? undefined,
          market: context.market,
          locale: context.locale
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "submit_failed");
        return;
      }
      trackEvent("feedback_submit_success", {
        route: context.route,
        market: context.market,
        locale: context.locale,
        source_page: context.sourcePage ?? context.route,
        supporter_id: getSupportClientAnalyticsId(),
        tool_slug: context.toolType ?? undefined
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-xl leading-none"
          aria-label={zh ? "关闭" : "Close"}
        >
          ×
        </button>

        {done ? (
          <div className="pr-8">
            <p className="text-lg font-bold text-slate-900">
              {zh ? "感谢你的反馈" : "Thanks for your feedback"}
            </p>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {zh
                ? "你的建议会帮助 ToolEagle 变得更好。"
                : "Your input helps us improve ToolEagle."}
            </p>
            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              {zh ? (
                <>
                  若问题<strong>紧急</strong>（支付失败、无法使用等），可{" "}
                  <button
                    type="button"
                    onClick={() => setSupportOpen(true)}
                    className="text-red-800 font-semibold underline"
                  >
                    联系人工支持
                  </button>
                  （企业微信 / 微信 / QQ）。
                </>
              ) : (
                <>
                  If it&apos;s <strong>urgent</strong> (payment or outage), email{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-800 font-semibold underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {zh ? "好的" : "OK"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-900 pr-8">
              {zh ? "反馈与建议" : "Feedback & requests"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {zh
                ? "我们会附带页面与工具信息，便于定位问题。"
                : "We attach page & tool context automatically."}
            </p>

            <label className="mt-4 block text-xs font-semibold text-slate-700">
              {zh ? "类型" : "Category"}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {FEEDBACK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {labels[c]}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-700">
              {zh ? "标题（可选）" : "Title (optional)"}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                maxLength={200}
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-700">
              {zh ? "详细描述" : "Message"} *
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-y min-h-[100px]"
                required
                maxLength={8000}
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-700">
              {zh ? "联系方式（可选）" : "Contact (optional)"}
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={zh ? "邮箱或微信号" : "Email or @handle"}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                maxLength={240}
              />
            </label>

            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting || message.trim().length < 3}
                onClick={() => void submit()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? (zh ? "提交中…" : "Sending…") : zh ? "提交" : "Submit"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {zh ? "取消" : "Cancel"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    {zh ? (
      <SupportContactModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        sourcePage={context.sourcePage ?? context.route}
      />
    ) : null}
    </>
  );
}
