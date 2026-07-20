import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

    // 1. Measure Supabase connectivity and real latency
    const start = Date.now();
    const settingsPromise = admin
      .from("qco2_engine_settings")
      .select("active_pairs, updated_at")
      .eq("id", 1)
      .single();

    // 2. Fetch last engine tick (latest row from qco2_engine_logs)
    const lastTickPromise = admin
      .from("qco2_engine_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch count of active signals
    const activeSignalsPromise = admin
      .from("qco2_signals")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const [settingsRes, lastTickRes, activeSignalsRes] = await Promise.all([
      settingsPromise,
      lastTickPromise,
      activeSignalsPromise,
    ]);

    const end = Date.now();
    const latencyMs = end - start;

    if (settingsRes.error) {
      throw new Error(`Database error: ${settingsRes.error.message}`);
    }

    // Process active pairs
    const activePairs = settingsRes.data?.active_pairs as string[] | null;
    const activePairsCount = Array.isArray(activePairs) ? activePairs.length : 0;
    const settingsUpdatedAt = settingsRes.data?.updated_at || null;

    // Process last tick
    const lastTickTime = lastTickRes.data?.created_at || null;
    let timeSinceLastTickSeconds = null;
    let tickHealthStatus: "healthy" | "delayed" | "critical" = "healthy";

    if (lastTickTime) {
      const lastTickMs = new Date(lastTickTime).getTime();
      const differenceMs = Date.now() - lastTickMs;
      timeSinceLastTickSeconds = Math.max(0, Math.floor(differenceMs / 1000));
      
      // Cron runs every ~5min. If >10min, mark as delayed. If >20min, critical.
      if (timeSinceLastTickSeconds > 1200) {
        tickHealthStatus = "critical";
      } else if (timeSinceLastTickSeconds > 600) {
        tickHealthStatus = "delayed";
      }
    } else {
      tickHealthStatus = "critical";
    }

    // Active signals count
    const activeSignalsCount = activeSignalsRes.count || 0;

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        latency_ms: latencyMs,
      },
      engine: {
        last_tick_at: lastTickTime,
        seconds_since_last_tick: timeSinceLastTickSeconds,
        tick_health: tickHealthStatus,
        active_pairs_count: activePairsCount,
        active_pairs: activePairs || [],
        settings_updated_at: settingsUpdatedAt,
      },
      signals: {
        active_count: activeSignalsCount,
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      database: {
        connected: false,
        latency_ms: 0,
      },
      error: (err as Error).message,
    }, { status: 500 });
  }
}
