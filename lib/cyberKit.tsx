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
