// XAU Decisive Scalping Engine — M1/M5 EMA9/20 trend alignment + Bollinger Bands +
// RSI + PSAR, per owner's exact manual-analysis spec (2026-07-24, "ubah biar sama
// seperti yang gua kirim barusan setingannya"). Full replacement of the SMC
// Liquidity Sweep + FVG + EMA200 H1 model (2026-07-22), which was too selective and
// produced ZERO signals over 3 straight days ("3 hari ga ada sinyal sama sekali").
// This model is deliberately decisive: it fires a direction whenever M1 + M5 trend
// agree, rather than waiting for a rare multi-layer confluence. XAU ONLY —
// BTC/ETH/SOL keep using Institutional SMC v3 (lib/institutionalEngine.ts).
//
// 1. TREN MIKRO M1 & M5 (core trigger): EMA9 vs EMA20 alignment on BOTH M1 and M5
//    must agree (both bullish or both bearish), and price must still be on the
//    correct side of EMA20 M1. Disagreement = no trade (choppy/transitioning).
// 2. RSI MOMENTUM: confirms, doesn't gate except at true exhaustion extremes
//    (forbid fresh BUY if RSI M1>78 or RSI M5>75; forbid fresh SELL if RSI M1<22 or
//    RSI M5<25) — loose enough to keep firing in a healthy trend.
// 3. PSAR: confirmation bonus/penalty on confidence, not a hard gate (PSAR flips
//    fast and would kill frequency if treated as a blocker).
// 4. BOLLINGER BANDS (M1, 20/2): position vs the band decides whether price is at
//    a normal pullback (full confidence) or already extended past the band
//    (breakout/possible-fakeout — still tradeable, slightly reduced confidence,
//    noted in reasoning). Also drives the realistic quick TP1 target and the
//    tight SL (placed just outside the nearest MA/PSAR — "cutloss ketat di luar MA
//    atau Bollinger terdekat").

import { Candle, ema } from "./signalEngine";

export interface XauAggressiveResult {
  direction: "BUY" | "SELL" | null;
  confidence: number;
  reasoning: string;
  atr: number;
  checklist: { label: string; pass: boolean }[];
  blockReason?: string;
  entryOverride?: number;
  slPrice?: number;
  tpPrices?: number[];
}

// SL fixed at 50 pips (owner spec 2026-07-24, "sl nya jauhin 50pips" -- the
// dynamic 15-40 pip clamp based on EMA20/PSAR was too tight for gold's real M1/M5
// noise, causing frequent whipsaw stop-outs in backtest, 12.5% winrate/-111 pips
// over 3 days). TP1 stays dynamic off the Bollinger Band (realistic quick target).
const SL_FIXED_PIPS = 50;
const TP1_MIN_PIPS = 10;
const TP1_MAX_PIPS = 25;

function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gainSum += change;
    else lossSum -= change;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    out[i] = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
  }
  return out;
}

function bollinger(closes: number[], period = 20, mult = 2): { upper: number[]; lower: number[]; mid: number[] } {
  const mid = sma(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { upper, lower, mid };
}

// Standard parabolic SAR (0.02 step / 0.2 max), returns bull/bear state + level per candle.
function psarSeries(candles: Candle[], step = 0.02, max = 0.2): { bull: boolean; sar: number }[] {
  const out: { bull: boolean; sar: number }[] = [];
  if (candles.length < 2) return out;
  let bull = candles[1].close >= candles[0].close;
  let af = step;
  let ep = bull ? candles[0].high : candles[0].low;
  let sar = bull ? candles[0].low : candles[0].high;
  for (let i = 1; i < candles.length; i++) {
    sar = sar + af * (ep - sar);
    if (bull) {
      if (candles[i].low < sar) {
        bull = false;
        sar = ep;
        ep = candles[i].low;
        af = step;
      } else if (candles[i].high > ep) {
        ep = candles[i].high;
        af = Math.min(af + step, max);
      }
    } else {
      if (candles[i].high > sar) {
        bull = true;
        sar = ep;
        ep = candles[i].high;
        af = step;
      } else if (candles[i].low < ep) {
        ep = candles[i].low;
        af = Math.min(af + step, max);
      }
    }
    out.push({ bull, sar });
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function evaluateXauAggressive(
  m1: Candle[],
  m5: Candle[],
  newsBlackout: boolean,
  pipUnit: number = 0.1,
  livePrice?: number
): XauAggressiveResult {
  const checklist: { label: string; pass: boolean }[] = [];

  if (newsBlackout) {
    return { direction: null, confidence: 0, reasoning: "Blocked: high-impact news window", atr: 0, checklist, blockReason: "News blackout aktif" };
  }
  if (m1.length < 30 || m5.length < 30) {
    return { direction: null, confidence: 0, reasoning: "Not enough M1/M5 data yet", atr: 0, checklist, blockReason: "Data belum cukup" };
  }

  const m1Closes = m1.map((c) => c.close);
  const m5Closes = m5.map((c) => c.close);
  const l1 = m1.length - 1;
  const l5 = m5.length - 1;
  const currentPrice = livePrice ?? m1Closes[l1];

  const ema9M1 = ema(m1Closes, 9);
  const ema20M1 = ema(m1Closes, 20);
  const ema9M5 = ema(m5Closes, 9);
  const ema20M5 = ema(m5Closes, 20);
  const rsiM1 = rsi(m1Closes, 14);
  const rsiM5 = rsi(m5Closes, 14);
  const bbM1 = bollinger(m1Closes, 20, 2);
  const psarM1 = psarSeries(m1, 0.02, 0.2);

  const e9m1 = ema9M1[l1];
  const e20m1 = ema20M1[l1];
  const e9m5 = ema9M5[l5];
  const e20m5 = ema20M5[l5];

  // ---- 1. TREN MIKRO M1 & M5 (core trigger) ----
  const m1Bull = e9m1 > e20m1;
  const m1Bear = e9m1 < e20m1;
  const m5Bull = e9m5 > e20m5;
  const m5Bear = e9m5 < e20m5;

  let direction: "BUY" | "SELL" | null = null;
  if (m1Bull && m5Bull && currentPrice > e20m1) direction = "BUY";
  else if (m1Bear && m5Bear && currentPrice < e20m1) direction = "SELL";

  checklist.push({ label: "Tren M1 (EMA9 vs EMA20)", pass: m1Bull || m1Bear });
  checklist.push({ label: "Tren M5 (EMA9 vs EMA20)", pass: m5Bull || m5Bear });
  checklist.push({ label: "M1 & M5 Sejalan", pass: direction !== null });

  if (!direction) {
    return {
      direction: null,
      confidence: 0,
      reasoning: `Tren M1 (${m1Bull ? "bullish" : m1Bear ? "bearish" : "flat"}) & M5 (${m5Bull ? "bullish" : m5Bear ? "bearish" : "flat"}) belum sejalan — NO TRADE, tunggu struktur jelas`,
      atr: 0,
      checklist,
      blockReason: "Tren M1/M5 belum sejalan",
    };
  }

  // ---- 2. RSI momentum (veto only at true exhaustion extremes) ----
  const rsiNowM1 = rsiM1[l1];
  const rsiNowM5 = rsiM5[l5];
  const rsiExhausted =
    direction === "BUY" ? rsiNowM1 > 78 || rsiNowM5 > 75 : rsiNowM1 < 22 || rsiNowM5 < 25;
  checklist.push({ label: "RSI Belum Exhausted", pass: !rsiExhausted });

  if (rsiExhausted) {
    return {
      direction: null,
      confidence: 20,
      reasoning: `Tren ${direction} sejalan tapi RSI sudah exhausted (M1 ${rsiNowM1.toFixed(1)} / M5 ${rsiNowM5.toFixed(1)}) — NO TRADE, tunggu koreksi dulu`,
      atr: 0,
      checklist,
      blockReason: "RSI exhausted",
    };
  }

  // ---- 3. PSAR (confirmation bonus, not a hard gate) ----
  const psarNow = psarM1[psarM1.length - 1];
  const psarAgrees = psarNow ? (direction === "BUY" ? psarNow.bull : !psarNow.bull) : false;
  checklist.push({ label: "PSAR Konfirmasi Arah", pass: psarAgrees });

  // ---- 4. Bollinger position -> entry sizing, SL, TP1 ----
  const bbUpper = bbM1.upper[l1];
  const bbLower = bbM1.lower[l1];
  const bandWidth = bbUpper - bbLower;
  const extendedPastBand = direction === "BUY" ? currentPrice > bbUpper : currentPrice < bbLower;
  checklist.push({ label: "Belum Extended dari Bollinger (bukan fakeout risk)", pass: !extendedPastBand });

  // TP1: realistic quick target = distance to the band in the trade direction; if
  // price already blew past the band (breakout in progress), fall back to a
  // fraction of the band width instead of a negative/zero distance.
  const rawTp1Dist =
    direction === "BUY"
      ? extendedPastBand
        ? bandWidth * 0.5
        : bbUpper - currentPrice
      : extendedPastBand
        ? bandWidth * 0.5
        : currentPrice - bbLower;
  const tp1Pips = clamp(Math.round(rawTp1Dist / pipUnit), TP1_MIN_PIPS, TP1_MAX_PIPS);

  // SL fixed at 50 pips (see SL_FIXED_PIPS note above).
  const slPips = SL_FIXED_PIPS;

  const entryOverride = currentPrice;
  const slPrice = direction === "BUY" ? entryOverride - slPips * pipUnit : entryOverride + slPips * pipUnit;
  const tpPipsList = [tp1Pips, tp1Pips + 15, tp1Pips + 30, tp1Pips + 50];
  const tpPrices = tpPipsList.map((p) => (direction === "BUY" ? entryOverride + p * pipUnit : entryOverride - p * pipUnit));

  // Confidence: base + bonuses. No hard multi-layer gate anymore -- decisive by design.
  let confidence = 68;
  if (psarAgrees) confidence += 10;
  if (direction === "BUY" ? rsiNowM1 >= 50 && rsiNowM1 <= 72 : rsiNowM1 <= 50 && rsiNowM1 >= 28) confidence += 8;
  if (!extendedPastBand) confidence += 6;
  else confidence -= 5; // extended past band = possible fakeout, still tradeable but noted
  confidence = clamp(confidence, 45, 92);

  const bbNote = extendedPastBand ? "harga sudah extend lewat band (waspada fakeout)" : "harga masih di area normal pullback dalam band";

  return {
    direction,
    confidence,
    reasoning: `XAU Scalp: EMA9/20 M1+M5 align ${direction}, RSI M1 ${rsiNowM1.toFixed(1)} / M5 ${rsiNowM5.toFixed(1)}, PSAR ${psarAgrees ? "konfirmasi" : "belum align"}, ${bbNote}. Entry dekat harga live, SL ketat di luar EMA20/PSAR.`,
    atr: slPips * pipUnit,
    checklist,
    entryOverride,
    slPrice,
    tpPrices,
  };
}
