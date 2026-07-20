import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// LASTQUESTION.CO :: Portfolio page "Live Community Activity" feed.
//
// Reads ONLY rows where qco2_profiles.is_dummy = true -- the existing,
// already-established demo roster (dummy1-15@leaderboard.local) used for the
// "Kontes Capai Lot" leaderboard auto-growth. This endpoint NEVER touches real
// member rows (is_dummy = false/null are excluded by the query itself) and
// NEVER writes anything -- the modal/lot/pair/direction shown here are
// generated fresh on every request, purely for a "live" cosmetic feel. These
// numbers are not persisted and cannot affect the real contest standings,
// which are computed from qco2_lot_entries / total_lot exactly as before.

const PAIRS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT", "EURUSD", "GBPUSD"];

function randomModal(): number {
  const t = Math.random();
  const min = Math.log(100);
  const max = Math.log(50000);
  return Math.round(Math.exp(min + t * (max - min)));
}

function randomLot(): number {
  return Math.round((Math.random() * 4.9 + 0.01) * 100) / 100;
}

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("qco2_profiles")
      .select("id, full_name")
      .eq("is_dummy", true);

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // Feature a random rotating subset each call so it doesn't always show the same 7 names.
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const featured = shuffled.slice(0, Math.min(7, shuffled.length));

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
