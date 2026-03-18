"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

const IDEA_SAMPLES: Record<string, string[]> = {
  "TikTok": [
    "TikTok涨粉：7个被验证的方法，从0到万粉",
    "TikTok播放量卡500？3个原因+解决方案",
    "TikTok爆款视频的黄金3秒法则"
  ],
  "YouTube": [
    "YouTube播放量破万的5个算法技巧",
    "YouTube标题怎么写更容易爆？",
    "YouTube Shorts 涨粉完整指南"
  ],
  "Instagram": [
    "Instagram Reels 涨粉实战技巧",
    "Instagram 内容策略：从0到1",
    "Reels 爆款案例10个"
  ],
  default: [
    "7个核心方法，从0到1",
    "爆款视频的黄金法则",
    "2026最新实战指南"
  ]
};

type Props = {
  ctaLinks: { href: string; label: string }[];
};

export function ZhIdeaGeneratorClient({ ctaLinks }: Props) {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = () => {
    const key = Object.keys(IDEA_SAMPLES).find((k) =>
      topic && k !== "default" && topic.includes(k)
    ) || "default";
    const options = IDEA_SAMPLES[key];
    setResult(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-2xl">
        <h1 className="text-3xl font-semibold text-slate-900">免费选题生成器</h1>
        <p className="mt-2 text-slate-600">输入领域，一键生成爆款视频选题</p>

        <div className="mt-8">
          <input
            type="text"
            placeholder="例如：TikTok、YouTube、Instagram"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-white font-medium hover:bg-slate-800 transition"
          >
            生成选题
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">生成结果</h2>
            <p className="text-lg text-slate-800">{result}</p>
            <div className="mt-4">
              <ZhCopyButton text={result} label="复制" />
            </div>
          </div>
        )}

        <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">深入了解更多</h2>
          <p className="mt-2 text-sm text-slate-600">查看完整指南，获取更多技巧</p>
          <ul className="mt-4 space-y-2">
            {ctaLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sky-700 hover:text-sky-800 hover:underline"
                >
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
