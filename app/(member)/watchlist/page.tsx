"use client";

/**
 * LASTQUESTION.CO :: AUTO WATCHLIST / AI COIN SCANNER
 * 100% REAL DATA, ZERO DUMMY, ZERO MANUAL INPUT.
 * There is no "add pair" button anymore. Every card on this page is a coin the
 * real-time scanner (lib/autoWatchlistEngine.ts, cron every 5min) detected as
 * genuinely hot RIGHT NOW based on real OKX 1H momentum, volume-vs-average, and
 * 20-candle breakout structure -- see /api/cron/watchlist-scan. The list updates
 * itself: a coin appears the instant it qualifies and disappears the instant it
 * cools off. Nothing here is ever added or removed by a person.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, TrendingUp, TrendingDown, Flame, Zap, Activity, Radio } from "lucide-react";
import { C, Panel, CornerTicks, GlitchText, chamferMicro, fmtPrice, timeAgo } from "@/lib/cyberKit";

interface AutoWatchItem {
  id: string;
  pair: string;
  direction: "bullish" | "bearish";
  score: number;
  change_1h: number;
  change_4h: number;
  volume_ratio: number;
  is_breakout: boolean;
  last_price: number;
  reasoning: string;
  first_detected_at: string;
  last_seen_at: string;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, score) / 100) * c;
  return (
    <div className="relative flex h-9 w-9 items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke={C.iron} strokeWidth="3" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function AutoWatchCard({ item }: { item: AutoWatchItem }) {
  const up = item.direction === "bullish";
  const color = up ? C.green : C.red;
  const changeVal = up ? item.change_1h : item.change_1h;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35 }}
    >
      <Panel glowColor={color} size={12} contentClassName="p-4">
        <CornerTicks color={color} />

        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ScoreRing score={item.score} color={color} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-mono text-[13px] font-bold tracking-wide text-slate-100">{item.pair}</span>
                {item.is_breakout && (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                    <Flame size={12} style={{ color: C.gold }} strokeWidth={2} />
                  </motion.span>
                )}
              </div>
              <span className="font-mono text-[8px] tracking-[0.16em]" style={{ color }}>
                {up ? "BULLISH SETUP" : "BEARISH SETUP"}
              </span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.12em]" style={{ borderColor: color, color, ...chamferMicro(2) }}>
            {up ? <TrendingUp size={9} strokeWidth={2.2} /> : <TrendingDown size={9} strokeWidth={2.2} />}
            {up ? "+" : ""}{item.change_1h.toFixed(2)}%
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="min-w-0">
            <span className="font-mono text-[8px] tracking-[0.2em] text-slate-600">LAST PRICE</span>
            <div className="truncate font-mono text-lg font-bold tabular-nums text-slate-200">${fmtPrice(item.last_price)}</div>
          </div>
          <div className="text-right">
            <span className="font-mono text-[8px] tracking-[0.2em] text-slate-600">4H</span>
            <div className="font-mono text-sm font-bold tabular-nums" style={{ color: item.change_4h >= 0 ? C.green : C.red }}>
              {item.change_4h >= 0 ? "+" : ""}{item.change_4h.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="mt-3 border-t pt-2.5" style={{ borderColor: C.iron }}>
          <p className="min-w-0 break-words font-mono text-[9.5px] leading-relaxed text-slate-400">{item.reasoning}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.16em] text-slate-600">
              <Zap size={9} style={{ color: C.gold }} strokeWidth={2} />
              VOL {item.volume_ratio.toFixed(1)}x
            </span>
            <span className="font-mono text-[8px] tracking-[0.16em] text-slate-600">TERDETEKSI {timeAgo(item.first_detected_at)} LALU</span>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

function ScannerStatusBar({ scanning, scannedAt, universeSize, hitCount }: { scanning: boolean; scannedAt: string | null; universeSize: number; hitCount: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-y px-3 py-2 font-mono text-[9px] tracking-[0.18em]" style={{ borderColor: C.iron, backgroundColor: "rgba(17,21,32,0.5)" }}>
      <span className="flex items-center gap-1.5">
        <motion.span
          className="h-1.5 w-1.5"
          style={{ backgroundColor: C.green, boxShadow: `0 0 6px ${C.green}` }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
        <span className="text-slate-500">SCANNER ONLINE</span>
      </span>
      <span className="text-slate-700">|</span>
      <span className="text-slate-500">
        UNIVERSE <span style={{ color: C.cyan }}>{universeSize}</span> COIN
      </span>
      <span className="text-slate-700">|</span>
      <span className="text-slate-500">
        MEMENUHI KRITERIA <span style={{ color: C.green }}>{hitCount}</span>
      </span>
      <span className="ml-auto flex items-center gap-1.5 text-slate-600">
        {scanning && <Radar size={11} className="animate-spin" style={{ color: C.cyan }} strokeWidth={1.8} />}
        {scannedAt ? `TICK TERAKHIR ${timeAgo(scannedAt)} LALU` : "MENGHUBUNGKAN..."}
      </span>
    </div>
  );
}

const UNIVERSE_SIZE = 28; // WATCHLIST_UNIVERSE.length in lib/autoWatchlistEngine.ts

export default function WatchlistPage() {
  const [items, setItems] = useState<AutoWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function pull() {
      try {
        const res = await fetch("/api/watchlist", { cache: "no-store" });
        const d = await res.json();
        if (mounted && d.success) {
          setItems(d.items);
          setScannedAt(d.scannedAt);
          setFlash(true);
          setTimeout(() => setFlash(false), 500);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    pull();
    const iv = setInterval(pull, 5000); // house rule: 5s SWR polling
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const sorted = [...items].sort((a, b) => b.score - a.score);

  return (
    <div className="relative">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <GlitchText text="MONITOR // AUTO WATCHLIST" />
          <h1 className="mt-1.5 flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-slate-100 md:text-2xl">
            <Radar size={18} style={{ color: C.cyan }} strokeWidth={1.8} />
            AI Coin Scanner
          </h1>
          <p className="mt-1 max-w-xl font-mono text-[10px] leading-relaxed tracking-[0.06em] text-slate-500">
            Sepenuhnya otomatis -- tidak ada input manual. Sistem memindai {UNIVERSE_SIZE} pair OKX real-time
            setiap 5 menit; coin masuk sendiri saat momentum, volume, atau breakout-nya memenuhi kriteria,
            dan keluar sendiri saat mendingin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={flash ? { opacity: [0, 1, 0] } : { opacity: 0 }} transition={{ duration: 0.5 }} className="h-1.5 w-1.5" style={{ backgroundColor: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
          <Radio size={12} style={{ color: C.green }} strokeWidth={1.6} />
          <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.green }}>LIVE</span>
        </div>
      </div>

      <ScannerStatusBar scanning={loading} scannedAt={scannedAt} universeSize={UNIVERSE_SIZE} hitCount={sorted.length} />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i} glowColor={C.iron} size={12} contentClassName="p-4 h-[168px] flex items-center justify-center">
              <CornerTicks color={C.iron} />
              <span className="font-mono text-[10px] tracking-widest text-slate-600 animate-pulse">[ MEMINDAI PASAR... ]</span>
            </Panel>
          ))
        ) : (
          <AnimatePresence>
            {sorted.map((item) => (
              <AutoWatchCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {!loading && sorted.length === 0 && (
        <div className="col-span-full mt-3 flex flex-col items-center gap-2 border border-dashed py-14 text-center" style={{ borderColor: C.iron }}>
          <Activity size={22} style={{ color: "#475569" }} strokeWidth={1.6} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-slate-600">
            [ TIDAK ADA COIN YANG MEMENUHI KRITERIA SAAT INI ]
          </span>
          <span className="max-w-sm font-mono text-[9px] tracking-[0.1em] text-slate-700">
            Scanner tetap memantau {UNIVERSE_SIZE} pair setiap 5 menit -- watchlist akan otomatis terisi
            begitu ada momentum/volume/breakout yang nyata.
          </span>
        </div>
      )}
    </div>
  );
}
