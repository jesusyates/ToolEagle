"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

const SAMPLES: Record<string, string[]> = {
  "TikTok涨粉": [
    "2026年TikTok涨粉终极指南：7个核心方法+实战技巧",
    "从0到万粉：TikTok涨粉的7个被验证的有效方法",
    "99%的人都不知道的TikTok涨粉秘诀"
  ],
  "YouTube播放量": [
    "如何让YouTube视频播放量暴增？5个算法技巧",
    "YouTube播放量破万的3个关键要素",
    "2026年YouTube算法偏好：这样发视频更易爆"
  ],
  "爆款视频": [
    "爆款视频的黄金3秒法则：开场决定一切",
    "7个爆款视频必备的钩子模板",
    "如何做出让人忍不住看完的爆款视频？"
  ],
  default: [
    "输入主题，生成爆款标题",
    "7个核心方法，从0到1",
    "2026最新实战指南"
  ]
};

type Props = {
  ctaLinks: { href: string; label: string }[];
};

export function ZhTitleGeneratorClient({ ctaLinks }: Props) {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = () => {
    const key = Object.keys(SAMPLES).find((k) =>
      topic && k !== "default" && topic.includes(k)
    ) || "default";
    const options = SAMPLES[key];
    setResult(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-2xl">
        <h1 className="text-3xl font-semibold text-slate-900">免费标题生成器</h1>
        <p className="mt-2 text-slate-600">输入主题，一键生成爆款标题</p>

        <div className="mt-8">
          <input
            type="text"
            placeholder="例如：TikTok涨粉、YouTube播放量、爆款视频"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-white font-medium hover:bg-slate-800 transition"
          >
            生成标题
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-xl border-2 border-sky-200 bg-sky-50 p-5">
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
