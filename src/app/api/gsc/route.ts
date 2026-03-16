import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

type GscData = {
  connected: boolean;
  indexedPages?: number;
  topQueries?: { query: string; clicks: number; impressions: number }[];
  totalClicks?: number;
  totalImpressions?: number;
  error?: string;
};

export async function GET(): Promise<NextResponse<GscData>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
  }

  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GSC_SITE_URL ?? `${BASE_URL}/`;

  if (!clientEmail || !privateKey) {
    return NextResponse.json({
      connected: false,
      error: "GSC credentials not configured. Set GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY."
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
    });

    const searchconsole = google.searchconsole({ version: "v1", auth });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const [sitemapsRes, analyticsRes] = await Promise.all([
      searchconsole.sitemaps.list({ siteUrl }).catch(() => ({ data: {} })),
      searchconsole.searchanalytics
        .query({
          siteUrl,
          requestBody: {
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
            dimensions: ["query"],
            rowLimit: 20
          }
        })
        .catch(() => null)
    ]);

    let indexedPages: number | undefined;
    const sitemaps = (sitemapsRes.data as any)?.sitemap;
    if (Array.isArray(sitemaps) && sitemaps.length > 0) {
      indexedPages = sitemaps.reduce((sum: number, s: any) => sum + (s.contents?.[0]?.indexed ?? 0), 0);
    }

    let totalClicks = 0;
    let totalImpressions = 0;
    const topQueries: { query: string; clicks: number; impressions: number }[] = [];

    if (analyticsRes?.data?.rows) {
      for (const row of analyticsRes.data.rows as any[]) {
        totalClicks += row.clicks ?? 0;
        totalImpressions += row.impressions ?? 0;
        topQueries.push({
          query: row.keys?.[0] ?? "",
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0
        });
      }
    }

    return NextResponse.json({
      connected: true,
      indexedPages,
      topQueries,
      totalClicks,
      totalImpressions
    });
  } catch (err: any) {
    console.error("GSC API error:", err?.message ?? err);
    return NextResponse.json({
      connected: false,
      error: err?.message ?? "Failed to fetch GSC data"
    });
  }
}
