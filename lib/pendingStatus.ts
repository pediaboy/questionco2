// Live, read-only diagnostic snapshot of the auto-signal engine for the
// /dashboard/pending "AI Engine Terminal" page. Reuses the EXACT same data
// source + strategy logic as the real cron (fetchOkxCandles + evaluateInstitutional)
// but never writes to the DB or sends Telegram messages — it's a pure "what is the
// engine looking at RIGHT NOW" read, refreshed on a short in-memory cache so many
// concurrent dashboard viewers don't each hammer OKX individually.

import { fetchOkxCandles, fetchOkxLastPrice } from "./signalEngine";
import { evaluateInstitutional } from "./institutionalEngine";
import { SIGNAL_PAIRS } from "./signalPairs";

export interface PairLiveStatus {
  pair: string;
  price: number;
  direction: "BUY" | "SELL" | null;
  confidence: number;
  stage: "structure" | "scoring_low" | "ready"; // real pipeline stage derived from real result
  weakFactors: string[];
  reasoning: string;
  checkedAt: string;
}

const CACHE_MS = 20_000; // refresh OKX-backed data at most every 20s regardless of viewer count
let cache: { at: number; data: PairLiveStatus[] } | null = null;

async function evalPairLive(pair: (typeof SIGNAL_PAIRS)[number]): Promise<PairLiveStatus> {
  const [m5, m1] = await Promise.all([
    fetchOkxCandles(pair.dataInstId, "5m", 300),
    fetchOkxCandles(pair.dataInstId, "1m", 100),
  ]);
  const price = await fetchOkxLastPrice(pair.dataInstId).catch(() => m5[m5.length - 1]?.close ?? 0);
  const result = evaluateInstitutional(m5, m1, false);

  let stage: PairLiveStatus["stage"] = "structure";
  if (result.direction && result.confidence > 0) stage = result.confidence >= 76 ? "ready" : "scoring_low";

  const weakFactors = (result.checklist || [])
    .filter((c) => !c.pass && c.label !== "BOS" && c.label !== "CHOCH" && c.label !== "Trend (EMA20/50/200)" && c.label !== "EMA" && c.label !== "Kill Zone")
    .map((c) => c.label);

  return {
    pair: pair.label,
    price,
    direction: result.direction,
    confidence: result.confidence,
    stage,
    weakFactors,
    reasoning: result.reasoning || result.blockReason || "",
    checkedAt: new Date().toISOString(),
  };
}

export async function getLiveEngineStatus(): Promise<PairLiveStatus[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const data = await Promise.all(SIGNAL_PAIRS.map((p) => evalPairLive(p).catch(() => null))).then(
    (rows) => rows.filter((r): r is PairLiveStatus => r !== null)
  );
  cache = { at: Date.now(), data };
  return data;
}
