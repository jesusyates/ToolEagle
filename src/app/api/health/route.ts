import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: { status: string; db: string; redis: string } = {
    status: "ok",
    db: "unknown",
    redis: "unknown"
  };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1).single();
    result.db = error ? "error" : "connected";
  } catch (err) {
    console.error("[health] DB check failed:", err);
    result.db = "error";
    result.status = "degraded";
  }

  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      await redis.get("health:ping");
      result.redis = "connected";
    } else {
      result.redis = "skipped";
    }
  } catch (err) {
    console.error("[health] Redis check failed:", err);
    result.redis = "error";
    if (result.status === "ok") result.status = "degraded";
  }

  const statusCode = result.status === "ok" ? 200 : 503;
  return NextResponse.json(result, { status: statusCode });
}
