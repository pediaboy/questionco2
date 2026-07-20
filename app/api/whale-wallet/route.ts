import { NextResponse } from "next/server";
import { WHALE_ASSETS } from "@/lib/whaleWalletAssets";

export const dynamic = "force-dynamic";

interface ScanRow {
  s: string;
  d: [number, number];
}

async function scanTv(market: string, tickers: string[]): Promise<Record<string, [number, number]>> {
  if (tickers.length === 0) return {};
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

async function fetchOkxBulkSpot(): Promise<Record<string, { last: number; open24h: number }>> {
  const res = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { cache: "no-store" });
  const json = await res.json();
  if (json.code !== "0" || !Array.isArray(json.data)) throw new Error("OKX bulk ticker fetch failed");
  const map: Record<string, { last: number; open24h: number }> = {};
  for (const row of json.data) {
    map[row.instId] = { last: Number(row.last), open24h: Number(row.open24h) };
  }
  return map;
}

export async function GET() {
  try {
    const forexTickers = WHALE_ASSETS.filter((a) => a.tvMarket === "forex").map((a) => a.tvTicker!);
    const cfdTickers = WHALE_ASSETS.filter((a) => a.tvMarket === "cfd").map((a) => a.tvTicker!);
    const futuresTickers = WHALE_ASSETS.filter((a) => a.tvMarket === "futures").map((a) => a.tvTicker!);

    const [okxMap, forexMap, cfdMap, futuresMap] = await Promise.all([
      fetchOkxBulkSpot(),
      scanTv("forex", forexTickers),
      scanTv("cfd", cfdTickers),
      scanTv("futures", futuresTickers),
    ]);

    type WhaleItemOut = { symbol: string; category: "Crypto" | "Forex" | "Komoditas"; price: number; change: number };

    const items: WhaleItemOut[] = WHALE_ASSETS.map((asset): WhaleItemOut | null => {
      if (asset.category === "Crypto" && asset.okxInstId) {
        const t = okxMap[asset.okxInstId];
        if (!t) return null;
        const change = t.open24h ? ((t.last - t.open24h) / t.open24h) * 100 : 0;
        return { symbol: asset.symbol, category: asset.category, price: t.last, change };
      }
      const tvMap = asset.tvMarket === "forex" ? forexMap : asset.tvMarket === "cfd" ? cfdMap : futuresMap;
      const row = asset.tvTicker ? tvMap[asset.tvTicker] : undefined;
      if (!row) return null;
      return { symbol: asset.symbol, category: asset.category, price: row[0], change: row[1] };
    }).filter((x): x is WhaleItemOut => x !== null);

    return NextResponse.json({ success: true, items, updated_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
