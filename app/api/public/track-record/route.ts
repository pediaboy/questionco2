import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface SignalRow {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number;
  stop_loss: number;
  take_profit: number;
  tp2: number | null;
  tp3: number | null;
  tp4: number | null;
  pip_unit: number | null;
  status: string;
  hit_level: string | null;
  closed_at: string | null;
  created_at: string;
}

// Computes the REAL pip result of a completed signal from its own stored
// entry/exit prices and pip_unit -- works generically for both manual and
// auto-engine signals (no assumption of a fixed pip scheme).
function realPips(sig: SignalRow): number {
  const unit = sig.pip_unit || 1;
  let exitPrice: number | null = null;
  if (sig.hit_level === "sl") exitPrice = sig.stop_loss;
  else if (sig.hit_level === "tp1") exitPrice = sig.take_profit;
  else if (sig.hit_level === "tp2") exitPrice = sig.tp2;
  else if (sig.hit_level === "tp3") exitPrice = sig.tp3;
  else if (sig.hit_level === "tp4") exitPrice = sig.tp4;
  if (exitPrice === null || !Number.isFinite(exitPrice)) return 0;
  const raw = sig.direction === "BUY" ? exitPrice - sig.entry : sig.entry - exitPrice;
  return Math.round(raw / unit);
}

function periodStartWIB(period: string): string {
  const now = new Date();
  if (period === "mingguan") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (period === "bulanan") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  // harian: since today 00:00 WIB (UTC+7)
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const wibMidnight = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate(), 0, 0, 0));
  return new Date(wibMidnight.getTime() - 7 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "bulanan";
  const since = periodStartWIB(period);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_signals")
    .select("id, pair, direction, entry, stop_loss, take_profit, tp2, tp3, tp4, pip_unit, status, hit_level, closed_at, created_at")
    .in("status", ["tp_hit", "sl_hit", "closed"])
    .gte("closed_at", since)
    .order("closed_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const rows = (data || []) as SignalRow[];
  const withPips = rows.map((r) => ({ ...r, pips: realPips(r) }));

  const wins = withPips.filter((r) => r.status === "tp_hit").length;
  const losses = withPips.filter((r) => r.status === "sl_hit").length;
  const decided = wins + losses;
  const winRate = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;
  const totalPips = withPips.reduce((sum, r) => sum + r.pips, 0);
  const completedCount = withPips.length;

  const recent = withPips.slice(0, 5).map((r) => ({
    pair: r.pair,
    direction: r.direction,
    status: r.status,
    pips: r.pips,
  }));

  return NextResponse.json({
    success: true,
    period,
    stats: {
      total_pips: totalPips,
      win_rate: winRate,
      completed_count: completedCount,
      wins,
      losses,
    },
    recent,
  });
}
