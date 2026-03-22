import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

const LINKS = [
  { href: ZH.douyinTopic, label: "选题生成器" },
  { href: ZH.douyinHook, label: "钩子生成器" },
  { href: ZH.douyinScript, label: "口播脚本" },
  { href: ZH.douyinCaption, label: "文案包" },
  { href: ZH.douyinCommentCta, label: "评论引导" },
  { href: ZH.douyinStructure, label: "内容结构" }
] as const;

/** SEO 集群页底部：强制内链至抖音专属工具（≥6） */
export function DouyinSeoToolLinksStrip() {
  return (
    <section className="mt-10 rounded-2xl border border-red-200 bg-red-50/40 p-5 text-sm">
      <h2 className="text-lg font-bold text-red-950">站内抖音工具（一键生成）</h2>
      <p className="mt-2 text-slate-700 leading-relaxed">
        从选题、开头、结构到描述区与评论引导，全部按抖音语境输出；点进生成器直接拿可拍、可发结果。
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {LINKS.map((x) => (
          <li key={x.href}>
            <Link
              href={x.href}
              className="inline-flex rounded-lg bg-white border border-red-100 px-3 py-1.5 text-sm font-semibold text-red-950 hover:border-red-300 transition"
            >
              {x.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-600">
        创作入口{" "}
        <Link href={ZH.douyin} className="font-semibold text-red-800 hover:underline">
          /zh/douyin
        </Link>
        {" · 工具索引 "}
        <Link href={ZH.douyinTools} className="font-semibold text-red-800 hover:underline">
          /zh/douyin/tools
        </Link>
        {" · 教程 "}
        <Link href={ZH.douyinGuide} className="font-semibold text-red-800 hover:underline">
          /zh/douyin-guide
        </Link>
      </p>
    </section>
  );
}
