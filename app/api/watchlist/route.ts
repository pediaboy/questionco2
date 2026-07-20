import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Auto Watchlist feed -- READ ONLY. There is no manual add/remove anymore
 * (owner request 2026-07-21: "bukan manual isi, tapi otomatis kalo ada coin
 * yg bagus bakal masuk"). Rows are written exclusively by the cron scanner at
 * /api/cron/watchlist-scan (lib/autoWatchlistEngine.ts), every 5 minutes,
 * based on real OKX 1H momentum/volume/breakout criteria. This is a public
 * market-data feed (like /api/public/latest-signal), no per-user auth needed.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_auto_watchlist")
    .select("id, pair, direction, score, change_1h, change_4h, volume_ratio, is_breakout, last_price, reasoning, first_detected_at, last_seen_at")
    .order("score", { ascending: false });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data || [], scannedAt: new Date().toISOString() });
}
