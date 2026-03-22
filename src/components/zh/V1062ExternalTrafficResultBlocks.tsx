"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { safeCopyToClipboard } from "@/lib/clipboard";
import type { CreatorPostPackage } from "@/lib/ai/postPackage";
import { trackEvent } from "@/lib/analytics";
import { ZH } from "@/lib/zh-site/paths";

function buildCnShareText(
  pkg: CreatorPostPackage,
  index: number,
  toolShareUrl: string,
  douyinHubUrl: string,
  userInputFallback: string
): string {
  const topic = (pkg.topic || "").trim() || userInputFallback.trim().slice(0, 80);
  const hook = (pkg.hook || "").trim().slice(0, 280);
  const explain =
    (pkg.why_it_works || pkg.why_opening_grabs || pkg.why_copy_growth || "").trim().slice(0, 220);
  return [
    `【内容包 ${index + 1}】`,
    `选题：${topic}`,
    `钩子：${hook}`,
    explain ? `短说明：${explain}` : "",
    `→ 同款生成工具：${toolShareUrl}`,
    `→ 抖音增长专栏：${douyinHubUrl}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildEnDiscussionPack(toolShareUrl: string, douyinHubUrl: string, hookSample: string): {
  reddit: string;
  x: string;
  quora: string;
} {
  const hookShort = hookSample.slice(0, 120) || "structured short-form";
  return {
    reddit: `Does anyone else structure Douyin (Chinese TikTok) scripts as hook → middle → CTA instead of “just write a caption”? I’ve been using a small workflow that outputs the full pack in one go (topic, hook, script, caption, comment CTA) — curious if that’s overkill or normal for CN creators.\n\nTool I’m testing (not affiliated): ${toolShareUrl}\n\nBroader context on the Douyin stack: ${douyinHubUrl}`,
    x: `Honest question for Douyin people: do you still stitch hooks + script + caption from 3 different prompts, or one structured pack?\n\nI’m trying the latter — ${hookShort}…\n\n${toolShareUrl}\n\n${douyinHubUrl}`,
    quora: `I treat Douyin like any short-form platform: the first 1–2 seconds must earn the next 10. I use a single template that forces topic, hook, full script, caption, and a concrete comment CTA in one pass so I’m not editing three outputs together.\n\nReference workflow (Chinese UI, global-friendly idea): ${toolShareUrl}\n\nHub with more patterns: ${douyinHubUrl}`
  };
}

/** Per-package: CN share copy for external platforms */
export function V1062PerPackageShareBlock({
  pkg,
  index,
  toolShareUrl,
  douyinHubUrl,
  userInputFallback
}: {
  pkg: CreatorPostPackage;
  index: number;
  toolShareUrl: string;
  douyinHubUrl: string;
  userInputFallback: string;
}) {
  const text = useMemo(
    () => buildCnShareText(pkg, index, toolShareUrl, douyinHubUrl, userInputFallback),
    [pkg, index, toolShareUrl, douyinHubUrl, userInputFallback]
  );

  async function copy() {
    await safeCopyToClipboard(text);
    trackEvent("v1062_share_block_copy", { kind: "cn_per_package", index });
  }

  return (
    <div className="mt-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/90 to-amber-50/50 p-3">
      <p className="text-[11px] font-bold text-rose-950 uppercase tracking-wide">分享文案（适合发到 Reddit / X / 小红书）</p>
      <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{text}</p>
      <button
        type="button"
        onClick={() => void copy()}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
      >
        <Copy className="h-3 w-3" />
        复制分享文案
      </button>
    </div>
  );
}

/** Once per result: viral structure + EN discussion pack + traffic hook */
export function V1062AggregatedTrafficBlocks({
  firstPackage,
  toolShareUrl,
  douyinHubUrl
}: {
  firstPackage: CreatorPostPackage | undefined;
  toolShareUrl: string;
  douyinHubUrl: string;
}) {
  const hookSample = (firstPackage?.hook || firstPackage?.topic || "").trim();
  const snippet =
    (firstPackage?.publish_rhythm || firstPackage?.script_talking_points || "").trim().slice(0, 320) ||
    hookSample.slice(0, 200);

  const en = useMemo(
    () => buildEnDiscussionPack(toolShareUrl, douyinHubUrl, hookSample),
    [toolShareUrl, douyinHubUrl, hookSample]
  );

  async function copyEn(kind: "reddit" | "x" | "quora") {
    await safeCopyToClipboard(en[kind]);
    trackEvent("v1062_share_block_copy", { kind: `en_${kind}` });
  }

  return (
    <div className="mt-8 space-y-6 border-t border-slate-200 pt-6">
      <section className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-4" aria-labelledby="v1062-viral">
        <h3 id="v1062-viral" className="text-sm font-bold text-red-950 flex items-center gap-2">
          <span aria-hidden>🔥</span> 用这个结构做内容
        </h3>
        <p className="mt-2 text-xs text-slate-700 leading-relaxed">
          示例：先停滑（钩子）→ 中段只讲一个主信息点 → 结尾用可执行评论/私信引导。同一套结构可日更，不必每次从零想。
        </p>
        <div className="mt-3 rounded-lg border border-red-100 bg-white px-3 py-2.5 text-sm text-slate-800 whitespace-pre-wrap">
          {snippet || "生成后此处展示可复制结构片段（钩子/节奏/气口）。"}
        </div>
        <button
          type="button"
          onClick={() => void safeCopyToClipboard(snippet).then(() => trackEvent("v1062_share_block_copy", { kind: "viral_snippet" }))}
          className="mt-2 text-xs font-semibold text-red-800 hover:underline"
        >
          复制结构片段 →
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" aria-labelledby="v1062-en">
        <h3 id="v1062-en" className="text-sm font-bold text-slate-900">
          Reddit / X / Quora 讨论向英文（非硬广）
        </h3>
        <p className="mt-1 text-xs text-slate-600">语气偏讨论与提问，可原样发到英文社区测试流量。</p>
        <div className="mt-4 space-y-4">
          {(
            [
              ["reddit", "Reddit", en.reddit] as const,
              ["x", "X", en.x] as const,
              ["quora", "Quora", en.quora] as const
            ] as const
          ).map(([key, label, body]) => (
            <div key={key} className="rounded-xl border border-white bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
              <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{body}</p>
              <button
                type="button"
                onClick={() => void copyEn(key)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-slate-700">
        <span className="font-semibold text-red-900">你也可以用这个生成你的内容</span>
        {" — "}
        <Link href={ZH.douyinHub} className="text-red-800 font-bold hover:underline">
          进入抖音增长中心
        </Link>
        {" · "}
        <Link href={toolShareUrl} className="text-sky-800 font-semibold hover:underline">
          再生成一次（保留当前主题）
        </Link>
      </p>
    </div>
  );
}
