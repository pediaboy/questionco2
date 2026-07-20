import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getLiveEngineStatus } from "@/lib/pendingStatus";
import { fetchOkxCandles } from "@/lib/signalEngine";
import { ema } from "@/lib/signalEngine";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const [pipeline, signalsRes, logsRes] = await Promise.all([
      getLiveEngineStatus(),
      admin
        .from("qco2_signals")
        .select("id, pair, direction, entry, take_profit, status, hit_level, created_at, source")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("qco2_engine_logs")
        .select("id, pair, action, confidence, direction, reasoning, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    const logs = (logsRes.data || []).slice().reverse(); // chronological order for the terminal feed

    // Pick the pair the engine is currently most interested in (highest live confidence)
    const target = [...pipeline].sort((a, b) => b.confidence - a.confidence)[0] || pipeline[0];
    const targetPairConfig = SIGNAL_PAIRS.find((p) => p.label === target?.pair) || SIGNAL_PAIRS[0];

    const m15Raw = await fetchOkxCandles(targetPairConfig.dataInstId, "1m", 100).catch(() => []);
    // Resample confirmed 1m -> 15m for a compact real chart (avoids a second OKX bar-size call)
    const m15: { o: number; h: number; l: number; c: number }[] = [];
    for (let i = 0; i + 15 <= m15Raw.length; i += 15) {
      const chunk = m15Raw.slice(i, i + 15);
      m15.push({
        o: chunk[0].open,
        h: Math.max(...chunk.map((c) => c.high)),
        l: Math.min(...chunk.map((c) => c.low)),
        c: chunk[chunk.length - 1].close,
      });
    }
    const closes = m15.map((c) => c.c);
    const ema9 = ema(closes, 9);
    const ema21 = ema(closes, 21);

    return NextResponse.json({
      success: true,
      pipeline,
      target: target?.pair || null,
      chart: { candles: m15, ema9, ema21 },
      signals: signalsRes.data || [],
      logs,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
