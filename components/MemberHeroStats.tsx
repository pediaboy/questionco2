"use client";

import React from "react";
import Link from "next/link";
import { Trophy, LineChart, TrendingUp, TrendingDown, Terminal } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { LatestSignal } from "@/lib/useGlobalStats";

interface HeroStatsData {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  latest_signal: LatestSignal | null;
}

interface MemberHeroStatsProps {
  profile: HeroStatsData;
}

function timeAgoShort(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}d lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}mnt lalu`;
  const hr = Math.floor(min / 60);
  return `${hr}j lalu`;
}

export default function MemberHeroStats({ profile }: MemberHeroStatsProps) {
  const [parent] = useAutoAnimate();
  const profit = profile.profit_pips;
  const isProfitPositive = profit >= 0;
  const sig = profile.latest_signal;
  const sigIsBuy = sig?.direction === "BUY";
  const sigIsFresh = sig ? Date.now() - new Date(sig.created_at).getTime() < 5 * 60 * 1000 : false;

  const stats = [
    {
      label: "Win Rate",
      value: `${profile.win_rate}%`,
      icon: Trophy,
      liveText: "● LIVE",
      liveColor: "text-emerald-400",
    },
    {
      label: "Total Trade",
      value: String(profile.total_trade),
      icon: LineChart,
      liveText: "ACTIVE",
      liveColor: "text-cyan-400",
    },
    {
      label: "Profit / Loss",
      value: isProfitPositive ? `+${profit} pips` : `${profit} pips`,
      icon: isProfitPositive ? TrendingUp : TrendingDown,
      liveText: isProfitPositive ? "PROFIT" : "LOSS",
      liveColor: isProfitPositive ? "text-emerald-400" : "text-rose-500",
      valueColor: isProfitPositive ? "text-emerald-400" : "text-rose-400",
    },
  ];

  return (
    <div ref={parent} className="grid grid-cols-2 gap-3.5 my-6">
      {stats.map((stat, i) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={i}
            className="chamfer-sm bg-[#0f172a]/70 backdrop-blur-sm border border-white/10 p-4 relative flex flex-col justify-between h-[110px] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-200"
          >
            <div className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t border-l border-cyan-400/70" />
            <div className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b border-r border-cyan-400/70" />

            <div className="flex items-center justify-between">
              <IconComponent className="text-slate-400" size={16} strokeWidth={1.5} />
              <span className={`text-[9px] font-bold tracking-wider ${stat.liveColor || "text-emerald-400"}`}>
                {stat.liveText}
              </span>
            </div>

            <div className="my-1">
              <span className={`font-mono font-bold text-2xl tracking-tight ${stat.valueColor || "text-white"}`}>
                {stat.value}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-sans">
                {stat.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Signal Console Log -- replaces the old "Kelas Selesai" card. Shows the latest
          signal and re-renders automatically the instant a new one is created (driven by
          the same 1s global-stats poll as the other 3 cards). */}
      <Link
        href="/dashboard/sinyal"
        className="chamfer-sm bg-[#0f172a]/70 backdrop-blur-sm border border-white/10 p-4 relative flex flex-col justify-between h-[110px] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-200"
      >
        <div className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t border-l border-cyan-400/70" />
        <div className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b border-r border-cyan-400/70" />

        <div className="flex items-center justify-between">
          <Terminal className="text-slate-400" size={16} strokeWidth={1.5} />
          <span
            className={`text-[9px] font-bold tracking-wider ${sigIsFresh ? "text-amber-400" : "text-purple-400"}`}
          >
            {sigIsFresh ? "NEW" : "LOG"}
          </span>
        </div>

        <div className="my-1 min-w-0">
          {sig ? (
            <span
              className={`font-mono font-bold text-lg tracking-tight block truncate ${
                sigIsBuy ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {sig.pair} {sig.direction}
            </span>
          ) : (
            <span className="font-mono font-bold text-lg tracking-tight text-white/40">-- --</span>
          )}
        </div>

        <div>
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-sans truncate">
            {sig ? `Sinyal Terbaru · ${timeAgoShort(sig.created_at)}` : "Sinyal Terbaru"}
          </span>
        </div>
      </Link>
    </div>
  );
}
