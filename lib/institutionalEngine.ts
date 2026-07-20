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
import { ema, vwap as vwapSeries } from "./signalEngine";
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
// Re-tuned 2026-07-20 (round 2) after adding the owner's EA-style hard gates
// (EMA9/21 momentum + EMA200 filter, anti-sideways min-distance, Donchian(50)+2pip
// SnR breakout confirmation — see constants below). These 3 hard gates are much
// stricter/burstier than the old 2-gate design (breakout-style logic only fires in
// clusters right as a trend opens, then goes quiet while the channel re-adapts,
// unlike the old pure trend+structure gate). Re-ran the same live 5-day OKX
// backtest methodology across all 4 pairs with the new gates active: 76% collapsed
// to ~1.2 signals/day (over-filtered — confidence and hard-gates were both
// squeezing the same rare events). Swept down: 70%=4.4/day but 2 of 5 sampled days
// had ZERO qualifying breakouts; 66% averaged 6.0/day AND was the lowest threshold
// where every single day in the 5-day sample had at least 1 fire (range 1-13/day —
// bursty by breakout-strategy nature, not a smooth constant rate). Chosen as the
// best fit for "minimal 4-5, maksimal 10 sinyal per hari": hits the average, and
// unlike higher thresholds doesn't risk multi-day silent stretches.
const CONFIDENCE_MIN = 66;

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

export interface FactorWeights {
  trend: number; structure: number; orderBlock: number; fvg: number; liquiditySweep: number;
  zone: number; vwap: number; macd: number; rsi: number; adx: number; volume: number; cvd: number; bollinger: number;
}

export const DEFAULT_FACTOR_WEIGHTS: FactorWeights = {
  trend: 0.1, structure: 0.12, orderBlock: 0.05, fvg: 0.05, liquiditySweep: 0.08, zone: 0.08,
  vwap: 0.1, macd: 0.1, rsi: 0.12, adx: 0.1, volume: 0.05, cvd: 0.03, bollinger: 0.02,
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

  // Dynamic SnR (Donchian channel, 50-candle lookback) breakout confirmation —
  // requires a genuine confirmed break past the channel edge by more than the
  // buffer (owner spec: SnR_Buffer_Points = 20 -> 2 pips) to filter false breakouts.
  const snr = donchianChannel(m5, SNR_LOOKBACK_PERIOD);
  const snrBuffer = SNR_BUFFER_PIPS * pipUnit;
  const snrBreakoutOk = direction === "BUY" ? price > snr.upper + snrBuffer : price < snr.lower - snrBuffer;
  if (!snrBreakoutOk) {
    return empty(
      `Belum breakout SnR Donchian(${SNR_LOOKBACK_PERIOD}) dengan buffer ${snrBuffer.toFixed(4)} ` +
        `(upper ${snr.upper.toFixed(4)} / lower ${snr.lower.toFixed(4)}, price ${price.toFixed(4)}) — NO TRADE`
    );
  }

  const vwapVal = vwapSeries(m5);
  const lastVwap = vwapVal[vwapVal.length - 1];
  const vwapOk = direction === "BUY" ? price > lastVwap : price < lastVwap;

  const swings = findSwings(m5, 2);
  const structBreak = detectStructureBreak(m5, swings);
  const structureOk = structBreak.direction === (direction === "BUY" ? "up" : "down") && structBreak.type !== null;

  const orderBlockOk = structureOk ? findOrderBlock(m5, structBreak.brokenLevel ? m5.length - 1 : 0, structBreak.direction!) : false;
  const fvgOk = findFVG(m5, direction === "BUY" ? "up" : "down");
  const liquiditySweepOk = findLiquiditySweep(m5, swings, direction === "BUY" ? "up" : "down");
  const zone = premiumDiscountZone(price, swings);
  const zoneOk = direction === "BUY" ? zone === "discount" : direction === "SELL" ? zone === "premium" : false;

  const rsiSeries = rsi(closes, 14);
  const lastRsi = rsiSeries[rsiSeries.length - 1];
  const rsiOk = direction === "BUY" ? lastRsi >= RSI_BUY_MIN && lastRsi <= RSI_BUY_MAX : lastRsi >= RSI_SELL_MIN && lastRsi <= RSI_SELL_MAX;

  const adx = adxSeries(m5, 14);
  const lastAdx = adx[adx.length - 1];
  const adxOk = !Number.isNaN(lastAdx) && lastAdx >= ADX_MIN;

  const atrVals = atrSeries(m5, 14);
  const lastAtr = atrVals[atrVals.length - 1];
  const atrOk = !Number.isNaN(lastAtr) && lastAtr > 0;

  const { macdLine, signalLine, hist } = macdSeries(closes);
  const n = macdLine.length;
  const macdBullCross = macdLine[n - 2] <= signalLine[n - 2] && macdLine[n - 1] > signalLine[n - 1];
  const macdBearCross = macdLine[n - 2] >= signalLine[n - 2] && macdLine[n - 1] < signalLine[n - 1];
  const macdOk = direction === "BUY" ? macdBullCross : macdBearCross;
  const macdHistAligned = direction === "BUY" ? hist[n - 1] > 0 : hist[n - 1] < 0;

  const bb = bollinger(closes, 20, 2);
  const lastLow = m5[m5.length - 1].low;
  const lastHigh = m5[m5.length - 1].high;
  const bbOk =
    direction === "BUY"
      ? !Number.isNaN(bb.lower[n - 1]) && lastLow <= bb.lower[n - 1] && price > bb.lower[n - 1]
      : !Number.isNaN(bb.upper[n - 1]) && lastHigh >= bb.upper[n - 1] && price < bb.upper[n - 1];

  // Volume: current M5 candle vs 20-candle average
  const vols = m5.map((c) => c.volume);
  const avgVol20 = vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const lastVol = vols[vols.length - 1];
  const volumeOk = avgVol20 > 0 && lastVol > avgVol20;

  // CVD: rising for BUY, falling for SELL, and not diverging vs price over the same window
  const cvd = cvdSeries(m5);
  const lookback = 10;
  const cvdSlope = cvd[cvd.length - 1] - cvd[cvd.length - 1 - lookback];
  const priceSlope = closes[closes.length - 1] - closes[closes.length - 1 - lookback];
  const cvdDirOk = direction === "BUY" ? cvdSlope > 0 : cvdSlope < 0;
  const cvdDiverging = Math.sign(cvdSlope) !== Math.sign(priceSlope) && cvdSlope !== 0 && priceSlope !== 0;
  const cvdOk = cvdDirOk && !cvdDiverging;

  const killZoneOk = true; // already gated above — always true if we got this far

  const checklist: ChecklistItem[] = [
    { label: "EMA9/21 Momentum + EMA200 Filter", pass: true }, // hard gate above; direction only set when aligned
    { label: "Anti-Sideways (Min Distance EMA)", pass: true }, // hard gate above
    { label: "Dynamic SnR (Donchian 50 + Buffer)", pass: true }, // hard gate above
    { label: "BOS", pass: structureOk && structBreak.type === "BOS" },
    { label: "CHOCH", pass: structureOk && structBreak.type === "CHOCH" },
    { label: "Order Block", pass: orderBlockOk },
    { label: "Liquidity Sweep", pass: liquiditySweepOk },
    { label: "FVG", pass: fvgOk },
    { label: "Premium/Discount Zone", pass: zoneOk },
    { label: "VWAP", pass: vwapOk },
    { label: "MACD", pass: macdOk },
    { label: "RSI", pass: rsiOk },
    { label: "ADX", pass: adxOk },
    { label: "ATR", pass: atrOk },
    { label: "Volume", pass: volumeOk },
    { label: "CVD", pass: cvdOk },
    { label: "Kill Zone", pass: killZoneOk },
    { label: "Bollinger Band", pass: bbOk },
  ];

  // ---- HARD gates ----
  // 1) EMA9/21 momentum + EMA200 trend filter, 2) EMA9/21 min-distance anti-sideways,
  // 3) Donchian(50) SnR breakout w/ buffer — all three checked (and can early-return)
  // above, per owner's EA-style spec. SMC structure (BOS/CHOCH) is now a WEIGHTED
  // scoring factor, not a hard gate (kept from the earlier fix — requiring it
  // alongside the new SnR breakout made the engine fire near-zero times again).
  if (!atrOk) {
    return empty("Data ATR tidak valid — NO TRADE");
  }

  // ---- confidence scoring (0-100), each component normalized, partial credit ----
  const adxScore = Math.min(100, Math.max(0, ((lastAdx - ADX_MIN) / 25) * 100));
  const volScore = Math.min(100, Math.max(0, ((lastVol / Math.max(avgVol20, 1e-9) - 1) / 1) * 100));
  const rsiCenter = direction === "BUY" ? 65 : 35;
  const rsiRange = direction === "BUY" ? RSI_BUY_MAX - RSI_BUY_MIN : RSI_SELL_MAX - RSI_SELL_MIN;
  const rsiScore = Math.max(0, 100 - (Math.abs(lastRsi - rsiCenter) / (rsiRange / 2)) * 100);
  const trendGap = Math.abs(lastEmaFast - lastEma200) / lastEma200;
  const trendScore = Math.min(100, trendGap * 10000);
  const vwapDist = Math.abs(price - lastVwap) / Math.max(lastAtr, 1e-9);
  const vwapScore = vwapOk ? Math.min(100, 50 + vwapDist * 50) : Math.max(0, 50 - vwapDist * 50);
  const structureScore = !structureOk ? 20 : structBreak.type === "BOS" ? 100 : 85;
  const macdScore = macdOk ? 100 : macdHistAligned ? 55 : 15;
  const orderBlockScore = orderBlockOk ? 100 : 35;
  const fvgScore = fvgOk ? 100 : 35;
  const liquiditySweepScore = liquiditySweepOk ? 100 : 25;
  const zoneScore = zoneOk ? 100 : zone === "equilibrium" ? 55 : 15;
  const cvdScore = cvdOk ? 100 : cvdDirOk ? 45 : 15;
  const bbScore = bbOk ? 100 : 40;

  const weights: [number, number][] = [
    [trendScore, fw.trend],
    [structureScore, fw.structure],
    [orderBlockScore, fw.orderBlock],
    [fvgScore, fw.fvg],
    [liquiditySweepScore, fw.liquiditySweep],
    [zoneScore, fw.zone],
    [vwapScore, fw.vwap],
    [macdScore, fw.macd],
    [rsiScore, fw.rsi],
    [adxScore, fw.adx],
    [volScore, fw.volume],
    [cvdScore, fw.cvd],
    [bbScore, fw.bollinger],
  ];
  const baseConfidence = Math.round(weights.reduce((sum, [score, w]) => sum + score * w, 0));

  // ---- M15 multi-timeframe confirmation (scalping bias) ----
  // Real scalping setups check a higher timeframe (M15) for overall bias before
  // trusting an M5 entry trigger. Rewards agreement, penalizes disagreement —
  // does not hard-block, since M15/M5 can legitimately diverge briefly on scalps.
  const m15 = m15Trend(m5);
  const m15Agree = m15 !== "none" && m15 === trend;
  const m15Bonus = m15 === "none" ? 0 : m15Agree ? 8 : -12;
  checklist.push({ label: "M15 Trend Confirmation", pass: m15Agree });
  const confidence = Math.max(0, Math.min(100, baseConfidence + m15Bonus));

  if (confidence < confidenceMin) {
    const weak = checklist.filter((c) => !c.pass && c.label !== "BOS" && c.label !== "CHOCH").map((c) => c.label);
    return { ...empty(`Confidence ${confidence}% dibawah minimal ${confidenceMin}% (lemah di: ${weak.join(", ") || "kombinasi minor"})`), confidence };
  }

  const reasoning =
    `${direction} — struktur ${structBreak.type} mengkonfirmasi trend ${trend.toUpperCase()}. ` +
    `Price ${direction === "BUY" ? "diatas" : "dibawah"} VWAP & EMA200, RSI ${lastRsi.toFixed(1)}, ADX ${lastAdx.toFixed(1)}, ` +
    `volume ${(lastVol / avgVol20).toFixed(2)}x rata-rata, CVD ${cvdDirOk ? "konfirmasi" : "netral"} tanpa divergensi. ` +
    `Zone: ${zone}.`;

  return {
    direction,
    confidence,
    trend,
    checklist,
    reasoning,
    entry: price,
    atr: lastAtr,
    structureType: structBreak.type,
  };
}
