import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";
import { Candle } from "@/lib/signalEngine";
import { evaluateInstitutional, DEFAULT_ENGINE_SETTINGS, EngineSettings } from "@/lib/institutionalEngine";
import { evaluateXauAggressive } from "@/lib/xauAggressiveEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * REAL historical backtest — replays the site's ACTUAL live strategy functions
 * (evaluateInstitutional for BTC/ETH/SOL, evaluateXauAggressive for XAUUSD)
 * against REAL historical OKX candles, using the EXACT same risk model the
 * live cron (app/api/cron/auto-signal/route.ts) applies when it creates a real
 * signal. Nothing here is randomly generated. Two honest simplifications vs.
 * the live system (documented in the UI, not hidden):
 *   1. Evaluation steps every 5 minutes (the live GH Actions ping runs ~every
 *      2min, but stepping every 5min keeps candle-fetch volume/runtime sane
 *      for an on-demand backtest and still samples every real M5 close).
 *   2. News-blackout filter is NOT replayed (would need a historical
 *      ForexFactory calendar archive we don't have) — assumed no blackout.
 * Lookback is capped at 1 or 3 days to keep OKX pagination + runtime reasonable
 * for a synchronous request.
 */

const OKX_BASE = "https://www.okx.com/api/v5/market/candles";
const BAR_MS: Record<string, number> = { "1m": 60_000, "3m": 180_000, "5m": 300_000, "1H": 3_600_000 };

// Paginate OKX's candle endpoint backward in time (max 300 rows/request) until
// `neededCount` real candles are collected or history runs out.
async function fetchOkxHistory(instId: string, bar: "1m" | "3m" | "5m" | "1H", neededCount: number): Promise<Candle[]> {
  const all: Candle[] = [];
  let after: number | null = null;
  let guard = 0;
  while (all.length < neededCount && guard < 60) {
    guard += 1;
    const url = `${OKX_BASE}?instId=${instId}&bar=${bar}&limit=300${after ? `&after=${after}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (json.code !== "0" || !Array.isArray(json.data) || json.data.length === 0) break;
    const rows: Candle[] = json.data
      .filter((r: string[]) => r[8] === "1")
      .map((r: string[]) => ({
        ts: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Number(r[5]),
      }));
    if (rows.length === 0) break;
    all.push(...rows); // OKX returns newest-first per page
    const oldestTs = rows[rows.length - 1].ts;
    after = oldestTs;
    if (rows.length < 300) break; // exhausted available history
  }
  // dedupe + sort chronologically (oldest -> newest)
  const byTs = new Map<number, Candle>();
  for (const c of all) byTs.set(c.ts, c);
  return Array.from(byTs.values()).sort((a, b) => a.ts - b.ts);
}

// Real M3 candles built by aggregating 3 consecutive real M1 candles — a
// legitimate OHLCV resample, not synthetic data.
function resampleTo3m(m1: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i + 3 <= m1.length; i += 3) {
    const chunk = m1.slice(i, i + 3);
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

interface SimTrade {
  ts: number;
  direction: "BUY" | "SELL";
  entry: number;
  sl: number;
  tps: number[];
  outcome: "tp1" | "tp2" | "tp3" | "tp4" | "sl" | "open_end_of_data";
  pipsResult: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pairKey = String(body.pair || "");
    const days = Number(body.days) === 1 ? 1 : 3; // only 1 or 3 supported
    const pair = SIGNAL_PAIRS.find((p) => p.key === pairKey);
    if (!pair) return NextResponse.json({ success: false, error: "Unknown pair" }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: settingsRow } = await admin.from("qco2_engine_settings").select("*").eq("id", 1).maybeSingle();
    const engineSettings: EngineSettings = settingsRow
      ? { confidenceMin: settingsRow.confidence_min ?? DEFAULT_ENGINE_SETTINGS.confidenceMin, factorWeights: settingsRow.factor_weights ?? DEFAULT_ENGINE_SETTINGS.factorWeights }
      : DEFAULT_ENGINE_SETTINGS;
    const atrSlMultiplier: number = Number(settingsRow?.atr_sl_multiplier) || 1.5;
    const rrTargets: number[] = Array.isArray(settingsRow?.rr_targets) && settingsRow.rr_targets.length ? settingsRow.rr_targets : [2, 3, 4, 6];

    const isXau = pair.key === "XAUUSD";
    const stepMs = BAR_MS["5m"];
    const windowMs = days * 24 * 60 * 60 * 1000;

    // XAU's Decisive Scalping engine needs M1 (EMA9/20, RSI, BB, PSAR) + M5 (trend
    // agreement) -- both pairs of data fetched the same way now, just different
    // slice windows per engine below.
    const [m5, m1] = await Promise.all([
      fetchOkxHistory(pair.dataInstId, "5m", Math.ceil(windowMs / BAR_MS["5m"]) + (isXau ? 100 : 320)),
      fetchOkxHistory(pair.dataInstId, "1m", Math.ceil(windowMs / BAR_MS["1m"]) + (isXau ? 200 : 120)),
    ]);

    if (m5.length < 250 || m1.length < (isXau ? 60 : 120)) {
      return NextResponse.json({ success: false, error: "Data historis OKX tidak cukup untuk periode ini" }, { status: 502 });
    }

    const simStart = m5[m5.length - 1].ts - windowMs;
    const trades: SimTrade[] = [];
    let i = isXau ? 40 : 220; // warm-up index, matches each engine's min-history requirement
    let skipUntilIdx = -1;

    for (; i < m5.length; i += 1) {
      const t = m5[i].ts;
      if (t < simStart) continue;
      if (i <= skipUntilIdx) continue; // currently "in a trade" in the simulation, don't overlap

      const m5Slice = isXau ? m5.slice(Math.max(0, i - 59), i + 1) : m5.slice(Math.max(0, i - 299), i + 1);
      const m1Slice = m1.filter((c) => c.ts <= t).slice(-(isXau ? 150 : 100));
      if (m1Slice.length < (isXau ? 30 : 100) && m1Slice.length < 30) continue;

      let direction: "BUY" | "SELL" | null = null;
      let atr = 0;
      let entryOverride: number | undefined;
      let slPrice: number | undefined;
      let tpPrices: number[] | undefined;

      if (isXau) {
        const res = evaluateXauAggressive(m1Slice, m5Slice, false, pair.pipUnit, m1Slice[m1Slice.length - 1].close);
        direction = res.direction;
        entryOverride = res.entryOverride;
        slPrice = res.slPrice;
        tpPrices = res.tpPrices;
      } else {
        const res = evaluateInstitutional(m5Slice, m1Slice, false, engineSettings, pair.pipUnit);
        direction = res.direction;
        atr = res.atr;
      }
      if (!direction) continue;

      const entry = isXau ? entryOverride ?? m5Slice[m5Slice.length - 1].close : m5Slice[m5Slice.length - 1].close;
      let sl: number, tps: number[];
      if (isXau) {
        sl = slPrice!;
        tps = tpPrices!;
      } else if (pair.key === "BTCUSDT") {
        // Keep the backtest truthful to the live model (owner spec 2026-07-21: BTC
        // swing profile, fixed 150/200/500 pip TPs instead of ATR/RR multiples).
        const slDist = atr * atrSlMultiplier;
        sl = direction === "BUY" ? entry - slDist : entry + slDist;
        tps = [150, 200, 500].map((p) => (direction === "BUY" ? entry + p * pair.pipUnit : entry - p * pair.pipUnit));
      } else {
        const slDist = atr * atrSlMultiplier;
        sl = direction === "BUY" ? entry - slDist : entry + slDist;
        tps = rrTargets.map((rr) => (direction === "BUY" ? entry + slDist * rr : entry - slDist * rr));
      }

      // Walk forward through REAL subsequent candles to see which level is hit first.
      let outcome: SimTrade["outcome"] = "open_end_of_data";
      let resolvedIdx = m5.length - 1;
      for (let j = i + 1; j < m5.length; j += 1) {
        const c = m5[j];
        const slHit = direction === "BUY" ? c.low <= sl : c.high >= sl;
        if (slHit) {
          outcome = "sl";
          resolvedIdx = j;
          break;
        }
        let hitLevel = -1;
        for (let k = tps.length - 1; k >= 0; k -= 1) {
          const tpHit = direction === "BUY" ? c.high >= tps[k] : c.low <= tps[k];
          if (tpHit) {
            hitLevel = k;
            break;
          }
        }
        if (hitLevel === tps.length - 1) {
          outcome = (["tp1", "tp2", "tp3", "tp4"][hitLevel] as SimTrade["outcome"]);
          resolvedIdx = j;
          break;
        }
      }

      const pipDist = Math.abs(entry - (outcome === "sl" ? sl : outcome.startsWith("tp") ? tps[Number(outcome.slice(2)) - 1] : entry)) / pair.pipUnit;
      const pipsResult = outcome === "sl" ? -pipDist : outcome === "open_end_of_data" ? 0 : pipDist;

      trades.push({ ts: t, direction, entry, sl, tps, outcome, pipsResult });
      skipUntilIdx = resolvedIdx;
    }

    const closedTrades = trades.filter((t) => t.outcome !== "open_end_of_data");
    const wins = closedTrades.filter((t) => t.outcome !== "sl").length;
    const losses = closedTrades.filter((t) => t.outcome === "sl").length;
    const winRate = closedTrades.length ? Math.round((wins / closedTrades.length) * 1000) / 10 : 0;
    const totalPips = Math.round(trades.reduce((s, t) => s + t.pipsResult, 0) * 10) / 10;
    const tpBreakdown = { tp1: 0, tp2: 0, tp3: 0, tp4: 0 } as Record<string, number>;
    for (const t of closedTrades) if (t.outcome.startsWith("tp")) tpBreakdown[t.outcome] += 1;

    return NextResponse.json({
      success: true,
      pair: pair.label,
      strategy: isXau ? "xau_scalp_ema_bb_rsi_psar_v1" : "institutional_smc_v3",
      days,
      candlesEvaluated: m5.filter((c) => c.ts >= simStart).length,
      totalSignals: trades.length,
      closedSignals: closedTrades.length,
      openAtEndOfData: trades.length - closedTrades.length,
      wins,
      losses,
      winRate,
      totalPips,
      tpBreakdown,
      trades: trades.slice(-60).reverse(), // cap payload size, most recent first
      note: "Real historical OKX candles replayed through the live strategy function (institutional SMC v3 / XAU aggressive scalp). Evaluated every real M5 close; news-blackout filter not replayed (no historical calendar archive available).",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Backtest failed" }, { status: 500 });
  }
}
