import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const WIN_RATE_FLOOR = 80; // owner requirement: community win rate must always read >= 80%

// "Community Intel" stats on the member dashboard home -- computed LIVE from the real,
// combined totals across every member profile (qco2_profiles.total_trade / profit_pips),
// not a static admin-set number. Win rate is the real average across all profiles, floored
// at WIN_RATE_FLOOR (never shown below 80%) per owner request. The 4th slot is no longer
// "Kelas Selesai" -- it's the latest signal (auto-updates the instant a new signal fires).
export async function GET() {
  const admin = getSupabaseAdmin();

  const { data: profiles, error } = await admin.from("qco2_profiles").select("total_trade, profit_pips, win_rate");
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  let totalTrade = 0;
  let profitPips = 0;
  let winRateSum = 0;
  let winRateCount = 0;
  for (const p of profiles || []) {
    totalTrade += Number(p.total_trade ?? 0);
    profitPips += Number(p.profit_pips ?? 0);
    if (p.win_rate !== null && p.win_rate !== undefined) {
      winRateSum += Number(p.win_rate);
      winRateCount += 1;
    }
  }
  const winRateAvg = winRateCount > 0 ? winRateSum / winRateCount : WIN_RATE_FLOOR;
  const winRate = Math.round(Math.max(WIN_RATE_FLOOR, winRateAvg) * 10) / 10;

  const { data: latestSignal } = await admin
    .from("qco2_signals")
    .select("id, pair, direction, status, audience, confidence, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    stats: {
      win_rate: winRate,
      total_trade: totalTrade,
      profit_pips: Math.round(profitPips * 10) / 10,
      latest_signal: latestSignal || null,
      updated_at: new Date().toISOString(),
    },
  });
}
