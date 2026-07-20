import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getLivePriceForPair } from "@/lib/signalEngine";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

export const dynamic = "force-dynamic";

const PAIR_LABEL: Record<string, string> = {
  XAUUSD: "XAU/USD",
  BTCUSDT: "BTC/USDT",
  ETHUSDT: "ETH/USDT",
  SOLUSDT: "SOL/USDT",
};

const BE_PIPS = 20; // matches the real signal system's first BE threshold (see lib/signalAlerts.ts BE_THRESHOLDS)

// Live feed of recent trade entries across all contest participants — makes the
// "Kontes Capai Lot" feel like a real trading floor with members actively opening
// positions right now. Each entry's status (RUNNING / BE_HIT / SL_HIT) is computed
// against the REAL current market price for its pair every time this route is hit —
// never fabricated. Uses the exact same pip math (pipUnit, slPips=50) as the real
// auto-signal engine (lib/signalPairs.ts) so the pip counts shown are consistent
// with what members see on actual signals.
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

  // Fetch each distinct pair's REAL live price once (not per-entry) to stay efficient.
  const distinctPairs = Array.from(new Set((entries || []).map((e) => e.pair)));
  const livePrices = new Map<string, number>();
  await Promise.all(
    distinctPairs.map(async (pairKey) => {
      const cfg = SIGNAL_PAIRS.find((p) => p.key === pairKey);
      if (!cfg) return;
      try {
        const price = await getLivePriceForPair(cfg.key, cfg.dataInstId);
        if (Number.isFinite(price) && price > 0) livePrices.set(pairKey, price);
      } catch {
        // if a live price fetch fails, entries for that pair just report status RUNNING below
      }
    })
  );

  const items = (entries || []).map((e) => {
    const cfg = SIGNAL_PAIRS.find((p) => p.key === e.pair);
    const livePrice = livePrices.get(e.pair);
    const entryPrice = Number(e.price);
    const direction = (e.direction || "BUY") as "BUY" | "SELL";

    let status: "RUNNING" | "BE_HIT" | "SL_HIT" = "RUNNING";
    let pips: number | null = null;

    if (cfg && livePrice && entryPrice > 0) {
      const sign = direction === "BUY" ? 1 : -1;
      pips = Math.round(((livePrice - entryPrice) * sign) / cfg.pipUnit);
      if (pips <= -cfg.slPips) status = "SL_HIT";
      else if (pips >= BE_PIPS) status = "BE_HIT";
    }

    return {
      id: e.id,
      name: nameById.get(e.profile_id) || "Trader",
      pair: PAIR_LABEL[e.pair] || e.pair,
      direction,
      lot_size: e.lot_size,
      price: e.price,
      created_at: e.created_at,
      status,
      pips,
      live_price: livePrice ?? null,
    };
  });

  return NextResponse.json({ success: true, items });
}
