import { ZhWrittenForCreatorsHome } from "./_components/ZhWrittenForCreatorsHome";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh",
  title: zhSeoTitle("写给中国创作者"),
  description:
    "专为中国自媒体与短视频创作者：抖音场景深度优先，钩子·口播·文案包与模板库闭环，支持微信/支付宝。本土创作者系统，非翻译壳。",
  keywords: ["ToolEagle", "短视频文案", "自媒体工具", "抖音运营", "创作者增长", "短视频工具"]
});

export default function ZhHomePage() {
  return <ZhWrittenForCreatorsHome />;
}
