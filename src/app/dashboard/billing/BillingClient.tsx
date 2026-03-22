"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";

type Balance = {
  remaining: number;
  expireAt: string | null;
  daysLeft: number | null;
  totalCredits: number;
};

type LogRow = {
  id: string;
  tool_slug: string;
  credits_used: number;
  remaining_after: number;
  created_at: string;
};

type OrderRow = {
  order_id: string;
  plan: string;
  amount: number;
  paid_at: string | null;
  credits_total: number | null;
  credits_expire_at: string | null;
};

export function BillingClient({ variant = "en" }: { variant?: "en" | "zh" }) {
  const isZh = variant === "zh";
  const dash = isZh ? "/zh/dashboard" : "/dashboard";
  const [balance, setBalance] = useState<Balance | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, u, p] = await Promise.all([
          fetch("/api/credits/balance", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/credits/usage?limit=40", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/credits/purchases", { credentials: "include" }).then((r) => r.json())
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
  }, []);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      {!isZh ? <SiteHeader /> : null}
      <div className="flex-1 container max-w-3xl py-10 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {isZh ? "计费" : "Billing"}
        </p>
        <h1 className="text-2xl font-bold mt-1">算力与订单</h1>
        <p className="text-sm text-slate-600 mt-2">
          中国站按次数计费（含有效期）。购买更多请前往{" "}
          <Link href="/zh/pricing" className="text-red-800 font-semibold underline">
            中文站定价
          </Link>
          。
        </p>

        {err ? <p className="mt-4 text-sm text-rose-700">加载失败，请刷新重试。</p> : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <h2 className="text-lg font-bold text-slate-900">当前余额</h2>
          {balance ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>
                <span className="font-semibold">剩余次数：</span>
                {balance.remaining}
              </li>
              <li>
                <span className="font-semibold">有效期：</span>
                {balance.daysLeft !== null ? `${balance.daysLeft} 天` : "—"}
                {balance.expireAt ? (
                  <span className="text-slate-500 ml-2">({new Date(balance.expireAt).toLocaleString()})</span>
                ) : null}
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">加载中…</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">使用记录</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {logs.length === 0 ? (
              <li className="text-slate-500">暂无记录</li>
            ) : (
              logs.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2"
                >
                  <span className="text-slate-800">{l.tool_slug || "—"}</span>
                  <span className="text-slate-600">
                    −{l.credits_used} · 余 {l.remaining_after}
                  </span>
                  <span className="text-xs text-slate-400 w-full">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">购买记录</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {orders.length === 0 ? (
              <li className="text-slate-500">暂无记录</li>
            ) : (
              orders.map((o) => (
                <li
                  key={o.order_id}
                  className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-700"
                >
                  <span className="font-mono text-xs">{o.order_id}</span>
                  <span className="mx-2">·</span>
                  {o.plan} · ¥{o.amount}
                  {o.credits_total != null ? ` · ${o.credits_total} 次` : ""}
                  {o.paid_at ? (
                    <span className="block text-xs text-slate-400 mt-1">
                      {new Date(o.paid_at).toLocaleString()}
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="mt-10 text-sm">
          <Link href={dash} className="text-sky-700 font-semibold hover:underline">
            ← {isZh ? "返回工作台" : "Back to dashboard"}
          </Link>
        </p>
      </div>
      {!isZh ? <SiteFooter /> : null}
    </main>
  );
}
