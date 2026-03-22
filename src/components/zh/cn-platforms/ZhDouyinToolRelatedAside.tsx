import Link from "next/link";
import { tools } from "@/config/tools";
import { ZH } from "@/lib/zh-site/paths";
import { DOUYIN_TOOL_NEXT_STEPS, type DouyinToolPageVariant } from "./douyin-tool-next-steps";

const CARD =
  "rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm";

type Props = {
  /** `config/tools` slug，如 douyin-hook-generator */
  currentSlug: string;
  variant: DouyinToolPageVariant;
};

/**
 * 对齐英文站工具页侧栏：Related tools + 站内探索（抖音语境）。
 * 与 PostPackageToolClient 的 ValueProof / Examples / History / ProTips 叠在同一列。
 */
export function ZhDouyinToolRelatedAside({ currentSlug, variant }: Props) {
  const meta = tools.find((t) => t.slug === currentSlug);
  const category = meta?.category ?? "Hooks";

  const sameCat = tools.filter(
    (t) => t.slug.startsWith("douyin-") && t.slug !== currentSlug && t.category === category
  );
  const related =
    sameCat.length > 0
      ? sameCat.slice(0, 5)
      : tools.filter((t) => t.slug.startsWith("douyin-") && t.slug !== currentSlug).slice(0, 5);

  const nextSteps = DOUYIN_TOOL_NEXT_STEPS[variant];

  return (
    <>
      <div className={CARD}>
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">相关抖音工具</p>
        <ul className="mt-3 space-y-2">
          {related.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/zh/${tool.slug}`}
                className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
              >
                {tool.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={CARD}>
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">推荐下一步</p>
        <ul className="mt-3 space-y-3">
          {nextSteps.map((x) => (
            <li key={x.href}>
              <Link href={x.href} className="group block">
                <span className="text-sm font-medium text-slate-900 group-hover:text-sky-700">
                  {x.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{x.sub}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={CARD}>
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">教程与范例库</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>
            <Link href={ZH.douyinGuide} className="hover:text-sky-700 hover:underline">
              可执行教程（/zh/douyin-guide）
            </Link>
          </li>
          <li>
            <Link href={ZH.douyinHooksSeo} className="hover:text-sky-700 hover:underline">
              钩子模板 · SEO
            </Link>
          </li>
          <li>
            <Link href={ZH.douyinCaptionExamplesSeo} className="hover:text-sky-700 hover:underline">
              文案范例 · SEO
            </Link>
          </li>
          <li>
            <Link href={ZH.douyinScriptTemplatesSeo} className="hover:text-sky-700 hover:underline">
              口播脚本模板 · SEO
            </Link>
          </li>
          <li>
            <Link href={ZH.douyinTopicIdeasSeo} className="hover:text-sky-700 hover:underline">
              选题灵感 · SEO
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
