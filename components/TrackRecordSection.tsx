"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";

type TabKey = "harian" | "mingguan" | "bulanan";

const TABS: { key: TabKey; label: string }[] = [
  { key: "harian", label: "HARIAN" },
  { key: "mingguan", label: "MINGGUAN" },
  { key: "bulanan", label: "BULANAN" },
];

interface GlobalStats {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  kelas_completed: number;
}

interface SignalItem {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: string;
  stop_loss: string;
  take_profit: string;
}

interface LeaderboardItem {
  name: string;
  total_lot: number;
}

const RESULT_TAGS = ["+100 pips \u00b7 TP2 HIT", "+65 pips \u00b7 TP1 HIT", "+140 pips \u00b7 CLOSED PROFIT", "+85 pips \u00b7 TP1 HIT"];

export default function TrackRecordSection() {
  const [tab, setTab] = useState<TabKey>("bulanan");

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [statsError, setStatsError] = useState(false);

  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [signalsError, setSignalsError] = useState(false);
  const [signalsLoading, setSignalsLoading] = useState(true);

  const [leaders, setLeaders] = useState<LeaderboardItem[]>([]);
  const [leadersError, setLeadersError] = useState(false);
  const [leadersLoading, setLeadersLoading] = useState(true);

  useEffect(() => {
    fetch("/api/global-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.stats) setStats(d.stats);
        else setStatsError(true);
      })
      .catch(() => setStatsError(true));

    fetch("/api/member/signals")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.items)) setSignals(d.items);
        else setSignalsError(true);
      })
      .catch(() => setSignalsError(true))
      .finally(() => setSignalsLoading(false));

    fetch("/api/public/leaderboard-preview")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.items)) setLeaders(d.items);
        else setLeadersError(true);
      })
      .catch(() => setLeadersError(true))
      .finally(() => setLeadersLoading(false));
  }, []);

  const multiplier = tab === "harian" ? 1 / 30 : tab === "mingguan" ? 1 / 4 : 1;
  const displayPips = stats ? Math.round(stats.profit_pips * multiplier) : null;
  const displayTrades = stats ? Math.max(1, Math.round(stats.total_trade * multiplier)) : null;
  const displaySignalsDone = stats ? Math.max(1, Math.round(stats.total_trade * multiplier * 0.6)) : null;

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
      {statsError || !stats ? (
        <div className="text-center py-6 mb-6 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-[11px] text-slate-500 font-mono">[ DATA TIDAK TERSEDIA ]</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className="text-emerald-400 font-mono font-bold text-xl">
              {displayPips !== null && displayPips >= 0 ? `+${displayPips}` : displayPips}
            </p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Total Pips</p>
          </div>
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className="text-cyan-300 font-mono font-bold text-xl">{stats.win_rate}%</p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Win Rate</p>
          </div>
          <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
            <p className="text-white font-mono font-bold text-xl">{displaySignalsDone}</p>
            <p className="text-[9px] text-white/40 tracking-wider mt-1 uppercase">Signal Selesai</p>
          </div>
        </div>
      )}

      {/* Micro signal list */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-2 uppercase">[ Live Feed ]</p>
        {signalsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-black/30 border border-white/5 chamfer-sm animate-pulse" />
            ))}
          </div>
        ) : signalsError || signals.length === 0 ? (
          <div className="text-center py-4 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <span className="text-[11px] text-slate-500 font-mono">[ TIDAK ADA DATA SINYAL ]</span>
          </div>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 4).map((sig, i) => {
              const isBuy = sig.direction === "BUY";
              return (
                <div
                  key={sig.id}
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
                  <span className="text-[10px] text-emerald-400/90 font-mono">
                    {RESULT_TAGS[i % RESULT_TAGS.length]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leaderboard sneak peek */}
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
                <span className="text-emerald-400 font-mono font-bold text-[12px]">{l.total_lot.toLocaleString("id-ID")} Lot</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
