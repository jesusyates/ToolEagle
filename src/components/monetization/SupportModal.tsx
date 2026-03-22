"use client";

import { useEffect } from "react";
import Link from "next/link";
import { DonationBox } from "@/components/DonationBox";
import { ZhDonationPaymentPanel } from "@/components/monetization/ZhDonationPaymentPanel";
import { ZH } from "@/lib/zh-site/paths";
import { trackEvent } from "@/lib/analytics";
import { getSupportClientAnalyticsId } from "@/lib/supporter/client-analytics-id";

type SupportModalProps = {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
  route: string;
};

/**
 * V100.2 — QR after explicit open. V101.1 — verified donation orders (no manual record).
 */
export function SupportModal({ open, onClose, sourcePage, route }: SupportModalProps) {
  useEffect(() => {
    if (!open) return;
    trackEvent("support_drawer_open", {
      route,
      market: "cn",
      locale: "zh",
      source_page: sourcePage,
      supporter_id: getSupportClientAnalyticsId()
    });
  }, [open, route, sourcePage]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-xl leading-none"
            aria-label="关闭"
          >
            ×
          </button>
          <p id="support-modal-title" className="text-sm font-bold text-slate-900 pr-8">
            支持 ToolEagle
          </p>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            选择金额生成支付订单，扫码支付成功后由平台回调自动记账并更新权益，无需手动确认。
          </p>

          <div className="mt-4">
            <ZhDonationPaymentPanel />
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3">
            <DonationBox variant="zh" compact prominent={false} fallbackUnrecorded />
          </div>

          <Link
            href={ZH.support}
            className="mt-4 block text-center text-xs font-semibold text-red-900 hover:underline"
            onClick={onClose}
          >
            打开支持者中心（完整记录）→
          </Link>
        </div>
      </div>
    </>
  );
}
