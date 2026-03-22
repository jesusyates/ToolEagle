import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZhSupportPageClient } from "./ZhSupportPageClient";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/support",
  title: zhSeoTitle("支持者中心 — 感谢与权益"),
  description:
    "查看支持记录、支持者等级与轻量权益：额外每日生成次数、免费档多可见一套文案包等。打赏通过微信/支付宝；登记用于感谢与账号关联。"
});

export default function ZhSupportPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <ZhSupportPageClient />
    </main>
  );
}
