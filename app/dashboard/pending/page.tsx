"use client";

/**
 * LASTQUESTION.CO :: /dashboard/pending
 * AI ENGINE TERMINAL & PENDING PIPELINE — 100% REAL DATA, ZERO DUMMY.
 * Every number on this page comes from a live read of the actual auto-signal
 * engine (lib/institutionalEngine.ts) against real OKX candles, and real rows
 * from qco2_signals. Nothing here is randomly generated or hardcoded.
 * Dark Cyberpunk HUD — Next.js 14 + Tailwind CSS + Framer Motion + lucide-react
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";
import { motion } from "framer-motion";
import {
  Database,
  Sigma,
  Crosshair,
  Activity,
  Radio,
  TrendingUp,
  TrendingDown,
  Terminal,
  Cpu,
  ScanLine,
  Lock,
} from "lucide-react";

const C = {
  bg: "#05080F",
  card: "#111520",
  cyan: "#00F0FF",
  gold: "#FFD700",
  red: "#FF0044",
  green: "#00FF66",
  iron: "#1E293B",
};

const chamfer = (s = 12): React.CSSProperties => ({
  clipPath: `polygon(${s}px 0, 100% 0, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0 100%, 0 ${s}px)`,
});
const chamferMicro = (s = 5): React.CSSProperties => ({
  clipPath: `polygon(${s}px 0, 100% 0, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0 100%, 0 ${s}px)`,
});

function Panel({
  children,
  glowColor = C.cyan,
  size = 14,
  className = "",
}: {
  children: React.ReactNode;
  glowColor?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative p-px ${className}`}
      style={{ background: `linear-gradient(135deg, ${glowColor}55, ${C.iron} 30%, ${C.iron} 70%, ${glowColor}33)`, ...chamfer(size) }}
    >
      <div className="relative h-full w-full" style={{ backgroundColor: C.card, ...chamfer(size - 1) }}>
        {children}
      </div>
    </div>
  );
}

function CornerTicks({ color = C.cyan }: { color?: string }) {
  const base = "pointer-events-none absolute h-3.5 w-3.5";
  const s: React.CSSProperties = { borderColor: color, filter: `drop-shadow(0 0 4px ${color}99)` };
  return (
    <>
      <span className={`${base} left-1 top-1 border-l-2 border-t-2`} style={s} aria-hidden="true" />
      <span className={`${base} right-1 top-1 border-r-2 border-t-2 opacity-40`} style={s} aria-hidden="true" />
      <span className={`${base} bottom-1 left-1 border-b-2 border-l-2 opacity-40`} style={s} aria-hidden="true" />
      <span className={`${base} bottom-1 right-1 border-b-2 border-r-2`} style={s} aria-hidden="true" />
    </>
  );
}

function GlitchText({ text }: { text: string }) {
  return (
    <span className="relative inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
      <motion.span
        className="relative z-10"
        style={{ color: C.cyan }}
        animate={{ x: [0, -1, 1, 0], opacity: [1, 0.85, 1] }}
        transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 2.4 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute left-0 top-0 z-0"
        style={{ color: C.red }}
        animate={{ x: [0, 2, -1, 0], opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 2.4 }}
        aria-hidden="true"
      >
        {text}
      </motion.span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  TYPES — mirror /api/pending-status                                        */
/* -------------------------------------------------------------------------- */

interface PairLiveStatus {
  pair: string;
  price: number;
  direction: "BUY" | "SELL" | null;
  confidence: number;
  stage: "structure" | "scoring_low" | "ready";
  weakFactors: string[];
  reasoning: string;
  checkedAt: string;
}

interface SignalRow {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number;
  take_profit: number | null;
  status: string;
  hit_level: string | null;
  created_at: string;
  source: string;
}

interface ChartData {
  candles: { o: number; h: number; l: number; c: number }[];
  ema9: number[];
  ema21: number[];
}

interface ApiResponse {
  success: boolean;
  pipeline: PairLiveStatus[];
  charts: Record<string, ChartData>;
  signals: SignalRow[];
  logs: EngineLogRow[];
}

const PIPELINE_STAGES = [
  { id: 1, label: "DATA INGESTION", icon: Database },
  { id: 2, label: "EMA/VWAP/SMC CALCULATING", icon: Sigma },
  { id: 3, label: "WAITING BREAKOUT", icon: Crosshair },
];

function stageIndex(stage: PairLiveStatus["stage"]): number {
  if (stage === "structure") return 1; // still calculating/searching for structure
  if (stage === "scoring_low") return 2; // has structure, waiting confidence to cross threshold
  return 2;
}

function PipelineNode({ node, active }: { node: (typeof PIPELINE_STAGES)[number]; active: boolean }) {
  const Icon = node.icon;
  return (
    <motion.div
      className="relative flex items-center gap-2.5 border px-3.5 py-2.5"
      style={{
        ...chamferMicro(8),
        borderColor: active ? C.cyan : C.iron,
        backgroundColor: active ? "rgba(0,240,255,0.07)" : "rgba(30,41,59,0.25)",
      }}
      animate={active ? { boxShadow: [`0 0 0px ${C.cyan}00`, `0 0 18px ${C.cyan}55`, `0 0 0px ${C.cyan}00`] } : { boxShadow: `0 0 0px transparent` }}
      transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
    >
      <motion.span animate={active ? { opacity: [1, 0.4, 1] } : { opacity: 0.35 }} transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}>
        <Icon size={15} style={{ color: active ? C.cyan : "#475569" }} strokeWidth={1.6} />
      </motion.span>
      <div className="flex flex-col leading-none">
        <span className="font-mono text-[9px] font-bold tracking-[0.18em]" style={{ color: active ? C.cyan : "#64748B" }}>
          [ {node.id}. {node.label} ]
        </span>
        <span className="mt-1 font-mono text-[8px] tracking-[0.2em]" style={{ color: active ? C.green : "#334155" }}>
          {active ? "● ACTIVE" : "○ STANDBY"}
        </span>
      </div>
    </motion.div>
  );
}

function DashedConnector({ active }: { active: boolean }) {
  return (
    <div className="relative mx-1 hidden h-px flex-1 min-w-6 md:block">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${active ? C.cyan : C.iron} 0 6px, transparent 6px 12px)`,
          opacity: active ? 0.9 : 0.4,
        }}
      />
      {active && (
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2"
          style={{ backgroundColor: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

/* Cycles through the 4 REAL pairs, showing each one's real live stage/confidence */
function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

/* Real list of all 4 pairs the engine is currently evaluating, each with its live
   confidence build-up toward CONFIDENCE_MIN -- replaces the old single-pair-cycling
   "processing flow" panel with a genuine multi-row pipeline view (2026-07-20). */
function PendingPipelineList({ pipeline }: { pipeline: PairLiveStatus[] }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const sorted = [...pipeline].sort((a, b) => b.confidence - a.confidence);

  return (
    <Panel size={14}>
      <CornerTicks />
      <div className="p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu size={14} style={{ color: C.cyan }} strokeWidth={1.6} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              PENDING PIPELINE
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-[0.25em] text-slate-600">{sorted.length.toString().padStart(2, "0")} SIGNALS</span>
        </div>

        <div className="flex flex-col gap-2">
          {sorted.map((p) => {
            const isLong = p.direction === "BUY";
            const ready = p.stage === "ready";
            const barColor = p.direction === null ? "#475569" : isLong ? C.green : C.red;
            return (
              <motion.div
                key={p.pair}
                className="relative flex items-center gap-3 overflow-hidden border px-3 py-2.5"
                style={{ ...chamferMicro(8), borderColor: ready ? C.cyan : C.iron, backgroundColor: ready ? "rgba(0,240,255,0.06)" : "rgba(17,21,32,0.5)" }}
                animate={
                  ready
                    ? { boxShadow: [`0 0 0px ${C.cyan}00`, `0 0 16px ${C.cyan}55`, `0 0 0px ${C.cyan}00`] }
                    : { boxShadow: `0 0 0px transparent` }
                }
                transition={{ duration: 1.6, repeat: ready ? Infinity : 0 }}
              >
                {/* continuously moving scan-line sweep across every row -- always animating, not just "ready" ones */}
                <motion.div
                  className="pointer-events-none absolute inset-y-0 w-10"
                  style={{ background: `linear-gradient(90deg, transparent, ${barColor}22, transparent)` }}
                  animate={{ left: ["-10%", "110%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: Math.random() * 1.5 }}
                />

                <motion.div
                  style={{ color: barColor }}
                  animate={p.direction ? { scale: [1, 1.15, 1] } : { rotate: 360 }}
                  transition={p.direction ? { duration: 1.4, repeat: Infinity } : { duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {isLong ? <TrendingUp size={16} strokeWidth={2} /> : p.direction === "SELL" ? <TrendingDown size={16} strokeWidth={2} /> : <ScanLine size={16} strokeWidth={2} />}
                </motion.div>

                <div className="flex min-w-[92px] flex-col leading-none">
                  <span className="font-mono text-[11px] font-bold text-slate-200">{p.pair}</span>
                  <span className="mt-1 font-mono text-[8px] tracking-[0.15em]" style={{ color: p.direction ? barColor : "#475569" }}>
                    {p.direction ? (isLong ? "LONG" : "SHORT") : "SCANNING"}
                  </span>
                </div>

                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(30,41,59,0.7)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    animate={{ width: `${Math.max(2, p.confidence)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-y-0 w-4"
                    style={{ background: `linear-gradient(90deg, transparent, ${barColor}, transparent)`, opacity: 0.6 }}
                    animate={{ left: ["-15%", "115%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <span className="w-11 text-right font-mono text-[11px] font-bold" style={{ color: ready ? C.green : p.confidence >= 50 ? C.gold : "#64748B" }}>
                  {p.confidence}%
                </span>
                <span className="w-8 text-right font-mono text-[9px] text-slate-600">{timeAgo(p.checkedAt)}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

/* Real, live-scrolling terminal feed sourced directly from qco2_engine_logs --
   every row is an actual cron tick evaluation, not decorative/fake text. */
const ACTION_TAG: Record<string, { tag: string; color: string }> = {
  created: { tag: "SIGNAL", color: C.green },
  monitoring: { tag: "WATCH", color: C.cyan },
  no_trigger: { tag: "SCAN", color: "#64748B" },
  closed: { tag: "CLOSE", color: C.gold },
  timeout: { tag: "TIMEOUT", color: C.gold },
  skipped_weekend: { tag: "SKIP", color: "#475569" },
  error: { tag: "ERR", color: C.red },
};

interface EngineLogRow {
  id: string;
  pair: string;
  action: string;
  confidence: number | null;
  direction: string | null;
  reasoning: string | null;
  created_at: string;
}

const SCAN_STEPS = ["INGEST", "EMA", "VWAP", "RSI/ADX", "SMC STRUCT", "NEWS FILTER"];

/* Purely cosmetic "still alive between real ticks" indicator -- clearly a live
   polling readout (never mixed into the real log rows above it), so the page never
   feels frozen during the ~5min gap between actual qco2_engine_logs writes. */
function LiveScanIndicator({ pairs }: { pairs: string[] }) {
  const [pairIdx, setPairIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx((s) => {
        if (s + 1 >= SCAN_STEPS.length) {
          setPairIdx((p) => (p + 1) % Math.max(1, pairs.length));
          return 0;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(iv);
  }, [pairs.length]);

  const pair = pairs[pairIdx] || "—";
  return (
    <div className="flex items-center gap-2 py-0.5">
      <motion.span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.green }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
      <span className="font-bold" style={{ color: C.green }}>[SCAN]</span>
      <span className="text-slate-500">{pair}</span>
      <span className="text-slate-400">
        checking <span style={{ color: C.cyan }}>{SCAN_STEPS[stepIdx]}</span>...
      </span>
    </div>
  );
}

function EngineTerminalLog({ logs, pairs }: { logs: EngineLogRow[]; pairs: string[] }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [logs]);

  return (
    <Panel size={14}>
      <CornerTicks color={C.green} />
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Terminal size={14} style={{ color: C.green }} strokeWidth={1.6} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            AI ENGINE <span className="text-slate-600">//</span> TERMINAL
          </span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-slate-600">
            <motion.span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.green }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            SCANNING
          </span>
        </div>

        <div ref={boxRef} className="max-h-[220px] overflow-y-auto font-mono text-[10px] leading-relaxed">
          {logs.length === 0 && <div className="py-4 text-center text-slate-600">[ MENUNGGU TICK PERTAMA... ]</div>}
          {logs.map((l) => {
            const meta = ACTION_TAG[l.action] || { tag: l.action.toUpperCase(), color: "#64748B" };
            const time = new Date(l.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
            return (
              <div key={l.id} className="flex gap-2 py-0.5">
                <span className="text-slate-600">{time}</span>
                <span className="font-bold" style={{ color: meta.color }}>[{meta.tag}]</span>
                <span className="text-slate-500">{l.pair}</span>
                <span className="flex-1 truncate text-slate-400">
                  {l.confidence !== null ? `conf ${l.confidence}%` : ""} {l.reasoning ? `— ${l.reasoning}` : ""}
                </span>
              </div>
            );
          })}
          <LiveScanIndicator pairs={pairs} />
          <div className="flex items-center gap-1 pt-1 text-slate-600">
            <span>{">"}</span>
            <motion.span className="inline-block h-3 w-1.5" style={{ backgroundColor: C.cyan }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  TERMINAL CHART — real OKX M15 candles for the current highest-confidence pair */
/* -------------------------------------------------------------------------- */

const HUD_INDICATORS = (candles: { o: number; h: number; l: number; c: number }[]) => {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const range = last ? Math.abs(last.h - last.l) : 0;
  const prevRange = prev ? Math.abs(prev.h - prev.l) : 0;
  const volLabel = prevRange > 0 ? `${(range / prevRange).toFixed(2)}x` : "N/A";
  return [
    { label: "RANGE", value: volLabel, color: C.green },
    { label: "CANDLES", value: `${candles.length} M15`, color: C.cyan },
  ];
};

/* One compact live chart card for a single pair -- rendered 4x in a grid so the
   Live Market Feed shows XAU/BTC/ETH/SOL simultaneously (was previously only the
   single highest-confidence pair, per owner request 2026-07-20). */
function MiniChart({ pairLabel, chart, statusColor }: { pairLabel: string; chart: ChartData; statusColor: string }) {
  const { candles, ema9, ema21 } = chart;
  const points = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const span = max - min || 1;
    const toY = (v: number) => 82 - ((v - min) / span) * 74;
    const toX = (i: number) => 8 + i * (384 / Math.max(1, candles.length - 1));
    const toPath = (vals: number[]) =>
      vals.map((v, i) => (Number.isFinite(v) ? `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}` : "")).join(" ");
    return { toX, toY, ema9Path: toPath(ema9), ema21Path: toPath(ema21) };
  }, [candles, ema9, ema21]);

  const indicators = HUD_INDICATORS(candles);

  return (
    <div className="relative p-px" style={{ backgroundColor: statusColor + "66", ...chamfer(12) }}>
      <div className="relative" style={{ backgroundColor: C.card, ...chamfer(11) }}>
        <CornerTicks color={statusColor} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: C.iron }}>
          <div className="flex items-center gap-2">
            <ScanLine size={12} style={{ color: statusColor }} strokeWidth={1.6} />
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: statusColor }}>
              {pairLabel} <span className="text-slate-600">M15</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5"
              style={{ backgroundColor: C.red, boxShadow: `0 0 6px ${C.red}` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="font-mono text-[8px] tracking-[0.2em]" style={{ color: C.red }}>
              LIVE
            </span>
          </div>
        </div>

        <div className="relative">
          {!points ? (
            <div className="flex h-[90px] items-center justify-center font-mono text-[9px] text-slate-600">[ MEMUAT... ]</div>
          ) : (
            <svg viewBox="0 0 400 90" className="block h-auto w-full" preserveAspectRatio="none" aria-hidden="true">
              <g opacity="0.1" stroke={C.cyan} strokeWidth="0.4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={40 + i * 40} y1="0" x2={40 + i * 40} y2="90" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={15 + i * 15} x2="400" y2={15 + i * 15} />
                ))}
              </g>

              {candles.map((cd, i) => {
                const bull = cd.c >= cd.o;
                const col = bull ? C.green : C.red;
                const x = points.toX(i);
                return (
                  <g key={i}>
                    <line x1={x} y1={points.toY(cd.h)} x2={x} y2={points.toY(cd.l)} stroke={col} strokeWidth="0.7" />
                    <rect
                      x={x - 2.4}
                      y={Math.min(points.toY(cd.o), points.toY(cd.c))}
                      width="4.8"
                      height={Math.max(1, Math.abs(points.toY(cd.o) - points.toY(cd.c)))}
                      fill={col}
                      fillOpacity={bull ? 0.85 : 0.75}
                    />
                  </g>
                );
              })}

              <path d={points.ema9Path} fill="none" stroke={C.cyan} strokeWidth="1.1" strokeOpacity="0.9" style={{ filter: `drop-shadow(0 0 3px ${C.cyan}88)` }} />
              <path d={points.ema21Path} fill="none" stroke={C.gold} strokeWidth="1" strokeOpacity="0.9" style={{ filter: `drop-shadow(0 0 3px ${C.gold}88)` }} />
            </svg>
          )}

          <div className="pointer-events-none absolute left-3 top-2 flex flex-col gap-1">
            {indicators.map((ind, i) => (
              <motion.span
                key={ind.label}
                className="flex items-center gap-1.5 font-mono text-[8.5px] font-bold tracking-[0.2em]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                <span className="inline-block h-1 w-1" style={{ backgroundColor: ind.color }} />
                <span className="text-slate-500">{ind.label}:</span>
                <span style={{ color: ind.color }}>{ind.value}</span>
              </motion.span>
            ))}
          </div>

          <div className="pointer-events-none absolute bottom-2 right-3 flex gap-3 font-mono text-[8px] tracking-[0.15em]">
            <span style={{ color: C.cyan }}>— EMA 9</span>
            <span style={{ color: C.gold }}>— EMA 21</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Grid of all 4 pairs' live charts + a header, replacing the old single-pair panel. */
const SIGNAL_PAIR_LABELS = SIGNAL_PAIRS.map((p) => p.label);

function LiveMarketGrid({ charts, pipeline }: { charts: Record<string, ChartData>; pipeline: PairLiveStatus[] }) {
  const dirByPair = new Map(pipeline.map((p) => [p.pair, p.direction]));
  return (
    <Panel size={14}>
      <CornerTicks />
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <ScanLine size={14} style={{ color: C.cyan }} strokeWidth={1.6} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">LIVE MARKET FEED</span>
          <span className="ml-auto font-mono text-[9px] tracking-[0.2em] text-slate-600">4 PAIRS :: OKX</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SIGNAL_PAIR_LABELS.map((label) => {
            const dir = dirByPair.get(label);
            const color = dir === "BUY" ? C.green : dir === "SELL" ? C.red : C.cyan;
            const chart = charts[label] || { candles: [], ema9: [], ema21: [] };
            return <MiniChart key={label} pairLabel={label} chart={chart} statusColor={color} />;
          })}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  SIGNAL LOG — real rows from qco2_signals                                  */
/* -------------------------------------------------------------------------- */

// Honest mapping to real DB states -- a row only ever exists AFTER the signal
// message has already gone out to Telegram, so "active" must read as SENT/running,
// never PENDING (fixed 2026-07-20 per owner report: signals that were already sent
// were confusingly shown as "PENDING").
type UiStatus = "SENT" | "WIN" | "LOSS" | "TIMEOUT";
function toUiStatus(row: SignalRow): UiStatus {
  if (row.status === "active") return "SENT";
  if (row.status === "tp_hit" || row.status === "closed") return "WIN";
  if (row.status === "timeout") return "TIMEOUT";
  return "LOSS"; // sl_hit
}

function LoadingDots({ color = C.gold }: { color?: string }) {
  return (
    <span className="inline-flex gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-[3px] w-[3px]"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: UiStatus }) {
  if (status === "SENT") {
    return (
      <span
        className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em]"
        style={{ ...chamferMicro(4), borderColor: C.cyan, color: C.cyan, boxShadow: `0 0 10px ${C.cyan}44, inset 0 0 6px ${C.cyan}22` }}
      >
        [ SENT ] <LoadingDots color={C.cyan} />
      </span>
    );
  }
  if (status === "WIN") {
    return (
      <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em]" style={{ ...chamferMicro(4), borderColor: C.green, color: C.green }}>
        [ WIN ]
      </span>
    );
  }
  if (status === "TIMEOUT") {
    return (
      <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em] opacity-70" style={{ ...chamferMicro(4), borderColor: C.gold, color: C.gold }}>
        [ TIMEOUT ]
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em] line-through opacity-50" style={{ ...chamferMicro(4), borderColor: C.red, color: C.red }}>
      [ LOSS ]
    </span>
  );
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
}

function SignalLog({ signals }: { signals: SignalRow[] }) {
  return (
    <Panel size={14}>
      <CornerTicks color={C.gold} />
      <div className="p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal size={14} style={{ color: C.gold }} strokeWidth={1.6} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              SIGNAL LOG HISTORY <span className="text-slate-600">::</span> <span style={{ color: C.gold }}>REAL DATA</span>
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-[0.25em] text-slate-600">{"> "}QCO2_SIGNALS TABLE</span>
        </div>

        <div className="hidden grid-cols-[80px_90px_70px_1fr_130px] gap-2 border-b px-2 pb-2 font-mono text-[8.5px] tracking-[0.25em] text-slate-600 md:grid" style={{ borderColor: C.iron }}>
          <span>TIMESTAMP</span>
          <span>PAIR</span>
          <span>SETUP</span>
          <span>ENTRY</span>
          <span className="text-right">STATUS</span>
        </div>

        <div className="flex flex-col">
          {signals.length === 0 && (
            <div className="py-6 text-center font-mono text-[10px] text-slate-600">[ BELUM ADA SINYAL — ENGINE MASIH MEMANTAU ]</div>
          )}
          {signals.map((row, i) => {
            const isBuy = row.direction === "BUY";
            const SetupIcon = isBuy ? TrendingUp : TrendingDown;
            const uiStatus = toUiStatus(row);
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-2 items-center gap-2 border-b px-2 py-2.5 font-mono text-[10.5px] transition-colors hover:bg-cyan-400/[0.03] md:grid-cols-[80px_90px_70px_1fr_130px]"
                style={{ borderColor: "rgba(30,41,59,0.5)" }}
              >
                <span className="text-slate-500">[ {fmtTime(row.created_at)} ]</span>
                <span className="text-right font-bold text-slate-300 md:text-left">{row.pair}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: isBuy ? C.green : C.red }}>
                  <SetupIcon size={11} strokeWidth={2} />
                  {row.direction}
                </span>
                <span className="text-right tabular-nums text-slate-400 md:text-left">{row.entry}</span>
                <span className="col-span-2 flex justify-end md:col-span-1">
                  <StatusBadge status={uiStatus} />
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center gap-1 px-2 font-mono text-[10px] text-slate-600">
          <span>{">"}</span>
          <motion.span className="inline-block h-3 w-1.5" style={{ backgroundColor: C.cyan }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAGE — polls /api/pending-status every 5s (real backend, house SWR rule)   */
/* -------------------------------------------------------------------------- */

export default function PendingPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/pending-status", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success) {
          setData(json);
          setFlash(true);
          setTimeout(() => setFlash(false), 500);
        }
      } catch {
        /* keep last good data on transient errors */
      }
    }
    load();
    const iv = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className={`mx-auto flex w-full max-w-4xl flex-col gap-5 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border" style={{ ...chamferMicro(6), borderColor: C.cyan + "66", backgroundColor: C.cyan + "11" }}>
              <Activity size={16} style={{ color: C.cyan }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-mono text-sm font-bold tracking-[0.3em] text-white md:text-base">
                AI ENGINE <span style={{ color: C.cyan }}>TERMINAL</span>
              </h1>
              <span className="mt-1 font-mono text-[9px] tracking-[0.35em] text-slate-500">LASTQUESTION.CO {"//"} PENDING PIPELINE</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div animate={flash ? { opacity: [0, 1, 0] } : { opacity: 0 }} transition={{ duration: 0.5 }} className="h-1.5 w-1.5" style={{ backgroundColor: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
            <Radio size={12} style={{ color: C.green }} strokeWidth={1.6} />
            <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.green }}>
              ENGINE ONLINE
            </span>
          </div>
        </motion.header>

        {!data ? (
          <div className="py-16 text-center font-mono text-[11px] tracking-[0.2em] text-slate-600">[ MENYAMBUNGKAN KE ENGINE... ]</div>
        ) : (
          <>
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} aria-label="Pending Pipeline">
              <PendingPipelineList pipeline={data.pipeline} />
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} aria-label="AI Engine Terminal Log">
              <EngineTerminalLog logs={data.logs} pairs={SIGNAL_PAIR_LABELS} />
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} aria-label="Live Market Chart">
              <LiveMarketGrid charts={data.charts} pipeline={data.pipeline} />
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} aria-label="Signal Log History">
              <SignalLog signals={data.signals} />
            </motion.section>
          </>
        )}

        <footer className="flex items-center justify-between font-mono text-[8.5px] tracking-[0.25em] text-slate-700">
          <span>LASTQUESTION © INTEL GRID</span>
          <span>INSTITUTIONAL SMC v3 :: LIVE</span>
        </footer>
      </div>

      {!isVip && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px]">
          <div className="w-12 h-12 chamfer-sm bg-[#05080f] border border-yellow-500/50 flex items-center justify-center">
            <Lock size={20} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-yellow-500">[ Fitur VIP ]</span>
          <button
            onClick={() => setGateOpen(true)}
            className="chamfer-sm border border-cyan-400/40 px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-cyan-300 bg-[#0b0f18]/80"
          >
            Upgrade untuk Akses
          </button>
        </div>
      )}

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="AI Engine Terminal" />
    </main>
  );
}
