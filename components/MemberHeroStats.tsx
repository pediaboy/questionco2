"use client";

import React from "react";
import { Trophy, LineChart, TrendingUp, TrendingDown, GraduationCap } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface HeroStatsData {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  kelas_completed: number;
}

interface MemberHeroStatsProps {
  profile: HeroStatsData;
}

export default function MemberHeroStats({ profile }: MemberHeroStatsProps) {
  const [parent] = useAutoAnimate();
  const profit = profile.profit_pips;
  const isProfitPositive = profit >= 0;

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
    {
      label: "Kelas Selesai",
      value: String(profile.kelas_completed),
      icon: GraduationCap,
      liveText: "STUDY",
      liveColor: "text-purple-400",
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
            {/* Tactical Corner Accents */}
            <div className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t border-l border-cyan-400/70" />
            <div className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b border-r border-cyan-400/70" />

            {/* Top Row: Icon & Status */}
            <div className="flex items-center justify-between">
              <IconComponent className="text-slate-400" size={16} strokeWidth={1.5} />
              <span className={`text-[9px] font-bold tracking-wider ${stat.liveColor || "text-emerald-400"}`}>
                {stat.liveText}
              </span>
            </div>

            {/* Middle: Big Value */}
            <div className="my-1">
              <span className={`font-mono font-bold text-2xl tracking-tight ${stat.valueColor || "text-white"}`}>
                {stat.value}
              </span>
            </div>

            {/* Bottom: Label */}
            <div>
              <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block font-sans">
                {stat.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
