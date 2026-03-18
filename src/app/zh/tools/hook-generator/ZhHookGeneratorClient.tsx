"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

const HOOK_SAMPLES: Record<string, string[]> = {
  "涨粉": [
    "你是不是也发现，发了很多视频就是不涨粉？",
    "3秒决定你的视频能不能爆，这个方法90%的人不知道",
    "为什么别人的视频随便发就火？今天说清楚"
  ],
  "播放量": [
    "播放量卡在500？可能是这3个原因",
    "想让播放量破万？前3秒必须这样做",
    "算法最喜欢的开场，就这3种"
  ],
  "爆款": [
    "爆款视频的开场，都有这个共同点",
    "千万别一上来就讲干货，这样开头才爆",
    "我研究了100个爆款，发现了一个规律"
  ],
  default: [
    "你是不是也遇到过这种情况？",
    "3秒决定你的视频能不能爆",
    "这个方法90%的人不知道"
  ]
};

type Props = {
  ctaLinks: { href: string; label: string }[];
};

export function ZhHookGeneratorClient({ ctaLinks }: Props) {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = () => {
    const key = Object.keys(HOOK_SAMPLES).find((k) =>
      topic && k !== "default" && topic.includes(k)
    ) || "default";
    const options = HOOK_SAMPLES[key];
    setResult(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12 max-w-2xl">
        <h1 className="text-3xl font-semibold text-slate-900">免费钩子生成器</h1>
        <p className="mt-2 text-slate-600">输入主题，一键生成爆款开场钩子</p>

        <div className="mt-8">
          <input
            type="text"
            placeholder="例如：涨粉、播放量、爆款"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-white font-medium hover:bg-slate-800 transition"
          >
            生成钩子
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
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
