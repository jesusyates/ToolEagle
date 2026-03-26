import { NextRequest, NextResponse } from "next/server";
import {
  dequeueBatch,
  peekPendingCount,
  recordSubmission
} from "@/lib/indexing-queue";
import { submitUrlToGoogleIndexing } from "@/lib/google-indexing-submit";

export const dynamic = "force-dynamic";

/**
 * V106: Batch-process pending URLs (Google Indexing API). Non-blocking for callers.
 * Auth: Authorization: Bearer INDEXING_QUEUE_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INDEXING_QUEUE_SECRET;
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let max = 15;
  try {
    const body = await req.json();
    if (typeof body?.max === "number") max = Math.min(50, Math.max(1, body.max));
  } catch {
    // no body
  }

  const before = peekPendingCount();
  const batch = dequeueBatch(max);
  const results: { url: string; ok: boolean; error?: string }[] = [];

  for (const item of batch) {
    const url = item?.url;
    if (!url) continue;
    const r = await submitUrlToGoogleIndexing(url);
    if (r.ok) {
      recordSubmission({ url, source: item.source, ok: true });
      results.push({ url, ok: true });
    } else {
      recordSubmission({ url, source: item.source, ok: false, error: r.error });
      results.push({ url, ok: false, error: r.error });
    }
  }

  const after = peekPendingCount();
  return NextResponse.json({
    ok: true,
    pendingBefore: before,
    pendingAfter: after,
    processed: results.length,
    results
  });
}
