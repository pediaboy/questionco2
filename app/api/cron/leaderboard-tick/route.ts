import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.LEADERBOARD_CRON_SECRET || "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type ScanRow = { s: string; d: [number, number] };
async function scan(market: string, tickers: string[]): Promise<Record<string, [number, number]>> {
  const res = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols: { tickers }, columns: ["close", "change"] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingView ${market} scan failed: ${res.status}`);
  const json: { data?: ScanRow[] } = await res.json();
  const map: Record<string, [number, number]> = {};
  for (const row of json.data || []) map[row.s] = row.d;
  return map;
}

async function getLivePrices(): Promise<{ xau: number; btc: number }> {
  try {
    const [crypto, cfd] = await Promise.all([
      scan("crypto", ["BINANCE:BTCUSDT"]),
      scan("cfd", ["OANDA:XAUUSD"]),
    ]);
    const btc = crypto["BINANCE:BTCUSDT"]?.[0];
    const xau = cfd["OANDA:XAUUSD"]?.[0];
    return { xau: xau || 2350, btc: btc || 65000 };
  } catch {
    // Fallback prices if TradingView is briefly unreachable — keeps the tick running.
    return { xau: 2350, btc: 65000 };
  }
}

// Runs every 5 minutes (see the "Leaderboard Auto Growth" workflow). For every profile with
// auto_growth=true, randomly generates 0-2 small realistic trade entries (0.01-1.00 lot each,
// XAU/USD or BTC/USDT, priced off the live TradingView feed) into qco2_lot_entries and adds
// their sum to total_lot — this is what makes the "Kontes Capai Lot" race feel organic instead
// of one flat number jump. Also nudges profit_pips/win_rate/total_trade a little for realism.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: entries, error } = await admin
    .from("qco2_profiles")
    .select("id, profit_pips, win_rate, total_trade, total_lot")
    .eq("auto_growth", true);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if (!entries || entries.length === 0) {
    return NextResponse.json({ success: true, updated: 0 });
  }

  const { xau, btc } = await getLivePrices();
  const newLotEntries: { profile_id: string; pair: string; lot_size: number; price: number; is_auto: boolean }[] = [];

  const updates = entries.map(async (e) => {
    // 0-2 realistic trade entries per tick, per profile — not everyone moves every tick.
    const roll = Math.random();
    const entryCount = roll < 0.05 ? 2 : roll < 0.3 ? 1 : 0;

    let lotDelta = 0;
    for (let i = 0; i < entryCount; i++) {
      const pair = Math.random() < 0.5 ? "XAUUSD" : "BTCUSDT";
      const lot = round2(randomBetween(0.01, 1));
      const price = pair === "XAUUSD" ? xau : btc;
      lotDelta += lot;
      newLotEntries.push({ profile_id: e.id, pair, lot_size: lot, price, is_auto: true });
    }

    const nextLot = round2(Number(e.total_lot ?? 0) + lotDelta);

    // Small, infrequent pip/win-rate/trade drift — cosmetic realism, scaled down since this
    // now runs every 5 min instead of every 2 hours.
    const nextPips =
      Math.random() < 0.5
        ? Math.round((Number(e.profit_pips ?? 0) + (Math.random() < 0.78 ? randomBetween(0.2, 1.6) : -randomBetween(0.1, 0.6))) * 10) / 10
        : e.profit_pips;
    const nextWinRate =
      Math.random() < 0.2
        ? Math.min(92, Math.max(55, Math.round((Number(e.win_rate ?? 65) + randomBetween(-0.3, 0.4)) * 10) / 10))
        : e.win_rate;
    const nextTotalTrade = Number(e.total_trade ?? 0) + (Math.random() < 0.08 ? 1 : 0);

    return admin
      .from("qco2_profiles")
      .update({
        total_lot: nextLot,
        profit_pips: nextPips,
        win_rate: nextWinRate,
        total_trade: nextTotalTrade,
        updated_at: new Date().toISOString(),
      })
      .eq("id", e.id);
  });

  await Promise.all(updates);

  if (newLotEntries.length > 0) {
    await admin.from("qco2_lot_entries").insert(newLotEntries);
  }

  return NextResponse.json({ success: true, updated: entries.length, entries_created: newLotEntries.length });
}
