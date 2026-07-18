"use client";

import React, { useEffect, useState } from "react";
import { Trophy, TrendingUp, LineChart } from "lucide-react";

interface LeaderboardItem {
  name: string;
  profit_pips: number;
  win_rate: number;
  total_trade: number;
}

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/member/leaderboard");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setItems(data.items);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // LEADERBOARD ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Peringkat <span className="text-cyan-300 text-glow-cyan">Trader</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Peringkat trader berdasarkan total akumulasi profit pips.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING LEADERBOARD ]</span>
        </div>
      ) : items.length === 0 ? (
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
              let rankBadge = "";

              if (rank === 1) {
                rankColor = "text-[#FFD700] text-glow-gold font-bold";
                rankBadge = "🥇";
              } else if (rank === 2) {
                rankColor = "text-[#C0C0C0] font-bold";
                rankBadge = "🥈";
              } else if (rank === 3) {
                rankColor = "text-[#CD7F32] font-bold";
                rankBadge = "🥉";
              }

              const isProfitPositive = item.profit_pips >= 0;

              return (
                <div key={index} className="flex items-center justify-between p-4 bg-black/20 hover:bg-white/5 transition-all">
                  {/* Left: Rank & Info */}
                  <div className="flex items-center gap-3">
                    <span className={`w-6 font-mono text-center text-sm ${rankColor}`}>
                      {rankBadge || rank}
                    </span>
                    <div>
                      <div className="font-sans font-bold text-white text-[13.5px]">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#94A3B8] font-mono">
                        <span className="flex items-center gap-0.5">
                          <Trophy size={10} className="text-amber-400/80" /> WR: {item.win_rate}%
                        </span>
                        <span className="text-white/20">|</span>
                        <span className="flex items-center gap-0.5">
                          <LineChart size={10} className="text-cyan-400/80" /> {item.total_trade} trades
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Profit Pips */}
                  <div className="text-right flex flex-col items-end">
                    <span className={`font-mono font-bold text-sm ${isProfitPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {isProfitPositive ? `+${item.profit_pips}` : item.profit_pips} pips
                    </span>
                    <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">
                      ACCUMULATED
                    </span>
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
