import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SITE_URL, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "服务条款",
  description:
    "ToolEagle 服务条款。使用我们免费创作者工具的规则与指南。",
  openGraph: {
    title: "服务条款 | ToolEagle",
    description: "使用我们免费创作者工具的规则与指南。",
    url: `${SITE_URL}/zh/terms`
  }
};

export default function ZhTermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <article className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">服务条款</h1>
        <p className="text-sm text-slate-500 mb-8">最后更新：2026 年 3 月</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 接受条款</h2>
            <p>
              访问或使用 ToolEagle（「本服务」）即表示您同意受本服务条款约束。如不同意，请勿使用本服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 服务说明</h2>
            <p>
              ToolEagle 为内容创作者提供免费 AI 工具（文案、标签、钩子、标题等）。我们保留随时修改、暂停或终止任何服务的权利。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 合理使用</h2>
            <p>您同意不：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>将本服务用于任何非法目的</li>
              <li>试图绕过安全或访问限制</li>
              <li>抓取、爬取或滥用本服务</li>
              <li>提交有害、冒犯或侵权内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 免责声明</h2>
            <p>
              本服务以「现状」提供，不提供任何形式的保证。我们不保证准确性、可用性或特定用途的适用性。AI 生成内容可能需要人工审核。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. 联系我们</h2>
            <p>
              如有疑问：{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link href="/zh/privacy" className="text-sky-600 hover:underline">
            查看隐私政策 →
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
