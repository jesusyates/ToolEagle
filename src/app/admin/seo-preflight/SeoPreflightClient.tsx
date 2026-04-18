"use client";

import { useState } from "react";
import { SeoAutomationMarketLocaleLanguageFields } from "@/components/admin/seo/SeoAutomationMarketLocaleLanguageFields";
import type { SeoDraftGenerationJobResult } from "@/lib/seo-draft-generation/types";
import {
  SEO_PREFLIGHT_CONTENT_TYPES,
  type SeoPreflightContentType,
  type SeoPreflightJobResult
} from "@/lib/seo-preflight/client";

export function SeoPreflightClient() {
  const [targetCount, setTargetCount] = useState(5);
  const [market, setMarket] = useState("US");
  const [locale, setLocale] = useState("en-US");
  const [contentLanguage, setContentLanguage] = useState("en");
  const [site, setSite] = useState("");
  const [contentType, setContentType] = useState<SeoPreflightContentType>("guide");
  const [maxEstimatedCost, setMaxEstimatedCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeoPreflightJobResult | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<SeoDraftGenerationJobResult | null>(null);

  async function onRun(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = {
        targetCount,
        market,
        locale,
        contentLanguage,
        contentType,
        persistLog: true
      };
      if (site.trim()) body.site = site.trim();
      const m = maxEstimatedCost.trim();
      if (m.length > 0) {
        const n = Number(m);
        if (Number.isFinite(n)) body.maxEstimatedCost = n;
      }
      const res = await fetch("/api/admin/seo-preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; result?: SeoPreflightJobResult };
      if (!res.ok || !j?.ok || !j.result) {
        setError(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setResult(j.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGenerateDrafts() {
    setDraftLoading(true);
    setDraftError(null);
    setDraftResult(null);
    try {
      const body =
        result && result.approved.length > 0
          ? { approved: result.approved }
          : { useLastPreflightFile: true };
      const res = await fetch("/api/admin/seo-generate-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        result?: SeoDraftGenerationJobResult;
      };
      if (!res.ok || !j?.ok || !j.result) {
        setDraftError(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setDraftResult(j.result);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : String(err));
    } finally {
      setDraftLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onRun} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700">目标数量</label>
          <input
            type="number"
            min={0}
            max={500}
            value={targetCount}
            onChange={(ev) => setTargetCount(Number(ev.target.value))}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <SeoAutomationMarketLocaleLanguageFields
          market={market}
          setMarket={setMarket}
          locale={locale}
          setLocale={setLocale}
          contentLanguage={contentLanguage}
          setContentLanguage={setContentLanguage}
          labels={{ market: "国家市场" }}
          labelClassName="block text-sm font-medium text-slate-700"
          selectClassName="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700">站点标识（可选）</label>
          <input
            value={site}
            onChange={(ev) => setSite(ev.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="global / cn ..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">内容类型</label>
          <select
            value={contentType}
            onChange={(ev) => setContentType(ev.target.value as SeoPreflightContentType)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {SEO_PREFLIGHT_CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">预计成本上限（可选，空=不限制）</label>
          <input
            value={maxEstimatedCost}
            onChange={(ev) => setMaxEstimatedCost(ev.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="例如 1.5"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "运行中…" : "运行预检"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">错误：{error}</p> : null}

      {result ? (
        <div className="space-y-6 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <p>总候选数（已扫描）：{result.candidatesSeen}</p>
            <p>目标数量：{result.targetCount}</p>
            <p>通过数：{result.approvedCount}</p>
            <p>拒绝数：{result.rejectedCount}</p>
            <p>预计总成本：{result.estimatedTotalCost.toFixed(4)}</p>
            <p className="text-slate-500">运行时间：{result.ranAt}</p>
          </div>
          <div>
            <h2 className="font-semibold">拒绝原因统计</h2>
            <ul className="mt-2 list-inside list-disc text-slate-700">
              {Object.entries(result.rejectReasonCounts).length === 0 ? (
                <li>无</li>
              ) : (
                Object.entries(result.rejectReasonCounts).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">通过列表</h2>
            <ul className="mt-2 space-y-3">
              {result.approved.length === 0 ? <li className="text-slate-500">无</li> : null}
              {result.approved.map((r, i) => (
                <li key={i} className="rounded border border-slate-200 p-2">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-slate-600">slug: {r.slug}</div>
                  <div className="text-slate-600">topic: {r.topic}</div>
                  <div className="text-slate-600">成本: {r.estimatedCost}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">拒绝列表</h2>
            <ul className="mt-2 space-y-3">
              {result.rejected.length === 0 ? <li className="text-slate-500">无</li> : null}
              {result.rejected.map((r, i) => (
                <li key={i} className="rounded border border-slate-200 p-2">
                  <div className="font-medium">{r.topic}</div>
                  <div className="text-red-700">{r.rejectReason ?? "unknown"}</div>
                  {r.title ? <div className="text-slate-600">标题：{r.title}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="rounded border border-slate-200 p-4 space-y-3 max-w-xl">
        <h2 className="font-semibold text-base">阶段 2：生成全文草稿（仅 draft，不发布）</h2>
        <p className="text-slate-600 text-sm">
          优先使用下方「通过列表」；若尚未在本页跑预检，则读取服务器{" "}
          <code className="text-xs">generated/seo-preflight-last-run.json</code>。
        </p>
        <button
          type="button"
          onClick={() => void onGenerateDrafts()}
          disabled={draftLoading}
          className="rounded bg-amber-800 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {draftLoading ? "生成中…" : "从预检通过项生成草稿"}
        </button>
        {draftError ? <p className="text-sm text-red-700">草稿：{draftError}</p> : null}
        {draftResult ? (
          <div className="text-sm space-y-2">
            <p className="text-slate-600">
              来源：{draftResult.source} · 条数：{draftResult.inputCount} · {draftResult.ranAt}
            </p>
            <ul className="space-y-2">
              {draftResult.rows.map((r, i) => (
                <li key={i} className="rounded border border-slate-100 p-2">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-slate-600">slug: {r.slug}</div>
                  <div>
                    质量：{r.qualityPass ? "通过" : "未通过"}
                    {r.qualityRejectReason ? ` — ${r.qualityRejectReason}` : null}
                  </div>
                  <div>
                    已存草稿：{r.savedAsDraft ? "是" : "否"}
                    {r.saveError ? ` (${r.saveError})` : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
