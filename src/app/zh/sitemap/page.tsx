import Link from "next/link";
import { getZhPageMetadata } from "@/lib/zh-metadata";
import { BASE_URL } from "@/config/site";
import { ZH } from "@/lib/zh-site/paths";

export const metadata = getZhPageMetadata("中文站点地图", `${BASE_URL}/zh/sitemap`);

/**
 * 中文站地图：仅列出对用户有用的主路径（抖音专栏优先）。
 * 不包含英文站 TikTok/YouTube/Instagram 指南集群（已 301 至抖音专栏）。
 */
export default function ZhSitemapPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">中文站点地图</h1>
            <p className="mt-4 text-slate-600">
              中文站以<strong className="font-normal text-slate-800">抖音</strong>为主路径与可执行教程；不提供英文站内容镜像。
            </p>

            <section className="mt-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">核心入口</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                <li>
                  <Link href={ZH.douyin} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    抖音工具首页 →
                  </Link>
                </li>
                <li>
                  <Link href={ZH.douyinGuide} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    抖音可执行教程目录 →
                  </Link>
                </li>
                <li>
                  <Link href={ZH.douyinTutorials} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    教程与长文索引 →
                  </Link>
                </li>
                <li>
                  <Link href={ZH.douyinTools} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    抖音专属工具索引 →
                  </Link>
                </li>
                <li>
                  <Link href="/zh/blog" className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    中文创作者博客 →
                  </Link>
                </li>
                <li>
                  <Link href="/zh/recent" className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    最新发布 →
                  </Link>
                </li>
                <li>
                  <Link href={ZH.pricing} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    定价说明 →
                  </Link>
                </li>
                <li>
                  <Link href={ZH.support} className="text-sky-700 hover:text-sky-800 hover:underline font-medium">
                    支持 / 反馈 →
                  </Link>
                </li>
              </ul>
            </section>

            <p className="mt-10 text-sm text-slate-500">
              需要英文主站工具与全球向内容请使用页脚「英文主站」。
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
