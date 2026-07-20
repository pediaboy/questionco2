import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scanUniverseForHotCoins } from "@/lib/autoWatchlistEngine";

export const dynamic = "force-dynamic";

// Shared with /api/cron/auto-signal -- same trusted cron caller (Base44 workflow),
// no need for a second secret.
const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

async function handle(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const results = await scanUniverseForHotCoins();
  const qualifying = results.filter((r) => r.qualifies);

  for (const r of qualifying) {
    const { error } = await admin.from("qco2_auto_watchlist").upsert(
      {
        pair: r.pair,
        direction: r.direction,
        score: r.score,
        change_1h: r.change1h,
        change_4h: r.change4h,
        volume_ratio: r.volumeRatio,
        is_breakout: r.isBreakout,
        last_price: r.lastPrice,
        reasoning: r.reasoning,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "pair" }
    );
    if (error) {
      console.error(`watchlist-scan upsert failed for ${r.pair}:`, error.message);
    }
  }

  // Anything not in this tick's qualifying set has cooled off -- drop it so the
  // list always reflects the current live market state, never stale entries.
  const qualifyingPairs = qualifying.map((r) => r.pair);
  if (qualifyingPairs.length > 0) {
    await admin.from("qco2_auto_watchlist").delete().not("pair", "in", `(${qualifyingPairs.join(",")})`);
  } else {
    await admin.from("qco2_auto_watchlist").delete().neq("pair", "__none__");
  }

  return NextResponse.json({
    success: true,
    scanned: results.length,
    qualifying: qualifying.length,
    pairs: qualifyingPairs,
    errors: results.filter((r) => r.error).map((r) => `${r.pair}: ${r.error}`),
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
