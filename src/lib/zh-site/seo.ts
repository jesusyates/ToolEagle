import type { Metadata } from "next";
import { BASE_URL } from "@/config/site";
import { ZH_TO_EN_CANONICAL } from "./paths";

export function buildZhPageMetadata(opts: {
  zhPath: string;
  title: string;
  description: string;
  /** V106.2 — long-tail / preview hints (optional) */
  keywords?: string[];
}): Metadata {
  const zhPath = (opts.zhPath.replace(/\/$/, "") || "/zh") as string;
  const enPath = ZH_TO_EN_CANONICAL[zhPath] ?? "/";

  return {
    /** 根 layout 的 `title.template` 为 `%s | ToolEagle`；此处传完整 SEO 标题，须 absolute 避免双重后缀 */
    title: { absolute: opts.title },
    description: opts.description,
    ...(opts.keywords?.length ? { keywords: opts.keywords } : {}),
    alternates: {
      canonical: `${BASE_URL}${zhPath}`,
      languages: {
        en: `${BASE_URL}${enPath}`,
        "zh-CN": `${BASE_URL}${zhPath}`
      }
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${BASE_URL}${zhPath}`,
      type: "website",
      siteName: "ToolEagle",
      locale: "zh_CN"
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description
    }
  };
}
