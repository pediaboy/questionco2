"use client";

/**
 * LASTQUESTION.CO :: /dashboard/data-feed
 * WS DATA FEED DIAGNOSTIC & TELEMETRY MONITORING PORTAL.
 *
 * Real self-measurement diagnostics of the client's WebSocket connection to Binance.
 * End-to-end telemetry: measures latency proxy (time between packets), message throughput
 * (messages/sec), connection age/uptime, and a rolling diagnostic log.
 *
 * Dark Cyberpunk style. Gates with useMemberAuth() and VipGateOverlay.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, chamfer, chamferMicro, fmtPrice, fmtQty, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { 
  Activity, 
  Radio, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Square,
  BarChart2,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";

interface FeedStats {
  latency: number;
  minLatency: number;
  maxLatency: number;
  avgLatency: number;
  throughput: number;
  totalMessages: number;
  lastMessageTime: number;
  btcPrice: number;
  ethPrice: number;
  btcChange: number;
  ethChange: number;
}

interface LogEvent {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warn" | "error" | "data";
  message: string;
}

export default function DataFeedPage() {
  const { profile, loading } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // Connection State
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [manualDisconnect, setManualDisconnect] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [uptimeSec, setUptimeSec] = useState(0);

  // Throttled React States
  const [stats, setStats] = useState<FeedStats>({
    latency: 0,
    minLatency: 9999,
    maxLatency: 0,
    avgLatency: 0,
    throughput: 0,
    totalMessages: 0,
    lastMessageTime: 0,
    btcPrice: 0,
    ethPrice: 0,
    btcChange: 0,
    ethChange: 0,
  });
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);

  // High-frequency WS references for throttling/batching
  const wsRef = useRef<WebSocket | null>(null);
  const statsRef = useRef<FeedStats>({
    latency: 0,
    minLatency: 9999,
    maxLatency: 0,
    avgLatency: 0,
    throughput: 0,
    totalMessages: 0,
    lastMessageTime: 0,
    btcPrice: 0,
    ethPrice: 0,
    btcChange: 0,
    ethChange: 0,
  });
  
  const logBufferRef = useRef<LogEvent[]>([]);
  const latencyHistoryRef = useRef<number[]>([]);
  const lastMsgArrivalRef = useRef<number>(0);
  const latencySumRef = useRef<number>(0);
  const latencyCountRef = useRef<number>(0);
  const throughputCounterRef = useRef<number>(0);
  const isDirtyRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Logging function
  const addLog = (type: LogEvent["type"], message: string) => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
    const newLog: LogEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      type,
      message,
    };
    logBufferRef.current = [newLog, ...logBufferRef.current].slice(0, 50);
    isDirtyRef.current = true;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // WebSocket Connection & Reconnection Orchestration
  useEffect(() => {
    // If user is not VIP or loading is active, or user manually disconnected, do not connect
    if (!profile || !isVip || manualDisconnect) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setStatus("offline");
      }
      return;
    }

    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let flushTimer: ReturnType<typeof setInterval> | null = null;
    let throughputTimer: ReturnType<typeof setInterval> | null = null;
    let uptimeTimer: ReturnType<typeof setInterval> | null = null;
    let dead = false;

    // Reset statistics upon fresh initialization/connection
    statsRef.current = {
      latency: 0,
      minLatency: 9999,
      maxLatency: 0,
      avgLatency: 0,
      throughput: 0,
      totalMessages: 0,
      lastMessageTime: 0,
      btcPrice: 0,
      ethPrice: 0,
      btcChange: 0,
      ethChange: 0,
    };
    latencySumRef.current = 0;
    latencyCountRef.current = 0;
    throughputCounterRef.current = 0;
    lastMsgArrivalRef.current = 0;
    latencyHistoryRef.current = [];
    logBufferRef.current = [];
    isDirtyRef.current = true;

    setUptimeSec(0);

    addLog("info", "Inisialisasi WebSocket Telemetry Diagnostics...");

    // 1. Uptime Counter (low-frequency state change)
    uptimeTimer = setInterval(() => {
      if (!dead && wsRef.current?.readyState === WebSocket.OPEN) {
        setUptimeSec((prev) => prev + 1);
      }
    }, 1000);

    // 2. Throughput calculation: measures total messages received in past second
    throughputTimer = setInterval(() => {
      if (!dead) {
        statsRef.current.throughput = throughputCounterRef.current;
        throughputCounterRef.current = 0;
        isDirtyRef.current = true;
      }
    }, 1000);

    // 3. Throttle State Flusher: React re-renders strictly at 250ms interval to protect performance
    flushTimer = setInterval(() => {
      if (!dead && isDirtyRef.current && isMountedRef.current) {
        setStats({ ...statsRef.current });
        if (logBufferRef.current.length > 0) {
          setLogs([...logBufferRef.current]);
        }
        if (latencyHistoryRef.current.length > 0) {
          setLatencyHistory([...latencyHistoryRef.current]);
        }
        isDirtyRef.current = false;
      }
    }, 250);

    // Endpoint streams: BTC & ETH ticker for real-time traffic
    const url = "wss://data-stream.binance.vision/stream?streams=btcusdt@ticker/ethusdt@ticker";

    const connect = () => {
      if (dead) return;
      setStatus("connecting");
      addLog("info", `Menghubungkan ke ${url}...`);

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err: unknown) {
        addLog("error", `Inisiasi WebSocket gagal: ${err instanceof Error ? err.message : String(err)}`);
        schedule();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (dead) return;
        retry = 0;
        setStatus("online");
        addLog("success", "Koneksi WebSocket terjalin dengan sukses! Menunggu paket data...");
      };

      ws.onmessage = (evt) => {
        if (dead) return;
        const now = Date.now();
        throughputCounterRef.current += 1;
        statsRef.current.totalMessages += 1;

        // Measure message-arrival latency proxy
        if (lastMsgArrivalRef.current > 0) {
          const currentLatency = now - lastMsgArrivalRef.current;
          statsRef.current.latency = currentLatency;

          if (currentLatency < statsRef.current.minLatency) {
            statsRef.current.minLatency = currentLatency;
          }
          if (currentLatency > statsRef.current.maxLatency) {
            statsRef.current.maxLatency = currentLatency;
          }

          // Latency running average
          latencyCountRef.current += 1;
          latencySumRef.current += currentLatency;
          statsRef.current.avgLatency = Math.round(latencySumRef.current / latencyCountRef.current);

          // Update scrolling latency history for visual charting (last 30 measurements)
          latencyHistoryRef.current.push(currentLatency);
          if (latencyHistoryRef.current.length > 30) {
            latencyHistoryRef.current.shift();
          }
        }
        lastMsgArrivalRef.current = now;
        statsRef.current.lastMessageTime = now;

        // Extract real ticker price data
        try {
          const frame = JSON.parse(evt.data);
          const stream = frame.stream || "";
          const d = frame.data;
          
          if (d && stream.endsWith("@ticker")) {
            const sym = d.s as string;
            const price = Number.parseFloat(d.c as string);
            const pct = Number.parseFloat(d.P as string);

            if (sym === "BTCUSDT") {
              statsRef.current.btcPrice = price;
              statsRef.current.btcChange = pct;
              // Log a sample subset of messages to prevent log flood
              if (statsRef.current.totalMessages % 5 === 0) {
                addLog("data", `[BTCUSDT] Live Tick: $${price.toLocaleString()} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`);
              }
            } else if (sym === "ETHUSDT") {
              statsRef.current.ethPrice = price;
              statsRef.current.ethChange = pct;
              if (statsRef.current.totalMessages % 5 === 2) {
                addLog("data", `[ETHUSDT] Live Tick: $${price.toLocaleString()} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`);
              }
            }
          }
        } catch {
          // ignore corrupted JSON frames
        }

        isDirtyRef.current = true;
      };

      ws.onerror = () => {
        addLog("error", "WebSocket mendeteksi kegagalan transmisi/error.");
      };

      ws.onclose = (evt) => {
        if (dead) return;
        setStatus("offline");
        addLog("warn", `Koneksi terputus. Kode: ${evt.code}, Alasan: ${evt.reason || "Tidak ada detail"}`);
        schedule();
      };
    };

    const schedule = () => {
      if (dead) return;
      const delay = Math.min(1000 * Math.pow(2, retry), 10000);
      retry += 1;
      setReconnectCount(retry);
      addLog("warn", `Menjadwalkan koneksi ulang dalam ${delay}ms (Percobaan #${retry})...`);
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      dead = true;
      if (flushTimer) clearInterval(flushTimer);
      if (throughputTimer) clearInterval(throughputTimer);
      if (uptimeTimer) clearInterval(uptimeTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [profile, isVip, manualDisconnect]);

  // Loading state gate
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  // Format helper for uptime
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate simple sparkline SVG path for latency values
  const getSparklinePath = () => {
    if (latencyHistory.length < 2) return "";
    const width = 300;
    const height = 45;
    const maxVal = Math.max(...latencyHistory, 500); // minimum scale peak
    const minVal = Math.min(...latencyHistory, 0);
    const spread = maxVal - minVal || 1;

    return latencyHistory
      .map((val, i) => {
        const x = (i / (latencyHistory.length - 1)) * width;
        const y = height - ((val - minVal) / spread) * height;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="relative min-h-[85vh] pb-10 text-slate-100">
      
      {/* HEADER SECTION */}
      <div 
        className="relative mb-6 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [filter:drop-shadow(0_0_4px_#00F0FF)]" />
              <h1 className="font-mono text-xs font-bold tracking-[0.25em] text-cyan-400">TELEMETRI DATA FEED</h1>
            </div>
            <p className="mt-1 text-lg font-bold tracking-tight text-white sm:text-2xl">
              Diagnostics & Koneksi Real-time
            </p>
            <p className="mt-1 font-mono text-[10px] text-slate-400">
              Sistem diagnostik mandiri untuk menganalisis latency, throughput, dan stabilitas koneksi WebSocket internal ke Binance API.
            </p>
          </div>

          {/* Action controller button */}
          {isVip && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualDisconnect((prev) => !prev)}
                className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all duration-150 ${
                  manualDisconnect
                    ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40"
                    : "border-red-500/50 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                }`}
                style={chamferMicro(4)}
              >
                {manualDisconnect ? (
                  <>
                    <Play className="h-3 w-3 text-emerald-400" /> Hubungkan
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 text-red-400" /> Putuskan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CORE INTERFACE */}
      <div className="relative">
        
        {/* BLURRED WRAPPER IF NOT VIP */}
        <div className={`grid grid-cols-1 gap-6 lg:grid-cols-3 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          
          {/* COLUMN 1: LIVE CONNECTION TELEMETRY */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            
            {/* PANEL: KEY METRICS */}
            <Panel glowColor={status === "online" ? C.cyan : status === "connecting" ? C.gold : C.red}>
              <CornerTicks color={status === "online" ? C.cyan : status === "connecting" ? C.gold : C.red} />
              <div className="p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                    <Activity className="h-4 w-4 text-cyan-400" /> Metrik Utama Telemetri
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">KONEKSI:</span>
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                        status === "online"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : status === "connecting"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}
                      style={chamferMicro(4)}
                    >
                      {status === "online" ? (
                        <>
                          <Wifi className="h-3 w-3" /> ONLINE
                        </>
                      ) : status === "connecting" ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" /> HUBUNGKAN
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" /> OFFLINE
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {/* LATENCY PROXY */}
                  <div className="border border-slate-800 bg-slate-900/20 p-3" style={chamferMicro(5)}>
                    <span className="block font-mono text-[10px] tracking-wider text-slate-400">LATENCY PROXY</span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-mono text-2xl font-bold text-white">
                        {status === "online" && stats.latency > 0 ? stats.latency : "—"}
                      </span>
                      {status === "online" && stats.latency > 0 && <span className="font-mono text-[10px] text-slate-500">ms</span>}
                    </div>
                    <span className="mt-2 block font-mono text-[9px] text-slate-500">Waktu antar paket data</span>
                  </div>

                  {/* THROUGHPUT */}
                  <div className="border border-slate-800 bg-slate-900/20 p-3" style={chamferMicro(5)}>
                    <span className="block font-mono text-[10px] tracking-wider text-slate-400">THROUGHPUT</span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-mono text-2xl font-bold text-cyan-400">
                        {status === "online" ? stats.throughput : "0"}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">msg/s</span>
                    </div>
                    <span className="mt-2 block font-mono text-[9px] text-slate-500">Arus data per detik</span>
                  </div>

                  {/* TOTAL MESSAGES */}
                  <div className="border border-slate-800 bg-slate-900/20 p-3" style={chamferMicro(5)}>
                    <span className="block font-mono text-[10px] tracking-wider text-slate-400">TOTAL DATA PKT</span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-mono text-2xl font-bold text-white">
                        {stats.totalMessages.toLocaleString()}
                      </span>
                    </div>
                    <span className="mt-2 block font-mono text-[9px] text-slate-500">Akumulasi paket masuk</span>
                  </div>

                  {/* UPTIME */}
                  <div className="border border-slate-800 bg-slate-900/20 p-3" style={chamferMicro(5)}>
                    <span className="block font-mono text-[10px] tracking-wider text-slate-400">KONEKSI UPTIME</span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-mono text-2xl font-bold text-white">
                        {formatUptime(uptimeSec)}
                      </span>
                    </div>
                    <span className="mt-2 block font-mono text-[9px] text-slate-500">Durasi hidup koneksi</span>
                  </div>
                </div>

                {/* HISTORICAL LATENCY GRAPH */}
                <div className="mt-6 border border-slate-800/80 bg-[#070b12] p-4" style={chamferMicro(6)}>
                  <div className="mb-3 flex items-center justify-between font-mono text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <BarChart2 className="h-3.5 w-3.5 text-cyan-400" /> LIVE LATENCY VISUALIZER (30 DATA POINTS)
                    </span>
                    <span className="text-slate-500">RATA-RATA: {stats.avgLatency || "—"} ms</span>
                  </div>

                  <div className="relative flex h-20 items-end justify-between border-b border-l border-slate-800/50 px-1 pb-1">
                    {/* SVG Sparkline */}
                    {latencyHistory.length >= 2 ? (
                      <div className="absolute inset-0 left-1 right-1 top-2 bottom-1">
                        <svg className="h-full w-full" viewBox="0 0 300 45" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="latencyGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          {/* Area Path */}
                          <path
                            d={`${getSparklinePath()} L 300 45 L 0 45 Z`}
                            fill="url(#latencyGlow)"
                            stroke="none"
                          />
                          {/* Stroke Path */}
                          <path
                            d={getSparklinePath()}
                            fill="none"
                            stroke="#00F0FF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-slate-600">
                        Menunggu data telemetry terkumpul...
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex justify-between font-mono text-[8px] text-slate-500">
                    <span>SEBELUMNYA</span>
                    <span>METODE: DELTA-TIME ANTAR DATA PACKET (LATENCY PROXY)</span>
                    <span>SEKARANG</span>
                  </div>
                </div>

                {/* LATENCY SUMMARY DATA */}
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 font-mono text-[10px]">
                  <div className="flex justify-between border-r border-slate-800/50 pr-4">
                    <span className="text-slate-500">MIN LATENCY</span>
                    <span className="font-bold text-emerald-400">{stats.minLatency === 9999 ? "—" : `${stats.minLatency}ms`}</span>
                  </div>
                  <div className="flex justify-between border-r border-slate-800/50 px-4">
                    <span className="text-slate-500">MAX LATENCY</span>
                    <span className="font-bold text-rose-500">{stats.maxLatency === 0 ? "—" : `${stats.maxLatency}ms`}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-slate-500">ATTEMPTS</span>
                    <span className="font-bold text-amber-400">{reconnectCount} reconnects</span>
                  </div>
                </div>

              </div>
            </Panel>

            {/* PANEL: LIVE TELEMETRY FLOW TERMINAL */}
            <Panel glowColor={C.cyan}>
              <CornerTicks color={C.cyan} />
              <div className="p-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                    <Terminal className="h-4 w-4 text-cyan-400" /> Diagnostic Terminal Logs
                  </div>
                  <div className="font-mono text-[9px] text-slate-500">
                    ROLLING LOG (MAKSIMAL 50 BARIS)
                  </div>
                </div>

                <div 
                  className="mt-4 h-64 overflow-y-auto rounded border border-slate-900 bg-black/60 p-4 font-mono text-[11px] leading-relaxed text-slate-300"
                >
                  {logs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-600">
                      Terminal siap. Menunggu aktivitas koneksi...
                    </div>
                  ) : (
                    logs.map((log) => {
                      let colorClass = "text-slate-400";
                      let prefix = "[INFO]";
                      
                      if (log.type === "success") {
                        colorClass = "text-emerald-400";
                        prefix = "[OK]  ";
                      } else if (log.type === "warn") {
                        colorClass = "text-amber-400 font-semibold";
                        prefix = "[WARN]";
                      } else if (log.type === "error") {
                        colorClass = "text-rose-500 font-bold animate-pulse";
                        prefix = "[ERR]";
                      } else if (log.type === "data") {
                        colorClass = "text-cyan-400 opacity-90";
                        prefix = "[DATA]";
                      }

                      return (
                        <div key={log.id} className="mb-1.5 flex items-start gap-2 border-b border-slate-950 pb-1 hover:bg-slate-900/20">
                          <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                          <span className={`shrink-0 ${colorClass}`}>{prefix}</span>
                          <span className="break-all text-slate-300">{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Panel>

          </div>

          {/* COLUMN 2: ACTIVE CHANNEL ANALYSIS & TELEMETRY CHECKS */}
          <div className="flex flex-col gap-6">
            
            {/* PANEL: ACTIVE API FEED PREVIEW */}
            <Panel glowColor={C.cyan}>
              <CornerTicks color={C.cyan} />
              <div className="p-6">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                    <Database className="h-4 w-4 text-cyan-400" /> Live Stream Prices
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4">
                  {/* BTC TICKER CARD */}
                  <div className="border border-slate-800 bg-slate-950 p-4" style={chamferMicro(6)}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">BTCUSDT</span>
                      <span className="font-mono text-[9px] text-slate-500">STREAM TAPE</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="font-mono text-xl font-bold tracking-tight text-white">
                        {status === "online" && stats.btcPrice > 0 ? `$${stats.btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Menghubungkan..."}
                      </span>
                      {status === "online" && stats.btcPrice > 0 && (
                        <span className={`font-mono text-xs font-bold ${stats.btcChange >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {stats.btcChange >= 0 ? "+" : ""}{stats.btcChange.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ETH TICKER CARD */}
                  <div className="border border-slate-800 bg-slate-950 p-4" style={chamferMicro(6)}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">ETHUSDT</span>
                      <span className="font-mono text-[9px] text-slate-500">STREAM TAPE</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="font-mono text-xl font-bold tracking-tight text-white">
                        {status === "online" && stats.ethPrice > 0 ? `$${stats.ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Menghubungkan..."}
                      </span>
                      {status === "online" && stats.ethPrice > 0 && (
                        <span className={`font-mono text-xs font-bold ${stats.ethChange >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          {stats.ethChange >= 0 ? "+" : ""}{stats.ethChange.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            {/* PANEL: CONNECTIONS HEALTH CHECKS */}
            <Panel glowColor={C.cyan}>
              <CornerTicks color={C.cyan} />
              <div className="p-6">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" /> Telemetry Health Assessment
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 font-mono text-[10px]">
                  
                  {/* CHECK 1: CONNECTION STABILITY */}
                  <div className="flex items-start gap-3 border-b border-slate-900 pb-3">
                    {reconnectCount === 0 && status === "online" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : reconnectCount > 0 && status === "online" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    ) : (
                      <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-rose-500 animate-pulse bg-rose-950/20" />
                    )}
                    <div>
                      <span className="block font-bold text-slate-200">Stabilitas Saluran API</span>
                      <p className="mt-1 text-slate-400 leading-normal">
                        {reconnectCount === 0 && status === "online"
                          ? "Koneksi stabil tanpa interupsi atau kegagalan penandatanganan paket."
                          : reconnectCount > 0 && status === "online"
                          ? `Terjadi ${reconnectCount} gangguan konektivitas, namun pemulihan otomatis berhasil.`
                          : "Saluran koneksi sedang terputus. Menunggu koneksi ulang otomatis."}
                      </p>
                    </div>
                  </div>

                  {/* CHECK 2: PACKET DELAY QUALITY */}
                  <div className="flex items-start gap-3 border-b border-slate-900 pb-3">
                    {stats.avgLatency > 0 && stats.avgLatency <= 250 ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : stats.avgLatency > 250 && stats.avgLatency < 800 ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    ) : stats.avgLatency >= 800 ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400 animate-pulse" />
                    ) : (
                      <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-800 bg-slate-950" />
                    )}
                    <div>
                      <span className="block font-bold text-slate-200">Kualitas Packet Delay</span>
                      <p className="mt-1 text-slate-400 leading-normal">
                        {stats.avgLatency === 0
                          ? "Menunggu transmisi data pertama untuk mengukur respon."
                          : stats.avgLatency <= 250
                          ? `Latency rata-rata luar biasa (${stats.avgLatency}ms). Transmisi real-time optimal.`
                          : stats.avgLatency < 800
                          ? `Terjadi delay sedang (${stats.avgLatency}ms). Potensi antrean jaringan.`
                          : `Delay kritis (${stats.avgLatency}ms). Disarankan untuk memeriksa koneksi internet Anda.`}
                      </p>
                    </div>
                  </div>

                  {/* CHECK 3: THROTTLING CONGRUENCE */}
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <span className="block font-bold text-slate-200">Throttling Mesin UI</span>
                      <p className="mt-1 text-slate-400 leading-normal">
                        Frekuensi render state React disaring ke interval 250ms secara konstan untuk mengeliminasi overhead lag, melindungi CPU dari jutaan pembaruan data bertubi-tubi.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </Panel>

          </div>

        </div>

        {/* VIP OVERLAY FOR BLOCKING PREMIUM ACCESS */}
        {!isVip && (
          <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
        )}

      </div>

      {/* UPGRADE MODAL */}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Data Feed Diagnostic" />

    </div>
  );
}
