"use client";

/**
 * LASTQUESTION.CO :: SHARED CYBERPUNK HUD DESIGN KIT
 * Extracted from app/dashboard/pending/page.tsx so every dashboard sub-page
 * (signal history, engine logs, asset screener, etc.) shares ONE consistent
 * set of primitives instead of duplicating ~150 lines of chamfer/panel
 * boilerplate per file. Import what you need:
 *
 *   import { C, Panel, CornerTicks, chamfer, chamferMicro, fmtPrice, fmtQty } from "@/lib/cyberKit";
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export const C = {
  bg: "#05080F",
  card: "#111520",
  cyan: "#00F0FF",
  gold: "#FFD700",
  red: "#FF0044",
  green: "#00FF66",
  iron: "#1E293B",
};

export const chamfer = (s = 12): React.CSSProperties => ({
  clipPath: `polygon(${s}px 0, 100% 0, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0 100%, 0 ${s}px)`,
});
export const chamferMicro = (s = 5): React.CSSProperties => ({
  clipPath: `polygon(${s}px 0, 100% 0, 100% calc(100% - ${s}px), calc(100% - ${s}px) 100%, 0 100%, 0 ${s}px)`,
});

export function Panel({
  children,
  glowColor = C.cyan,
  size = 14,
  className = "",
  contentClassName = "",
}: {
  children: React.ReactNode;
  glowColor?: string;
  size?: number;
  /** Sizing/grid-placement classes for the OUTER card box (w-full, h-full, h-64, etc). */
  className?: string;
  /** Padding/flex-layout classes for the INNER content area (p-4, flex flex-col, justify-between, etc).
   * IMPORTANT: content padding must go here, not in `className` -- `className` lands on the
   * outer 1px gradient-border wrapper, not the actual content box, so padding passed via
   * `className` does nothing to protect text from the absolutely-positioned CornerTicks
   * corner brackets, causing text to visually overlap/get clipped by them. */
  contentClassName?: string;
}) {
  return (
    <div
      className={`relative p-px ${className}`}
      style={{ background: `linear-gradient(135deg, ${glowColor}55, ${C.iron} 30%, ${C.iron} 70%, ${glowColor}33)`, ...chamfer(size) }}
    >
      <div className={`relative h-full w-full ${contentClassName}`} style={{ backgroundColor: C.card, ...chamfer(size - 1) }}>
        {children}
      </div>
    </div>
  );
}


/* Flickery duplicated-text glitch effect for HUD section labels -- cyan main
 * layer + a faint red ghost layer that briefly desyncs, like a scanline glitch. */
export function GlitchText({ text }: { text: string }) {
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

export function CornerTicks({ color = C.cyan }: { color?: string }) {
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

/* number formatting helpers for live prices, shared across every market-data page */
export function fmtPrice(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}
export function fmtQty(n: number): string {
  if (n >= 100) return n.toFixed(1);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(4);
}

export function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

/* Standard VIP blur+lock gate overlay -- use on any premium dashboard sub-page.
 * Wrap your real content in a div with `isVip ? "" : "blur-md select-none pointer-events-none"`,
 * then render <VipGateOverlay isVip={isVip} onUpgradeClick={...} /> as a sibling. */
export function VipGateOverlay({ isVip, onUpgradeClick }: { isVip: boolean; onUpgradeClick: () => void }) {
  if (isVip) return null;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px]">
      <div className="flex h-12 w-12 items-center justify-center border border-yellow-500/50 bg-[#05080f]" style={chamferMicro(6)}>
        <span className="text-yellow-500">🔒</span>
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-yellow-500">[ Fitur VIP ]</span>
      <button
        onClick={onUpgradeClick}
        className="border border-cyan-400/40 bg-[#0b0f18]/80 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-cyan-300"
        style={chamferMicro(6)}
      >
        Upgrade untuk Akses
      </button>
    </div>
  );
}


/* Standard "not a broker/exchange account" disclosure — use verbatim on every
 * page that shows real member performance/contest/lot stats (Portfolio,
 * Account Overview, Wallet Balance, etc). ONE canonical text + style so it
 * never drifts into shouty ALL-CAPS placeholder-looking copy on some pages
 * and readable prose on others. `min-w-0 break-words` guards against text
 * overflow at browser zoom / narrow viewports. */
export function ZeroDummyDisclosure({ className = "" }: { className?: string }) {
  return (
    <div
      className={`min-w-0 border border-amber-500/20 bg-amber-500/5 p-4 ${className}`}
      style={{ clipPath: "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)" }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
        <div className="min-w-0 space-y-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            PROTOKOL ZERO DUMMY DATA
          </span>
          <p className="font-sans text-[11px] text-amber-200/70 leading-relaxed break-words">
            LASTQUESTION.CO mematuhi kebijakan ketat <strong>ZERO DUMMY DATA</strong>. Halaman ini adalah
            representasi standing performa sinyal real serta keterlibatan kontes resmi Anda di platform
            kami. Ini <strong>bukan</strong> akun broker, terminal margin, ataupun exchange wallet. Kami
            tidak menampung saldo margin ataupun dana trading member. Semua parameter kinerja dikalkulasikan
            secara transparan dari data nyata.
          </p>
        </div>
      </div>
    </div>
  );
}
