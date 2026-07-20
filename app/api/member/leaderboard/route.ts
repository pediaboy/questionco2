import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getNextTier, getProgressPercent } from "@/lib/contestTiers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select("email, full_name, total_lot, win_rate, total_trade, is_dummy, broker_registered")
    .or("is_dummy.eq.true,broker_registered.eq.true")
    .order("total_lot", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const items = (data || []).map((p) => {
    const total_lot = p.total_lot ?? 0;
    const nextTier = getNextTier(total_lot);
    return {
      name: p.full_name || (p.email ? p.email.split("@")[0] : "Trader"),
      total_lot,
      win_rate: p.win_rate ?? 0,
      total_trade: p.total_trade ?? 0,
      next_tier_lot: nextTier?.lot ?? null,
      next_tier_reward: nextTier?.reward ?? null,
      progress_percent: getProgressPercent(total_lot, nextTier),
    };
  });

  return NextResponse.json({ success: true, items });
}
