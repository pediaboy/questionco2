// XAU SMC Liquidity Sweep + FVG Engine — dedicated M5/H1 strategy for XAUUSD ONLY,
// per owner spec 2026-07-22 ("jangan sampe ngaco lagi"). Full replacement of the
// previous PSAR/momentum-chasing model, which kept buying tops and selling bottoms
// (owner complaint 2026-07-21). BTC/ETH/SOL keep using the Institutional SMC v3
// model (lib/institutionalEngine.ts) unchanged.
//
// LAYER 1 — SMC Liquidity Sweep & FVG (the ONLY setup, order-only, never a chase):
//   BUY:  Liquidity Sweep at a recent M5 swing low (wick breaks below it, closes
//         back above) followed by a Bullish FVG (3-candle gap: candle1.high <
//         candle3.low). Entry = TOP of the FVG (candle3.low) — a BUY LIMIT, filled
//         only once price actually retraces back down INTO the gap.
//   SELL: Liquidity Sweep at a recent M5 swing high (wick breaks above it, closes
//         back below) followed by a Bearish FVG (candle1.low > candle3.high).
//         Entry = BOTTOM of the FVG (candle3.high) — a SELL LIMIT, filled only
//         once price retraces back up INTO the gap.
//   Instant market orders at a fresh extreme are explicitly never fired — the
//   engine only returns a direction once live price has actually traded back INTO
//   the FVG zone (i.e., the limit would already be filled), never while price is
//   still out at the sweep extreme.
//
// LAYER 2 — EMA200 H1 trend filter (HARD gate, no exceptions):
//   BUY only valid if price > EMA200 H1. SELL only valid if price < EMA200 H1.
//
// LAYER 3 — Momentum & volatility guard (HARD gates):
//   RSI(14) M5: forbidden to BUY if RSI > 60, forbidden to SELL if RSI < 40.
//   ATR(14) M5 must clear a minimum floor (avoid dead/sideways tape).
//   The FVG's breakout candle volume must exceed its own 10-candle volume MA
//   (avoid a low-conviction, low-volume gap).
//
// Risk model (unchanged, fixed pips, set by app/api/cron/auto-signal/route.ts):
// SL 50 pips / TP1 30 / TP2 50 / TP3 70 / TP4 100 — TP1 note: move SL to entry (BEP).

import { Candle, ema } from "./signalEngine";

export interface XauAggressiveResult {
  direction: "BUY" | "SELL" | null;
  confidence: number;
  reasoning: string;
  atr: number;
  checklist: { label: string; pass: boolean }[];
  blockReason?: string;
  entryOverride?: number; // FVG-zone limit entry (top of FVG for BUY, bottom for SELL)
}

const MIN_ATR_PIPS = 8; // minimum M5 ATR, in pips, to consider the market volatile enough to trade

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

function atrSeries(candles: Candle[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
      continue;
    }
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }
  if (trs.length <= period) return out;
  let avg = trs.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = avg;
  for (let i = period + 1; i < trs.length; i++) {
    avg = (avg * (period - 1) + trs[i]) / period;
    out[i] = avg;
  }
  return out;
}

// Liquidity sweep: a candle wicks beyond the highest-high/lowest-low of the
// preceding `lookback` candles, then closes back on the other side -- a classic
// stop-hunt before reversal. Scans the last `scanBack` candles for the most recent
// occurrence (returns its index so the FVG search can start from there).
function findLiquiditySweep(candles: Candle[], lookback = 12, scanBack = 8): { direction: "BUY" | "SELL"; index: number } | null {
  const last = candles.length - 1;
  const earliest = Math.max(lookback + 1, last - scanBack);
  for (let i = last; i >= earliest; i--) {
    const window = candles.slice(i - lookback, i);
    const swingHigh = Math.max(...window.map((c) => c.high));
    const swingLow = Math.min(...window.map((c) => c.low));
    const c = candles[i];
    if (c.high > swingHigh && c.close < swingHigh) return { direction: "SELL", index: i };
    if (c.low < swingLow && c.close > swingLow) return { direction: "BUY", index: i };
  }
  return null;
}

interface Fvg { top: number; bottom: number; index: number }

// Bullish FVG: 3-candle gap where candle1.high < candle3.low. Zone = [candle1.high,
// candle3.low]; entry (top of FVG) = candle3.low.
function findBullishFvg(candles: Candle[], fromIdx: number, toIdx: number): Fvg | null {
  for (let i = toIdx; i >= Math.max(2, fromIdx); i--) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    if (c1.high < c3.low) return { top: c3.low, bottom: c1.high, index: i };
  }
  return null;
}

// Bearish FVG: candle1.low > candle3.high. Zone = [candle3.high, candle1.low];
// entry (bottom of FVG) = candle3.high.
function findBearishFvg(candles: Candle[], fromIdx: number, toIdx: number): Fvg | null {
  for (let i = toIdx; i >= Math.max(2, fromIdx); i--) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    if (c1.low > c3.high) return { top: c1.low, bottom: c3.high, index: i };
  }
  return null;
}

function volumeMaBefore(candles: Candle[], idx: number, period = 10): number {
  const start = Math.max(0, idx - period);
  const window = candles.slice(start, idx);
  if (window.length === 0) return 0;
  return window.reduce((a, b) => a + b.volume, 0) / window.length;
}

export function evaluateXauAggressive(
  m5: Candle[],
  h1: Candle[],
  newsBlackout: boolean,
  pipUnit: number = 0.1,
  livePrice?: number
): XauAggressiveResult {
  const checklist: { label: string; pass: boolean }[] = [];

  if (newsBlackout) {
    return { direction: null, confidence: 0, reasoning: "Blocked: high-impact news window", atr: 0, checklist, blockReason: "News blackout aktif" };
  }
  if (m5.length < 40) {
    return { direction: null, confidence: 0, reasoning: "Not enough M5 data yet", atr: 0, checklist, blockReason: "Data M5 belum cukup" };
  }
  if (h1.length < 210) {
    return { direction: null, confidence: 0, reasoning: "Not enough H1 data yet for EMA200", atr: 0, checklist, blockReason: "Data H1 belum cukup" };
  }

  const closes = m5.map((c) => c.close);
  const last = m5.length - 1;
  const currentPrice = livePrice ?? closes[last];

  // ---- LAYER 1: Liquidity Sweep -> FVG (order-only setup) ----
  const sweep = findLiquiditySweep(m5, 12, 8);
  checklist.push({ label: "Liquidity Sweep (Swing Low/High M5)", pass: sweep !== null });

  if (!sweep) {
    return {
      direction: null,
      confidence: 0,
      reasoning: "Belum ada Liquidity Sweep di swing low/high M5 — NO TRADE",
      atr: 0,
      checklist,
      blockReason: "Belum ada Liquidity Sweep",
    };
  }

  const fvg = sweep.direction === "BUY" ? findBullishFvg(m5, sweep.index, last) : findBearishFvg(m5, sweep.index, last);
  checklist.push({ label: `${sweep.direction === "BUY" ? "Bullish" : "Bearish"} FVG / Order Block`, pass: fvg !== null });

  if (!fvg) {
    return {
      direction: null,
      confidence: 0,
      reasoning: `Liquidity Sweep ${sweep.direction} terdeteksi tapi FVG belum terbentuk — NO TRADE, tunggu`,
      atr: 0,
      checklist,
      blockReason: "FVG belum terbentuk setelah sweep",
    };
  }

  const direction = sweep.direction;
  const entryLevel = direction === "BUY" ? fvg.top : fvg.bottom;

  // Price must have ACTUALLY retraced back into the FVG zone -- this is what
  // guarantees the "limit order" would already be filled, and is the hard block
  // against ever recommending a market order at a fresh extreme (owner: "dilarang
  // keras merekomendasikan instant market order saat harga di pucuk/dasar").
  const inZone = currentPrice >= fvg.bottom && currentPrice <= fvg.top;
  checklist.push({ label: `Harga Retrace ke Area FVG (${direction === "BUY" ? "Top" : "Bottom"})`, pass: inZone });

  if (!inZone) {
    return {
      direction: null,
      confidence: 30,
      reasoning: `Setup ${direction} valid (Sweep + FVG) tapi harga belum retrace ke area FVG (limit ${entryLevel.toFixed(2)}) — NO TRADE, tunggu limit terisi`,
      atr: 0,
      checklist,
      blockReason: "Harga belum masuk area FVG (limit belum terisi)",
    };
  }

  // ---- LAYER 2: EMA200 H1 trend filter (hard gate) ----
  const h1Closes = h1.map((c) => c.close);
  const ema200Arr = ema(h1Closes, 200);
  const ema200 = ema200Arr[ema200Arr.length - 1];
  const trendOk = direction === "BUY" ? currentPrice > ema200 : currentPrice < ema200;
  checklist.push({ label: "EMA200 H1 Trend Filter", pass: trendOk });

  if (!trendOk) {
    return {
      direction: null,
      confidence: 25,
      reasoning: `Setup ${direction} (Sweep + FVG, harga di zona) tapi melawan EMA200 H1 (${ema200.toFixed(2)}) — NO TRADE`,
      atr: 0,
      checklist,
      blockReason: "Melawan EMA200 H1",
    };
  }

  // ---- LAYER 3: Momentum & volatility guard (hard gates) ----
  const rsiArr = rsi(closes, 14);
  const rsiNow = rsiArr[last];
  const rsiOk = direction === "BUY" ? rsiNow <= 60 : rsiNow >= 40;
  checklist.push({ label: "RSI(14) M5 Filter (Buy<=60 / Sell>=40)", pass: rsiOk });

  const atrArr = atrSeries(m5, 14);
  const atrNow = atrArr[last] || atrArr.filter((v) => !Number.isNaN(v)).slice(-1)[0] || 0;
  const atrPips = atrNow / pipUnit;
  const atrOk = atrPips >= MIN_ATR_PIPS;
  checklist.push({ label: `ATR(14) M5 Minimum (>=${MIN_ATR_PIPS} pips)`, pass: atrOk });

  const volMa10 = volumeMaBefore(m5, fvg.index, 10);
  const breakoutVolume = m5[fvg.index]?.volume ?? 0;
  const volumeOk = volMa10 > 0 && breakoutVolume > volMa10;
  checklist.push({ label: "Volume Konfirmasi > MA Volume(10)", pass: volumeOk });

  if (!rsiOk || !atrOk || !volumeOk) {
    const reasons = [
      !rsiOk ? `RSI(14) ${rsiNow.toFixed(1)} ${direction === "BUY" ? "> 60" : "< 40"}` : null,
      !atrOk ? `ATR ${atrPips.toFixed(1)} pips < min ${MIN_ATR_PIPS}` : null,
      !volumeOk ? "volume breakout <= MA(10)" : null,
    ].filter(Boolean);
    return {
      direction: null,
      confidence: 30,
      reasoning: `Setup ${direction} valid (Sweep+FVG+EMA200) tapi diblok Layer 3: ${reasons.join(", ")} — NO TRADE`,
      atr: atrNow,
      checklist,
      blockReason: reasons.join(", "),
    };
  }

  // All 3 layers passed. Fixed base confidence (hard-gate system, no partial
  // credit) + small bonuses for extra confluence strength.
  let confidence = 78;
  if (breakoutVolume > volMa10 * 1.5) confidence += 6;
  if (atrPips >= MIN_ATR_PIPS * 1.5) confidence += 4;
  if (direction === "BUY" && rsiNow <= 50) confidence += 4;
  if (direction === "SELL" && rsiNow >= 50) confidence += 4;
  confidence = Math.min(94, confidence);

  return {
    direction,
    confidence,
    reasoning: `XAU SMC: Liquidity Sweep ${direction} + ${direction === "BUY" ? "Bullish" : "Bearish"} FVG (limit ${entryLevel.toFixed(2)}) + EMA200 H1 align + RSI ${rsiNow.toFixed(1)} + ATR ${atrPips.toFixed(1)}p + volume confirm`,
    atr: atrNow,
    checklist,
    entryOverride: entryLevel,
  };
}
