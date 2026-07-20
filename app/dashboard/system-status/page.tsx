"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Activity,
  Cpu,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

interface StatusData {
  success: boolean;
  database: {
    connected: boolean;
    latency_ms: number;
  };
  engine: {
    last_tick_at: string | null;
    seconds_since_last_tick: number | null;
    tick_health: "healthy" | "delayed" | "critical";
    active_pairs_count: number;
    active_pairs: string[];
    settings_updated_at: string | null;
  };
  signals: {
    active_count: number;
  };
}

export default function SystemStatusPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // States
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/system-status-feed");
      if (!res.ok) {
        throw new Error(`Failed to fetch status: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        setLastRefreshed(new Date());
      } else {
        throw new Error(data.error || "Failed to retrieve status metrics");
      }
    } catch (err) {
      console.error("Error fetching system status:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVip) {
      fetchStatus();
    }
  }, [fetchStatus, isVip]);

  // Interval poll
  useEffect(() => {
    if (!isVip) return;
    const interval = setInterval(fetchStatus, 15000); // 15s automatic poll
    return () => clearInterval(interval);
  }, [fetchStatus, isVip]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const formatInterval = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "N/A";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
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
            [ SYSTEM STATUS CORE <span className="text-slate-700">//</span> TELEMETRY METRICS ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          System Health Telemetry
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Real-time diagnostics of database latency, cron engines, and institutional feeds.
        </p>
      </div>

      <div className="relative">
        <div className={`space-y-6 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          
          {/* Header Actions */}
          <div className="flex items-center justify-between border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs">
            <span className="text-slate-400 uppercase tracking-widest text-[10px]">
              AUTO-POLL INTERVAL: 15s • LAST UPDATE: {lastRefreshed.toLocaleTimeString()}
            </span>

            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/20 px-2.5 py-1 font-bold text-cyan-400 hover:bg-cyan-950/50 disabled:opacity-50 transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              <span>REFRESH</span>
            </button>
          </div>

          {loading && !status ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 font-mono text-xs text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border border-cyan-400 border-t-transparent" />
              <span>SYNCHRONIZING SYSTEM TELEMETRY...</span>
            </div>
          ) : error ? (
            <div className="border border-rose-500/30 bg-rose-950/10 p-5 font-mono text-xs text-rose-400 flex flex-col items-center justify-center gap-2">
              <AlertTriangle size={24} className="text-rose-500 animate-bounce" />
              <strong className="text-white uppercase tracking-wider">TELEMETRY DIAGNOSTIC FAILURE</strong>
              <span>ERROR CODE: {error}</span>
            </div>
          ) : !status ? (
            <div className="text-center p-10 text-slate-500 font-mono text-xs">
              NO SYSTEM DATA RECEIVED
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              
              {/* Box 1: Database status */}
              <Panel glowColor={status.database.connected ? C.cyan : C.red} size={10}>
                <CornerTicks color={status.database.connected ? C.cyan : C.red} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                      DATABASE LATENCY TEST
                    </span>
                    <Database size={16} className={status.database.connected ? "text-cyan-400" : "text-rose-500"} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white">
                      {status.database.latency_ms}
                    </span>
                    <span className="font-mono text-xs text-slate-500">ms</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>SUPABASE STATUS:</span>
                      <span className={status.database.connected ? "text-green-400" : "text-rose-500"}>
                        {status.database.connected ? "ONLINE (OPERATIONAL)" : "DISCONNECTED"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATACENTER LOCALITY:</span>
                      <span className="text-slate-200">REST SECURE CLOUD GATEWAY</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Box 2: Engine Tick Health */}
              <Panel
                glowColor={
                  status.engine.tick_health === "healthy"
                    ? C.green
                    : status.engine.tick_health === "delayed"
                    ? C.gold
                    : C.red
                }
                size={10}
              >
                <CornerTicks
                  color={
                    status.engine.tick_health === "healthy"
                      ? C.green
                      : status.engine.tick_health === "delayed"
                      ? C.gold
                      : C.red
                  }
                />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ENGINE TICK HEALTH
                    </span>
                    <Cpu
                      size={16}
                      className={
                        status.engine.tick_health === "healthy"
                          ? "text-emerald-400"
                          : status.engine.tick_health === "delayed"
                          ? "text-yellow-500"
                          : "text-rose-500 animate-pulse"
                      }
                    />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white">
                      {formatInterval(status.engine.seconds_since_last_tick)}
                    </span>
                    <span className="font-mono text-xs text-slate-500">elapsed</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>CRON HEARTBEAT:</span>
                      <span
                        className={
                          status.engine.tick_health === "healthy"
                            ? "text-green-400 font-bold"
                            : status.engine.tick_health === "delayed"
                            ? "text-yellow-500 font-bold"
                            : "text-rose-500 font-bold animate-pulse"
                        }
                      >
                        {status.engine.tick_health.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>LAST RE-EVALUATION:</span>
                      <span className="text-slate-200">
                        {status.engine.last_tick_at
                          ? new Date(status.engine.last_tick_at)
                              .toISOString()
                              .replace("T", " ")
                              .substring(11, 19) + " UTC"
                          : "NEVER"}
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Box 3: Active Signals Pipeline */}
              <Panel glowColor={C.cyan} size={10}>
                <CornerTicks color={C.cyan} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ACTIVE MONITORED PIPELINE
                    </span>
                    <Activity size={16} className="text-cyan-400" />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white">
                      {status.signals.active_count}
                    </span>
                    <span className="font-mono text-xs text-slate-500">active signals</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>PIPELINE ENGINE:</span>
                      <span className="text-green-400">ACTIVE & COMPILING</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TELEGRAM ROUTER:</span>
                      <span className="text-cyan-400 font-bold">ONLINE</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Box 4: Active Configuration Pairs */}
              <Panel glowColor={C.gold} size={10}>
                <CornerTicks color={C.gold} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ACTIVE ENGINE SETTINGS
                    </span>
                    <Layers size={16} className="text-yellow-500" />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-white">
                      {status.engine.active_pairs_count}
                    </span>
                    <span className="font-mono text-xs text-slate-500">pairs configured</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>ACTIVE KEYS:</span>
                      <span className="text-slate-200">
                        {status.engine.active_pairs.join(", ") || "NONE"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SETTINGS MODIFIED:</span>
                      <span className="text-slate-300">
                        {status.engine.settings_updated_at
                          ? new Date(status.engine.settings_updated_at)
                              .toISOString()
                              .substring(0, 10)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>

            </div>
          )}

          {/* Prompt warning if tick health critical */}
          {status && status.engine.tick_health !== "healthy" && (
            <div className="border border-rose-500/40 bg-rose-500/10 p-4 font-mono text-xs text-rose-400 flex items-start gap-3">
              <span className="text-lg">🚨</span>
              <div className="space-y-1">
                <strong className="text-white uppercase tracking-wider">
                  TELEMETRY WARNING: CRON SIGNAL DELAY DETECTED
                </strong>
                <p className="leading-relaxed">
                  The automated pricing and technical analysis cron engine has not checked in for more than{" "}
                  {status.engine.seconds_since_last_tick ? Math.floor(status.engine.seconds_since_last_tick / 60) : 10} minutes. 
                  This could indicate an execution delay with our hosting cron service provider. Please verify server daemon logs.
                </p>
              </div>
            </div>
          )}

        </div>

        <VipGateOverlay
          isVip={isVip}
          onUpgradeClick={() => setGateOpen(true)}
        />
      </div>

      <VipUpgradeModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        featureName="System Health Telemetry"
      />
    </div>
  );
}
