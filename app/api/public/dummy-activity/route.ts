import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// LASTQUESTION.CO :: Portfolio page "Live Feed Aktivitas Komunitas".
//
// Reads ONLY rows where qco2_profiles.is_dummy = true -- the existing,
// already-established demo roster (dummy1-15@leaderboard.local) used for the
// "Kontes Capai Lot" leaderboard auto-growth. This endpoint NEVER touches real
// member rows (is_dummy = false/null are excluded by the query itself) and
// NEVER writes anything -- the modal/lot/pair/direction shown here are
// generated fresh on every request, purely for a "live" cosmetic feel. These
// numbers are not persisted and cannot affect the real contest standings,
// which are computed from qco2_lot_entries / total_lot exactly as before.
//
// ?count=N controls how many rows come back: the client seeds with count=7
// on mount, then polls with count=1 every couple seconds to push ONE fresh
// "trade" onto the running feed at a time -- avoids the jarring full-list
// replace/jump the previous version had.

const PAIRS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT", "EURUSD", "GBPUSD"];

function randomLogWeighted(min: number, max: number): number {
  const t = Math.random();
  const lo = Math.log(min);
  const hi = Math.log(max);
  return Math.exp(lo + t * (hi - lo));
}

function randomModal(): number {
  return Math.round(randomLogWeighted(100, 50000));
}

function randomLot(): number {
  // 0.01 - 500 lot, log-weighted so small retail-sized trades are common and
  // big "whale" lots are rare -- feels organic instead of uniformly random.
  return Math.round(randomLogWeighted(0.01, 500) * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const count = Math.max(1, Math.min(20, Number(req.nextUrl.searchParams.get("count")) || 7));

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("qco2_profiles")
      .select("id, full_name")
      .eq("is_dummy", true);

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const featured = shuffled.slice(0, Math.min(count, shuffled.length));

    const items = featured.map((row) => ({
      id: row.id,
      alias: row.full_name,
      pair: PAIRS[Math.floor(Math.random() * PAIRS.length)],
      direction: Math.random() > 0.5 ? "BUY" : "SELL",
      modal: randomModal(),
      lot: randomLot(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
