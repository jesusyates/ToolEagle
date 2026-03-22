import { NextRequest, NextResponse } from "next/server";
import { getTrafficInjectionContext, type InjectionLocale, type InjectionVariant } from "@/lib/traffic-injection-data";
import { buildInjectionDistributionPack } from "@/lib/injection-distribution-pack";

export const dynamic = "force-dynamic";

/** Public read: aggressive distribution pack for top 5 money pages */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get("locale") === "en" ? "en" : "zh") as InjectionLocale;
    const variant = (searchParams.get("variant") === "b" ? "b" : "a") as InjectionVariant;
    const skipCache = searchParams.get("skipCache") === "1";

    const ctx = await getTrafficInjectionContext({ locale, variant, skipCache });
    const pack = buildInjectionDistributionPack(ctx.pages);
    return NextResponse.json({
      pack,
      source: ctx.source,
      locale: ctx.locale,
      variant: ctx.variant,
      cache: ctx.cacheBackend
    });
  } catch (e) {
    console.error("[traffic-injection/pack]", e);
    return NextResponse.json({ pack: [], source: "error" });
  }
}
