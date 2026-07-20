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

interface ApiResponse {
  success: boolean;
  pipeline: PairLiveStatus[];
  target: string | null;
  chart: { candles: { o: number; h: number; l: number; c: number }[]; ema9: number[]; ema21: number[] };
  signals: SignalRow[];
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
function AIPipeline({ pipeline }: { pipeline: PairLiveStatus[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (pipeline.length === 0) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % pipeline.length), 3200);
    return () => clearInterval(iv);
  }, [pipeline.length]);

  const current = pipeline[idx];
  const activeStage = current ? stageIndex(current.stage) : 0;

  return (
    <Panel size={14}>
      <CornerTicks />
      <div className="p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu size={14} style={{ color: C.cyan }} strokeWidth={1.6} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              AI PROCESSING FLOW <span className="text-slate-600">::</span>{" "}
              <span style={{ color: C.gold }}>{current?.pair || "..."}</span>
            </span>
          </div>
          <GlitchText
            text={
              current
                ? current.confidence >= 76
                  ? "SETUP CONFIRMED"
                  : `CONFIDENCE ${current.confidence}% :: HUNTING`
                : "LOADING..."
            }
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
          {PIPELINE_STAGES.map((node, i) => (
            <React.Fragment key={node.id}>
              <PipelineNode node={node} active={i === 0 || i <= activeStage} />
              {i < PIPELINE_STAGES.length - 1 && <DashedConnector active={i < activeStage} />}
            </React.Fragment>
          ))}
        </div>

        {current && current.weakFactors.length > 0 && (
          <div className="mt-3 font-mono text-[9px] tracking-[0.1em] text-slate-500">
            Lemah di: <span style={{ color: C.red }}>{current.weakFactors.join(", ")}</span>
          </div>
        )}

        <div className="relative mt-4 h-[3px] overflow-hidden" style={{ backgroundColor: "rgba(30,41,59,0.6)" }}>
          <motion.div
            className="absolute top-0 h-full w-1/4"
            style={{ background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }}
            animate={{ left: ["-25%", "100%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* real per-pair strip */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {pipeline.map((p) => (
            <button
              key={p.pair}
              onClick={() => setIdx(pipeline.indexOf(p))}
              className="flex flex-col items-start border px-2.5 py-2 text-left transition-colors"
              style={{ ...chamferMicro(6), borderColor: p.pair === current?.pair ? C.cyan : C.iron, backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-slate-300">{p.pair}</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: p.confidence >= 76 ? C.green : p.confidence >= 50 ? C.gold : "#64748B" }}>
                {p.confidence}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  TERMINAL CHART — real OKX M15 candles for the current highest-confidence pair */
/* -------------------------------------------------------------------------- */

const HUD_INDICATORS = (target: string, candles: { o: number; h: number; l: number; c: number }[]) => {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const range = last ? Math.abs(last.h - last.l) : 0;
  const prevRange = prev ? Math.abs(prev.h - prev.l) : 0;
  const volLabel = prevRange > 0 ? `${(range / prevRange).toFixed(2)}x` : "N/A";
  return [
    { label: "RANGE", value: volLabel, color: C.green },
    { label: "CANDLES", value: `${candles.length} M15`, color: C.cyan },
    { label: "TARGET", value: target, color: C.gold },
  ];
};

function TerminalChart({ target, chart }: { target: string; chart: ApiResponse["chart"] }) {
  const { candles, ema9, ema21 } = chart;
  const points = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const span = max - min || 1;
    const toY = (v: number) => 110 - ((v - min) / span) * 100;
    const toX = (i: number) => 8 + i * (384 / Math.max(1, candles.length - 1));
    const toPath = (vals: number[]) =>
      vals.map((v, i) => (Number.isFinite(v) ? `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}` : "")).join(" ");
    return { toX, toY, ema9Path: toPath(ema9), ema21Path: toPath(ema21) };
  }, [candles, ema9, ema21]);

  const indicators = HUD_INDICATORS(target, candles);

  return (
    <div className="relative p-px" style={{ backgroundColor: C.cyan + "66", ...chamfer(14) }}>
      <div className="relative" style={{ backgroundColor: C.card, ...chamfer(13) }}>
        <CornerTicks />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: C.iron }}>
          <div className="flex items-center gap-2">
            <ScanLine size={14} style={{ color: C.cyan }} strokeWidth={1.6} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
              LIVE MARKET FEED <span className="text-slate-600">::</span> <span style={{ color: C.gold }}>{target} M15</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5"
              style={{ backgroundColor: C.red, boxShadow: `0 0 6px ${C.red}` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.red }}>
              LIVE OKX
            </span>
          </div>
        </div>

        <div className="relative">
          {!points ? (
            <div className="flex h-[120px] items-center justify-center font-mono text-[10px] text-slate-600">[ MEMUAT DATA OKX... ]</div>
          ) : (
            <svg viewBox="0 0 400 120" className="block h-auto w-full" preserveAspectRatio="none" aria-hidden="true">
              <g opacity="0.1" stroke={C.cyan} strokeWidth="0.4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`v${i}`} x1={40 + i * 40} y1="0" x2={40 + i * 40} y2="120" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={20 + i * 20} x2="400" y2={20 + i * 20} />
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

/* -------------------------------------------------------------------------- */
/*  SIGNAL LOG — real rows from qco2_signals                                  */
/* -------------------------------------------------------------------------- */

// Honest mapping to real DB states: active = still open, watching for TP/SL/timeout;
// tp_hit/closed = actually fired & completed; sl_hit/timeout = ended without a win.
type UiStatus = "PENDING" | "SENT" | "CANCELLED";
function toUiStatus(row: SignalRow): UiStatus {
  if (row.status === "active") return "PENDING";
  if (row.status === "tp_hit" || row.status === "closed") return "SENT";
  return "CANCELLED"; // sl_hit, timeout
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-[3px] w-[3px]"
          style={{ backgroundColor: C.gold }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: UiStatus }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 border border-dashed px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em]" style={{ ...chamferMicro(4), borderColor: C.gold, color: C.gold }}>
        [ PENDING ] <LoadingDots />
      </span>
    );
  }
  if (status === "SENT") {
    return (
      <span
        className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em]"
        style={{ ...chamferMicro(4), borderColor: C.cyan, color: C.cyan, boxShadow: `0 0 10px ${C.cyan}44, inset 0 0 6px ${C.cyan}22` }}
      >
        [ SENT ]
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.15em] line-through opacity-50" style={{ ...chamferMicro(4), borderColor: C.red, color: C.red }}>
      [ CANCELLED ]
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
    <main className="min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
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
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} aria-label="AI Processing Flow">
              <AIPipeline pipeline={data.pipeline} />
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} aria-label="Live Market Chart">
              <TerminalChart target={data.target || "—"} chart={data.chart} />
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
    </main>
  );
}
