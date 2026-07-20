"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Activity,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  Database,
  Terminal,
  Zap,
} from "lucide-react";

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

export default function ExecutionLogsPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // States
  const [batches, setBatches] = useState<TickBatch[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded batch details
  const [expandedBatchId, setExpandedLogId] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/execution-logs-feed?page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Error fetching execution logs:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (isVip) {
      fetchBatches();
    }
  }, [fetchBatches, isVip]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const getActionColor = (act: string) => {
    switch (act) {
      case "created":
        return C.green;
      case "monitoring":
        return C.cyan;
      case "no_trigger":
        return "#64748B"; // slate-500
      case "closed":
        return C.gold;
      case "timeout":
        return "#A855F7"; // purple-500
      case "skipped_weekend":
        return "#E2E8F0"; // slate-200
      case "error":
        return C.red;
      default:
        return "#94A3B8"; // slate-400
    }
  };

  const formatGap = (seconds?: number) => {
    if (seconds === undefined) return "N/A (Oldest loaded)";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="relative min-h-[80vh] pb-10">
      {/* Top Title HUD */}
      <div
        className="relative mb-6 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4"
        style={{
          clipPath:
            "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />

        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-cyan-400 [box-shadow:0_0_6px_#00F0FF]" />
          </span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
            [ ENGINE EXECUTION TRACE <span className="text-slate-700">//</span> CRON STATUS ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Engine Execution History
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Chronological tracing of live AI engine tick batches and processing intervals.
        </p>
      </div>

      <div className="relative">
        <div className={`space-y-4 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          {/* Honest Disclosure Panel */}
          <div className="border border-yellow-500/20 bg-yellow-500/5 p-3 font-mono text-[10px] uppercase leading-relaxed text-yellow-500/90 flex gap-2">
            <span className="text-sm">⚠️</span>
            <div>
              <strong>DISCLOSURE:</strong> LASTQUESTION.CO is an automated signal broadcast system. This page displays the internal 5-minute cron-tick execution traces of our technical evaluation models. We do not support live trading, margin brokerage, or automated trade routing. Gaps represent engine analysis cycle pacing.
            </div>
          </div>

          {/* Table Control */}
          <div className="flex items-center justify-between border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
            <span className="text-slate-400 uppercase tracking-widest">
              TELEMETRY CRON TRACE STREAMS
            </span>

            <button
              onClick={fetchBatches}
              disabled={loading}
              className="flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/20 px-2.5 py-1 font-bold text-cyan-400 hover:bg-cyan-950/50 disabled:opacity-50 transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              <span>SYNC TRACES</span>
            </button>
          </div>

          {/* Batches Panel */}
          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-950/50">
                    <th className="p-3 uppercase tracking-wider">Tick Timestamp (UTC)</th>
                    <th className="p-3 uppercase tracking-wider">Pairs Evaluated</th>
                    <th className="p-3 uppercase tracking-wider">Processing Cadence</th>
                    <th className="p-3 uppercase tracking-wider text-right">Raw Engine Traces</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && batches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border border-cyan-400 border-t-transparent" />
                          <span>PULLING CYCLICAL TRACE RUNS...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-rose-500">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle size={14} />
                          <span>ERROR: {error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500">
                        NO EXECUTION TICKS LOGGED IN ENGINE DIAGNOSTICS
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => {
                      const isExpanded = expandedBatchId === batch.id;
                      const formattedTime = new Date(batch.timestamp)
                        .toISOString()
                        .replace("T", " ")
                        .substring(0, 19);

                      return (
                        <React.Fragment key={batch.id}>
                          <tr
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : batch.id)
                            }
                            className={`border-b border-slate-900/60 hover:bg-slate-900/40 cursor-pointer transition ${
                              isExpanded ? "bg-slate-950/40" : ""
                            }`}
                          >
                            <td className="p-3 text-white font-bold flex items-center gap-2">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping bg-cyan-400 opacity-40" />
                                <span className="relative inline-flex h-1.5 w-1.5 bg-cyan-400" />
                              </span>
                              <span>{formattedTime}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1.5">
                                {batch.pairs_evaluated.map((pe, idx) => (
                                  <span
                                    key={idx}
                                    className="border px-1 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                                    style={{
                                      borderColor: `${getActionColor(pe.action)}33`,
                                      color: getActionColor(pe.action),
                                      backgroundColor: `${getActionColor(pe.action)}0a`,
                                    }}
                                  >
                                    {pe.pair}: {pe.action}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">
                              {batch.time_gap_seconds !== undefined ? (
                                <div className="flex items-center gap-1">
                                  <Clock size={10} className="text-slate-500" />
                                  <span>
                                    GAP:{" "}
                                    <strong className="text-slate-300">
                                      {formatGap(batch.time_gap_seconds)}
                                    </strong>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right text-cyan-400">
                              <button className="text-[10px] uppercase underline tracking-wider hover:text-cyan-300 transition">
                                {isExpanded ? "[ Hide ]" : "[ Inspect ]"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-950/60">
                              <td colSpan={4} className="p-4 border-b border-slate-800">
                                <div className="space-y-4 border border-slate-800/80 bg-black/60 p-4 font-mono text-xs text-slate-300">
                                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                                      <Cpu size={10} />
                                      GRANULAR TRACE DETAILS FOR TICK: {formattedTime}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {batch.logs.length} ACTIONS RECORDED IN THIS WINDOW
                                    </span>
                                  </div>

                                  <div className="space-y-3">
                                    {batch.logs.map((log) => (
                                      <div
                                        key={log.id}
                                        className="border border-slate-900 bg-slate-950/50 p-2.5 rounded"
                                      >
                                        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2">
                                          <div className="flex items-center gap-2">
                                            <strong className="text-white text-[11px]">
                                              {log.pair}
                                            </strong>
                                            <span
                                              className="border px-1 text-[9px] uppercase tracking-wider font-bold"
                                              style={{
                                                borderColor: `${getActionColor(log.action)}33`,
                                                color: getActionColor(log.action),
                                                backgroundColor: `${getActionColor(log.action)}0a`,
                                              }}
                                            >
                                              {log.action}
                                            </span>
                                            {log.direction && (
                                              <span
                                                className={`text-[10px] font-bold ${
                                                  log.direction.toLowerCase() === "buy" ||
                                                  log.direction.toLowerCase() === "long"
                                                    ? "text-emerald-400"
                                                    : "text-rose-500"
                                                }`}
                                              >
                                                {log.direction.toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-500">
                                            Log ID: {log.id}
                                          </span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                          {log.reasoning || "No analytical narrative was attached."}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-800/80 p-3 font-mono text-xs text-slate-400 bg-slate-950/20">
              <div>
                SHOWING <span className="text-white">{batches.length}</span> OF{" "}
                <span className="text-white">{total}</span> TICKS
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-30 transition"
                >
                  <ChevronLeft size={12} />
                  <span>PREV</span>
                </button>
                <span className="text-cyan-400 font-bold px-1">PAGE {page}</span>
                <button
                  disabled={!hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-30 transition"
                >
                  <span>NEXT</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </Panel>
        </div>

        <VipGateOverlay
          isVip={isVip}
          onUpgradeClick={() => setGateOpen(true)}
        />
      </div>

      <VipUpgradeModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        featureName="Engine Execution Trace"
      />
    </div>
  );
}
