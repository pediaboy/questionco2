// ============================================================================
// INSTITUTIONAL SMC SCALPING ENGINE — v3 (2026-07-20)
// ============================================================================
// Full rewrite per owner spec: "AI Institutional Scalping Trader" persona.
// Only fires when a very high-confluence institutional setup is present.
// If ANY core filter fails -> NO TRADE. No partial/weak signals.
//
// HONEST DATA-SOURCE NOTE: we only have OHLCV candles from OKX (no Level-2 /
// order-book / true tape data). So Smart Money Concepts below are genuine
// algorithmic implementations of the standard retail-SMC definitions
// (swing-based structure, 3-candle FVG, wick-based liquidity sweep, etc.),
// not a real institutional order-flow feed. CVD is approximated from candle
// direction * volume (OKX spot candles don't expose taker buy/sell split).
// This is the best obtainable approximation without a paid data feed.
// ============================================================================

import type { Candle } from "./signalEngine";
import { ema } from "./signalEngine";
import { inKillZone } from "./marketSessions";

export type Direction = "BUY" | "SELL";

export interface Swing {
  index: number;
  price: number;
  type: "high" | "low";
}

export interface ChecklistItem {
  label: string;
  pass: boolean;
}

export interface InstitutionalResult {
  direction: Direction | null;
  confidence: number; // 0-100
  trend: "up" | "down" | "none";
  checklist: ChecklistItem[];
  reasoning: string;
  entry: number;
  atr: number;
  structureType: "BOS" | "CHOCH" | null;
  blockReason?: string; // why it's NO TRADE (news/killzone/weekday/etc, outside the checklist)
}

// ---------- basic indicator math ----------

function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function trueRange(candles: Candle[]): number[] {
  return candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
}

function atrSeries(candles: Candle[], period = 14): number[] {
  const tr = trueRange(candles);
  const out: number[] = new Array(tr.length).fill(NaN);
  let prev: number | null = null;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      prev = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
      out[i] = prev;
      continue;
    }
    prev = (prev! * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

function adxSeries(candles: Candle[], period = 14): number[] {
  const n = candles.length;
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < n; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      )
    );
  }
  const wilderSmooth = (arr: number[]) => {
    const out: number[] = new Array(arr.length).fill(NaN);
    let prev: number | null = null;
    for (let i = 0; i < arr.length; i++) {
      if (i < period - 1) continue;
      if (i === period - 1) {
        prev = arr.slice(0, period).reduce((a, b) => a + b, 0);
        out[i] = prev;
        continue;
      }
      prev = prev! - prev! / period + arr[i];
      out[i] = prev;
    }
    return out;
  };
  const trS = wilderSmooth(tr);
  const plusS = wilderSmooth(plusDM);
  const minusS = wilderSmooth(minusDM);
  const plusDI = trS.map((t, i) => (t ? (plusS[i] / t) * 100 : NaN));
  const minusDI = trS.map((t, i) => (t ? (minusS[i] / t) * 100 : NaN));
  const dx = plusDI.map((p, i) => {
    const m = minusDI[i];
    if (Number.isNaN(p) || Number.isNaN(m) || p + m === 0) return NaN;
    return (Math.abs(p - m) / (p + m)) * 100;
  });
  const out: number[] = new Array(n).fill(NaN);
  let prevAdx: number | null = null;
  for (let i = 0; i < dx.length; i++) {
    if (Number.isNaN(dx[i])) continue;
    if (prevAdx === null) {
      const window = dx.slice(Math.max(0, i - period + 1), i + 1).filter((v) => !Number.isNaN(v));
      if (window.length < period) continue;
      prevAdx = window.reduce((a, b) => a + b, 0) / window.length;
      out[i] = prevAdx;
    } else {
      prevAdx = (prevAdx * (period - 1) + dx[i]) / period;
      out[i] = prevAdx;
    }
  }
  return out;
}

function macdSeries(closes: number[]) {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = closes.map((_, i) => ema12[i] - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, hist };
}

function bollinger(closes: number[], period = 20, mult = 2) {
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const window = closes.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { upper, lower };
}

function cvdSeries(candles: Candle[]): number[] {
  const out: number[] = [];
  let cum = 0;
  for (const c of candles) {
    cum += c.close >= c.open ? c.volume : -c.volume;
    out.push(cum);
  }
  return out;
}

// ---------- market structure (swing-based SMC approximation) ----------

function findSwings(candles: Candle[], leftRight = 2): Swing[] {
  const swings: Swing[] = [];
  for (let i = leftRight; i < candles.length - leftRight; i++) {
    const highs = candles.slice(i - leftRight, i + leftRight + 1).map((c) => c.high);
    const lows = candles.slice(i - leftRight, i + leftRight + 1).map((c) => c.low);
    if (candles[i].high === Math.max(...highs)) swings.push({ index: i, price: candles[i].high, type: "high" });
    if (candles[i].low === Math.min(...lows)) swings.push({ index: i, price: candles[i].low, type: "low" });
  }
  return swings;
}

function detectStructureBreak(
  candles: Candle[],
  swings: Swing[]
): { direction: "up" | "down" | null; type: "BOS" | "CHOCH" | null; brokenLevel: number } {
  const highs = swings.filter((s) => s.type === "high").slice(-3);
  const lows = swings.filter((s) => s.type === "low").slice(-3);
  if (highs.length < 2 || lows.length < 2) return { direction: null, type: null, brokenLevel: 0 };

  const lastClose = candles[candles.length - 1].close;
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const prevHigh = highs[highs.length - 2];
  const prevLow = lows[lows.length - 2];

  if (lastClose > lastHigh.price) {
    const wasUptrend = lastLow.price > prevLow.price; // already making higher-lows -> continuation
    return { direction: "up", type: wasUptrend ? "BOS" : "CHOCH", brokenLevel: lastHigh.price };
  }
  if (lastClose < lastLow.price) {
    const wasDowntrend = lastHigh.price < prevHigh.price; // already making lower-highs -> continuation
    return { direction: "down", type: wasDowntrend ? "BOS" : "CHOCH", brokenLevel: lastLow.price };
  }
  return { direction: null, type: null, brokenLevel: 0 };
}

function findOrderBlock(candles: Candle[], breakIndex: number, direction: "up" | "down"): boolean {
  for (let i = breakIndex; i >= Math.max(0, breakIndex - 10); i--) {
    const c = candles[i];
    if (direction === "up" && c.close < c.open) return true; // last bearish candle before bullish impulse
    if (direction === "down" && c.close > c.open) return true; // last bullish candle before bearish impulse
  }
  return false;
}

function findFVG(candles: Candle[], direction: "up" | "down"): boolean {
  const n = candles.length;
  for (let i = n - 1; i >= Math.max(2, n - 10); i--) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    if (direction === "up" && c3.low > c1.high) return true;
    if (direction === "down" && c3.high < c1.low) return true;
  }
  return false;
}

function findLiquiditySweep(candles: Candle[], swings: Swing[], direction: "up" | "down"): boolean {
  const last = candles[candles.length - 1];
  if (direction === "up") {
    const recentLows = swings.filter((s) => s.type === "low").slice(-5);
    return recentLows.some((s) => last.low < s.price && last.close > s.price);
  }
  const recentHighs = swings.filter((s) => s.type === "high").slice(-5);
  return recentHighs.some((s) => last.high > s.price && last.close < s.price);
}

function premiumDiscountZone(price: number, swings: Swing[]): "premium" | "discount" | "equilibrium" {
  const recent = swings.slice(-6);
  if (recent.length < 2) return "equilibrium";
  const high = Math.max(...recent.map((s) => s.price));
  const low = Math.min(...recent.map((s) => s.price));
  const mid = (high + low) / 2;
  if (price > mid) return "premium";
  if (price < mid) return "discount";
  return "equilibrium";
}

// ---------- dynamic Support & Resistance (Donchian channel) ----------
// Per owner's EA-style spec: SnR read from High/Low channel over a lookback
// window (Donchian), NOT the swing-fractal structure above. Used as a genuine
// breakout-confirmation hard gate — a close must clear the channel edge by
// more than `bufferPrice` (owner spec: 20 points = 2 pips tolerance) to count
// as a real breakout, filtering out wicks/false-breaks that barely poke through.
function donchianChannel(candles: Candle[], lookback: number): { upper: number; lower: number } {
  // exclude the current (last, still-evaluated) candle from the channel itself —
  // the channel represents the range BEFORE the candle we're testing for a break.
  const window = candles.slice(-(lookback + 1), -1);
  const upper = Math.max(...window.map((c) => c.high));
  const lower = Math.min(...window.map((c) => c.low));
  return { upper, lower };
}

// ---------- M15 trend confirmation (scalping multi-timeframe: M15 bias, M5 entry
// structure, M1 for volume timing) ----------

function resampleToM15(m5: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i + 3 <= m5.length; i += 3) {
    const chunk = m5.slice(i, i + 3);
    out.push({
      ts: chunk[0].ts,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, c) => s + c.volume, 0),
    });
  }
  return out;
}

function m15Trend(m5: Candle[]): "up" | "down" | "none" {
  const m15 = resampleToM15(m5);
  if (m15.length < 50) return "none";
  const closes = m15.map((c) => c.close);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const last20 = e20[e20.length - 1];
  const last50 = e50[e50.length - 1];
  if (last20 > last50) return "up";
  if (last20 < last50) return "down";
  return "none";
}

// ---------- main evaluator ----------

const RSI_BUY_MIN = 55;
const RSI_BUY_MAX = 75;
const RSI_SELL_MIN = 25;
const RSI_SELL_MAX = 45;
const ADX_MIN = 25;
// Re-tuned 2026-07-20 (round 6) — owner explicitly stripped the strategy down to
// "pake m5 m1 aja, kelamaan kalo m15, pake ema ma rsi aja" for real high-risk
// scalping. Whole SMC confluence stack (structure/OB/FVG/liquidity/zone/VWAP/MACD/
// ADX/CVD/Bollinger/SnR/M15) removed — engine is now EMA9/21+EMA200 (hard gate) +
// RSI(14) zone (hard gate, promoted from a soft score) + M1 confirmation (bonus/
// penalty, replacing M15) + volume (small bonus). Fresh live 5-day OKX backtest of
// this exact lean model across all 4 pairs: hard gates alone pass ~750-830x/pair,
// RSI zone narrows that to ~475-550x/pair. Swept 40-75%: chose 60% — ~15.6
// signals/day average (full-day range 9-33), the most aggressive/frequent cadence
// tried so far, matching the owner's explicit "high risk, scalping agresif" ask.
const CONFIDENCE_MIN = 60;

// ---------- owner-spec EA-style momentum/SnR parameters (2026-07-20) ----------
// Pasted directly from the owner's MT4/5-style EA config. "Points" convention in
// that config: 10 points = 1 pip (confirmed by their own comment on
// SnR_Buffer_Points = 20 -> "2 pips"), so we convert points to this project's
// existing per-pair `pipUnit` convention: 1 pip = 1x pipUnit.
const EMA_FAST_PERIOD = 9;
const EMA_SLOW_PERIOD = 21;
const EMA_TREND_FILTER_PERIOD = 200;
const SNR_LOOKBACK_PERIOD = 50; // Donchian channel lookback (candles)
const MIN_DISTANCE_EMA_PIPS = 1; // 10 points = 1 pip -> min |EMA9-EMA21| gap to avoid sideways chop
const SNR_BUFFER_PIPS = 2; // 20 points = 2 pips -> breakout confirmation tolerance vs false breakout

// Simplified 2026-07-20 (round 6) per owner's explicit request: "pake m5 m1 aja,
// kelamaan kalo m15, kan dibilang buat scalping agresif pake ema ma rsi aja" —
// dropped the whole SMC confluence stack (structure/OB/FVG/liquidity/zone/VWAP/
// MACD/ADX/CVD/Bollinger/SnR/M15). The strategy is now genuinely just EMA + RSI
// on M5, with a fast M1 confirmation check (the M1 data was already being
// fetched but unused before) replacing M15 as the timing nudge.
export interface FactorWeights {
  trend: number; // EMA9/21 separation strength + distance from EMA200
  rsi: number; // RSI(14) position quality within its directional zone
}

export const DEFAULT_FACTOR_WEIGHTS: FactorWeights = {
  trend: 0.55, rsi: 0.45,
};

export interface EngineSettings {
  confidenceMin: number;
  factorWeights: FactorWeights;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  confidenceMin: CONFIDENCE_MIN,
  factorWeights: DEFAULT_FACTOR_WEIGHTS,
};

export function evaluateInstitutional(
  m5: Candle[],
  m1: Candle[],
  newsBlackout: boolean,
  settings: EngineSettings = DEFAULT_ENGINE_SETTINGS,
  pipUnit: number = 1
): InstitutionalResult {
  const confidenceMin = settings.confidenceMin ?? CONFIDENCE_MIN;
  const fw = settings.factorWeights ?? DEFAULT_FACTOR_WEIGHTS;
  const empty = (blockReason: string): InstitutionalResult => ({
    direction: null,
    confidence: 0,
    trend: "none",
    checklist: [],
    reasoning: blockReason,
    entry: 0,
    atr: 0,
    structureType: null,
    blockReason,
  });

  if (newsBlackout) return empty("News blackout aktif (high-impact news dalam 30 menit)");
  if (!inKillZone()) return empty("Diluar semua sesi trading (seharusnya tidak pernah terjadi — 4 sesi menutupi 24 jam penuh)");
  if (m5.length < 220 || m1.length < 30) return empty("insufficient_data");

  const closes = m5.map((c) => c.close);
  const price = closes[closes.length - 1];

  // ---- EMA momentum + trend filter (owner EA spec: fast 9 / slow 21 / trend filter 200) ----
  const emaFast = ema(closes, EMA_FAST_PERIOD);
  const emaSlow = ema(closes, EMA_SLOW_PERIOD);
  const ema200 = ema(closes, EMA_TREND_FILTER_PERIOD);
  const lastEmaFast = emaFast[emaFast.length - 1];
  const lastEmaSlow = emaSlow[emaSlow.length - 1];
  const lastEma200 = ema200[ema200.length - 1];

  // Major trend filter (EMA200, "wajib untuk hindari salah arah") gates direction;
  // EMA9/21 crossover supplies the momentum trigger within that trend.
  const trend: "up" | "down" | "none" =
    lastEmaFast > lastEmaSlow && price > lastEma200
      ? "up"
      : lastEmaFast < lastEmaSlow && price < lastEma200
      ? "down"
      : "none";

  if (trend === "none") return empty("EMA9/21 momentum + filter trend EMA200 tidak sejajar — NO TRADE");

  const direction: Direction = trend === "up" ? "BUY" : "SELL";

  // Anti-sideways filter: EMA9/21 must be separated by at least 1 pip, otherwise
  // the market is choppy/flat and the EA should not open (owner spec: Min_Distance_EMA_Points = 10).
  const emaDistance = Math.abs(lastEmaFast - lastEmaSlow);
  const minEmaDistance = MIN_DISTANCE_EMA_PIPS * pipUnit;
  if (emaDistance < minEmaDistance) {
    return empty(`EMA9/21 terlalu berdekatan (${emaDistance.toFixed(4)} < ${minEmaDistance.toFixed(4)}) — market sideways, NO TRADE`);
  }

  // ---- RSI(14) hard gate ("pake ema ma rsi aja" — RSI is now a real hard gate
  // alongside EMA, not just a soft score) ----
  const rsiSeries = rsi(closes, 14);
  const lastRsi = rsiSeries[rsiSeries.length - 1];
  const rsiOk = direction === "BUY" ? lastRsi >= RSI_BUY_MIN && lastRsi <= RSI_BUY_MAX : lastRsi >= RSI_SELL_MIN && lastRsi <= RSI_SELL_MAX;
  if (!rsiOk) {
    return empty(
      `RSI(14) ${lastRsi.toFixed(1)} diluar zona ${direction === "BUY" ? `${RSI_BUY_MIN}-${RSI_BUY_MAX}` : `${RSI_SELL_MIN}-${RSI_SELL_MAX}`} — NO TRADE`
    );
  }

  const atrVals = atrSeries(m5, 14);
  const lastAtr = atrVals[atrVals.length - 1];
  if (!(!Number.isNaN(lastAtr) && lastAtr > 0)) {
    return empty("Data ATR tidak valid — NO TRADE");
  }

  // ---- M1 fast confirmation (replaces M15 — owner wants M1/M5 only, no M15) ----
  const m1Closes = m1.map((c) => c.close);
  const m1EmaFast = ema(m1Closes, EMA_FAST_PERIOD);
  const m1EmaSlow = ema(m1Closes, EMA_SLOW_PERIOD);
  const lastM1Fast = m1EmaFast[m1EmaFast.length - 1];
  const lastM1Slow = m1EmaSlow[m1EmaSlow.length - 1];
  const m1Trend: "up" | "down" | "none" = lastM1Fast > lastM1Slow ? "up" : lastM1Fast < lastM1Slow ? "down" : "none";
  const m1Agree = m1Trend !== "none" && m1Trend === (direction === "BUY" ? "up" : "down");
  const m1Bonus = m1Trend === "none" ? 0 : m1Agree ? 8 : -10;

  // ---- Volume (RVOL) — small quality nudge, not a full weighted factor ----
  const vols = m5.map((c) => c.volume);
  const avgVol20 = vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const lastVol = vols[vols.length - 1];
  const volumeOk = avgVol20 > 0 && lastVol > avgVol20;
  const volBonus = avgVol20 > 0 ? (volumeOk ? 5 : -3) : 0;

  const checklist: ChecklistItem[] = [
    { label: "EMA9/21 Momentum + EMA200 Filter", pass: true }, // hard gate above
    { label: "Anti-Sideways (Min Distance EMA)", pass: true }, // hard gate above
    { label: "RSI(14) Zone", pass: rsiOk }, // hard gate above
    { label: "M1 Confirmation", pass: m1Agree },
    { label: "Volume (RVOL)", pass: volumeOk },
  ];

  // ---- confidence: pure EMA + RSI weighted base (per owner spec), M1 + volume
  // are additive bonus/penalty nudges only, not part of the weighted 100% base ----
  const trendGap = Math.abs(lastEmaFast - lastEma200) / lastEma200;
  const trendScore = Math.min(100, trendGap * 10000);
  const rsiCenter = direction === "BUY" ? 65 : 35;
  const rsiRange = direction === "BUY" ? RSI_BUY_MAX - RSI_BUY_MIN : RSI_SELL_MAX - RSI_SELL_MIN;
  const rsiScore = Math.max(0, 100 - (Math.abs(lastRsi - rsiCenter) / (rsiRange / 2)) * 100);

  const baseConfidence = trendScore * fw.trend + rsiScore * fw.rsi;
  const confidence = Math.max(0, Math.min(100, Math.round(baseConfidence + m1Bonus + volBonus)));

  if (confidence < confidenceMin) {
    const weak = checklist.filter((c) => !c.pass).map((c) => c.label);
    return {
      ...empty(`Confidence ${confidence}% dibawah minimal ${confidenceMin}% (lemah di: ${weak.join(", ") || "EMA/RSI kombinasi minor"})`),
      confidence,
    };
  }

  const reasoning =
    `${direction} — EMA9/21 momentum searah EMA200 (trend ${trend.toUpperCase()}), RSI(14) ${lastRsi.toFixed(1)} dalam zona ` +
    `${direction === "BUY" ? `${RSI_BUY_MIN}-${RSI_BUY_MAX}` : `${RSI_SELL_MIN}-${RSI_SELL_MAX}`}. ` +
    `M1 ${m1Agree ? "konfirmasi" : m1Trend === "none" ? "netral" : "berlawanan"} arah, volume ${(lastVol / Math.max(avgVol20, 1e-9)).toFixed(2)}x rata-rata.`;

  return {
    direction,
    confidence,
    trend,
    checklist,
    reasoning,
    entry: price,
    atr: lastAtr,
    structureType: null,
  };
}
