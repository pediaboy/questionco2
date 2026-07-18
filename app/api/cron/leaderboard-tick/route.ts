import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.LEADERBOARD_CRON_SECRET || "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Runs on a schedule (Mon-Fri, market hours). Grows the "Kontes Capai Lot" total_lot
// (trading volume never decreases, so this is always additive) plus a small pips/win-rate
// move, for every leaderboard entry flagged auto_growth=true — keeps the lot contest feeling
// like a real, live competition. Weekends are skipped entirely (forex market closed).
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Jakarta time (WIB, UTC+7) day-of-week check — 0 = Sunday, 6 = Saturday.
  const nowUtc = new Date();
  const wibDay = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
  if (wibDay === 0 || wibDay === 6) {
    return NextResponse.json({ success: true, skipped: true, reason: "Market closed (weekend)" });
  }

  const admin = getSupabaseAdmin();

  const { data: entries, error } = await admin
    .from("qco2_profiles")
    .select("id, profit_pips, win_rate, total_trade, total_lot")
    .eq("auto_growth", true);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!entries || entries.length === 0) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  const updates = entries.map(async (e) => {
    // Lot volume only ever accumulates (real trading volume never "un-trades").
    const lotDelta = randomBetween(3, 26);
    const nextLot = Math.round((Number(e.total_lot ?? 0) + lotDelta) * 100) / 100;

    // Mostly-positive random pip move — occasional small pullback for realism.
    const delta = Math.random() < 0.78 ? randomBetween(4, 38) : -randomBetween(2, 14);
    const nextPips = Math.round((Number(e.profit_pips ?? 0) + delta) * 10) / 10;

    // Win rate drifts gently, clamped to a believable 55-92% band.
    const wrDrift = randomBetween(-1.2, 1.5);
    const nextWinRate = Math.min(92, Math.max(55, Math.round((Number(e.win_rate ?? 65) + wrDrift) * 10) / 10));

    // Trade count ticks up now and then, not every run.
    const nextTotalTrade = Number(e.total_trade ?? 0) + (Math.random() < 0.4 ? 1 : 0);

    return admin
      .from("qco2_profiles")
      .update({
        total_lot: nextLot,
        profit_pips: nextPips,
        win_rate: nextWinRate,
        total_trade: nextTotalTrade,
        updated_at: new Date().toISOString(),
      })
      .eq("id", e.id);
  });

  await Promise.all(updates);

  return NextResponse.json({ success: true, updated: entries.length });
}
