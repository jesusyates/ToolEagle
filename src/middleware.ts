import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getCountryFromHeaders, getCountryFromPathname } from "@/lib/country";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  if (!requestHeaders.has("x-pathname")) {
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
  }
  // V76.5: Attach country for analytics (cf-ipcountry, x-vercel-ip-country, or pathname fallback)
  if (!requestHeaders.has("x-country")) {
    const fromHeader = getCountryFromHeaders(request.headers);
    const country = fromHeader ?? getCountryFromPathname(request.nextUrl.pathname);
    requestHeaders.set("x-country", country);
  }
  const req = new NextRequest(request.url, { headers: requestHeaders });
  return await updateSession(req);
}

export const config = {
  matcher: [
    "/((?!api/sitemap|sitemap|robots\\.txt|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
