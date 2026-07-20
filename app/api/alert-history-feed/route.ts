import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface UnifiedAlert {
  id: string;
  pair: string;
  direction: string;
  type: "new_signal" | "tp_hit" | "sl_hit" | "timeout" | "closed";
  timestamp: string;
  details: string;
  meta?: {
    entry?: number;
    hit_level?: string | null;
    confidence?: number | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const admin = getSupabaseAdmin();

    // Query new signal alerts from qco2_engine_logs
    const logsPromise = admin
      .from("qco2_engine_logs")
      .select("id, pair, action, confidence, direction, reasoning, created_at")
      .eq("action", "created")
      .order("created_at", { ascending: false })
      .limit(100); // fetch a reasonable buffer

    // Query status transition alerts from qco2_signals
    const signalsPromise = admin
      .from("qco2_signals")
      .select("id, pair, direction, entry, status, hit_level, closed_at, reasoning, confidence")
      .in("status", ["tp_hit", "sl_hit", "timeout", "closed"])
      .not("closed_at", "is", null)
      .order("closed_at", { ascending: false })
      .limit(100); // fetch a reasonable buffer

    const [logsRes, signalsRes] = await Promise.all([logsPromise, signalsPromise]);

    if (logsRes.error) {
      return NextResponse.json({ success: false, error: logsRes.error.message }, { status: 500 });
    }
    if (signalsRes.error) {
      return NextResponse.json({ success: false, error: signalsRes.error.message }, { status: 500 });
    }

    const unifiedAlerts: UnifiedAlert[] = [];

    // Map qco2_engine_logs (action='created') -> new_signal alerts
    if (logsRes.data) {
      logsRes.data.forEach((log) => {
        unifiedAlerts.push({
          id: `log-${log.id}`,
          pair: log.pair,
          direction: log.direction || "N/A",
          type: "new_signal",
          timestamp: log.created_at,
          details: log.reasoning || "Analisis kecerdasan buatan menyarankan entri baru.",
          meta: {
            confidence: log.confidence,
          },
        });
      });
    }

    // Map qco2_signals (status transitions) -> close/tp/sl/timeout alerts
    if (signalsRes.data) {
      signalsRes.data.forEach((sig) => {
        let details = "";
        const hitLvl = sig.hit_level ? sig.hit_level.toUpperCase() : "";

        if (sig.status === "tp_hit") {
          details = `Target Keuntungan ${hitLvl} Tercapai pada level harga entry ${sig.entry}.`;
        } else if (sig.status === "sl_hit") {
          details = `Batasan Resiko (Stop Loss) Terpicu pada level harga entry ${sig.entry}.`;
        } else if (sig.status === "timeout") {
          details = `Batas waktu penahanan posisi (Timeout) terpenuhi. Posisi ditutup otomatis.`;
        } else if (sig.status === "closed") {
          details = `Posisi ditutup secara manual oleh panel administrator pada level entry ${sig.entry}.`;
        }

        unifiedAlerts.push({
          id: `sig-${sig.id}`,
          pair: sig.pair,
          direction: sig.direction || "N/A",
          type: sig.status as UnifiedAlert["type"],
          timestamp: sig.closed_at || "",
          details: details || sig.reasoning || "Status sinyal ter-update.",
          meta: {
            entry: sig.entry,
            hit_level: sig.hit_level,
            confidence: sig.confidence,
          },
        });
      });
    }

    // Sort combined items descending by timestamp
    unifiedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = unifiedAlerts.length;
    const paginatedAlerts = unifiedAlerts.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return NextResponse.json({
      success: true,
      alerts: paginatedAlerts,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
