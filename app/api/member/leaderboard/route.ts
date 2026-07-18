import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select("email, full_name, profit_pips, win_rate, total_trade")
    .order("profit_pips", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const items = (data || []).map((p) => ({
    name: p.full_name || p.email.split("@")[0],
    profit_pips: p.profit_pips ?? 0,
    win_rate: p.win_rate ?? 0,
    total_trade: p.total_trade ?? 0,
  }));

  return NextResponse.json({ success: true, items });
}
