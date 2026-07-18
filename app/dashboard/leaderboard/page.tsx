"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Medal, Award, Gift, Zap } from "lucide-react";
import { useLeaderboard } from "@/lib/useLeaderboard";
import { CONTEST_TIERS } from "@/lib/contestTiers";

export default function LeaderboardPage() {
  const { items, isLoading, isError } = useLeaderboard();

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // KONTES CAPAI LOT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Kontes <span className="text-cyan-300 text-glow-cyan">Capai Lot</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Peringkat trader berdasarkan total akumulasi lot trading.</p>
      </div>

      {/* Contest rules banner */}
      <div className="chamfer-sm bg-[#0b0f18]/70 border border-amber-400/25 p-4 mb-5 relative overflow-hidden">
        <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-amber-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-amber-400/60" />
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-2 flex items-center gap-1.5">
          <Gift size={13} /> Hadiah Milestone
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {CONTEST_TIERS.map((t) => (
            <div key={t.lot} className="chamfer-sm bg-black/30 border border-white/10 px-3 py-2">
              <div className="text-white font-mono font-bold text-sm">{t.lot.toLocaleString("id-ID")} Lot</div>
              <div className="text-emerald-400 text-[11px] font-semibold">{t.reward}</div>
            </div>
          ))}
        </div>
        <p className="text-[10.5px] text-white/50 leading-relaxed">
          Wajib daftar akun trading lewat broker partner gratis kami untuk ikut kontes ini.
        </p>
        <Link
          href="/dashboard/upgrade"
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300"
        >
          <Zap size={12} /> Daftar Broker Gratis Sekarang &rarr;
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING LEADERBOARD ]</span>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a]/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ LEADERBOARD KOSONG ]</span>
        </div>
      ) : (
        <div className="chamfer bg-[#0b0f18]/60 border border-white/10 overflow-hidden relative">
          {/* Tactical Corner Accents */}
          <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-cyan-400/60" />
          <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-cyan-400/60" />

          <div className="divide-y divide-white/10">
            {items.map((item, index) => {
              const rank = index + 1;
              let rankColor = "text-white/70";
              let RankIcon: typeof Trophy | null = null;

              if (rank === 1) {
                rankColor = "text-[#FFD700] text-glow-gold";
                RankIcon = Trophy;
              } else if (rank === 2) {
                rankColor = "text-[#C0C0C0]";
                RankIcon = Medal;
              } else if (rank === 3) {
                rankColor = "text-[#CD7F32]";
                RankIcon = Award;
              }

              const reachedMax = item.next_tier_lot === null;

              return (
                <div key={index} className="flex flex-col gap-2 p-4 bg-black/20 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between">
                    {/* Left: Rank & Info */}
                    <div className="flex items-center gap-3">
                      <span className={`w-6 flex items-center justify-center font-mono text-center text-sm font-bold ${rankColor}`}>
                        {RankIcon ? <RankIcon size={16} /> : rank}
                      </span>
                      <div>
                        <div className="font-sans font-bold text-white text-[13.5px]">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#94A3B8] font-mono">
                          <span className="flex items-center gap-0.5">
                            WR: {item.win_rate}%
                          </span>
                          <span className="text-white/20">|</span>
                          <span className="flex items-center gap-0.5">
                            {item.total_trade} trades
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Lot count */}
                    <div className="text-right flex flex-col items-end">
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {item.total_lot.toLocaleString("id-ID")} Lot
                      </span>
                      <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">
                        ACCUMULATED
                      </span>
                    </div>
                  </div>

                  {/* Progress bar toward next tier */}
                  <div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 rounded-full transition-all"
                        style={{ width: `${reachedMax ? 100 : item.progress_percent}%` }}
                      />
                    </div>
                    <p className="text-[9.5px] text-white/40 font-mono mt-1">
                      {reachedMax
                        ? "SEMUA MILESTONE TERCAPAI"
                        : `Menuju ${item.next_tier_reward} · ${item.progress_percent}%`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
