"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { trackEvent } from "@/lib/analytics";

type Balance = {
  remaining_credits: number;
  total_credits: number;
  expire_at: string | null;
  wallet_type: "user" | "anonymous";
};
type LogRow = { id: string; tool: string; request_type: string; market: string; credits_used: number; remaining_after: number; created_at: string };
type OrderRow = {
  order_id: string; package_id: string | null; order_type: "credits" | "donation"; market: "cn" | "global";
  amount: number; currency: string; status: string; paid_at: string | null; credits_total: number | null; expire_at: string | null;
};

export function BillingClient({ variant = "en" }: { variant?: "en" | "zh" }) {
  const isZh = variant === "zh";
  const dash = isZh ? "/zh/dashboard" : "/dashboard";
  const pricing = isZh ? "/zh/pricing" : "/pricing";
  const [tab, setTab] = useState<"overview" | "purchases" | "usage" | "support">("overview");
  const [balance, setBalance] = useState<Balance | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("billing_page_view" as never, { market: isZh ? "cn" : "global" });
    let cancelled = false;
    (async () => {
      try {
        const [b, u, p] = await Promise.all([
          fetch("/api/credits/balance", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/credits/usage?limit=80", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/payment/history?limit=80", { credentials: "include" }).then((r) => r.json())
        ]);
        if (cancelled) return;
        setBalance(b as Balance);
        setLogs(Array.isArray(u.logs) ? u.logs : []);
        setOrders(Array.isArray(p.orders) ? p.orders : []);
      } catch {
        if (!cancelled) setErr("load_failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isZh]);

  useEffect(() => {
    trackEvent("billing_tab_view" as never, { tab, market: isZh ? "cn" : "global" });
  }, [tab, isZh]);

  const creditOrders = orders.filter((o) => o.order_type === "credits");
  const donationOrders = orders.filter((o) => o.order_type === "donation");

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      {!isZh ? <SiteHeader /> : null}
      <div className="flex-1 container max-w-4xl py-10 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{isZh ? "计费" : "Billing"}</p>
        <h1 className="text-2xl font-bold mt-1">{isZh ? "账单与创作次数" : "Billing & Credits"}</h1>
        <p className="text-sm text-slate-600 mt-2">
          {isZh ? "购买与消耗共用一套账本。" : "Purchases and usage share one ledger."}{" "}
          <Link href={pricing} className="font-semibold underline text-sky-700">{isZh ? "去购买" : "Buy credits"}</Link>
        </p>
        {err ? <p className="mt-4 text-sm text-rose-700">加载失败，请刷新重试。</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "overview", label: isZh ? "总览" : "Overview" },
            { id: "purchases", label: isZh ? "购买记录" : "Purchases" },
            { id: "usage", label: isZh ? "消耗记录" : "Usage" },
            { id: "support", label: isZh ? "打赏记录" : "Support" }
          ].map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id as typeof tab)} className={`rounded-full px-3 py-1.5 text-sm ${tab === t.id ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>{t.label}</button>
          ))}
        </div>

        {(tab === "overview" || tab === "purchases" || tab === "usage" || tab === "support") ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <h2 className="text-lg font-bold text-slate-900">{isZh ? "当前余额" : "Current Balance"}</h2>
            {balance ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li><span className="font-semibold">{isZh ? "剩余次数：" : "Remaining credits:"}</span>{balance.remaining_credits}</li>
                <li><span className="font-semibold">{isZh ? "累计购买：" : "Total credits:"}</span>{balance.total_credits}</li>
                <li><span className="font-semibold">{isZh ? "有效期：" : "Expire at:"}</span>{balance.expire_at ? new Date(balance.expire_at).toLocaleString() : "—"}</li>
                <li><span className="font-semibold">{isZh ? "钱包类型：" : "Wallet type:"}</span>{balance.wallet_type}</li>
              </ul>
            ) : <p className="mt-2 text-sm text-slate-500">加载中…</p>}
          </section>
        ) : null}

        {(tab === "overview" || tab === "purchases") ? (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{isZh ? "购买记录" : "Purchase History"}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {creditOrders.length === 0 ? <li className="text-slate-500">{isZh ? "暂无记录" : "No purchases yet"}</li> : creditOrders.map((o) => (
                <li key={o.order_id} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-700">
                  <span className="font-semibold">{o.package_id ?? "custom"}</span> · {o.amount} {o.currency} · {o.market} · {o.status}
                  {o.paid_at ? <span className="block text-xs text-slate-400 mt-1">{new Date(o.paid_at).toLocaleString()}</span> : null}
                  {o.credits_total != null ? <span className="block text-xs text-slate-500">+{o.credits_total} · expire {o.expire_at ? new Date(o.expire_at).toLocaleDateString() : "-"}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(tab === "overview" || tab === "usage") ? (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{isZh ? "使用记录" : "Usage History"}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {logs.length === 0 ? <li className="text-slate-500">{isZh ? "暂无记录" : "No usage yet"}</li> : logs.map((l) => (
                <li key={l.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
                  <span className="text-slate-800">{l.tool || "—"}</span>
                  <span className="text-slate-600">{l.request_type} · {l.market} · -{l.credits_used} · {isZh ? "余" : "left"} {l.remaining_after}</span>
                  <span className="text-xs text-slate-400 w-full">{new Date(l.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(tab === "overview" || tab === "support") ? (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">{isZh ? "打赏记录" : "Donation History"}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {donationOrders.length === 0 ? <li className="text-slate-500">{isZh ? "暂无记录" : "No donations yet"}</li> : donationOrders.map((o) => (
                <li key={o.order_id} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-700">
                  {o.amount} {o.currency} · {o.status}
                  {o.paid_at ? <span className="block text-xs text-slate-400 mt-1">{new Date(o.paid_at).toLocaleString()}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-10 text-sm"><Link href={dash} className="text-sky-700 font-semibold hover:underline">← {isZh ? "返回工作台" : "Back to dashboard"}</Link></p>
      </div>
      {!isZh ? <SiteFooter /> : null}
    </main>
  );
}
