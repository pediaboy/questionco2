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
// Rule: PSAR flip (within the last 6 confirmed M1 candles) is REQUIRED, plus at
// least ONE of {EMA3/7 cross, StochRSI extreme-turn} in the same direction — this
// is the "double confirmation, don't wait for a 2nd candle" setup the owner asked for.
//
// TREND FILTER (added 2026-07-20, loosened same day -- owner: "bikin ngikut trend,
// bukan lawan trend, agresif tapi aman" then "trend nya ga muncul samsek"): a HARD
// gate against the M5 EMA20/50 trend, but only rejects when the trend directly
// OPPOSES the flip direction -- flat/ambiguous M5 trend is neutral and does NOT
// block (requiring an exact match was too strict and choked off nearly every signal).
//
// LIQUIDITY SWEEP / M3 (added 2026-07-20, owner: "scalping agresif M1 M3 M5
// liquiditas, kasih aja sinyal mau volatil atau ga"): a 3rd optional 2nd-confirmation
// alongside EMA3/7 cross and StochRSI turn -- a classic liquidity grab on M3 (a wick
// sweeps beyond a recent swing high/low then closes back on the other side,
// signalling stops were hunted before a real move). Nothing here is volatility-gated
// (no ATR/volume minimum to fire) -- volume spike + ATR band stay pure confidence
// bonuses, never blockers, exactly per this request.

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

// M5 trend bias via EMA20/EMA50 alignment -- the higher-timeframe direction filter.
function m5Trend(m5: Candle[]): "up" | "down" | "none" {
  if (m5.length < 55) return "none";
  const closes = m5.map((c) => c.close);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const last = closes.length - 1;
  if (e20[last] > e50[last]) return "up";
  if (e20[last] < e50[last]) return "down";
  return "none";
}

// Liquidity sweep on M3: a candle wicks beyond the highest-high/lowest-low of the
// preceding `lookback` candles, then closes back on the other side of that level --
// a classic stop-hunt before reversal. Checked over the last 3 confirmed M3 candles.
function liquiditySweep(m3: Candle[], lookback = 10): "BUY" | "SELL" | null {
  if (m3.length < lookback + 4) return null;
  const last = m3.length - 1;
  for (let i = last; i >= Math.max(lookback + 1, last - 2); i--) {
    const window = m3.slice(i - lookback, i);
    const swingHigh = Math.max(...window.map((c) => c.high));
    const swingLow = Math.min(...window.map((c) => c.low));
    const c = m3[i];
    // Swept above a recent high (wick) but closed back below it -> bearish sweep -> SELL.
    if (c.high > swingHigh && c.close < swingHigh) return "SELL";
    // Swept below a recent low (wick) but closed back above it -> bullish sweep -> BUY.
    if (c.low < swingLow && c.close > swingLow) return "BUY";
  }
  return null;
}

// Real-time momentum breakout (added 2026-07-20, owner: "sebelom xau mau terbang
// atau terjun trend nya langsung ngasih sinyal yg valid" -- catch a fast directional
// move AS it's happening, without waiting for a PSAR flip which can lag). If price
// has net-moved >= 25 pips in one direction over the last `lookback` M1 candles,
// that raw momentum is itself treated as a valid standalone trigger (in addition to,
// not instead of, the existing PSAR-flip trigger).
function momentumBreakout(m1: Candle[], pipUnit: number, pipsThreshold = 25, lookback = 10): { direction: "BUY" | "SELL"; pipsMoved: number } | null {
  if (m1.length < lookback + 1) return null;
  const last = m1.length - 1;
  const startClose = m1[last - lookback].close;
  const nowClose = m1[last].close;
  const movedPips = (nowClose - startClose) / pipUnit;
  if (Math.abs(movedPips) < pipsThreshold) return null;
  return { direction: movedPips > 0 ? "BUY" : "SELL", pipsMoved: Math.abs(movedPips) };
}

export function evaluateXauAggressive(m1: Candle[], m3: Candle[], m5: Candle[], newsBlackout: boolean, pipUnit: number = 0.1): XauAggressiveResult {
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

  // 1. Primary trigger -- EITHER a PSAR flip within the last 6 confirmed candles,
  // OR a real-time 25-pip momentum breakout (added 2026-07-20, catches a fast move
  // AS it happens instead of waiting for PSAR to lag behind). Widened PSAR lookback
  // 3->6 (2026-07-20, "trend nya ga muncul samsek") -- the cron ticks every 5
  // minutes, so a 3-candle (3min) lookback was systematically missing flips that
  // happened between ticks.
  let psarFlip: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(1, last - 5); i--) {
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

  const momentum = momentumBreakout(m1, pipUnit, 25, 10);
  checklist.push({ label: "Momentum Breakout (25 pips / 10min)", pass: momentum !== null });

  let triggerSource: "psar" | "momentum" | null = null;
  let primaryDirection: "BUY" | "SELL" | null = null;
  if (psarFlip) {
    primaryDirection = psarFlip;
    triggerSource = "psar";
  } else if (momentum) {
    primaryDirection = momentum.direction;
    triggerSource = "momentum";
  }

  if (!primaryDirection) {
    return {
      direction: null,
      confidence: 0,
      reasoning: "Belum ada PSAR flip maupun momentum breakout 25 pips — NO TRADE",
      atr,
      checklist,
      blockReason: "Belum ada PSAR flip / momentum breakout",
    };
  }

  // 1b. HARD trend gate: only reject if M5 EMA20/50 trend directly OPPOSES the
  // trigger direction (loosened 2026-07-20, "trend nya ga muncul samsek" -- requiring
  // an exact match was too strict and choked off almost every signal). Flat/none
  // trend no longer blocks -- it's neutral, not "must match".
  const trendM5 = m5Trend(m5);
  const trendOpposes = (trendM5 === "down" && primaryDirection === "BUY") || (trendM5 === "up" && primaryDirection === "SELL");
  const trendMatches = !trendOpposes;
  checklist.push({ label: "M5 Trend Alignment (EMA20/50)", pass: trendMatches });

  if (!trendMatches) {
    return {
      direction: null,
      confidence: 20,
      reasoning: `${triggerSource === "momentum" ? `Momentum breakout ${primaryDirection}` : `PSAR flip ${primaryDirection}`} tapi trend M5 ${trendM5} — lawan trend, NO TRADE`,
      atr,
      checklist,
      blockReason: `${triggerSource === "momentum" ? "Momentum breakout" : "PSAR flip"} melawan trend M5`,
    };
  }

  // Backward-compat alias -- the rest of the function below still refers to
  // psarFlip as "the trigger direction" when checking 2nd-confirmation alignment.
  const effectivePsarFlip = triggerSource === "psar" ? psarFlip : null;

  // 2. EMA3/EMA7 crossover within last 6 bars (widened with PSAR window above), same
  // direction as the trigger.
  let emaCross: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(1, last - 5); i--) {
    if (ema3[i - 1] <= ema7[i - 1] && ema3[i] > ema7[i]) {
      emaCross = "BUY";
      break;
    }
    if (ema3[i - 1] >= ema7[i - 1] && ema3[i] < ema7[i]) {
      emaCross = "SELL";
      break;
    }
  }
  const emaConfirms = emaCross === primaryDirection;
  checklist.push({ label: "EMA 3/7 Crossover", pass: emaConfirms });

  // 3. StochRSI(5,3,3) exiting <10 turning up, or >90 turning down, same direction.
  let stochTurn: "BUY" | "SELL" | null = null;
  for (let i = last; i >= Math.max(2, last - 5); i--) {
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
  const stochConfirms = stochTurn === primaryDirection;
  checklist.push({ label: "Stochastic RSI (5,3,3) Extreme Turn", pass: stochConfirms });

  // 2b. Liquidity sweep on M3, same direction as the trigger -- a 3rd option for the
  // 2nd confirmation (stop-hunt reversal pattern, not volatility-gated).
  const sweep = liquiditySweep(m3, 10);
  const sweepConfirms = sweep === primaryDirection;
  checklist.push({ label: "Liquidity Sweep (M3)", pass: sweepConfirms });

  // Aggressive gate: if triggered by a PSAR flip, still require >=1 of {EMA cross,
  // StochRSI turn, M3 liquidity sweep} in the SAME direction ("double confirmation").
  // If triggered by a 25-pip momentum breakout instead (added 2026-07-20, "sebelom
  // xau mau terbang atau terjun ... langsung ngasih sinyal yg valid"), the realized
  // price move IS the confirmation -- fires immediately, no extra hurdle, to catch
  // the move fast rather than waiting.
  if (triggerSource === "psar" && !emaConfirms && !stochConfirms && !sweepConfirms) {
    return {
      direction: null,
      confidence: 35,
      reasoning: `PSAR flip ${effectivePsarFlip} terdeteksi tapi belum ada konfirmasi kedua (EMA3/7, StochRSI, atau Liquidity Sweep M3) — NO TRADE`,
      atr,
      checklist,
      blockReason: "PSAR flip tanpa konfirmasi kedua",
    };
  }

  const direction = primaryDirection;

  // Bonus scoring (informational, NOT gates): volume spike + ATR band rejection.
  const volAvg = volumes.slice(Math.max(0, last - 20), last).reduce((a, b) => a + b, 0) / Math.min(20, last || 1);
  const volumeSpike = volAvg > 0 && volumes[last] >= volAvg * 2;
  checklist.push({ label: "Volume Spike (>=2x avg)", pass: volumeSpike });

  const basis = ema(closes, 20)[last];
  const upperBand = basis + atr * 1.0;
  const lowerBand = basis - atr * 1.0;
  const bandTouch = direction === "SELL" ? closes[last] >= upperBand : closes[last] <= lowerBand;
  checklist.push({ label: "ATR Band (x1.0) Rejection Zone", pass: bandTouch });

  const confirmCount = [emaConfirms, stochConfirms, sweepConfirms].filter(Boolean).length;
  let confidence = triggerSource === "momentum" ? 68 : 62; // momentum trigger = already-realized move, slightly higher base
  if (confirmCount >= 2) confidence += 15; // 2+ of 3 confirmations aligned
  if (volumeSpike) confidence += 13;
  if (bandTouch) confidence += 10;
  confidence = Math.min(95, confidence);

  const parts =
    triggerSource === "momentum"
      ? [`Momentum breakout ${direction} (${momentum!.pipsMoved.toFixed(1)} pips/10min)`, `trend M5 ${trendM5}`]
      : [`PSAR flip ${direction}`, `trend M5 ${trendM5}`];
  if (emaConfirms) parts.push("EMA3/7 cross confirm");
  if (stochConfirms) parts.push("StochRSI extreme-turn confirm");
  if (sweepConfirms) parts.push("Liquidity Sweep M3 confirm");
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
