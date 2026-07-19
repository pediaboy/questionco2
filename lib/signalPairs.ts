// Pair configuration for the auto-signal engine. `dataInstId` is the OKX symbol
// used to compute the technical signal. For XAUUSD we use XAUT-USDT (Tether Gold,
// closely tracks LBMA spot gold with good liquidity) as a real-time data proxy for
// direction/momentum, but price levels (entry/TP/SL) are anchored to the site's own
// live XAUUSD ticker price so displayed numbers match what members see elsewhere.
//
// Risk model (fixed, no ATR): SL is always 50 pips from entry. TP1/TP2/TP3 sit at
// 50/100/200 pips — RR 1:1, 1:2, 1:4. `pipUnit` is the price value of ONE pip for
// that instrument (e.g. 0.1 for XAUUSD), so the same 50/100/200 pip counts scale
// correctly across very different instruments via `pipsToPrice(pips, pipUnit)`.
export interface PairConfig {
  key: string;
  label: string;
  dataInstId: string;
  useLiveTickerFor?: "XAU/USD" | "BTC/USD" | "ETH/USD";
  pipUnit: number;
  tpPips: [number, number, number]; // TP1 (RR 1:1), TP2 (RR 1:2), TP3 (RR 1:4)
  slPips: number; // static, always 50
  pipLabelSuffix: string; // e.g. "pips" or "USD"
  skipWeekends: boolean;
}

export const SIGNAL_PAIRS: PairConfig[] = [
  {
    key: "XAUUSD",
    label: "XAUUSD",
    dataInstId: "XAUT-USDT",
    useLiveTickerFor: "XAU/USD",
    pipUnit: 0.1, // 1 pip = $0.10 move (standard XAUUSD retail convention)
    tpPips: [50, 100, 200],
    slPips: 50,
    pipLabelSuffix: "pips",
    skipWeekends: true,
  },
  {
    key: "BTCUSDT",
    label: "BTCUSDT",
    dataInstId: "BTC-USDT",
    pipUnit: 4, // 1 "pip" = $4 move — keeps the same 50/100/200 pip counts, scaled to BTC's volatility
    tpPips: [50, 100, 200],
    slPips: 50,
    pipLabelSuffix: "USD",
    skipWeekends: false,
  },
];
