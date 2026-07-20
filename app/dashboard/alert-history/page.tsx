"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Bell,
  Radio,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  Shield,
  CheckCircle2,
} from "lucide-react";

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

export default function AlertHistoryPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // States
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/alert-history-feed?page=${page}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch alerts: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Error fetching alert history:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (isVip) {
      fetchAlerts();
    }
  }, [fetchAlerts, isVip]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const getAlertBadgeConfig = (type: UnifiedAlert["type"]) => {
    switch (type) {
      case "new_signal":
        return {
          label: "NEW SIGNAL",
          color: C.green,
          bgColor: "rgba(0, 255, 102, 0.08)",
          borderColor: "rgba(0, 255, 102, 0.25)",
        };
      case "tp_hit":
        return {
          label: "TAKE PROFIT",
          color: C.gold,
          bgColor: "rgba(255, 215, 0, 0.08)",
          borderColor: "rgba(255, 215, 0, 0.25)",
        };
      case "sl_hit":
        return {
          label: "STOP LOSS",
          color: C.red,
          bgColor: "rgba(255, 0, 68, 0.08)",
          borderColor: "rgba(255, 0, 68, 0.25)",
        };
      case "timeout":
        return {
          label: "TIMEOUT",
          color: "#94A3B8", // slate-400
          bgColor: "rgba(148, 163, 184, 0.08)",
          borderColor: "rgba(148, 163, 184, 0.25)",
        };
      case "closed":
        return {
          label: "MANUAL CLOSE",
          color: "#E2E8F0", // slate-200
          bgColor: "rgba(226, 232, 240, 0.08)",
          borderColor: "rgba(226, 232, 240, 0.25)",
        };
      default:
        return {
          label: "SYSTEM ALERT",
          color: C.cyan,
          bgColor: "rgba(0, 240, 255, 0.08)",
          borderColor: "rgba(0, 240, 255, 0.25)",
        };
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
            [ BROADCAST STREAM <span className="text-slate-700">//</span> TELEGRAM AUDIT TRAIL ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Unified Alert History
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Official timeline of real Telegram broadcast notifications and signal transition updates.
        </p>
      </div>

      <div className="relative">
        <div className={`space-y-4 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          {/* Top Info Bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-slate-800/80 bg-slate-950/60 p-3 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              <span>CHANNEL: LASTQUESTION.CO VIP BROADCAST CHANNEL</span>
            </div>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/20 px-3 py-1 font-bold text-cyan-400 hover:bg-cyan-950/50 disabled:opacity-50 transition self-end md:self-auto"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              <span>SYNC TIMELINE</span>
            </button>
          </div>

          {/* Timeline Feed Panel */}
          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="p-4 space-y-4 min-h-[400px]">
              {loading && alerts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 font-mono text-xs text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border border-cyan-400 border-t-transparent" />
                  <span>SYNCHRONIZING TELEGRAM TRANSMISSIONS...</span>
                </div>
              ) : error ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 font-mono text-xs text-rose-500">
                  <AlertCircle size={18} />
                  <span>ERROR: {error}</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex h-64 items-center justify-center font-mono text-xs text-slate-500">
                  NO RECENT SIGNAL TRANSMISSIONS LOGGED
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6">
                  {alerts.map((alert) => {
                    const badge = getAlertBadgeConfig(alert.type);
                    const formattedTime = new Date(alert.timestamp)
                      .toISOString()
                      .replace("T", " ")
                      .substring(0, 19);

                    return (
                      <div key={alert.id} className="relative group">
                        {/* Timeline node */}
                        <div
                          className="absolute -left-[30px] top-1 h-3 w-3 rounded-full border bg-[#05080F]"
                          style={{
                            borderColor: badge.color,
                            boxShadow: `0 0 6px ${badge.color}66`,
                          }}
                        />

                        {/* Content block */}
                        <div className="border border-slate-900 bg-slate-950/40 p-3 font-mono text-xs hover:border-slate-800/80 transition duration-200">
                          <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between border-b border-slate-900/80 pb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Color badge */}
                              <span
                                className="border px-2 py-0.5 text-[9px] font-bold tracking-wider"
                                style={{
                                  color: badge.color,
                                  borderColor: badge.borderColor,
                                  backgroundColor: badge.bgColor,
                                }}
                              >
                                {badge.label}
                              </span>

                              <span className="font-bold text-white text-sm">
                                {alert.pair}
                              </span>

                              {alert.direction && (
                                <span
                                  className={`font-bold px-1 ${
                                    alert.direction.toUpperCase() === "BUY" ||
                                    alert.direction.toUpperCase() === "LONG"
                                      ? "text-emerald-400"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {alert.direction.toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formattedTime} UTC</span>
                            </div>
                          </div>

                          <p className="mt-2 text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                            {alert.details}
                          </p>

                          {alert.meta && (alert.meta.entry || alert.meta.confidence) && (
                            <div className="mt-2 pt-2 border-t border-slate-900/40 flex flex-wrap gap-4 text-[10px] text-slate-500">
                              {alert.meta.entry && (
                                <span>
                                  ENTRY RESELLER:{" "}
                                  <strong className="text-slate-300">
                                    {alert.meta.entry}
                                  </strong>
                                </span>
                              )}
                              {alert.meta.confidence && (
                                <span>
                                  CONFIDENCE FACTOR:{" "}
                                  <strong className="text-cyan-400">
                                    {alert.meta.confidence}%
                                  </strong>
                                </span>
                              )}
                              {alert.meta.hit_level && (
                                <span>
                                  TARGET RECTIFIED:{" "}
                                  <strong className="text-amber-400">
                                    {alert.meta.hit_level.toUpperCase()}
                                  </strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-800/80 p-3 font-mono text-xs text-slate-400 bg-slate-950/20">
              <div>
                SHOWING <span className="text-white">{alerts.length}</span> OF{" "}
                <span className="text-white">{total}</span> ALERTS
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
        featureName="Alert History"
      />
    </div>
  );
}
