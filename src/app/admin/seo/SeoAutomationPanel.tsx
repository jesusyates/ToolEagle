"use client";

import { useCallback, useEffect, useState } from "react";
import { SeoAutomationMarketLocaleLanguageFields } from "@/components/admin/seo/SeoAutomationMarketLocaleLanguageFields";

type Tab = "seeds" | "scenarios" | "auto" | "joblog";

export function SeoAutomationPanel({ activeTab }: { activeTab: Tab }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seedJson, setSeedJson] = useState("");
  const [seedSummary, setSeedSummary] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<unknown>(null);
  const [autoMarket, setAutoMarket] = useState("global");
  const [autoLocale, setAutoLocale] = useState("en-US");
  const [autoContentLanguage, setAutoContentLanguage] = useState("en");

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

  async function runAutomation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
          预检可通过 API 使用 <code>useScenarioTopicsFile: true</code> 与 <code>seedsOnly: true</code> 读取此文件，或在下方运行完整自动生成。
        </p>
      </section>
    );
  }

  if (activeTab === "auto") {
    return (
      <section className="mt-8 max-w-xl space-y-4 text-sm">
        <h2 className="text-lg font-medium">自动生成（数据源 → 选题 → 预检 → 草稿）</h2>
        <p className="text-slate-600">不会直接发布；草稿写入数据库与生成日志。</p>
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
          <SeoAutomationMarketLocaleLanguageFields
            market={autoMarket}
            setMarket={setAutoMarket}
            locale={autoLocale}
            setLocale={setAutoLocale}
            contentLanguage={autoContentLanguage}
            setContentLanguage={setAutoContentLanguage}
          />
          <div>
            <label className="block text-slate-700">内容类型</label>
            <select name="contentType" className="mt-1 rounded border border-slate-300 px-2 py-1" defaultValue="guide">
              <option value="guide">指南 (guide)</option>
              <option value="how_to">操作指南 (how_to)</option>
              <option value="comparison">对比 (comparison)</option>
              <option value="listicle">清单 (listicle)</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="runPreflight" defaultChecked />
            运行预检
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="runDraftGeneration" />
            生成草稿（大模型）
          </label>
          <button type="submit" disabled={busy} className="rounded bg-green-700 px-4 py-2 text-white">
            {busy ? "执行中…" : "开始生成"}
          </button>
        </form>
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
