import { NextResponse } from "next/server";
import { ETF_LIST } from "@/lib/etfList";

export const dynamic = "force-dynamic";

type ScanRow = { s: string; d: [number, number, number, string] };
type ScanResponse = { data?: ScanRow[] };

async function scanAmerica(tickers: string[]): Promise<Record<string, [number, number, number, string]>> {
  const res = await fetch("https://scanner.tradingview.com/america/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({
      symbols: { tickers },
      columns: ["close", "change", "volume", "description"],
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`TradingView america scan failed: ${res.status}`);
  const json: ScanResponse = await res.json();

  const map: Record<string, [number, number, number, string]> = {};
  for (const row of json.data || []) {
    map[row.s] = row.d;
  }
  return map;
}

export async function GET() {
  try {
    const tvTickers = ETF_LIST.map((e) => e.tvTicker);
    const scanned = await scanAmerica(tvTickers);

    const items = ETF_LIST.map((e) => {
      const row = scanned[e.tvTicker];
      return {
        symbol: e.symbol,
        category: e.category,
        name: row ? row[3] : e.symbol,
        price: row ? row[0] : null,
        change: row ? row[1] : null,
        volume: row ? row[2] : null,
      };
    });

    const missing = items.filter((i) => i.price === null).length;
    if (missing === items.length) {
      return NextResponse.json({ success: false, error: "No data from TradingView" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      items,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
