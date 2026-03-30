"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type Phase = "idle" | "loading" | "paying" | "success" | "error";
type BillingPack = {
  package_id: string;
  display_name: string;
  amount: number;
  currency: "USD" | "CNY";
  credits_total: number;
  validity_days: number;
  is_primary: boolean;
};

export function GlobalCreditsPaymentPanel({
  initialPacks = []
}: {
  initialPacks?: BillingPack[];
}) {
  const [packs, setPacks] = useState<BillingPack[]>(initialPacks);
  const [selected, setSelected] = useState<string>(() => initialPacks.find((p) => p.is_primary)?.package_id ?? initialPacks[0]?.package_id ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);
  const [balanceText, setBalanceText] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPack = useMemo(
    () => packs.find((p) => p.package_id === selected) ?? packs[0],
    [packs, selected]
  );

  useEffect(() => {
    trackEvent("pricing_package_view" as never, { market: "global", route: "/pricing" });
    void (async () => {
      const res = await fetch("/api/payment/packages?market=global", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json.packages) ? (json.packages as BillingPack[]) : [];
      if (rows.length > 0) {
        setPacks(rows);
        const primary = rows.find((p) => p.is_primary) ?? rows[0];
        if (primary) setSelected((prev) => prev || primary.package_id);
      }
    })();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function buyNow() {
    if (!selectedPack) return;
    setErr(null);
    setPhase("loading");
    trackEvent("pricing_package_click" as never, {
      market: "global",
      package_id: selectedPack.package_id,
      amount: selectedPack.amount,
      currency: selectedPack.currency,
      order_type: "credits"
    });
    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        market: "global",
        package_id: selectedPack.package_id,
        order_type: "credits",
        source_path: typeof window !== "undefined" ? window.location.pathname : "/pricing",
        source_type: "pricing_panel",
        page_type: "pricing",
        tool_slug: null,
        referrer_path:
          typeof window !== "undefined" && document.referrer
            ? (() => {
                try {
                  return new URL(document.referrer).pathname;
                } catch {
                  return null;
                }
              })()
            : null
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPhase("error");
      const detail = typeof data.detail === "string" ? data.detail : "";
      const hint = typeof data.hint === "string" ? data.hint : "";
      const code = typeof data.error === "string" ? data.error : "purchase_failed";
      setErr([code, detail, hint].filter(Boolean).join(" | "));
      trackEvent("payment_failed", {
        market: "global",
        package_id: selectedPack.package_id,
        amount: selectedPack.amount,
        currency: selectedPack.currency,
        order_type: "credits"
      });
      return;
    }
    trackEvent("credit_purchase" as never, {
      market: "global",
      package_id: selectedPack.package_id,
      amount: selectedPack.amount,
      currency: selectedPack.currency,
      order_type: "credits"
    });
    setOrderId(data.orderId ?? null);
    const checkoutUrl = typeof data.paymentUrl === "string" ? data.paymentUrl : null;
    setCreditsAdded(selectedPack.credits_total);
    if (checkoutUrl) {
      // Expected UX: Buy Now immediately enters provider checkout.
      window.location.assign(checkoutUrl);
      return;
    }
    setPhase("error");
    setErr("missing_checkout_url");
  }

  useEffect(() => {
    if (phase !== "paying" || !orderId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    const tick = async () => {
      const statusRes = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`, {
        credentials: "include"
      });
      const status = await statusRes.json().catch(() => ({}));
      if (status?.status === "paid") {
        if (pollRef.current) clearInterval(pollRef.current);
        const balRes = await fetch("/api/credits/balance", { credentials: "include" });
        const bal = await balRes.json().catch(() => ({}));
        setBalanceText(
          `${bal?.remaining_credits ?? 0} credits · expires ${bal?.expire_at ? new Date(bal.expire_at).toLocaleDateString() : "-"}`
        );
        setPhase("success");
        trackEvent("payment_success", {
          market: "global",
          package_id: selectedPack?.package_id,
          amount: selectedPack?.amount,
          currency: selectedPack?.currency,
          order_type: "credits"
        });
      }
    };
    void tick();
    pollRef.current = setInterval(tick, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, orderId, selectedPack]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {packs.length === 0 ? (
          <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Loading packages...
          </div>
        ) : null}
        {packs.map((p) => {
          const perUse = (p.amount / Math.max(1, p.credits_total)).toFixed(3);
          const active = selected === p.package_id;
          return (
            <button
              key={p.package_id}
              type="button"
              onClick={() => setSelected(p.package_id)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              {p.is_primary ? (
                <span className="inline-block rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              ) : null}
              <p className="mt-1 text-sm font-semibold text-slate-700">{p.display_name}</p>
              <p className="text-3xl font-bold text-slate-900">${p.amount}</p>
              <p className="text-sm text-slate-600">{p.credits_total} credits · {p.validity_days} days</p>
              <p className="mt-1 text-xs text-slate-500">≈ ${perUse} per generation</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedPack || phase === "loading"}
        onClick={() => void buyNow()}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 shadow-sm"
      >
        {phase === "loading" ? "Creating order..." : "Buy Now"}
      </button>

      {phase === "paying" ? null : null}
      {phase === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Added {creditsAdded ?? 0} credits. {balanceText ?? ""}{" "}
          <Link href="/dashboard/billing" className="font-semibold underline">View billing</Link>
        </div>
      ) : null}
      {phase === "error" ? <p className="text-sm text-rose-700 break-words">{err}</p> : null}
    </div>
  );
}

