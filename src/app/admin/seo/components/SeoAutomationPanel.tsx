"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SeoAutomationMarketLocaleLanguageFields } from "@/components/admin/seo/SeoAutomationMarketLocaleLanguageFields";

type Tab = "seeds" | "scenarios" | "auto" | "joblog";

export function SeoAutomationPanel({ activeTab }: { activeTab: Tab }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seedJson, setSeedJson] = useState("");
  const [seedSummary, setSeedSummary] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<unknown>(null);
  const [autoMarket, setAutoMarket] = useState("global");
  const [autoLocale, setAutoLocale] = useState("en-US");
  const [autoContentLanguage, setAutoContentLanguage] = useState("en");
  const [gapWanted, setGapWanted] = useState(50);
  const [gapSummary, setGapSummary] = useState<unknown>(null);
  const [isGapRunning, setIsGapRunning] = useState(false);

  const loadSeeds = useCallback(async () => {
    const res = await fetch("/api/admin/seo-app-seeds");
    const j = (await res.json().catch(() => null)) as { ok?: boolean; store?: { seeds?: unknown[] } };
    if (!res.ok || !j?.ok) {
      setSeedSummary("加载数据源失败");
      return;
    }
    const n = j.store?.seeds?.length ?? 0;
    setSeedSummary(`共 ${n} 条数据源（data/app-seo-seeds.json）`);
    setSeedJson(JSON.stringify(j.store ?? { version: 1, seeds: [] }, null, 2));
  }, []);

  const loadJobLog = useCallback(async () => {
    const res = await fetch("/api/admin/seo-automation-run");
    const j = (await res.json().catch(() => null)) as { ok?: boolean; lastRun?: unknown };
    if (res.ok && j?.lastRun) setLastJob(j.lastRun);
    else setLastJob(null);
  }, []);

  useEffect(() => {
    if (activeTab === "seeds") void loadSeeds();
    if (activeTab === "joblog") void loadJobLog();
  }, [activeTab, loadSeeds, loadJobLog]);

  async function saveSeeds(mode: "merge" | "replace") {
    setBusy(true);
    setMsg(null);
    try {
      let body: Record<string, unknown> = {};
      try {
        body = { mode, rawStore: JSON.parse(seedJson) as unknown };
      } catch {
        setMsg("JSON 格式无效");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/admin/seo-app-seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg("已保存。");
      await loadSeeds();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadCsv(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/seo-app-seeds", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; imported?: number };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(`已导入 ${j.imported ?? 0} 行（合并模式）。`);
      await loadSeeds();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runMap() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seo-scenario-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        topicCount?: number;
        deduped?: number;
        preview?: { topic: string }[];
      };
      if (!res.ok || !j?.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(
        `已写入 generated/seo-scenario-topics.json —共 ${j.topicCount} 条选题（去重跳过 ${j.deduped ?? 0}）。预览：${(j.preview ?? []).map((p) => p.topic).join(" | ")}`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runGapAutoPipeline() {
    setIsGapRunning(true);
    setMsg(null);
    setGapSummary(null);
    try {
      const res = await fetch("/api/admin/seo-auto-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wanted: gapWanted,
          market: autoMarket,
          locale: autoLocale,
          contentLanguage: autoContentLanguage,
          contentType: "guide"
        })
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        summary?: unknown;
        steps?: unknown;
        result?: unknown;
      };
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setGapSummary(j ?? null);
      const s = j?.summary as
        | {
            planned?: number;
            approved?: number;
            generated?: number;
            queued?: number;
            wanted?: number;
            stopReason?: string;
            scheduledForPublish?: number;
          }
        | undefined;
      setMsg(
        j?.ok
          ? `自动生产已完成：计划 ${s?.planned ?? "?"} / 目标 ${s?.wanted ?? gapWanted}，预检通过 ${s?.approved ?? "?"}，生成 ${s?.generated ?? "?"}，入库草稿 ${s?.queued ?? "?"}，排期 ${s?.scheduledForPublish ?? 0}${s?.stopReason ? `（${s.stopReason}）` : ""}`
          : String(j?.error ?? "失败")
      );
      if (j?.ok) {
        router.refresh();
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGapRunning(false);
    }
  }

  async function runAutomation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isGapRunning) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      targetCount: Number(fd.get("targetCount")),
      market: autoMarket,
      locale: autoLocale,
      contentLanguage: autoContentLanguage,
      contentType: String(fd.get("contentType") ?? "guide"),
      runPreflight: fd.get("runPreflight") === "on",
      runDraftGeneration: fd.get("runDraftGeneration") === "on"
    };
    try {
      const res = await fetch("/api/admin/seo-automation-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; result?: unknown };
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg(j?.ok ? "任务已完成 — 请查看「任务记录」标签。" : String(j?.error ?? "失败"));
      setLastJob(j?.result ?? null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (activeTab === "seeds") {
    return (
      <section className="mt-8 max-w-3xl space-y-4 text-sm">
        <h2 className="text-lg font-medium">应用 SEO 数据源</h2>
        <p className="text-slate-600">{seedSummary ?? "加载中…"}</p>
        <p className="text-slate-600">
          编辑 JSON（<code className="text-xs">data/app-seo-seeds.json</code>）或导入 CSV，列名：
          id,feature,platform,keywords,steps,angles,markets,languages,notes,sellingPoints — 列表字段单元格内用{" "}
          <code className="text-xs">|</code> 分隔。
        </p>
        <textarea
          className="w-full min-h-[240px] rounded border border-slate-300 p-2 font-mono text-xs"
          value={seedJson}
          onChange={(e) => setSeedJson(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded bg-slate-900 px-3 py-1.5 text-white"
            onClick={() => void saveSeeds("merge")}
          >
            合并 JSON
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-red-900"
            onClick={() => void saveSeeds("replace")}
          >
            替换整库
          </button>
          <label className="rounded border border-slate-300 px-3 py-1.5 cursor-pointer">
            导入 CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(ev) => void uploadCsv(ev.target.files?.[0] ?? null)}
            />
          </label>
          <button type="button" className="text-sky-700 underline" onClick={() => void loadSeeds()}>
            重新加载
          </button>
        </div>
        {msg ? <p className="text-slate-800">{msg}</p> : null}
      </section>
    );
  }

  if (activeTab === "scenarios") {
    return (
      <section className="mt-8 max-w-3xl space-y-4 text-sm">
        <h2 className="text-lg font-medium">选题映射</h2>
        <p className="text-slate-600">
          将数据源展开为指南类选题并写入{" "}
          <code className="text-xs">generated/seo-scenario-topics.json</code>。
        </p>
        <button
          type="button"
          disabled={busy}
          className="rounded bg-sky-700 px-4 py-2 text-white"
          onClick={() => void runMap()}
        >
          生成选题
        </button>
        {msg ? <p className="text-slate-800">{msg}</p> : null}
        <p className="text-slate-500 text-xs">
          生产上请在 <strong>自动生成（生产）</strong> 中跑完整管线；若仅需对选题文件做预检排查，可用{" "}
          <Link href="/admin/seo-preflight" className="text-sky-700 underline">
            诊断预检
          </Link>{" "}
          或 API（<code>useScenarioTopicsFile</code>、<code>seedsOnly</code> 等）。
        </p>
      </section>
    );
  }

  if (activeTab === "auto") {
    return (
      <section className="mt-8 max-w-xl space-y-4 text-sm">
        <h2 className="text-lg font-medium">自动 SEO 生产</h2>

        {false && (
          <SeoAutomationMarketLocaleLanguageFields
            market={autoMarket}
            setMarket={setAutoMarket}
            locale={autoLocale}
            setLocale={setAutoLocale}
            contentLanguage={autoContentLanguage}
            setContentLanguage={setAutoContentLanguage}
          />
        )}

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
          <h3 className="font-medium text-emerald-900">自动SEO内容生产（推荐）</h3>
          <p className="text-slate-700 text-sm">系统会自动：</p>
          <ul className="list-disc pl-5 text-slate-700 text-sm space-y-1">
            <li>分析已有内容</li>
            <li>发现选题缺口</li>
            <li>生成高质量文章</li>
            <li>自动排期发布</li>
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-slate-700 text-xs">目标数量</label>
              <input
                type="number"
                min={1}
                max={500}
                value={gapWanted}
                onChange={(e) => setGapWanted(Number(e.target.value) || 1)}
                className="mt-1 w-28 rounded border border-slate-300 px-2 py-1"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                disabled={isGapRunning || busy}
                onClick={() => void runGapAutoPipeline()}
                className="rounded bg-emerald-700 px-4 py-2 text-white text-sm disabled:opacity-50"
              >
                {isGapRunning ? "执行中…" : "运行全自动"}
              </button>
              <p style={{ color: "#666", fontSize: 12 }}>
                系统将自动控制发布频率与内容质量，无需手动干预
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            运行日志：<code className="text-xs">generated/seo-auto-run-last-run.json</code>
          </p>
          {gapSummary ? (
            <pre className="max-h-40 overflow-auto rounded border border-emerald-100 bg-white p-2 text-[10px] leading-relaxed">
              {JSON.stringify(gapSummary, null, 2)}
            </pre>
          ) : null}
        </div>

        {false && (
          <>
            <p style={{ color: "#d97706", marginBottom: 8 }}>
              {"\u26A0\uFE0F"} 旧流程，仅用于调试。请优先使用「Gap 全自动」。
            </p>
            <h3 className="text-base font-medium text-slate-800">基于选题文件 / 数据源（旧流程）</h3>
            <p className="text-xs text-slate-600">
              依赖 <code className="text-xs">data/app-seo-seeds.json</code> 与 scenario映射；与 Gap 全自动独立。
            </p>
            <form onSubmit={(ev) => void runAutomation(ev)} className="space-y-3">
              <div>
                <label className="block text-slate-700">生成数量</label>
                <input
                  name="targetCount"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={8}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-slate-700">内容类型</label>
                <select name="contentType" className="mt-1 rounded border border-slate-300 px-2 py-1" defaultValue="guide">
                  <option value="guide">指南 (guide)</option>
                  <option value="how_to">操作指南 (how_to)</option>
                  <option value="comparison">对比 (comparison)</option>
                  <option value="listicle">清单 (listicle)</option>
                  <option value="problem_solution">问题与方案 (problem_solution)</option>
                  <option value="mistakes">常见错误 (mistakes)</option>
                  <option value="comparison_from_experience">经验对比 (comparison_from_experience)</option>
                  <option value="myth_busting">辟谣与澄清 (myth_busting)</option>
                  <option value="pattern_breakdown">模式拆解 (pattern_breakdown)</option>
                  <option value="scenario_specific">场景专篇 (scenario_specific)</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="runPreflight" defaultChecked />
                <span>
                  运行预检（管线内，与生产校验一致；一般请保持勾选）
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="runDraftGeneration" />
                生成草稿（大模型）
              </label>
              <button
                type="submit"
                disabled={isGapRunning || busy}
                className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
              >
                {isGapRunning ? "已禁用（自动模式运行中）" : busy ? "执行中..." : "开始生成"}
              </button>
            </form>
          </>
        )}
        {msg ? <p className="text-slate-800">{msg}</p> : null}
      </section>
    );
  }

  return (
    <section className="mt-8 max-w-3xl text-sm">
      <h2 className="text-lg font-medium">任务记录</h2>
      <p className="mt-2 text-slate-600">
        最近一次运行：<code className="text-xs">generated/seo-automation-last-run.json</code>
      </p>
      <button type="button" className="mt-2 text-sky-700 underline" onClick={() => void loadJobLog()}>
        刷新
      </button>
      <pre className="mt-4 max-h-[480px] overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs">
        {lastJob ? JSON.stringify(lastJob, null, 2) : "{}"}
      </pre>
    </section>
  );
}
