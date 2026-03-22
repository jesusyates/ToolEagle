import Link from "next/link";
import { BookOpen, ChevronRight, Video } from "lucide-react";
import { tools } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { DOUYIN_SCENES } from "@/lib/zh-site/cn-platforms/douyin-scenes";
import { ZH } from "@/lib/zh-site/paths";
import { DouyinWorkstationSummaryFooter } from "@/components/zh/cn-platforms/DouyinWorkstationSummaryFooter";

const SCENE_LABEL: Record<string, string> = {
  traffic: "获取流量",
  copy: "写文案",
  structure: "内容结构",
  conversion: "带货转化",
  account: "账号运营"
};

/** 仅匹配 `/zh/douyin-xxx` 单层路径中的生成器 slug */
function generatorSlugFromHref(href: string): string | null {
  const path = href.replace(/^\/zh\//, "").split("?")[0];
  if (!path || path.includes("/")) return null;
  return path.startsWith("douyin-") ? path : null;
}

function DouyinExtraCard({
  href,
  title,
  hint,
  sceneLabel
}: {
  href: string;
  title: string;
  hint: string;
  sceneLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35"
    >
      <p className="text-xs font-medium tracking-wide text-slate-500">{sceneLabel}</p>
      <h3 className="mt-1 text-base font-semibold leading-snug text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{hint}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">进入页面继续操作</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-700 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-red-600">
          前往
          <ChevronRight className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/**
 * 对齐英文站 `/tiktok-tools`（PlatformToolsPage）：Hero + 分场景工具卡片区。
 */
export function ZhDouyinToolsLanding() {
  const bySlug = new Map(tools.map((t) => [t.slug, t]));

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-red-100/90 bg-gradient-to-b from-red-950/[0.04] via-slate-50/90 to-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-25%,rgba(239,68,68,0.11),transparent_58%)]"
          aria-hidden
        />
        <div className="container relative py-10 md:py-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white shadow-sm md:h-14 md:w-14">
                <Video className="h-7 w-7 text-red-700 md:h-8 md:w-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
                抖音工具
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:border-l sm:border-slate-200 sm:pl-3 md:text-base">
                专为抖音创作者开发
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0 lg:justify-end">
              <Link
                href={ZH.douyinHub}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-900/15 transition hover:bg-red-500"
              >
                创作者工作台 →
              </Link>
              <Link
                href={ZH.douyinGuide}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-900 transition hover:bg-red-50"
              >
                可执行教程
              </Link>
              <Link
                href={ZH.douyinTools}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                全部工具索引
              </Link>
              <a
                href="https://www.douyin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              >
                打开抖音官网 ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {DOUYIN_SCENES.map((scene, idx) => {
        const sceneLabel = SCENE_LABEL[scene.id] ?? scene.title;
        const moreLinks = [...scene.guides, ...scene.reads];
        const exampleLines = scene.examples.slice(0, 2);
        return (
          <section
            key={scene.id}
            className={`border-b border-slate-100 py-11 last:border-0 ${
              idx % 2 === 1 ? "bg-slate-50/80" : "bg-white"
            }`}
          >
            <div className="container">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{scene.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{scene.description}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scene.tools.map((t) => {
                  const genSlug = generatorSlugFromHref(t.href);
                  const meta = genSlug ? bySlug.get(genSlug) : undefined;
                  if (meta && genSlug?.startsWith("douyin-")) {
                    return (
                      <ToolCard
                        key={t.href}
                        href={t.href}
                        icon={meta.icon}
                        name={meta.name}
                        description={meta.description}
                        descriptionZh={meta.descriptionZh}
                        category={meta.category}
                        categoryLabel={sceneLabel}
                        locale="zh"
                      />
                    );
                  }
                  return (
                    <DouyinExtraCard
                      key={t.href}
                      href={t.href}
                      title={t.label}
                      hint={
                        scene.id === "account"
                          ? "工作台、增长路径与复盘；可与上方生成器配合使用。"
                          : "进入页面查看说明与操作入口。"
                      }
                      sceneLabel={sceneLabel}
                    />
                  );
                })}
              </div>

              {moreLinks.length > 0 && (
                <div className="mt-8">
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                    <BookOpen className="h-5 w-5 text-red-600/70" aria-hidden />
                    教程与延伸阅读
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {moreLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50/50 hover:text-red-900"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {exampleLines.length > 0 && (
                <div className="mt-6 rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white p-4 md:p-5">
                  <p className="text-xs font-semibold text-red-900/85">抖音语境示例</p>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {exampleLines.map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-400/90" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section className="border-t border-slate-200 bg-gradient-to-b from-slate-50/90 to-white py-12">
        <div className="container">
          <h2 className="text-lg font-bold text-slate-900">教程与范例库</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            方法论与可复制句式；与上方工具同场景配套，适合收藏后反复用。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={ZH.douyinGuide}
              className="inline-flex rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50"
            >
              教程目录
            </Link>
            <Link
              href={ZH.douyinTutorials}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              长尾教程索引
            </Link>
            <Link
              href={ZH.douyinHooksSeo}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              钩子模板
            </Link>
            <Link
              href={ZH.douyinCaptionExamplesSeo}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              文案范例
            </Link>
            <Link
              href={ZH.douyinTopicIdeasSeo}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              选题灵感
            </Link>
            <Link
              href={ZH.douyinScriptTemplatesSeo}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              口播脚本模板
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-10 md:py-12">
        <div className="container max-w-3xl">
          <DouyinWorkstationSummaryFooter />
        </div>
      </section>
    </div>
  );
}
