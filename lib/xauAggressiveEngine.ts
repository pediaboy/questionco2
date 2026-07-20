// XAU Aggressive Scalping Engine — dedicated, M1-focused strategy for XAUUSD ONLY,
// per owner request 2026-07-20 ("khusus xau, paling agresif"). BTC/ETH/SOL keep using
// the Institutional SMC v3 model (lib/institutionalEngine.ts) unchanged.
//
// Trigger stack (owner-specified, "pick the most aggressive"):
//   1. Parabolic SAR (0.02 / 0.2) flip — the mandatory main trigger.
//   2. EMA 3 / EMA 7 crossover (M1) — fast trend-following confirmation.
//   3. Stochastic RSI (5,3,3) exiting <10 (turning up) / >90 (turning down) — momentum
//      exhaustion/reversal confirmation.
//   4. ATR Bands (multiplier 1.0) rejection + Volume spike (>=2x 20-bar average) —
//      NOT gates, just confidence boosters shown in the signal reasoning (owner's
//      own doc calls these "bonus/hidden weapon", not the core trigger).
//
// Rule: PSAR flip (within the last 3 confirmed M1 candles) is REQUIRED, plus at
// least ONE of {EMA3/7 cross, StochRSI extreme-turn} in the same direction — this
// is the "double confirmation, don't wait for a 2nd candle" setup the owner asked for.

import { Candle, ema } from "./signalEngine";

export interface XauAggressiveResult {
  direction: "BUY" | "SELL" | null;
  confidence: number;
  reasoning: string;
  atr: number;
  checklist: { label: string; pass: boolean }[];
  blockReason?: string;
}

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

// Standard Wilder Parabolic SAR. Returns per-bar SAR value + trend ("up"=bullish/long).
function parabolicSar(candles: Candle[], step = 0.02, max = 0.2): { sar: number[]; trend: ("up" | "down")[] } {
  const n = candles.length;
  const sar: number[] = new Array(n).fill(NaN);
  const trend: ("up" | "down")[] = new Array(n).fill("up");
  if (n < 3) return { sar, trend };

  let isUp = candles[1].close >= candles[0].close;
  let ep = isUp ? candles[0].high : candles[0].low;
  let af = step;
  let curSar = isUp ? candles[0].low : candles[0].high;

  sar[0] = curSar;
  trend[0] = isUp ? "up" : "down";

  for (let i = 1; i < n; i++) {
    curSar = curSar + af * (ep - curSar);

    if (isUp) {
      curSar = Math.min(curSar, candles[i - 1].low, i >= 2 ? candles[i - 2].low : candles[i - 1].low);
      if (candles[i].low < curSar) {
        isUp = false;
        curSar = ep;
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(af + step, max);
        }
      }
    } else {
      curSar = Math.max(curSar, candles[i - 1].high, i >= 2 ? candles[i - 2].high : candles[i - 1].high);
      if (candles[i].high > curSar) {
        isUp = true;
        curSar = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(af + step, max);
        }
      }
    }

    sar[i] = curSar;
    trend[i] = isUp ? "up" : "down";
  }

  return { sar, trend };
}

function stochRsi(rsiArr: number[], stochPeriod = 5, kSmooth = 3, dSmooth = 3): { k: number[]; d: number[] } {
  const n = rsiArr.length;
  const raw: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (i < stochPeriod - 1 || Number.isNaN(rsiArr[i])) continue;
    const window = rsiArr.slice(i - stochPeriod + 1, i + 1).filter((v) => !Number.isNaN(v));
    if (window.length < stochPeriod) continue;
    const lo = Math.min(...window);
    const hi = Math.max(...window);
    raw[i] = hi === lo ? 50 : ((rsiArr[i] - lo) / (hi - lo)) * 100;
  }
  const sma = (arr: number[], period: number) => {
    const out: number[] = new Array(arr.length).fill(NaN);
    for (let i = period - 1; i < arr.length; i++) {
      const win = arr.slice(i - period + 1, i + 1);
      if (win.some((v) => Number.isNaN(v))) continue;
      out[i] = win.reduce((a, b) => a + b, 0) / period;
    }
    return out;
  };
  const k = sma(raw, kSmooth);
  const d = sma(k, dSmooth);
  return { k, d };
}

export function evaluateXauAggressive(m1: Candle[], newsBlackout: boolean): XauAggressiveResult {
  const checklist: { label: string; pass: boolean }[] = [];

  if (newsBlackout) {
    return { direction: null, confidence: 0, reasoning: "Blocked: high-impact news window", atr: 0, checklist, blockReason: "News blackout aktif" };
  }
  if (m1.length < 40) {
    return { direction: null, confidence: 0, reasoning: "Not enough M1 data yet", atr: 0, checklist, blockReason: "Data M1 belum cukup" };
  }

  const closes = m1.map((c) => c.close);
  const volumes = m1.map((c) => c.volume);
  const last = m1.length - 1;

  const { trend } = parabolicSar(m1, 0.02, 0.2);
  const ema3 = ema(closes, 3);
  const ema7 = ema(closes, 7);
  const rsi14 = rsi(closes, 14);
  const { k: stochK } = stochRsi(rsi14, 5, 3, 3);
  const atrArr = atrSeries(m1, 14);
  const atr = atrArr[last] || atrArr.filter((v) => !Number.isNaN(v)).slice(-1)[0] || 0;

  // 1. PSAR flip within the last 3 confirmed candles (mandatory trigger).
  let psarFlip: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(1, last - 2); i--) {
    if (trend[i] === "up" && trend[i - 1] === "down") {
      psarFlip = "BUY";
      break;
    }
    if (trend[i] === "down" && trend[i - 1] === "up") {
      psarFlip = "SELL";
      break;
    }
  }
  checklist.push({ label: "Parabolic SAR (0.02/0.2) Flip", pass: psarFlip !== null });

  if (!psarFlip) {
    return {
      direction: null,
      confidence: 0,
      reasoning: "Belum ada PSAR flip di 3 candle M1 terakhir — NO TRADE",
      atr,
      checklist,
      blockReason: "Belum ada PSAR flip",
    };
  }

  // 2. EMA3/EMA7 crossover within last 3 bars, same direction as PSAR flip.
  let emaCross: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(1, last - 2); i--) {
    if (ema3[i - 1] <= ema7[i - 1] && ema3[i] > ema7[i]) {
      emaCross = "BUY";
      break;
    }
    if (ema3[i - 1] >= ema7[i - 1] && ema3[i] < ema7[i]) {
      emaCross = "SELL";
      break;
    }
  }
  const emaConfirms = emaCross === psarFlip;
  checklist.push({ label: "EMA 3/7 Crossover", pass: emaConfirms });

  // 3. StochRSI(5,3,3) exiting <10 turning up, or >90 turning down, same direction.
  let stochTurn: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(2, last - 2); i--) {
    if (!Number.isNaN(stochK[i]) && !Number.isNaN(stochK[i - 1])) {
      if (stochK[i - 1] < 10 && stochK[i] > stochK[i - 1]) {
        stochTurn = "BUY";
        break;
      }
      if (stochK[i - 1] > 90 && stochK[i] < stochK[i - 1]) {
        stochTurn = "SELL";
        break;
      }
    }
  }
  const stochConfirms = stochTurn === psarFlip;
  checklist.push({ label: "Stochastic RSI (5,3,3) Extreme Turn", pass: stochConfirms });

  // Aggressive gate: PSAR flip is mandatory, plus >=1 of {EMA cross, StochRSI turn}
  // in the SAME direction ("double confirmation", no waiting for a 2nd candle).
  if (!emaConfirms && !stochConfirms) {
    return {
      direction: null,
      confidence: 35,
      reasoning: `PSAR flip ${psarFlip} terdeteksi tapi belum ada konfirmasi kedua (EMA3/7 atau StochRSI) — NO TRADE`,
      atr,
      checklist,
      blockReason: "PSAR flip tanpa konfirmasi kedua",
    };
  }

  const direction = psarFlip;

  // Bonus scoring (informational, NOT gates): volume spike + ATR band rejection.
  const volAvg = volumes.slice(Math.max(0, last - 20), last).reduce((a, b) => a + b, 0) / Math.min(20, last || 1);
  const volumeSpike = volAvg > 0 && volumes[last] >= volAvg * 2;
  checklist.push({ label: "Volume Spike (>=2x avg)", pass: volumeSpike });

  const basis = ema(closes, 20)[last];
  const upperBand = basis + atr * 1.0;
  const lowerBand = basis - atr * 1.0;
  const bandTouch = direction === "SELL" ? closes[last] >= upperBand : closes[last] <= lowerBand;
  checklist.push({ label: "ATR Band (x1.0) Rejection Zone", pass: bandTouch });

  let confidence = 62;
  if (emaConfirms && stochConfirms) confidence += 15; // all 3 core confirmations aligned
  if (volumeSpike) confidence += 13;
  if (bandTouch) confidence += 10;
  confidence = Math.min(95, confidence);

  const parts = [`PSAR flip ${direction}`];
  if (emaConfirms) parts.push("EMA3/7 cross confirm");
  if (stochConfirms) parts.push("StochRSI extreme-turn confirm");
  if (volumeSpike) parts.push("volume spike 2x");
  if (bandTouch) parts.push("ATR band rejection");

  return {
    direction,
    confidence,
    reasoning: `XAU Aggressive Scalp M1: ${parts.join(" + ")}`,
    atr,
    checklist,
  };
}
