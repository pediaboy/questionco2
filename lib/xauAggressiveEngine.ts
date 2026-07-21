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

// Standard Bollinger Bands (20-period SMA, +/-2 stddev) -- owner request 2026-07-21:
// "yg bener buat scalping nya ema ma boll sar" (EMA + Bollinger + SAR is the right
// combo for scalping). Used below as a HARD anti-chase gate: the old momentum/PSAR
// triggers alone could fire a BUY right as price was already extended above the
// upper band (buying the top) or a SELL right as price was already extended below
// the lower band (selling the bottom) -- exactly the owner's complaint ("harga dah
// di pucuk malah suruh beli, harga udah jatoh malah suruh sell").
function bollingerBands(closes: number[], period = 20, mult = 2): { upper: number[]; lower: number[]; basis: number[] } {
  const n = closes.length;
  const basis: number[] = new Array(n).fill(NaN);
  const upper: number[] = new Array(n).fill(NaN);
  const lower: number[] = new Array(n).fill(NaN);
  for (let i = period - 1; i < n; i++) {
    const window = closes.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    basis[i] = mean;
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { basis, upper, lower };
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
function momentumBreakout(m1: Candle[], pipUnit: number, nowPrice: number, pipsThreshold = 25, lookback = 10): { direction: "BUY" | "SELL"; pipsMoved: number } | null {
  if (m1.length < lookback + 1) return null;
  const last = m1.length - 1;
  const startClose = m1[last - lookback].close;
  // Use the live current price (not the last confirmed candle close) as "now" so a
  // move that happened in the ~60s since the last confirmed candle is still caught.
  const movedPips = (nowPrice - startClose) / pipUnit;
  if (Math.abs(movedPips) < pipsThreshold) return null;
  return { direction: movedPips > 0 ? "BUY" : "SELL", pipsMoved: Math.abs(movedPips) };
}

// Real Support/Resistance zone detection (added 2026-07-20, owner: "kalo harga dah
// tinggi liatin area resis dan support nya" -- when price has already run, check
// nearby resistance/support before firing so an extended BUY into resistance or an
// extended SELL into support gets flagged rather than blindly chased). Uses a
// 5-bar fractal (2 candles either side) over the M5 window to find real swing
// highs/lows, then clusters nearby levels (within `clusterPips`) into zones so
// repeated touches count as one stronger level.
interface SRZone { price: number; touches: number }

function detectSRZones(m5: Candle[], pipUnit: number, fractalWidth = 2, clusterPips = 8): SRZone[] {
  const raw: number[] = [];
  for (let i = fractalWidth; i < m5.length - fractalWidth; i++) {
    const window = m5.slice(i - fractalWidth, i + fractalWidth + 1);
    const isHigh = m5[i].high === Math.max(...window.map((c) => c.high));
    const isLow = m5[i].low === Math.min(...window.map((c) => c.low));
    if (isHigh) raw.push(m5[i].high);
    if (isLow) raw.push(m5[i].low);
  }
  const clusterDist = clusterPips * pipUnit;
  const zones: SRZone[] = [];
  for (const p of raw.slice().sort((a, b) => a - b)) {
    const existing = zones.find((z) => Math.abs(z.price - p) <= clusterDist);
    if (existing) {
      existing.price = (existing.price * existing.touches + p) / (existing.touches + 1);
      existing.touches += 1;
    } else {
      zones.push({ price: p, touches: 1 });
    }
  }
  return zones;
}

function nearestSR(zones: SRZone[], currentPrice: number): { resistance: number | null; support: number | null } {
  const above = zones.filter((z) => z.price > currentPrice).sort((a, b) => a.price - b.price);
  const below = zones.filter((z) => z.price < currentPrice).sort((a, b) => b.price - a.price);
  return { resistance: above[0]?.price ?? null, support: below[0]?.price ?? null };
}

export function evaluateXauAggressive(m1: Candle[], m3: Candle[], m5: Candle[], newsBlackout: boolean, pipUnit: number = 0.1, livePrice?: number): XauAggressiveResult {
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

  // Real current price -- prefer the live OKX ticker (fetched fresh every cron tick,
  // sub-second accurate) over the last CONFIRMED M1 candle close, which can be up to
  // ~60s stale (a candle only becomes "confirmed" once the minute fully closes).
  // Fixes owner complaint 2026-07-20 ("harga dah turun baru ngasih sinyal") -- the
  // momentum/S/R decision checks below now react to the true current price instead
  // of a slightly-lagging closed candle. Indicator math (EMA/RSI/PSAR/StochRSI) still
  // correctly uses confirmed candles only -- those need stable closes, not live ticks.
  const currentPrice = livePrice ?? closes[last];

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

  const momentum = momentumBreakout(m1, pipUnit, currentPrice, 25, 10);
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

  // 1c. Bollinger Band (20, 2) anti-chase HARD gate -- owner request 2026-07-21.
  // Don't BUY if price is already AT/ABOVE the upper band (already pumped to the
  // top -- chasing), don't SELL if price is already AT/BELOW the lower band
  // (already dumped to the bottom -- chasing). This is the fix for "beli di pucuk,
  // jual di dasar": the trigger (PSAR/momentum) can still fire, but an overextended
  // entry gets blocked rather than taken.
  const bb = bollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[last];
  const bbLower = bb.lower[last];
  const bbOverextended =
    !Number.isNaN(bbUpper) && !Number.isNaN(bbLower)
      ? (primaryDirection === "BUY" && currentPrice >= bbUpper) || (primaryDirection === "SELL" && currentPrice <= bbLower)
      : false;
  checklist.push({ label: "Bollinger Band (20,2) Anti-Chase", pass: !bbOverextended });

  if (bbOverextended) {
    return {
      direction: null,
      confidence: 25,
      reasoning: `${primaryDirection} terdeteksi tapi harga sudah overextended di luar Bollinger Band (${primaryDirection === "BUY" ? "sudah di pucuk" : "sudah di dasar"}) — NO TRADE, hindari beli di pucuk / jual di dasar`,
      atr,
      checklist,
      blockReason: "Harga overextended di luar Bollinger Band -- anti-chase",
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
  const bandTouch = direction === "SELL" ? currentPrice >= upperBand : currentPrice <= lowerBand;
  checklist.push({ label: "ATR Band (x1.0) Rejection Zone", pass: bandTouch });

  // Support/Resistance check -- penalize chasing INTO a nearby zone (extended,
  // higher rejection risk), reward a bounce/reject FROM a nearby zone in the
  // trade's favor. Not a hard gate -- a confidence adjustment, so a genuinely
  // strong setup can still fire even right at a level, just flagged clearly.
  const srZones = detectSRZones(m5, pipUnit);
  const { resistance, support } = nearestSR(srZones, currentPrice);
  const srNearPips = 15;
  let srAdjust = 0;
  let srNote = "";
  if (direction === "BUY" && resistance !== null) {
    const distPips = (resistance - currentPrice) / pipUnit;
    if (distPips <= srNearPips) {
      srAdjust -= 15;
      srNote = `mendekati resistance ${resistance.toFixed(2)} (${Math.round(distPips)} pips lagi) — waspada rejection`;
    }
  }
  if (direction === "BUY" && support !== null) {
    const distPips = (currentPrice - support) / pipUnit;
    if (distPips <= srNearPips) {
      srAdjust += 10;
      srNote = srNote ? `${srNote}; mantul dari support ${support.toFixed(2)}` : `mantul dari support ${support.toFixed(2)} (${Math.round(distPips)} pips)`;
    }
  }
  if (direction === "SELL" && support !== null) {
    const distPips = (currentPrice - support) / pipUnit;
    if (distPips <= srNearPips) {
      srAdjust -= 15;
      srNote = `mendekati support ${support.toFixed(2)} (${Math.round(distPips)} pips lagi) — waspada rejection`;
    }
  }
  if (direction === "SELL" && resistance !== null) {
    const distPips = (resistance - currentPrice) / pipUnit;
    if (distPips <= srNearPips) {
      srAdjust += 10;
      srNote = srNote ? `${srNote}; reject dari resistance ${resistance.toFixed(2)}` : `reject dari resistance ${resistance.toFixed(2)} (${Math.round(distPips)} pips)`;
    }
  }
  checklist.push({ label: "Support/Resistance Zone", pass: srAdjust >= 0 });

  const confirmCount = [emaConfirms, stochConfirms, sweepConfirms].filter(Boolean).length;
  let confidence = triggerSource === "momentum" ? 68 : 62; // momentum trigger = already-realized move, slightly higher base
  if (confirmCount >= 2) confidence += 15; // 2+ of 3 confirmations aligned
  if (volumeSpike) confidence += 13;
  if (bandTouch) confidence += 10;
  confidence += srAdjust;
  confidence = Math.max(0, Math.min(95, confidence));

  const parts =
    triggerSource === "momentum"
      ? [`Momentum breakout ${direction} (${momentum!.pipsMoved.toFixed(1)} pips/10min)`, `trend M5 ${trendM5}`]
      : [`PSAR flip ${direction}`, `trend M5 ${trendM5}`];
  if (emaConfirms) parts.push("EMA3/7 cross confirm");
  if (stochConfirms) parts.push("StochRSI extreme-turn confirm");
  if (sweepConfirms) parts.push("Liquidity Sweep M3 confirm");
  if (volumeSpike) parts.push("volume spike 2x");
  if (bandTouch) parts.push("ATR band rejection");
  if (srNote) parts.push(`S/R: ${srNote}`);

  return {
    direction,
    confidence,
    reasoning: `XAU Aggressive Scalp M1: ${parts.join(" + ")}`,
    atr,
    checklist,
  };
}
