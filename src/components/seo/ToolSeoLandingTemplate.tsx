import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";

export type ToolSeoLandingConfig = {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  examples: string[];
  usageSteps: string[];
  toolHref: string;
  toolCta: string;
};

type Props = {
  config: ToolSeoLandingConfig;
};

export function ToolSeoLandingTemplate({ config }: Props) {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {config.h1}
            </h1>
            <p className="mt-4 text-xl text-slate-700 leading-relaxed">
              {config.intro}
            </p>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">示例 (Examples)</h2>
              <ul className="mt-3 space-y-2">
                {config.examples.map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 pl-4 border-l-2 border-slate-200"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900">使用方法 (How to Use)</h2>
              <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-slate-700">
                {config.usageSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>

            <div className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">免费使用，无需注册</h2>
              <p className="mt-2 text-sm text-slate-600">
                输入关键词，点击生成，即可获得结果。支持 Copy、分享到 Reddit / X。
              </p>
              <Link
                href={config.toolHref}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-sky-700 transition"
              >
                {config.toolCta}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                浏览所有工具 →
              </Link>
              <Link
                href="/zh/recent"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                中文创作者指南 →
              </Link>
              <Link
                href="/ai-tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                AI 工具目录 →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
