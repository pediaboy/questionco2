"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";

type TabKey = "harian" | "mingguan" | "bulanan";

const TABS: { key: TabKey; label: string }[] = [
  { key: "harian", label: "HARIAN" },
  { key: "mingguan", label: "MINGGUAN" },
  { key: "bulanan", label: "BULANAN" },
];

interface TrackRecordStats {
  total_pips: number;
  win_rate: number | null;
  completed_count: number;
  wins: number;
  losses: number;
}

interface RecentSignal {
  pair: string;
  direction: "BUY" | "SELL";
  status: string;
  pips: number;
}

interface LeaderboardItem {
  name: string;
  total_lot: number;
}

export default function TrackRecordSection() {
  const [tab, setTab] = useState<TabKey>("bulanan");

  const [stats, setStats] = useState<TrackRecordStats | null>(null);
  const [recent, setRecent] = useState<RecentSignal[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [leadersError, setLeadersError] = useState(false);
  const [leadersLoading, setLeadersLoading] = useState(true);

  useEffect(() => {
    setStatsLoading(true);
    fetch(`/api/public/track-record?period=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.stats);
          setRecent(d.recent || []);
          setStatsError(false);
        } else {
          setStatsError(true);
        }
      })
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }, [tab]);

  useEffect(() => {
    fetch("/api/public/leaderboard-preview")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.items)) setLeaders(d.items);
        else setLeadersError(true);
      })
      .catch(() => setLeadersError(true))
      .finally(() => setLeadersLoading(false));
  }, []);

  return (
    <section id="track-record" className="px-5 py-14">
      <div className="text-center mb-6">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2">
          [ TRANSPARENCY_LOG ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          Riwayat Signal <span className="text-cyan-300 text-glow-cyan">Transparan.</span>
        </h2>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 mb-6">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-mono text-[10px] font-bold tracking-widest py-2 chamfer-sm border transition-all ${
                active
                  ? "border-cyan-400 text-cyan-300 bg-cyan-950/30"
                  : "border-white/10 text-slate-500 bg-black/30"
              }`}
            >
              [ {t.label} ]
            </button>
          );
        })}
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 h-[62px] animate-pulse" />
          ))}
        </div>
      ) : statsError || !stats ? (
        <div className="text-center py-6 mb-6 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-[11px] text-slate-500 font-mono">[ DATA TIDAK TERSEDIA ]</span>
        </div>
      ) : stats.completed_count === 0 ? (
        <div className="text-center py-6 mb-6 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-[11px] text-slate-500 font-mono">
            [ BELUM ADA SINYAL SELESAI PERIODE INI ]
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className={`font-mono font-bold text-xl ${stats.total_pips >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {stats.total_pips >= 0 ? `+${stats.total_pips}` : stats.total_pips}
            </p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Total Pips</p>
          </div>
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className="text-cyan-300 font-mono font-bold text-xl">
              {stats.win_rate !== null ? `${stats.win_rate}%` : "--"}
            </p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Win Rate</p>
          </div>
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className="text-white font-mono font-bold text-xl">{stats.completed_count}</p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Signal Selesai</p>
          </div>
        </div>
      )}

      {/* Micro signal list -- real completed signals with real computed pip result */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-2 uppercase">[ Live Feed ]</p>
        {statsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-black/30 border border-white/5 chamfer-sm animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-4 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <span className="text-[11px] text-slate-500 font-mono">[ TIDAK ADA DATA SINYAL ]</span>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((sig, i) => {
              const isBuy = sig.direction === "BUY";
              const isWin = sig.status === "tp_hit";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between chamfer-sm border border-white/10 bg-[#0b0f18] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 border ${
                        isBuy
                          ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                          : "text-rose-400 border-rose-400/40 bg-rose-400/10"
                      }`}
                    >
                      {isBuy ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {sig.direction}
                    </span>
                    <span className="text-white/80 text-[11px] font-mono">{sig.pair}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isWin ? "text-emerald-400/90" : "text-rose-400/90"}`}>
                    {sig.pips >= 0 ? `+${sig.pips}` : sig.pips} pips · {sig.status === "closed" ? "CLOSED" : sig.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard sneak peek -- real Kontes Capai Lot data (lot volume, not pips) */}
      <div>
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-2 uppercase">
          [ Kontes Capai Lot &mdash; Top Trader ]
        </p>
        {leadersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-black/30 border border-white/5 chamfer-sm animate-pulse" />
            ))}
          </div>
        ) : leadersError || leaders.length === 0 ? (
          <div className="text-center py-4 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA DATA LEADERBOARD ]</span>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-between chamfer-sm border border-[#FFD700]/25 bg-[#FFD700]/5 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 chamfer-sm bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700] font-mono font-bold text-[11px]">
                    {i === 0 ? <Trophy size={12} /> : i + 1}
                  </span>
                  <span className="text-white/80 text-[12px] font-mono">{l.name}</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-[12px]">
                  {l.total_lot.toLocaleString("id-ID")} Lot
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
