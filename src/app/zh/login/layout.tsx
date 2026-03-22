import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/login",
  title: zhSeoTitle("登录"),
  description: "使用邮箱验证码或 Google 登录 ToolEagle，跨设备同步保存的结果与历史。",
  keywords: ["ToolEagle", "登录", "邮箱登录", "创作者账户"]
});

export default function ZhLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
