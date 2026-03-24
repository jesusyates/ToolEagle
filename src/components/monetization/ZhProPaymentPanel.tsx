"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/conversionClient";
import { listCreditPacksForUi, type CnCreditPackId } from "@/lib/credits/credit-packs";

type Phase = "idle" | "loading" | "paying" | "success" | "error";

/**
 * V101 — CN aggregator checkout · V107 — credit packs (按次 + 有效期)
 */
export function ZhProPaymentPanel({ paymentEnabled = true }: { paymentEnabled?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() || "/zh/pricing";
  const [phase, setPhase] = useState<Phase>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<CnCreditPackId>("cn_advanced");
  const [successMeta, setSuccessMeta] = useState<{ added: number; balance: number; expireAt: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const packs = listCreditPacksForUi();
  const current = packs.find((p) => p.id === selected) ?? packs[1];

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPoll();
  }, [stopPoll]);

  const startCheckout = async () => {
    if (!paymentEnabled) {
      setErrMsg("aggregator_not_configured");
      setPhase("error");
      setModalOpen(true);
      return;
    }
    setErrMsg(null);
    setPhase("loading");
    setModalOpen(true);
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ package_id: selected, market: "cn", order_type: "credits" })
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 && data.error === "login_required") {
        setModalOpen(false);
        setPhase("idle");
        router.push(`/zh/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!res.ok) {
        const detail =
          typeof data.detail === "string" ? data.detail : typeof data.error === "string" ? data.error : "request_failed";
        setErrMsg(detail);
        setPhase("error");
        trackEvent("payment_failed", {
          market: "cn",
          provider: "aggregator",
          plan: selected,
          route: "/zh/pricing"
        });
        return;
      }

      setOrderId(data.orderId ?? null);
      const q = typeof data.paymentQrUrl === "string" ? data.paymentQrUrl : null;
      const u = typeof data.paymentUrl === "string" ? data.paymentUrl : null;
      setQrUrl(q);
      setPayUrl(u);
      setPhase("paying");

      const amt = typeof data.amount === "number" ? data.amount : current.cny;
      trackEvent("payment_order_created", {
        market: "cn",
        provider: "aggregator",
        plan: selected,
        amount: amt,
        route: "/zh/pricing"
      });
      if (q || u) {
        trackEvent("payment_qr_shown", {
          market: "cn",
          provider: "aggregator",
          plan: selected,
          amount: amt,
          route: "/zh/pricing"
        });
      }
    } catch {
      setErrMsg("network_error");
      setPhase("error");
      trackEvent("payment_failed", { market: "cn", provider: "aggregator", plan: selected });
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
          trackEvent("payment_success", {
            market: "cn",
            provider: "aggregator",
            plan: selected,
            amount: typeof j.amount === "number" ? j.amount : current.cny,
            route: "/zh/pricing"
          });
          const balRes = await fetch("/api/credits/balance", { credentials: "include" });
          const bal = await balRes.json().catch(() => ({}));
          setSuccessMeta({
            added: current.credits,
            balance: Number(bal?.remaining_credits ?? 0),
            expireAt: typeof bal?.expire_at === "string" ? bal.expire_at : null
          });
          try {
            if (typeof window !== "undefined") {
              const amt = typeof j.amount === "number" ? j.amount : current.cny;
              const douyinIntent = sessionStorage.getItem("te_douyin_upgrade_intent") === "1";
              const cnIntent = sessionStorage.getItem("te_cn_upgrade_intent") === "1";

              if (douyinIntent) {
                trackConversion("douyin_payment_success", {
                  market: "cn",
                  locale: "zh",
                  plan: selected,
                  amount: amt,
                  plan_amount: amt,
                  plan_currency: "CNY",
                  provider: "aggregator",
                  route: "/zh/pricing"
                });
                sessionStorage.removeItem("te_douyin_upgrade_intent");
              }

              if (cnIntent) {
                trackConversion("cn_payment_success", {
                  market: "cn",
                  locale: "zh",
                  plan: selected,
                  amount: amt,
                  plan_amount: amt,
                  plan_currency: "CNY",
                  provider: "aggregator",
                  route: "/zh/pricing"
                });
                sessionStorage.removeItem("te_cn_upgrade_intent");
              }
            }
          } catch {
            /* ignore */
          }
        }
        if (j.status === "failed") {
          stopPoll();
          setPhase("error");
          setErrMsg("payment_failed");
          trackEvent("payment_failed", {
            market: "cn",
            provider: "aggregator",
            plan: selected,
            route: "/zh/pricing"
          });
        }
      } catch {
        /* ignore transient */
      }
    };

    void tick();
    pollRef.current = setInterval(tick, 2500);
    return () => stopPoll();
  }, [phase, orderId, selected, current.cny, stopPoll]);

  return (
    <div id="cn-credits-checkout" className="scroll-mt-28 h-full flex flex-col">
      <div className="grid gap-3 sm:grid-cols-2">
        {packs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              selected === p.id
                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {p.id === "cn_advanced" ? (
              <span className="inline-block rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white mb-1">
                推荐
              </span>
            ) : (
              <span className="block h-5" />
            )}
            <p className="font-bold text-slate-900">{p.labelZh}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ¥{p.cny}
              <span className="text-sm font-normal text-slate-600">
                {" "}
                / {p.credits} 次 / {p.days} 天
              </span>
            </p>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-12">
        <button
          type="button"
          onClick={() => void startCheckout()}
          disabled={phase === "loading" || !paymentEnabled}
          className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
        >
          {phase === "loading"
            ? "正在创建订单…"
            : paymentEnabled
              ? `立即购买 · ¥${current.cny}（${current.credits}次 / ${current.days}天）`
              : `支付通道维护中 · ¥${current.cny}（${current.credits}次 / ${current.days}天）`}
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-500 leading-relaxed">
          支付成功后自动到账，算力次数与有效期可在「控制台 → 算力/订单」查看。
        </p>
      </div>
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
              <p className="text-sm text-slate-600 text-center">正在准备支付…</p>
            ) : null}

            {phase === "error" ? (
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-slate-900">暂时无法拉起支付</p>
                <p className="text-xs text-slate-600">
                  {errMsg === "aggregator_not_configured"
                    ? "站点尚未配置国内聚合支付（微信/支付宝），请联系管理员完成配置。"
                    : `原因：${errMsg ?? "unknown"}`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                    onClick={() => {
                      setModalOpen(false);
                      setPhase("idle");
                    }}
                  >
                    关闭
                  </button>
                </div>
              </div>
            ) : null}

            {phase === "paying" ? (
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-900">请扫码支付</p>
                <p className="text-xs text-slate-600">支付完成后将自动检测，请稍候…</p>
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
                  <p className="text-xs text-amber-800">暂时无法显示支付二维码，请稍后重试。</p>
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
                <p className="text-lg font-bold text-emerald-800">支付成功</p>
                <p className="text-sm text-slate-600">
                  已获得 {successMeta?.added ?? current.credits} 次，当前余额 {successMeta?.balance ?? 0} 次，
                  有效期至 {successMeta?.expireAt ? new Date(successMeta.expireAt).toLocaleDateString() : "—"}。
                </p>
                <Link
                  href="/zh/tiktok-caption-generator"
                  className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setModalOpen(false)}
                >
                  去生成文案
                </Link>
                <Link
                  href="/zh/dashboard/billing"
                  className="inline-flex w-full justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => setModalOpen(false)}
                >
                  查看账单
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
