import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_FAILED_COOKIE = "te_auth_failed";

export async function GET() {
  const cookieStore = await cookies();
  const failed = cookieStore.get(AUTH_FAILED_COOKIE)?.value;

  const res = NextResponse.json({ status: failed ? "failed" : "pending" });

  if (failed) {
    res.cookies.set(AUTH_FAILED_COOKIE, "", { maxAge: 0, path: "/" });
  }

  return res;
}
