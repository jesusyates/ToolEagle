import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/dashboard/settings",
  title: zhSeoTitle("个人资料"),
  description: "设置创作者用户名与公开主页信息。",
  keywords: ["ToolEagle", "个人资料", "创作者"]
});

export default function ZhDashboardSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
