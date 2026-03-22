import { ZhDouyinToolsLanding } from "@/components/zh/cn-platforms/ZhDouyinToolsLanding";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin",
  title: zhSeoTitle("抖音工具 — AI 选题 · 钩子 · 口播 · 文案"),
  description:
    "抖音创作者工具首页：按获取流量、写文案、内容结构、带货转化、账号运营进入对应生成器；免费 AI 辅助，偏抖音语境与完播结构。",
  keywords: ["抖音运营", "抖音爆款", "抖音钩子", "口播脚本", "带货短视频", "抖音文案", "抖音创作者"]
});

export default function ZhDouyinLandingPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <ZhDouyinToolsLanding />
    </main>
  );
}
