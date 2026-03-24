"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DONATION_TIER_AMOUNTS_CNY } from "@/lib/payment/donation-config";
import { ZH } from "@/lib/zh-site/paths";
import { trackEvent } from "@/lib/analytics";

type Phase = "idle" | "loading" | "paying" | "success" | "error";

type Props = {
  onPaid?: () => void;
};

/**
 * V101.1 — Donation via aggregator (same QR + callback pattern as Pro).
 */
export function ZhDonationPaymentPanel({ onPaid }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const startCheckout = async (tier: number) => {
    setErrMsg(null);
    setAmount(tier);
    setPhase("loading");
    setModalOpen(true);
    try {
      const res = await fetch("/api/payment/create-donation-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: tier, market: "cn" })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail =
          typeof data.detail === "string" ? data.detail : typeof data.error === "string" ? data.error : "request_failed";
        setErrMsg(detail);
        setPhase("error");
        trackEvent("payment_failed", {
          market: "cn",
          provider: "aggregator",
          plan: "donation",
          amount: tier,
          route: ZH.support
        });
        return;
      }

      setOrderId(data.orderId ?? null);
      setQrUrl(typeof data.paymentQrUrl === "string" ? data.paymentQrUrl : null);
      setPayUrl(typeof data.paymentUrl === "string" ? data.paymentUrl : null);
      setPhase("paying");

      trackEvent("donation_order_created", {
        market: "cn",
        provider: "aggregator",
        plan: "donation",
        amount: tier,
        route: ZH.support
      });
      if (data.paymentQrUrl || data.paymentUrl) {
        trackEvent("payment_qr_shown", {
          market: "cn",
          provider: "aggregator",
          plan: "donation",
          amount: tier,
          route: ZH.support
        });
      }
    } catch {
      setErrMsg("network_error");
      setPhase("error");
      trackEvent("payment_failed", { market: "cn", provider: "aggregator", plan: "donation" });
    }
  };

  useEffect(() => {
    if (phase !== "paying" || !orderId) return;

    stopPoll();
    const tick = async () => {
      try {
        const r = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`, {
          credentials: "include"
        });
        const j = await r.json();
        if (j.status === "paid") {
          stopPoll();
          setPhase("success");
          trackEvent("donation_payment_success", {
            market: "cn",
            provider: "aggregator",
            plan: "donation",
            amount: typeof j.amount === "number" ? j.amount : amount ?? 0,
            route: ZH.support
          });
          onPaid?.();
        }
        if (j.status === "failed") {
          stopPoll();
          setPhase("error");
          setErrMsg("payment_failed");
        }
      } catch {
        /* ignore */
      }
    };

    void tick();
    pollRef.current = setInterval(tick, 2500);
    return () => stopPoll();
  }, [phase, orderId, amount, onPaid, stopPoll]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DONATION_TIER_AMOUNTS_CNY.map((tier) => (
          <button
            key={tier}
            type="button"
            disabled={phase === "loading"}
            onClick={() => void startCheckout(tier)}
            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-900 hover:bg-red-50 disabled:opacity-60"
          >
            ¥{tier}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        选择金额后生成支付订单，使用微信或支付宝扫码；支付成功后由支付平台通知本站，自动记录并更新支持者权益，无需手动确认。
      </p>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (phase !== "loading") {
              setModalOpen(false);
              if (phase === "success") setPhase("idle");
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === "loading" ? (
              <p className="text-sm text-slate-600 text-center">正在创建打赏订单…</p>
            ) : null}

            {phase === "error" ? (
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-slate-900">无法发起支付</p>
                <p className="text-xs text-slate-600">{errMsg ?? "unknown"}</p>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  onClick={() => {
                    setModalOpen(false);
                    setPhase("idle");
                  }}
                >
                  关闭
                </button>
              </div>
            ) : null}

            {phase === "paying" ? (
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-900">请扫码支付 ¥{amount}</p>
                <p className="text-xs text-slate-600">支付完成后将自动确认…</p>
                {qrUrl ? (
                  <Image
                    src={qrUrl}
                    alt="支付二维码"
                    width={200}
                    height={200}
                    className="mx-auto rounded-lg border border-slate-200"
                    unoptimized
                  />
                ) : null}
                {payUrl && !qrUrl ? (
                  <a
                    href={payUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    打开支付页面
                  </a>
                ) : null}
                {!qrUrl && !payUrl ? (
                  <p className="text-xs text-amber-800">未收到支付链接，请检查聚合支付接口。</p>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-slate-500 underline"
                  onClick={() => {
                    stopPoll();
                    setModalOpen(false);
                    setPhase("idle");
                  }}
                >
                  稍后继续
                </button>
              </div>
            ) : null}

            {phase === "success" ? (
              <div className="text-center space-y-3">
                <p className="text-lg font-bold text-emerald-800">支付成功，感谢支持！</p>
                <p className="text-sm text-slate-600">你的支持者等级与权益已更新。</p>
                <button
                  type="button"
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={() => {
                    setModalOpen(false);
                    setPhase("idle");
                  }}
                >
                  好的
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
