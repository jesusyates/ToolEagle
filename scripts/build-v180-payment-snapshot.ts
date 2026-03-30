#!/usr/bin/env npx tsx
/**
 * V180 — Pull orders + payment_events from Supabase for revenue attribution (optional when service role set).
 */
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });
dotenv.config();
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "v180-payment-db-snapshot.json");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  if (!url || !key) {
    fs.writeFileSync(
      OUT,
      JSON.stringify(
        {
          ok: false,
          builtAt: new Date().toISOString(),
          error: "missing_NEXT_PUBLIC_SUPABASE_URL_or_SUPABASE_SERVICE_ROLE_KEY",
          orders: [],
          payment_events: []
        },
        null,
        2
      ),
      "utf8"
    );
    console.warn("[build-v180-payment-snapshot] skipped — no service role / URL");
    return;
  }

  const supabase = createClient(url, key);
  const ordersRes = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(4000);
  const eventsRes = await supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(12000);

  if (eventsRes.error) {
    const msg = String(eventsRes.error?.message || "payment_events_query_failed");
    const looksLikeMissingTable =
      msg.includes("public.payment_events") &&
      (msg.toLowerCase().includes("schema cache") || msg.toLowerCase().includes("does not exist") || msg.toLowerCase().includes("not found"));

    // Some environments never applied V115+ migrations; in that case we still want
    // the afternoon stack to proceed (revenue attribution can degrade to orders-only).
    if (looksLikeMissingTable) {
      fs.writeFileSync(
        OUT,
        JSON.stringify(
          {
            ok: true,
            builtAt: new Date().toISOString(),
            orders: ordersRes.data ?? [],
            orders_error: ordersRes.error?.message ?? null,
            payment_events: [],
            payment_events_error: msg,
            note: "payment_events missing; snapshot degraded to orders-only"
          },
          null,
          2
        ),
        "utf8"
      );
      // Use stdout to avoid PowerShell treating stderr as a hard "NativeCommandError".
      console.log("[build-v180-payment-snapshot] payment_events missing; degraded snapshot written.", msg);
      return;
    }

    fs.writeFileSync(
      OUT,
      JSON.stringify(
        {
          ok: false,
          builtAt: new Date().toISOString(),
          error: "payment_events_query_failed",
          orders: ordersRes.data ?? [],
          orders_error: ordersRes.error?.message ?? null,
          payment_events: [],
          payment_events_error: eventsRes.error.message
        },
        null,
        2
      ),
      "utf8"
    );
    console.error(
      "[build-v180-payment-snapshot] FATAL: payment_events is required for revenue closure. Apply Supabase migrations (e.g. 0037_v184_payment_events_closure.sql).",
      eventsRes.error.message
    );
    process.exit(1);
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        ok: true,
        builtAt: new Date().toISOString(),
        orders: ordersRes.data ?? [],
        orders_error: ordersRes.error?.message ?? null,
        payment_events: eventsRes.data ?? [],
        payment_events_error: null
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("[build-v180-payment-snapshot] wrote", OUT, "orders", (ordersRes.data ?? []).length);
}

main().catch((e) => {
  console.error("[build-v180-payment-snapshot]", e);
  process.exitCode = 1;
});
