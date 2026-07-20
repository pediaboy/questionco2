/**
 * LASTQUESTION.CO :: AUTO WATCHLIST SCANNER ENGINE
 * 100% real data, zero dummy. Scans a curated universe of liquid OKX USDT spot
 * pairs every cron tick using real 1H candles, scores each one on real momentum +
 * volume + breakout criteria, and returns only the pairs that genuinely qualify
 * right now. There is NO manual add/remove -- a coin appears because the market
 * data says it's hot, and disappears the moment it cools off (next tick simply
 * won't include it, and the cron route deletes it from the table).
 *
 * Scoring model (0-100, qualifies at >= QUALIFY_SCORE):
 *   - 1H momentum   : |Δ1H| > 1.5%  -> +20   |Δ1H| > 3.5%  -> +15 more (up to 35)
 *   - 4H momentum   : |Δ4H| > 4%    -> +15
 *   - Volume spike  : vol/avg20 > 1.5x -> +15   > 2.5x -> +10 more (up to 25)
 *   - Structure     : new 20-candle high/low (breakout) -> +25
 * Direction (bullish/bearish) follows the sign of Δ1H. Every fired factor is
 * recorded into a human-readable `reasoning` string with the actual numbers --
 * nothing here is a canned/templated sentence unrelated to the real computed values.
 */

export interface UniversePair {
  key: string; // display label, e.g. "BTCUSDT"
  instId: string; // OKX instId, e.g. "BTC-USDT"
}

// 28 liquid OKX USDT spot pairs -- validated live against OKX's ticker endpoint
// (2026-07-21) to confirm every instId actually exists before wiring the scanner.
export const WATCHLIST_UNIVERSE: UniversePair[] = [
  { key: "BTCUSDT", instId: "BTC-USDT" },
  { key: "ETHUSDT", instId: "ETH-USDT" },
  { key: "SOLUSDT", instId: "SOL-USDT" },
  { key: "XRPUSDT", instId: "XRP-USDT" },
  { key: "ADAUSDT", instId: "ADA-USDT" },
  { key: "DOGEUSDT", instId: "DOGE-USDT" },
  { key: "DOTUSDT", instId: "DOT-USDT" },
  { key: "LINKUSDT", instId: "LINK-USDT" },
  { key: "AVAXUSDT", instId: "AVAX-USDT" },
  { key: "LTCUSDT", instId: "LTC-USDT" },
  { key: "BNBUSDT", instId: "BNB-USDT" },
  { key: "TRXUSDT", instId: "TRX-USDT" },
  { key: "NEARUSDT", instId: "NEAR-USDT" },
  { key: "APTUSDT", instId: "APT-USDT" },
  { key: "ARBUSDT", instId: "ARB-USDT" },
  { key: "OPUSDT", instId: "OP-USDT" },
  { key: "SUIUSDT", instId: "SUI-USDT" },
  { key: "INJUSDT", instId: "INJ-USDT" },
  { key: "ATOMUSDT", instId: "ATOM-USDT" },
  { key: "FILUSDT", instId: "FIL-USDT" },
  { key: "ICPUSDT", instId: "ICP-USDT" },
  { key: "ETCUSDT", instId: "ETC-USDT" },
  { key: "XLMUSDT", instId: "XLM-USDT" },
  { key: "HBARUSDT", instId: "HBAR-USDT" },
  { key: "SHIBUSDT", instId: "SHIB-USDT" },
  { key: "PEPEUSDT", instId: "PEPE-USDT" },
  { key: "WLDUSDT", instId: "WLD-USDT" },
  { key: "POLUSDT", instId: "POL-USDT" },
];

export const QUALIFY_SCORE = 55;

interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchOkx1hCandles(instId: string, limit = 30): Promise<Candle[]> {
  const url = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=1H&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (json.code !== "0" || !Array.isArray(json.data)) {
    throw new Error(`OKX 1H candle fetch failed for ${instId}: ${json.msg || "unknown error"}`);
  }
  const rows: Candle[] = json.data
    .filter((r: string[]) => r[8] === "1") // only fully-closed candles
    .map((r: string[]) => ({
      ts: Number(r[0]),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));
  return rows.reverse(); // chronological
}

export interface ScanResult {
  pair: string;
  instId: string;
  qualifies: boolean;
  direction: "bullish" | "bearish";
  score: number;
  change1h: number;
  change4h: number;
  volumeRatio: number;
  isBreakout: boolean;
  lastPrice: number;
  reasoning: string;
  error?: string;
}

function scoreOne(pair: UniversePair, candles: Candle[]): ScanResult {
  const n = candles.length;
  const last = candles[n - 1];
  const prev1h = candles[n - 2];
  const prev4h = candles[n - 5] || candles[0];

  const change1h = prev1h.close !== 0 ? ((last.close - prev1h.close) / prev1h.close) * 100 : 0;
  const change4h = prev4h.close !== 0 ? ((last.close - prev4h.close) / prev4h.close) * 100 : 0;

  // window of the 20 candles BEFORE the current one -- excludes the live candle
  // itself so "breakout" and "volume ratio" are judged against real prior history.
  const windowStart = Math.max(0, n - 21);
  const window = candles.slice(windowStart, n - 1);
  const avgVol20 = window.length > 0 ? window.reduce((s, c) => s + c.volume, 0) / window.length : last.volume;
  const volumeRatio = avgVol20 > 0 ? last.volume / avgVol20 : 1;
  const highestHigh20 = window.length > 0 ? Math.max(...window.map((c) => c.high)) : last.high;
  const lowestLow20 = window.length > 0 ? Math.min(...window.map((c) => c.low)) : last.low;
  const breakoutUp = last.close > highestHigh20;
  const breakoutDown = last.close < lowestLow20;

  const bullish = change1h >= 0;
  const absChange1h = Math.abs(change1h);
  const absChange4h = Math.abs(change4h);
  const isBreakout = bullish ? breakoutUp : breakoutDown;

  let score = 0;
  const reasons: string[] = [];

  if (absChange1h > 1.5) {
    score += 20;
    reasons.push(`Momentum 1H ${change1h >= 0 ? "+" : ""}${change1h.toFixed(2)}%`);
    if (absChange1h > 3.5) score += 15;
  }
  if (absChange4h > 4) {
    score += 15;
    reasons.push(`Momentum 4H ${change4h >= 0 ? "+" : ""}${change4h.toFixed(2)}%`);
  }
  if (volumeRatio > 1.5) {
    score += 15;
    reasons.push(`Volume ${volumeRatio.toFixed(1)}x rata-rata 20 candle`);
    if (volumeRatio > 2.5) score += 10;
  }
  if (isBreakout) {
    score += 25;
    reasons.push(bullish ? "Breakout tertinggi 20 candle (1H)" : "Breakdown terendah 20 candle (1H)");
  }
  score = Math.min(100, score);

  return {
    pair: pair.key,
    instId: pair.instId,
    qualifies: score >= QUALIFY_SCORE,
    direction: bullish ? "bullish" : "bearish",
    score,
    change1h,
    change4h,
    volumeRatio,
    isBreakout,
    lastPrice: last.close,
    reasoning: reasons.length > 0 ? reasons.join(" • ") : "Tidak ada konfluensi signifikan",
  };
}

/** Scans the whole universe in parallel, tolerating individual pair failures
 * (a single OKX hiccup on one pair must never take down the whole scan). */
export async function scanUniverseForHotCoins(): Promise<ScanResult[]> {
  const results = await Promise.all(
    WATCHLIST_UNIVERSE.map(async (pair) => {
      try {
        const candles = await fetchOkx1hCandles(pair.instId, 30);
        if (candles.length < 10) {
          return {
            pair: pair.key,
            instId: pair.instId,
            qualifies: false,
            direction: "bullish" as const,
            score: 0,
            change1h: 0,
            change4h: 0,
            volumeRatio: 0,
            isBreakout: false,
            lastPrice: 0,
            reasoning: "",
            error: "insufficient candle history",
          };
        }
        return scoreOne(pair, candles);
      } catch (e) {
        return {
          pair: pair.key,
          instId: pair.instId,
          qualifies: false,
          direction: "bullish" as const,
          score: 0,
          change1h: 0,
          change4h: 0,
          volumeRatio: 0,
          isBreakout: false,
          lastPrice: 0,
          reasoning: "",
          error: e instanceof Error ? e.message : "fetch error",
        };
      }
    })
  );
  return results;
}
