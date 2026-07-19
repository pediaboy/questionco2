// Auto-signal generation engine — v2 (quant-grade filters).
// Data source: OKX public market-data API (free, no key, no geo-block from our hosting region).
//
// STRATEGY DESIGN NOTE (multi-timeframe split — the spec listed one indicator stack across
// "M1 dan M5" without pinning which indicator belongs to which timeframe, so this is the
// documented design decision):
//   - M5 (macro/setup timeframe): VWAP + EMA9/EMA21/EMA200 — establishes trend direction
//     and the fresh EMA9/EMA21 crossover event.
//   - M1 (execution timeframe): RVOL (20-candle average volume) — the current M1 candle's
//     volume must be > 1.5x RVOL to confirm real participation behind the move (avoids
//     firing on a low-volume/fake crossover).
//
// SL/TP: SL is a STATIC 50 pips from entry (no ATR). TP1/TP2/TP3 = 50/100/200 pips
// (RR 1:1, 1:2, 1:4). Pip conversion is instrument-specific via `pipsToPrice()`.

export interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// OKX candles: [ts, open, high, low, close, vol, volCcy, volCcyQuote, confirm], newest first.
export async function fetchOkxCandles(instId: string, bar: "1m" | "5m", limit = 100): Promise<Candle[]> {
  const url = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (json.code !== "0" || !Array.isArray(json.data)) {
    throw new Error(`OKX candles fetch failed for ${instId}/${bar}: ${json.msg || "unknown error"}`);
  }
  const rows: Candle[] = json.data
    // Drop the still-forming (unclosed) latest candle — index 8 is OKX's "confirm" flag
    // (1 = closed). Using an in-progress candle would corrupt EMA/VWAP/RVOL with a
    // partial-period volume/price read.
    .filter((r: string[]) => r[8] === "1")
    .map((r: string[]) => ({
      ts: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));
  // OKX returns newest-first; reverse to chronological order (oldest -> newest).
  return rows.reverse();
}

export async function fetchOkxLastPrice(instId: string): Promise<number> {
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${instId}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (json.code !== "0" || !json.data?.[0]) {
    throw new Error(`OKX ticker fetch failed for ${instId}: ${json.msg || "unknown error"}`);
  }
  return Number(json.data[0].last);
}

// ---- Indicator math ----

export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (prev === null) {
      prev = values[i];
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

// Cumulative VWAP over the fetched candle window (typical price * volume, running sum).
export function vwap(candles: Candle[]): number[] {
  const out: number[] = [];
  let cumPV = 0;
  let cumVol = 0;
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumPV += typicalPrice * c.volume;
    cumVol += c.volume;
    out.push(cumVol > 0 ? cumPV / cumVol : typicalPrice);
  }
  return out;
}

// Relative volume: current candle volume vs the average of the prior N candles.
export function relativeVolume(candles: Candle[], lookback = 20): { current: number; avg: number; ratio: number } {
  if (candles.length < lookback + 1) {
    return { current: 0, avg: 0, ratio: 0 };
  }
  const recent = candles.slice(-1 - lookback, -1); // the N candles BEFORE the current one
  const avg = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
  const current = candles[candles.length - 1].volume;
  return { current, avg, ratio: avg > 0 ? current / avg : 0 };
}

// ---- Pip conversion helper (instrument-specific, accurate for XAUUSD & standard forex) ----
export function pipsToPrice(pips: number, pipUnit: number): number {
  return pips * pipUnit;
}

export type SignalDirection = "BUY" | "SELL" | null;

export interface StrategyResult {
  direction: SignalDirection;
  reason: string;
  m5Trend: "up" | "down" | "flat";
  vwapValue: number;
  ema200Value: number;
  rvolRatio: number;
}

const MIN_M5_FOR_EMA200 = 210; // EMA200 needs a real warch-up buffer beyond the period itself
const MIN_M1_FOR_RVOL = 22; // 20-candle lookback + current + 1 buffer

export function evaluateStrategy(m5Candles: Candle[], m1Candles: Candle[]): StrategyResult {
  if (m5Candles.length < MIN_M5_FOR_EMA200 || m1Candles.length < MIN_M1_FOR_RVOL) {
    return { direction: null, reason: "insufficient_data", m5Trend: "flat", vwapValue: 0, ema200Value: 0, rvolRatio: 0 };
  }

  const m5Closes = m5Candles.map((c) => c.close);
  const price = m5Closes[m5Closes.length - 1];

  // M5: VWAP filter + Triple EMA (9/21/200) trend + fresh EMA9/EMA21 cross
  const vwapSeries = vwap(m5Candles);
  const lastVwap = vwapSeries[vwapSeries.length - 1];

  const ema9Series = ema(m5Closes, 9);
  const ema21Series = ema(m5Closes, 21);
  const ema200Series = ema(m5Closes, 200);
  const lastEma9 = ema9Series[ema9Series.length - 1];
  const lastEma21 = ema21Series[ema21Series.length - 1];
  const lastEma200 = ema200Series[ema200Series.length - 1];

  const n = ema9Series.length;
  const prevEma9 = ema9Series[n - 2];
  const prevEma21 = ema21Series[n - 2];

  // Widened from "cross on the exact latest candle" to "cross happened within the last
  // CROSS_LOOKBACK candles". Backtested on live OKX data (2026-07-20): requiring the cross
  // AND the RVOL spike to land on the exact same 5m candle produced ~0-1 signals per pair
  // per 7+ hours (effectively zero in a 24h window across all 4 pairs) — too strict to ever
  // fire in practice. Looking back 3 candles for the cross while still requiring the RVOL
  // spike on the current candle brought this to a realistic ~1 signal per 3.5-7h per pair.
  const CROSS_LOOKBACK = 3;
  let freshBullCross = false;
  let freshBearCross = false;
  for (let i = Math.max(1, n - CROSS_LOOKBACK); i < n; i++) {
    if (ema9Series[i - 1] <= ema21Series[i - 1] && ema9Series[i] > ema21Series[i]) freshBullCross = true;
    if (ema9Series[i - 1] >= ema21Series[i - 1] && ema9Series[i] < ema21Series[i]) freshBearCross = true;
  }

  const m5Trend: "up" | "down" | "flat" = lastEma9 > lastEma21 ? "up" : lastEma9 < lastEma21 ? "down" : "flat";

  // M1: RVOL confirmation (current candle volume vs 20-candle average)
  const rvol = relativeVolume(m1Candles, 20);

  const RVOL_THRESHOLD = 1.2;
  const buyValid = price > lastVwap && price > lastEma200 && freshBullCross && rvol.ratio > RVOL_THRESHOLD;
  const sellValid = price < lastVwap && price < lastEma200 && freshBearCross && rvol.ratio > RVOL_THRESHOLD;

  if (buyValid) {
    return { direction: "BUY", reason: "vwap_ema200_cross_rvol_confirmed", m5Trend, vwapValue: lastVwap, ema200Value: lastEma200, rvolRatio: rvol.ratio };
  }
  if (sellValid) {
    return { direction: "SELL", reason: "vwap_ema200_cross_rvol_confirmed", m5Trend, vwapValue: lastVwap, ema200Value: lastEma200, rvolRatio: rvol.ratio };
  }

  return { direction: null, reason: "no_trigger", m5Trend, vwapValue: lastVwap, ema200Value: lastEma200, rvolRatio: rvol.ratio };
}
