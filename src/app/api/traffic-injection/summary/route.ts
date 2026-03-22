import { NextRequest, NextResponse } from "next/server";
import { getTrafficInjectionContext, getPrimaryMoneyPage, type InjectionLocale, type InjectionVariant } from "@/lib/traffic-injection-data";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get("locale") === "en" ? "en" : "zh") as InjectionLocale;
    const variant = (searchParams.get("variant") === "b" ? "b" : "a") as InjectionVariant;
    const ctx = await getTrafficInjectionContext({ locale, variant });
    const primary = getPrimaryMoneyPage(ctx.pages);
    if (!primary) {
      return NextResponse.json({ primary: null });
    }
    const path = primary.href.startsWith(BASE_URL)
      ? primary.href.slice(BASE_URL.length) || "/"
      : new URL(primary.href).pathname;

    return NextResponse.json({
      primary: { title: primary.title, href: path.startsWith("/") ? path : `/${path}` },
      cache: ctx.cacheBackend,
      locale: ctx.locale
    });
  } catch {
    return NextResponse.json({ primary: null });
  }
}
