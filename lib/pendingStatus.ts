// Live, read-only diagnostic snapshot of the auto-signal engine for the
// /dashboard/pending "AI Engine Terminal" page. Reuses the EXACT same data
// source + strategy logic as the real cron (fetchOkxCandles + evaluateInstitutional)
// but never writes to the DB or sends Telegram messages — it's a pure "what is the
// engine looking at RIGHT NOW" read, refreshed on a short in-memory cache so many
// concurrent dashboard viewers don't each hammer OKX individually.

import { fetchOkxCandles, fetchOkxLastPrice } from "./signalEngine";
import { evaluateInstitutional, EngineSettings, DEFAULT_ENGINE_SETTINGS, FactorWeights } from "./institutionalEngine";
import { SIGNAL_PAIRS } from "./signalPairs";
import { getSupabaseAdmin } from "./supabaseAdmin";

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

async function loadSettings(): Promise<EngineSettings> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("qco2_engine_settings").select("*").eq("id", 1).maybeSingle();
    if (!data) return DEFAULT_ENGINE_SETTINGS;
    return {
      confidenceMin: data.confidence_min ?? DEFAULT_ENGINE_SETTINGS.confidenceMin,
      factorWeights: (data.factor_weights as FactorWeights) ?? DEFAULT_ENGINE_SETTINGS.factorWeights,
    };
  } catch {
    return DEFAULT_ENGINE_SETTINGS;
  }
}

async function evalPairLive(pair: (typeof SIGNAL_PAIRS)[number], settings: EngineSettings): Promise<PairLiveStatus> {
  const [m5, m1] = await Promise.all([
    fetchOkxCandles(pair.dataInstId, "5m", 300),
    fetchOkxCandles(pair.dataInstId, "1m", 100),
  ]);
  const price = await fetchOkxLastPrice(pair.dataInstId).catch(() => m5[m5.length - 1]?.close ?? 0);
  const result = evaluateInstitutional(m5, m1, false, settings);

  let stage: PairLiveStatus["stage"] = "structure";
  if (result.direction && result.confidence > 0) stage = result.confidence >= settings.confidenceMin ? "ready" : "scoring_low";

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
  const settings = await loadSettings();
  const data = await Promise.all(SIGNAL_PAIRS.map((p) => evalPairLive(p, settings).catch(() => null))).then(
    (rows) => rows.filter((r): r is PairLiveStatus => r !== null)
  );
  cache = { at: Date.now(), data };
  return data;
}
