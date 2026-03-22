import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Cron secret or logged-in user */
export async function allowProgrammaticSeoWrite(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  if (secret && request.headers.get("x-cron-secret") === secret) return true;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return !!user;
}
