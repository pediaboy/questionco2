"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, Trophy, Activity } from "lucide-react";

type TabKey = "harian" | "mingguan" | "bulanan";
const TABS: { key: TabKey; label: string }[] = [
  { key: "harian", label: "HARIAN" },
  { key: "mingguan", label: "MINGGUAN" },
  { key: "bulanan", label: "BULANAN" },
];

interface Stats {
  total_pips: number;
  win_rate: number | null;
  completed_count: number;
  wins: number;
  losses: number;
}
interface PairRow {
  pair: string;
  wins: number;
  losses: number;
  total_pips: number;
  win_rate: number | null;
}
interface EquityPoint {
  closed_at: string;
  cumulative_pips: number;
}

function EquityCurveChart({ points }: { points: EquityPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-white/20 text-[11px] font-mono">
        [ BELUM CUKUP DATA UNTUK GRAFIK ]
      </div>
    );
  }
  const values = points.map((p) => p.cumulative_pips);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p.cumulative_pips - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const zeroY = h - ((0 - min) / range) * h;
  const last = values[values.length - 1];

  return (
    <div className="relative h-32">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <line x1={0} y1={zeroY} x2={w} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} strokeDasharray="2 2" />
        <path d={path} fill="none" stroke={last >= 0 ? "#00F0FF" : "#f43f5e"} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function PerformancePage() {
  const [tab, setTab] = useState<TabKey>("bulanan");
  const [stats, setStats] = useState<Stats | null>(null);
  const [byPair, setByPair] = useState<PairRow[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/track-record?period=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.stats);
          setByPair(d.by_pair || []);
          setEquity(d.equity_curve || []);
        }
      })
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ TRACK RECORD // VERIFIED ]
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Performance <span className="text-cyan-300 text-glow-cyan">Tracking</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Statistik akurasi sinyal dihitung otomatis dari harga entry/exit real setiap sinyal yang sudah selesai.
          </p>
        </div>

        <div className="flex gap-1.5 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 chamfer-sm py-2 text-[10.5px] font-bold tracking-wider transition-colors ${
                tab === t.key ? "bg-cyan-400 text-black" : "bg-[#0b0f18] border border-white/10 text-white/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : !stats || stats.completed_count === 0 ? (
          <div className="text-center py-12 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <Activity size={22} className="text-white/20 mx-auto mb-2" />
            <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA SINYAL SELESAI PERIODE INI ]</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 text-center">
                <p className="text-[9px] tracking-widest text-white/40 uppercase mb-1">Win Rate</p>
                <p className="text-2xl font-bold font-mono text-cyan-300">{stats.win_rate ?? "-"}%</p>
              </div>
              <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 text-center">
                <p className="text-[9px] tracking-widest text-white/40 uppercase mb-1">Total Pips</p>
                <p className={`text-2xl font-bold font-mono ${stats.total_pips >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {stats.total_pips >= 0 ? "+" : ""}
                  {stats.total_pips}
                </p>
              </div>
            </div>

            <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4">
              <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3">Equity Curve (Kumulatif Pips)</p>
              <EquityCurveChart points={equity} />
            </div>

            <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4 flex items-center justify-around text-center">
              <div>
                <p className="text-emerald-400 font-mono font-bold text-lg flex items-center gap-1 justify-center">
                  <TrendingUp size={14} /> {stats.wins}
                </p>
                <p className="text-white/30 text-[10px]">TP HIT</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-rose-400 font-mono font-bold text-lg flex items-center gap-1 justify-center">
                  <TrendingDown size={14} /> {stats.losses}
                </p>
                <p className="text-white/30 text-[10px]">SL HIT</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-white font-mono font-bold text-lg flex items-center gap-1 justify-center">
                  <Trophy size={14} className="text-[#FFD700]" /> {stats.completed_count}
                </p>
                <p className="text-white/30 text-[10px]">TOTAL</p>
              </div>
            </div>

            <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-2">Per Pair</p>
            <div className="space-y-2">
              {byPair.map((p) => (
                <div key={p.pair} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex items-center justify-between">
                  <span className="text-white font-mono font-bold text-[12.5px]">{p.pair}</span>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-white/40">{p.win_rate ?? "-"}% WR</span>
                    <span className={p.total_pips >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {p.total_pips >= 0 ? "+" : ""}
                      {p.total_pips}p
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-white/25 text-[10px] text-center mt-6 leading-relaxed">
          Semua angka dihitung langsung dari harga entry/stop-loss/take-profit riil tiap sinyal, tidak ada data simulasi.
        </p>
      </main>
      <Footer />
    </div>
  );
}
