import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";

/** V105.2 — Funnel /zh/tools/* traffic toward Douyin cluster */
export default function ZhToolsSubtreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-red-100 bg-red-50/50">
        <div className="container py-2 max-w-5xl">
          <ZhDouyinTrafficInjectionBanner compact />
        </div>
      </div>
      {children}
    </>
  );
}
