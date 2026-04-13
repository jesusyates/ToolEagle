"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";
import { fetchCreditsBalanceForUi } from "@/lib/account/fetch-balance-for-ui";

type Bal = { remaining: number; daysLeft: number | null; expireAt: string | null };

function daysLeftFromExpire(expireAt: string | null): number | null {
  if (!expireAt) return null;
  const d = new Date(expireAt);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}
type Log = { id: string; tool_slug: string; credits_used: number; remaining_after: number; created_at: string };
type Order = {
  order_id: string;
  plan: string;
  amount: number;
  paid_at: string | null;
  credits_total: number | null;
};

/**
 * V109.2 — 中文工作台：算力一览（复用 billing API，不新建复杂 dashboard）
 */
export function ZhCreditsSnapshotCard() {
  const [balance, setBalance] = useState<Bal | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<{ count: number; sum: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bRaw, u, p, d] = await Promise.all([
          fetchCreditsBalanceForUi(),
          fetch("/api/credits/usage?limit=8", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/credits/purchases", { credentials: "include" }).then((r) => r.json()),
          fetch("/api/donation/history", { credentials: "include" }).then((r) => r.json())
        ]);
        if (cancelled) return;
        setBalance({
          remaining: bRaw.remaining_credits,
          daysLeft: daysLeftFromExpire(bRaw.expire_at),
          expireAt: bRaw.expire_at
        });
        setLogs(Array.isArray(u.logs) ? u.logs.slice(0, 8) : []);
        setOrders(Array.isArray(p.orders) ? p.orders.slice(0, 5) : []);
        const st = d?.stats;
        setDonations(
          st && typeof st.count === "number"
            ? { count: st.count, sum: typeof st.sum === "number" ? st.sum : 0 }
            : { count: 0, sum: 0 }
        );
      } catch {
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="mt-3 h-8 w-24 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">算力与记录</h2>
          <p className="mt-1 text-xs text-slate-600">剩余次数、最近消耗与订单在同一处查看。</p>
        </div>
        <Link
          href={`${ZH.pricing}#cn-credits-checkout`}
          className="inline-flex shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          去充值
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">当前剩余</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{balance?.remaining ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">
            {balance?.daysLeft != null ? `约 ${balance.daysLeft} 天有效` : "有效期见订单"}
          </p>
        </div>
        {donations && donations.count > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide">已记录打赏</p>
            <p className="mt-1 text-sm text-amber-950">
              {donations.count} 笔 · 合计 ¥{donations.sum.toFixed(2)}
            </p>
            <p className="text-[11px] text-amber-800/90 mt-1">与算力订单分开统计。</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 flex items-center">
            <p className="text-xs text-slate-500">暂无打赏记录（可选）</p>
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900">最近使用</h3>
        <ul className="mt-2 space-y-1.5 text-xs">
          {logs.length === 0 ? (
            <li className="text-slate-500">暂无消耗记录</li>
          ) : (
            logs.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-1 rounded-lg border border-slate-100 bg-white px-2 py-1.5">
                <span className="text-slate-700 truncate">{l.tool_slug || "—"}</span>
                <span className="text-slate-500">
                  −{l.credits_used} · 余 {l.remaining_after}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-bold text-slate-900">最近订单</h3>
        <ul className="mt-2 space-y-1.5 text-xs">
          {orders.length === 0 ? (
            <li className="text-slate-500">暂无订单</li>
          ) : (
            orders.map((o) => (
              <li key={o.order_id} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-slate-700">
                <span className="font-mono text-[10px]">{o.order_id}</span>
                <span className="mx-1">·</span>
                {o.plan} ¥{o.amount}
                {o.credits_total != null ? ` · ${o.credits_total} 次` : ""}
              </li>
            ))
          )}
        </ul>
      </div>

      <p className="mt-4 text-xs">
        <Link href="/zh/dashboard/billing" className="font-semibold text-red-800 underline">
          查看完整账单与明细 →
        </Link>
      </p>
    </section>
  );
}
