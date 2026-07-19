import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const PAIR_LABEL: Record<string, string> = { XAUUSD: "XAU/USD", BTCUSDT: "BTC/USDT" };

// Live feed of recent trade entries across all contest participants — makes the
// "Kontes Capai Lot" feel like a real trading floor with members actively opening
// positions right now.
export async function GET() {
  const admin = getSupabaseAdmin();

  const { data: entries, error } = await admin
    .from("qco2_lot_entries")
    .select("id, profile_id, pair, lot_size, price, direction, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const profileIds = Array.from(new Set((entries || []).map((e) => e.profile_id)));
  const { data: profiles } = await admin
    .from("qco2_profiles")
    .select("id, full_name, email")
    .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

  const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name || p.email?.split("@")[0] || "Trader"]));

  const items = (entries || []).map((e) => ({
    id: e.id,
    name: nameById.get(e.profile_id) || "Trader",
    pair: PAIR_LABEL[e.pair] || e.pair,
    direction: e.direction || "BUY",
    lot_size: e.lot_size,
    price: e.price,
    created_at: e.created_at,
  }));

  return NextResponse.json({ success: true, items });
}
