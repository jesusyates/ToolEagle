import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { SITE_URL, CONTACT_EMAIL } from "@/config/site";

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "ToolEagle 隐私政策。我们如何收集、使用和保护您的数据。符合 GDPR 和 CCPA 要求。",
  openGraph: {
    title: "隐私政策 | ToolEagle",
    description: "我们如何收集、使用和保护您的数据。",
    url: `${SITE_URL}/zh/privacy`
  }
};

export default function ZhPrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <article className="flex-1 container py-12 max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">隐私政策</h1>
        <p className="text-sm text-slate-500 mb-8">最后更新：2026 年 3 月</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. 引言</h2>
            <p>
              ToolEagle（「我们」）尊重您的隐私。本隐私政策说明我们如何收集、使用、披露和保护您在使用我们网站和服务时的信息。我们遵守《通用数据保护条例》（GDPR）和《加州消费者隐私法》（CCPA）的相关要求。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. 我们收集的信息</h2>
            <p>我们可能收集：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>使用数据：</strong>访问的页面、使用的工具、时间戳（通过分析）</li>
              <li><strong>设备数据：</strong>浏览器类型、IP 地址（尽可能匿名化）</li>
              <li><strong>自愿提供的数据：</strong>邮箱（如您订阅简报）、您提交的内容</li>
              <li><strong>Cookie：</strong>必要和分析类 Cookie（见下方 Cookie 政策）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. 信息用途</h2>
            <p>我们使用收集的信息用于：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>提供和改进我们的工具与服务</li>
              <li>发送简报（仅在您选择订阅时）</li>
              <li>分析使用情况以改善用户体验</li>
              <li>履行法律义务</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. 您的权利（GDPR 与 CCPA）</h2>
            <p>您有权：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>访问</strong>您的个人数据</li>
              <li><strong>更正</strong>不准确的数据</li>
              <li><strong>删除</strong>您的数据（「被遗忘权」）</li>
              <li><strong>限制</strong>或反对处理</li>
              <li><strong>数据可携</strong></li>
              <li><strong>随时撤回同意</strong></li>
              <li>加州居民：<strong>选择退出</strong>个人信息的出售（我们不出售数据）</li>
            </ul>
            <p className="mt-3">
              行使上述权利，请发送邮件至{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. 联系我们</h2>
            <p>
              隐私相关咨询：{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link href="/zh/terms" className="text-sky-600 hover:underline">
            查看服务条款 →
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
