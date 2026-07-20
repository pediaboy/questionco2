"use client";

import React from "react";
import Link from "next/link";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { useGlobalStats } from "@/lib/useGlobalStats";
import MemberHeroStats from "@/components/MemberHeroStats";
import QuickMenuGrid from "@/components/QuickMenuGrid";

export default function MemberDashboard() {
  const { profile } = useMemberAuth();
  const { stats } = useGlobalStats();

  if (!profile) return null;

  const displayName = profile.full_name || profile.email.split("@")[0];

  const heroStats = stats || {
    win_rate: 80,
    total_trade: 0,
    profit_pips: 0,
    latest_signal: null,
  };

  return (
    <div className="relative">
      {/* ================= WELCOME / SESSION BLOCK ================= */}
      <div className="relative mb-7 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4 chamfer-sm">
        {/* subtle scanline texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, #00F0FF 2px, #00F0FF 3px)",
          }}
        />
        {/* neon corner ticks */}
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />

        {/* session status line */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-400 [box-shadow:0_0_6px_#34d399]" />
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
            [ SESSION <span className="text-slate-700">//</span>{" "}
            <span className="text-emerald-400/90">ESTABLISHED</span> ]
          </span>
        </div>

        <h2 className="font-display mt-2 text-xl font-bold text-white md:text-2xl">
          Selamat Datang,{" "}
          <span className="text-glow-cyan relative text-cyan-300">
            {displayName}
            {/* underline accent */}
            <span className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-cyan-400/80 via-cyan-400/30 to-transparent" />
          </span>
        </h2>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          {">"} OPERATOR TERMINAL AKTIF <span className="animate-pulse text-cyan-500">_</span>
        </p>
      </div>

      {/* ================= HERO STATS (global community stats, synced every 5s) ================= */}
      <div className="relative mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-600">
            <span className="text-cyan-500/70">//</span> COMMUNITY INTEL
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
            <span className="inline-block h-1 w-1 animate-pulse bg-cyan-400" />
            SYNC 1S
          </span>
        </div>
        <MemberHeroStats profile={heroStats} />
      </div>

      {/* ================= QUICK MENU GRID ================= */}
      <div className="relative mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-600">
            <span className="text-cyan-500/70">//</span> QUICK ACCESS
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
        </div>
        <QuickMenuGrid />
      </div>

      {/* ================= VIP UPSELL BANNER (if not already VIP) ================= */}
      {!profile.is_vip && (
        <Link
          href="/dashboard/upgrade"
          className="group chamfer-sm relative my-6 block overflow-hidden border border-[#FFD700]/25 bg-gradient-to-r from-amber-950/25 via-black to-black p-4 transition-all duration-300 hover:border-[#FFD700]/60 hover:shadow-[0_0_24px_rgba(255,215,0,0.12)] active:border-[#FFD700]/80"
        >
          {/* gold shimmer sweep on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FFD700]/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

          {/* ambient gold glow blob */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 bg-[#FFD700]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 md:opacity-60" />

          {/* Tactical Corner Accents */}
          <div className="absolute left-[3px] top-[3px] h-2.5 w-2.5 border-l border-t border-[#FFD700]/80 [filter:drop-shadow(0_0_3px_rgba(255,215,0,0.5))]" />
          <div className="absolute bottom-[3px] right-[3px] h-2.5 w-2.5 border-b border-r border-[#FFD700]/80 [filter:drop-shadow(0_0_3px_rgba(255,215,0,0.5))]" />
          <div className="absolute right-[3px] top-[3px] h-2.5 w-2.5 border-r border-t border-[#FFD700]/30" />
          <div className="absolute bottom-[3px] left-[3px] h-2.5 w-2.5 border-b border-l border-[#FFD700]/30" />

          <div className="relative flex items-center justify-between">
            <div className="flex-1 pr-3">
              <span className="mb-1 block font-mono text-[9.5px] font-bold uppercase tracking-widest text-[#FFD700]">
                [ ELITE PROTOCOL ACCESS ]
              </span>
              <h3 className="font-display text-[15px] font-bold uppercase tracking-wide text-white">
                Upgrade ke VIP Sinyal
              </h3>
              <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-white/60">
                Dapatkan akses sinyal trading real-time, live analysis, dan support premium sekarang juga.
              </p>
            </div>
            <div className="chamfer-sm flex h-8 w-8 shrink-0 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] transition-transform duration-200 group-hover:translate-x-1">
              <span className="text-base font-bold">→</span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
