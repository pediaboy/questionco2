// Curated list of popular US-listed ETFs, grouped by category.
// Free, no API key — same TradingView scanner technique used by /api/ticker.
export interface EtfConfig {
  symbol: string; // display ticker, e.g. "SPY"
  tvTicker: string; // TradingView scanner symbol, e.g. "AMEX:SPY"
  category: string;
}

export const ETF_CATEGORIES = [
  "Indeks Utama",
  "Komoditas",
  "Sektor",
  "Obligasi & Properti",
  "Pasar Global",
  "Tematik & Volatilitas",
] as const;

export const ETF_LIST: EtfConfig[] = [
  // Indeks Utama
  { symbol: "SPY", tvTicker: "AMEX:SPY", category: "Indeks Utama" },
  { symbol: "QQQ", tvTicker: "NASDAQ:QQQ", category: "Indeks Utama" },
  { symbol: "DIA", tvTicker: "AMEX:DIA", category: "Indeks Utama" },
  { symbol: "IWM", tvTicker: "AMEX:IWM", category: "Indeks Utama" },
  { symbol: "VTI", tvTicker: "AMEX:VTI", category: "Indeks Utama" },
  { symbol: "VOO", tvTicker: "AMEX:VOO", category: "Indeks Utama" },
  // Komoditas
  { symbol: "GLD", tvTicker: "AMEX:GLD", category: "Komoditas" },
  { symbol: "SLV", tvTicker: "AMEX:SLV", category: "Komoditas" },
  { symbol: "USO", tvTicker: "AMEX:USO", category: "Komoditas" },
  // Sektor
  { symbol: "XLF", tvTicker: "AMEX:XLF", category: "Sektor" },
  { symbol: "XLE", tvTicker: "AMEX:XLE", category: "Sektor" },
  { symbol: "XLK", tvTicker: "AMEX:XLK", category: "Sektor" },
  { symbol: "XLV", tvTicker: "AMEX:XLV", category: "Sektor" },
  // Obligasi & Properti
  { symbol: "TLT", tvTicker: "NASDAQ:TLT", category: "Obligasi & Properti" },
  { symbol: "VNQ", tvTicker: "AMEX:VNQ", category: "Obligasi & Properti" },
  // Pasar Global
  { symbol: "EEM", tvTicker: "AMEX:EEM", category: "Pasar Global" },
  { symbol: "VWO", tvTicker: "AMEX:VWO", category: "Pasar Global" },
  // Tematik & Volatilitas
  { symbol: "ARKK", tvTicker: "CBOE:ARKK", category: "Tematik & Volatilitas" },
  { symbol: "VXX", tvTicker: "CBOE:VXX", category: "Tematik & Volatilitas" },
];
