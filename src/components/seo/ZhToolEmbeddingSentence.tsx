/**
 * V77 AI Citation: Natural tool embedding in content.
 * "你也可以使用 ToolEagle 的 [工具名] 直接生成..."
 */

import Link from "next/link";
import { tools } from "@/config/tools";

type Props = {
  /** Tool slug (e.g. tiktok-caption-generator) */
  toolSlug: string;
  /** Context keyword for the sentence (e.g. 爆款文案 or viral captions) */
  keyword: string;
  /** Optional: use zh path for tool link */
  useZhPath?: boolean;
  /** Optional: language for sentence template */
  lang?: "zh" | "en";
};

function getZhToolName(slug: string): string {
  if (slug.includes("caption")) return "文案生成器";
  if (slug.includes("hook")) return "钩子生成器";
  if (slug.includes("title")) return "标题生成器";
  if (slug.includes("hashtag")) return "标签生成器";
  if (slug.includes("idea") || slug.includes("video-idea")) return "选题生成器";
  const tool = tools.find((t) => t.slug === slug);
  return tool?.name.replace(" Generator", "") ?? slug;
}

export function ZhToolEmbeddingSentence({
  toolSlug,
  keyword,
  useZhPath = true,
  lang = "zh"
}: Props) {
  const tool = tools.find((t) => t.slug === toolSlug);
  if (!tool) return null;

  const path = useZhPath ? `/zh/tools/${toolSlug}` : `/tools/${toolSlug}`;
  const toolName = lang === "zh" ? getZhToolName(toolSlug) : tool.name;

  if (lang === "en") {
    return (
      <p className="mt-4 text-slate-700 leading-relaxed">
        You can also use ToolEagle&apos;s{" "}
        <Link
          href={path}
          className="font-medium text-sky-700 hover:text-sky-800 underline underline-offset-2"
        >
          {toolName}
        </Link>
        {" "}to generate {keyword} in seconds.
      </p>
    );
  }

  return (
    <p className="mt-4 text-slate-700 leading-relaxed">
      你也可以使用 ToolEagle 的{" "}
      <Link
        href={path}
        className="font-medium text-sky-700 hover:text-sky-800 underline underline-offset-2"
      >
        {toolName}
      </Link>
      {" "}直接生成{keyword}。
    </p>
  );
}
