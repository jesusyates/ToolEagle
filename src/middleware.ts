import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // v62.1: Ensure x-pathname is always set for zh-CN lang (even when supabase returns early)
  const requestHeaders = new Headers(request.headers);
  if (!requestHeaders.has("x-pathname")) {
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
  }
  const req = new NextRequest(request.url, { headers: requestHeaders });
  return await updateSession(req);
}

export const config = {
  matcher: [
    "/((?!api/sitemap|sitemap|robots\\.txt|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
