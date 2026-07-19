// Shared pair config for the Live Market Terminal (CryptoTerminal + OrderBookPanel).
// XAU first per site convention, then majors, then popular alts.
// symbol = Binance spot pair used for price/depth feeds.
// base = short coin code used to match OKX's instFamily (e.g. "BTC-USDT") for liquidations.
export interface TerminalPair {
  symbol: string;
  label: string;
  base: string;
}

export const TERMINAL_PAIRS: TerminalPair[] = [
  { symbol: "PAXGUSDT", label: "XAU", base: "PAXG" }, // gold proxy (PAX Gold token)
  { symbol: "BTCUSDT", label: "BTC", base: "BTC" },
  { symbol: "ETHUSDT", label: "ETH", base: "ETH" },
  { symbol: "SOLUSDT", label: "SOL", base: "SOL" },
  { symbol: "BNBUSDT", label: "BNB", base: "BNB" },
  { symbol: "XRPUSDT", label: "XRP", base: "XRP" },
  { symbol: "DOGEUSDT", label: "DOGE", base: "DOGE" },
  { symbol: "ADAUSDT", label: "ADA", base: "ADA" },
  { symbol: "AVAXUSDT", label: "AVAX", base: "AVAX" },
  { symbol: "LINKUSDT", label: "LINK", base: "LINK" },
];

export function priceDecimalsFor(symbol: string): number {
  if (symbol.startsWith("XRP") || symbol.startsWith("ADA")) return 4;
  if (symbol.startsWith("DOGE")) return 5;
  return 2;
}
