import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface EngineLog {
  id: number;
  pair: string;
  action: string;
  confidence: number | null;
  direction: string | null;
  reasoning: string | null;
  created_at: string;
}

interface TickBatch {
  id: string;
  timestamp: string;
  pairs_evaluated: {
    pair: string;
    action: string;
    direction: string | null;
    confidence: number | null;
  }[];
  logs: EngineLog[];
  time_gap_seconds?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const admin = getSupabaseAdmin();

    // Fetch the recent 500 logs to group into execution cycles
    const { data: rawLogs, error } = await admin
      .from("qco2_engine_logs")
      .select("id, pair, action, confidence, direction, reasoning, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const logs: EngineLog[] = rawLogs || [];
    const batches: TickBatch[] = [];

    // Group logs into batches where the timestamp difference is <= 60 seconds
    logs.forEach((log) => {
      const logTime = new Date(log.created_at).getTime();
      
      // Find an existing batch that is within 60 seconds
      let added = false;
      for (const batch of batches) {
        const batchTime = new Date(batch.timestamp).getTime();
        if (Math.abs(batchTime - logTime) <= 60000) {
          batch.logs.push(log);
          batch.pairs_evaluated.push({
            pair: log.pair,
            action: log.action,
            direction: log.direction,
            confidence: log.confidence,
          });
          // Update the batch timestamp to the latest log's timestamp if it is newer
          if (logTime > batchTime) {
            batch.timestamp = log.created_at;
          }
          added = true;
          break;
        }
      }

      if (!added) {
        batches.push({
          id: `batch-${log.id}`,
          timestamp: log.created_at,
          pairs_evaluated: [{
            pair: log.pair,
            action: log.action,
            direction: log.direction,
            confidence: log.confidence,
          }],
          logs: [log],
        });
      }
    });

    // Sort batches chronologically descending
    batches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate real time-gap between consecutive ticks
    for (let i = 0; i < batches.length; i++) {
      if (i < batches.length - 1) {
        const currentBatchTime = new Date(batches[i].timestamp).getTime();
        const nextBatchTime = new Date(batches[i + 1].timestamp).getTime();
        batches[i].time_gap_seconds = Math.round((currentBatchTime - nextBatchTime) / 1000);
      } else {
        batches[i].time_gap_seconds = undefined; // First batch / oldest tick in the list
      }
    }

    const total = batches.length;
    const paginatedBatches = batches.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return NextResponse.json({
      success: true,
      batches: paginatedBatches,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
