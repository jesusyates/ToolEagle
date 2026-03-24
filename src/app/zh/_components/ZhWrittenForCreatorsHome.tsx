import { ZhStationBrandHero } from "@/components/zh/ZhStationBrandHero";
import { ZhHomepageKeywordSections } from "@/components/zh/ZhHomepageKeywordSections";
import { ZH_STATION_COMMITMENTS } from "@/config/zh-station-commitments";

/**
 * 中文站首页：品牌首屏（含「从这里开始逛」三入口）+「我们坚持的四件事」。
 */
export function ZhWrittenForCreatorsHome() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <div className="flex-1">
        <ZhStationBrandHero />

        <section
          id="zh-commitments"
          className="border-t border-stone-200/80 bg-gradient-to-b from-[#faf8f5] to-white py-16 md:py-20 scroll-mt-20"
        >
          <div className="container max-w-4xl px-4">
            <h2 className="text-center font-serif text-2xl md:text-3xl font-bold text-stone-900">
              我们坚持的四件事
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-stone-600 leading-relaxed">
              写给正在日更、正在试错、正在把内容当成事业的你——不画大饼，只把产品原则说清楚。
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2">
              {ZH_STATION_COMMITMENTS.map((c) => (
                <li
                  key={c.title}
                  className="rounded-2xl border border-stone-200/90 bg-white/90 p-6 shadow-sm shadow-stone-200/40"
                >
                  <h3 className="text-lg font-bold text-red-950">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <ZhHomepageKeywordSections />
      </div>
    </main>
  );
}
