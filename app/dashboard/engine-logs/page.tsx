"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Terminal,
  Cpu,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  HelpCircle,
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

export default function EngineLogsPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // Filter States
  const [pair, setPair] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Data States
  const [logs, setLogs] = useState<EngineLog[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh States
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Selected log detail expansion
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/engine-logs-feed?pair=${pair}&action=${action}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pair, action, page, limit]);

  // Initial fetch and manual trigger
  useEffect(() => {
    if (isVip) {
      fetchLogs();
    }
  }, [fetchLogs, isVip]);

  // Auto refresh poll
  useEffect(() => {
    if (!isVip || !autoRefresh) return;

    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLogs();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, isVip]);

  // Reset page when filters change
  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPair(e.target.value);
    setPage(1);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAction(e.target.value);
    setPage(1);
  };

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
            [ ENGINE CORE LOGS <span className="text-slate-700">//</span> TELEMETRY AUDIT ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Engine Diagnostic Feed
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Live streaming audit trail of the institutional AI signal analysis engine.
        </p>
      </div>

      <div className="relative">
        <div className={`space-y-4 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-slate-800/80 bg-slate-950/60 p-3 font-mono text-xs">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">INSTRUMENT:</span>
                <select
                  value={pair}
                  onChange={handlePairChange}
                  className="border border-slate-800 bg-slate-950 px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">ALL PAIRS</option>
                  <option value="XAUUSD">XAUUSD</option>
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="ETHUSDT">ETHUSDT</option>
                  <option value="SOLUSDT">SOLUSDT</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">ACTION TYPE:</span>
                <select
                  value={action}
                  onChange={handleActionChange}
                  className="border border-slate-800 bg-slate-950 px-2 py-1 text-cyan-400 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">ALL ACTIONS</option>
                  <option value="created">CREATED</option>
                  <option value="monitoring">MONITORING</option>
                  <option value="no_trigger">NO TRIGGER</option>
                  <option value="closed">CLOSED</option>
                  <option value="timeout">TIMEOUT</option>
                  <option value="skipped_weekend">SKIPPED WEEKEND</option>
                  <option value="error">ERROR</option>
                </select>
              </div>
            </div>

            {/* Poll Status */}
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-yellow-500"}`} />
                <span>
                  {autoRefresh
                    ? `REFRESH IN ${countdown}S`
                    : "POLLING PAUSED"}
                </span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="ml-1 border border-slate-800 bg-slate-900 p-1 hover:border-cyan-500/50 hover:text-cyan-400 transition"
                >
                  {autoRefresh ? <Pause size={10} /> : <Play size={10} />}
                </button>
              </div>

              <button
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/20 px-2 py-1 font-bold text-cyan-400 hover:bg-cyan-950/50 disabled:opacity-50 transition"
              >
                <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                <span>FORCE</span>
              </button>
            </div>
          </div>

          {/* Terminal HUD Table */}
          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-950/50">
                    <th className="p-3 uppercase tracking-wider">Timestamp (UTC)</th>
                    <th className="p-3 uppercase tracking-wider">Pair</th>
                    <th className="p-3 uppercase tracking-wider">Action</th>
                    <th className="p-3 uppercase tracking-wider">Dir</th>
                    <th className="p-3 uppercase tracking-wider">Confidence</th>
                    <th className="p-3 uppercase tracking-wider text-right">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border border-cyan-400 border-t-transparent" />
                          <span>SYNCHRONIZING TERMINAL FEED...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-rose-500">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle size={14} />
                          <span>ERROR: {error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        NO DIAGNOSTIC LOGS FOUND MATCHING FILTER CRITERIA
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const formattedTime = new Date(log.created_at)
                        .toISOString()
                        .replace("T", " ")
                        .substring(0, 19);

                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className={`border-b border-slate-900/60 hover:bg-slate-900/40 cursor-pointer transition ${
                              isExpanded ? "bg-slate-950/40" : ""
                            }`}
                          >
                            <td className="p-3 text-slate-400">{formattedTime}</td>
                            <td className="p-3 text-white font-bold">{log.pair}</td>
                            <td className="p-3">
                              <span
                                className="inline-block border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  borderColor: `${getActionColor(log.action)}33`,
                                  color: getActionColor(log.action),
                                  backgroundColor: `${getActionColor(log.action)}0d`,
                                }}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3">
                              {log.direction ? (
                                <span
                                  className={`font-bold ${
                                    log.direction.toLowerCase() === "buy" ||
                                    log.direction.toLowerCase() === "long"
                                      ? "text-emerald-400"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {log.direction.toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="p-3">
                              {log.confidence !== null && log.confidence !== undefined ? (
                                <span className="text-slate-300">
                                  {log.confidence}%
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right text-cyan-400">
                              <button className="text-[10px] uppercase underline tracking-wider hover:text-cyan-300 transition">
                                {isExpanded ? "[ Close ]" : "[ Expand ]"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-950/60">
                              <td colSpan={6} className="p-4 border-b border-slate-800">
                                <div className="space-y-2 border border-slate-800/80 bg-black/60 p-3 font-mono text-xs text-slate-300">
                                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                                      <Terminal size={10} />
                                      DIAGNOSTIC EXPLANATORY DEEP ANALYSIS (ID: {log.id})
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      CONFIDENCE RATIO: {log.confidence ? `${log.confidence}%` : "N/A"}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap leading-relaxed">
                                    {log.reasoning || "No analytical explanation was attached to this tick."}
                                  </p>
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-800/80 p-3 font-mono text-xs text-slate-400 bg-slate-950/20">
              <div>
                SHOWING{" "}
                <span className="text-white">
                  {logs.length}
                </span>{" "}
                OF <span className="text-white">{total}</span> RECORDS
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
        featureName="Engine Core Logs"
      />
    </div>
  );
}
