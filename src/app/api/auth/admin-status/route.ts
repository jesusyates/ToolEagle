import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";

export const dynamic = "force-dynamic";

/** Read-only: whether the current session user has `profiles.role === "admin"`. */
export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ admin });
}
