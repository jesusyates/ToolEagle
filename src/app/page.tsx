import { HomePageClient } from "./_components/HomePageClient";
import { TrendingMakeMoneySection } from "@/components/traffic/TrendingMakeMoneySection";
import { BASE_URL } from "@/config/site";

/** V97: hreflang pair with /zh */
export const metadata = {
  alternates: {
    canonical: `${BASE_URL}/`,
    languages: {
      en: `${BASE_URL}/`,
      "zh-CN": `${BASE_URL}/zh`
    }
  }
};

export default function HomePage() {
  return <HomePageClient trendingInjection={<TrendingMakeMoneySection englishOnly />} />;
}
