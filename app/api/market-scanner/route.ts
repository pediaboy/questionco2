import { NextResponse } from "next/server";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Simple EMA helper
function calculateEma(values: number[], period: number): number[] {
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

export async function GET() {
  try {
    const results = await Promise.all(
      SIGNAL_PAIRS.map(async (pair) => {
        const url = `https://www.okx.com/api/v5/market/candles?instId=${pair.dataInstId}&bar=1m&limit=50`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to fetch candles for ${pair.dataInstId}`);
        }
        const json = await res.json();
        if (json.code !== "0" || !Array.isArray(json.data)) {
          throw new Error(`OKX Error: ${json.msg || "invalid data"}`);
        }

        // Filter closed candles (confirm flag is index 8)
        const closedCandles: Candle[] = json.data
          .filter((r: string[]) => r[8] === "1")
          .map((r: string[]) => ({
            ts: Number(r[0]),
            open: Number(r[1]),
            high: Number(r[2]),
            low: Number(r[3]),
            close: Number(r[4]),
            volume: Number(r[5]),
          }));

        // OKX is newest-first, reverse to chronological (oldest to newest)
        const candles = closedCandles.reverse();

        if (candles.length < 25) {
          return {
            key: pair.key,
            label: pair.label,
            instId: pair.dataInstId,
            error: "Insufficient candle history",
          };
        }

        const closes = candles.map((c) => c.close);
        const latestPrice = closes[closes.length - 1];

        // Breakout indicator: last 20 candles (excluding the latest closed candle)
        const lookback = 20;
        const priorCandles = candles.slice(candles.length - 1 - lookback, candles.length - 1);
        const priorHigh = Math.max(...priorCandles.map((c) => c.high));
        const priorLow = Math.min(...priorCandles.map((c) => c.low));

        let breakoutStatus: "BREAKOUT_UP" | "BREAKOUT_DOWN" | "RANGING" = "RANGING";
        if (latestPrice > priorHigh) {
          breakoutStatus = "BREAKOUT_UP";
        } else if (latestPrice < priorLow) {
          breakoutStatus = "BREAKOUT_DOWN";
        }

        // EMA indicators
        const ema9Series = calculateEma(closes, 9);
        const ema21Series = calculateEma(closes, 21);

        const lastEma9 = ema9Series[ema9Series.length - 1];
        const lastEma21 = ema21Series[ema21Series.length - 1];
        const prevEma9 = ema9Series[ema9Series.length - 2];
        const prevEma21 = ema21Series[ema21Series.length - 2];

        const isEmaBullCross = prevEma9 <= prevEma21 && lastEma9 > lastEma21;
        const isEmaBearCross = prevEma9 >= prevEma21 && lastEma9 < lastEma21;

        const currentEmaTrend: "up" | "down" | "flat" =
          lastEma9 > lastEma21 ? "up" : lastEma9 < lastEma21 ? "down" : "flat";

        // Determine specific level being tested
        const distanceToHigh = Math.abs(latestPrice - priorHigh);
        const distanceToLow = Math.abs(latestPrice - priorLow);
        const levelTested = distanceToHigh < distanceToLow ? priorHigh : priorLow;
        const levelTestedType: "HIGH" | "LOW" = distanceToHigh < distanceToLow ? "HIGH" : "LOW";

        return {
          key: pair.key,
          label: pair.label,
          instId: pair.dataInstId,
          latestPrice,
          priorHigh,
          priorLow,
          breakoutStatus,
          lastEma9,
          lastEma21,
          isEmaBullCross,
          isEmaBearCross,
          currentEmaTrend,
          levelTested,
          levelTestedType,
          lastUpdated: Date.now(),
        };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (err: unknown) {
    console.error("Market scanner api error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
