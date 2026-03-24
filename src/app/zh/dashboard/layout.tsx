import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/dashboard",
  title: zhSeoTitle("工作台"),
  description: "查看收藏、生成历史与项目；管理创作者资料与账户权益。",
  keywords: ["ToolEagle", "工作台", "账户"]
});

export default function ZhDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
