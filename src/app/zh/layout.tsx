import { ZhCnPerfBeacon } from "@/components/zh/ZhCnPerfBeacon";
import { ZhSiteHeader } from "@/components/zh/ZhSiteHeader";
import { ZhSiteFooter } from "@/components/zh/ZhSiteFooter";

/** 中国站统一壳层：顶栏 + 页面 + 页脚；子路由保留各自 `<main>` 与背景。 */
export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ZhCnPerfBeacon />
      <ZhSiteHeader />
      {children}
      <ZhSiteFooter />
    </>
  );
}
