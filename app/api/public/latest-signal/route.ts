import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Public homepage teaser: the most recent signal's pair/direction/status only.
// Deliberately never returns entry/stop_loss/take_profit prices (those stay
// gated behind login/VIP) -- only the outcome, which is safe to show publicly
// as a track-record teaser (the trade is already live or closed).
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_signals")
    .select("pair, direction, status, hit_level, source, strategy_mode, confidence, created_at, closed_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, signal: data });
}
