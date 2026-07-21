// Pair configuration for the auto-signal engine. `dataInstId` is the OKX symbol
// used to compute the technical signal. For XAUUSD we use XAUT-USDT (Tether Gold,
// closely tracks LBMA spot gold with good liquidity) as a real-time data proxy for
// direction/momentum, but price levels (entry/TP/SL) are anchored to the site's own
// live XAUUSD ticker price so displayed numbers match what members see elsewhere.
// BTC/ETH/SOL use their OKX USDT pair directly (both signal + price anchor).
//
// Risk model (fixed, no ATR): SL is always 50 pips from entry. TP1/TP2/TP3 sit at
// 50/100/200 pips — RR 1:1, 1:2, 1:4. `pipUnit` is the price value of ONE pip for
// that instrument (e.g. 0.1 for XAUUSD), so the same 50/100/200 pip counts scale
// correctly across very different instruments via `pipsToPrice(pips, pipUnit)`.
// pipUnit values are calibrated so the resulting 50-pip SL sits at roughly 3-3.5x
// each instrument's average 5-minute price range (checked live against OKX data on
// 2026-07-19) — tight enough to matter, wide enough to survive normal noise.
export interface PairConfig {
  key: string;
  label: string;
  dataInstId: string;
  useLiveTickerFor?: "XAU/USD" | "BTC/USD" | "ETH/USD";
  pipUnit: number;
  tpPips: [number, number, number]; // TP1 (RR 1:1), TP2 (RR 1:2), TP3 (RR 1:4)
  slPips: number; // static, always 50
  pipLabelSuffix: string; // always "pips" -- pipUnit already converts each instrument's own move-size into a comparable pip count, so the label must say "pips" everywhere, never a currency name (fixed 2026-07-20, was wrongly "USD" for crypto pairs)
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
    pipUnit: 4, // 1 "pip" = $4 move -> 50-pip SL = $200 (~0.31% of ~$64.5k)
    // Swing-trade profile (owner request 2026-07-21): TP1/TP2/TP3 = 150/200/500 pips,
    // matching the real fixed-pip ladder the auto-signal cron now uses for BTC
    // specifically (see app/api/cron/auto-signal/route.ts) -- kept in sync here so
    // the recap report and the open-positions BE/SL estimate reference the same
    // real targets instead of the old generic 50/100/200.
    tpPips: [150, 200, 500],
    slPips: 50,
    pipLabelSuffix: "pips",
    skipWeekends: false,
  },
  {
    key: "ETHUSDT",
    label: "ETHUSDT",
    dataInstId: "ETH-USDT",
    pipUnit: 0.2, // 1 "pip" = $0.20 move -> 50-pip SL = $10 (~0.53% of ~$1.87k)
    tpPips: [50, 100, 200],
    slPips: 50,
    pipLabelSuffix: "pips",
    skipWeekends: false,
  },
  {
    key: "SOLUSDT",
    label: "SOLUSDT",
    dataInstId: "SOL-USDT",
    pipUnit: 0.008, // 1 "pip" = $0.008 move -> 50-pip SL = $0.40 (~0.53% of ~$76)
    tpPips: [50, 100, 200],
    slPips: 50,
    pipLabelSuffix: "pips",
    skipWeekends: false,
  },
];
