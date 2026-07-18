import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ScanRow = { s: string; d: [number, number] };
type ScanResponse = { data?: ScanRow[] };

async function scan(market: string, tickers: string[]): Promise<Record<string, [number, number]>> {
  const res = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbols: { tickers },
      columns: ["close", "change"],
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`TradingView ${market} scan failed: ${res.status}`);
  const json: ScanResponse = await res.json();

  const map: Record<string, [number, number]> = {};
  for (const row of json.data || []) {
    map[row.s] = row.d;
  }
  return map;
}

export async function GET() {
  try {
    const [crypto, cfd] = await Promise.all([
      scan("crypto", ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"]),
      scan("cfd", ["OANDA:XAUUSD"]),
    ]);

    const btc = crypto["BINANCE:BTCUSDT"];
    const eth = crypto["BINANCE:ETHUSDT"];
    const xau = cfd["OANDA:XAUUSD"];

    if (!btc || !eth || !xau) {
      return NextResponse.json({ success: false, error: "Incomplete data from TradingView" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      items: [
        { symbol: "BTC/USD", price: btc[0], change: btc[1] },
        { symbol: "ETH/USD", price: eth[0], change: eth[1] },
        { symbol: "XAU/USD", price: xau[0], change: xau[1] },
      ],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
