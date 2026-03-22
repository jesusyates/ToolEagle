import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";

/** V105.2 — High-intent zh PSEO → Douyin hub */
export default function ZhPseoSubtreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-red-100 bg-red-50/50">
        <div className="container py-2 max-w-3xl">
          <ZhDouyinTrafficInjectionBanner compact />
        </div>
      </div>
      {children}
    </>
  );
}
