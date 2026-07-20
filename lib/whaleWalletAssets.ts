// LASTQUESTION.CO :: WHALE WALLET MONITOR -- asset universe definition.
// Every price here is 100% real-time market data, zero dummy: crypto via OKX
// bulk SPOT ticker endpoint, forex + commodities via the same TradingView
// scanner technique already used site-wide (/api/ticker, useEtf.ts). No
// balances/quantities are simulated -- this is a live multi-asset price board,
// not a simulated portfolio.

export interface WhaleAsset {
  symbol: string; // display symbol, e.g. "BTC/USDT"
  category: "Crypto" | "Forex" | "Komoditas";
  // source-specific lookup key
  okxInstId?: string; // for category === "Crypto"
  tvMarket?: "forex" | "cfd" | "futures"; // for Forex/Komoditas
  tvTicker?: string; // TradingView scanner symbol
}

export const WHALE_ASSETS: WhaleAsset[] = [
  // Crypto -- OKX SPOT bulk ticker
  { symbol: "BTC/USDT", category: "Crypto", okxInstId: "BTC-USDT" },
  { symbol: "ETH/USDT", category: "Crypto", okxInstId: "ETH-USDT" },
  { symbol: "SOL/USDT", category: "Crypto", okxInstId: "SOL-USDT" },
  { symbol: "BNB/USDT", category: "Crypto", okxInstId: "BNB-USDT" },
  { symbol: "XRP/USDT", category: "Crypto", okxInstId: "XRP-USDT" },
  { symbol: "DOGE/USDT", category: "Crypto", okxInstId: "DOGE-USDT" },

  // Forex -- TradingView "forex" scanner bucket, OANDA feed
  { symbol: "EUR/USD", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:EURUSD" },
  { symbol: "GBP/USD", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:GBPUSD" },
  { symbol: "USD/JPY", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:USDJPY" },
  { symbol: "AUD/USD", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:AUDUSD" },
  { symbol: "USD/CHF", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:USDCHF" },
  { symbol: "USD/CAD", category: "Forex", tvMarket: "forex", tvTicker: "OANDA:USDCAD" },

  // Komoditas -- TradingView "cfd" (spot) + "futures" buckets
  { symbol: "XAU/USD", category: "Komoditas", tvMarket: "cfd", tvTicker: "OANDA:XAUUSD" },
  { symbol: "XAG/USD", category: "Komoditas", tvMarket: "cfd", tvTicker: "TVC:SILVER" },
  { symbol: "CRUDE OIL", category: "Komoditas", tvMarket: "futures", tvTicker: "NYMEX:CL1!" },
  { symbol: "NATGAS", category: "Komoditas", tvMarket: "futures", tvTicker: "NYMEX:NG1!" },
];
