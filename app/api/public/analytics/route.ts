import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveSessions } from "@/lib/marketSessions";

export const dynamic = "force-dynamic";

// Real, DB-derived community/platform analytics -- no invented numbers.
export async function GET() {
  const admin = getSupabaseAdmin();

  const [{ count: totalSignals }, { count: vipCount }, { count: freeCount }, { data: byPairRaw }, { data: globalStats }] =
    await Promise.all([
      admin.from("qco2_signals").select("id", { count: "exact", head: true }),
      admin
        .from("qco2_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "vip_member")
        .gt("expired_at", new Date().toISOString()),
      admin.from("qco2_profiles").select("id", { count: "exact", head: true }).eq("role", "free_member"),
      admin.from("qco2_signals").select("pair"),
      admin.from("global_statistics").select("*").eq("id", 1).maybeSingle(),
    ]);

  const pairCounts: Record<string, number> = {};
  for (const row of byPairRaw || []) {
    pairCounts[row.pair] = (pairCounts[row.pair] || 0) + 1;
  }

  const { data: institutional } = await admin
    .from("qco2_signals")
    .select("confidence")
    .not("confidence", "is", null);

  const avgConfidence =
    institutional && institutional.length > 0
      ? Math.round(institutional.reduce((s, r) => s + (r.confidence || 0), 0) / institutional.length)
      : null;

  return NextResponse.json({
    success: true,
    total_signals: totalSignals || 0,
    vip_members: vipCount || 0,
    free_members: freeCount || 0,
    signals_by_pair: pairCounts,
    avg_institutional_confidence: avgConfidence,
    active_market_sessions: getActiveSessions().map((s) => s.label),
    global_stats: globalStats || null,
  });
}
