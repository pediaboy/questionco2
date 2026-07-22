"use client";

/**
 * LASTQUESTION.CO :: /dashboard/backtest
 * REAL historical strategy simulation — see app/api/backtest/route.ts for the
 * full methodology note. Every number here comes from replaying the live
 * strategy function against real OKX historical candles. No random results.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, TrendingUp, TrendingDown, Play, Loader2, Lock } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";
import { C, Panel, CornerTicks, chamferMicro, fmtPrice } from "@/lib/cyberKit";

interface SimTrade {
  ts: number;
  direction: "BUY" | "SELL";
  entry: number;
  sl: number;
  tps: number[];
  outcome: string;
  pipsResult: number;
}

interface BacktestResult {
  success: boolean;
  pair: string;
  strategy: string;
  days: number;
  candlesEvaluated: number;
  totalSignals: number;
  closedSignals: number;
  openAtEndOfData: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPips: number;
  tpBreakdown: Record<string, number>;
  trades: SimTrade[];
  note: string;
  error?: string;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function BacktestPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);
  const [pairKey, setPairKey] = useState(SIGNAL_PAIRS[0].key);
  const [days, setDays] = useState<1 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBacktest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair: pairKey, days }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Backtest gagal");
      } else {
        setResult(json);
      }
    } catch {
      setError("Gagal menghubungi server backtest");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className={`mx-auto flex w-full max-w-4xl flex-col gap-5 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border" style={{ ...chamferMicro(6), borderColor: C.gold + "66", backgroundColor: C.gold + "11" }}>
            <FlaskConical size={16} style={{ color: C.gold }} strokeWidth={1.6} />
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="font-mono text-sm font-bold tracking-[0.3em] text-white md:text-base">
              BACKTEST <span style={{ color: C.gold }}>RESULTS</span>
            </h1>
            <span className="mt-1 font-mono text-[9px] tracking-[0.35em] text-slate-500">REAL OKX HISTORICAL SIMULATION</span>
          </div>
        </motion.header>

        {/* CONTROL PANEL */}
        <Panel size={12} glowColor={C.gold}>
          <CornerTicks color={C.gold} />
          <div className="flex flex-col gap-4 p-4">
            <div>
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">Pilih Pair</span>
              <div className="flex flex-wrap gap-2">
                {SIGNAL_PAIRS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPairKey(p.key)}
                    className="border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider transition-colors"
                    style={{
                      borderColor: pairKey === p.key ? C.gold : C.iron,
                      color: pairKey === p.key ? C.gold : "#94A3B8",
                      backgroundColor: pairKey === p.key ? "rgba(255,215,0,0.08)" : "transparent",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">Periode Lookback</span>
              <div className="flex gap-2">
                {[1, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d as 1 | 3)}
                    className="border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider transition-colors"
                    style={{
                      borderColor: days === d ? C.cyan : C.iron,
                      color: days === d ? C.cyan : "#94A3B8",
                      backgroundColor: days === d ? "rgba(0,240,255,0.08)" : "transparent",
                    }}
                  >
                    {d} HARI
                  </button>
                ))}
              </div>
              <span className="mt-1.5 block font-mono text-[8.5px] text-slate-600">
                Dibatasi 1-3 hari agar simulasi real-time OKX selesai dalam hitungan detik.
              </span>
            </div>
            <button
              onClick={runBacktest}
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 border px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors disabled:opacity-50"
              style={{ borderColor: C.green, color: C.green, backgroundColor: "rgba(0,255,102,0.08)" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {loading ? "MENJALANKAN SIMULASI..." : "RUN BACKTEST"}
            </button>
          </div>
        </Panel>

        {error && (
          <div className="border px-4 py-3 font-mono text-[11px]" style={{ borderColor: C.red + "55", color: C.red, backgroundColor: C.red + "0D" }}>
            [ ERROR ] {error}
          </div>
        )}

        {loading && (
          <div className="py-10 text-center font-mono text-[11px] tracking-[0.2em] text-slate-600">
            [ MENGAMBIL DATA HISTORIS OKX + MENJALANKAN STRATEGI ASLI... ]
          </div>
        )}

        {result && (
          <>
            {/* SUMMARY STATS */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "TOTAL SINYAL", value: result.totalSignals, color: C.cyan },
                { label: "WIN RATE", value: `${result.winRate}%`, color: result.winRate >= 50 ? C.green : C.red },
                { label: "TOTAL PIPS", value: `${result.totalPips >= 0 ? "+" : ""}${result.totalPips}`, color: result.totalPips >= 0 ? C.green : C.red },
                { label: "CLOSED", value: `${result.wins}W / ${result.losses}L`, color: C.gold },
              ].map((s) => (
                <Panel key={s.label} size={10}>
                  <div className="p-3">
                    <span className="block font-mono text-[8px] uppercase tracking-[0.2em] text-slate-500">{s.label}</span>
                    <span className="mt-1 block font-mono text-lg font-bold tabular-nums" style={{ color: s.color }}>
                      {s.value}
                    </span>
                  </div>
                </Panel>
              ))}
            </div>

            {/* TP BREAKDOWN */}
            <Panel size={12}>
              <CornerTicks />
              <div className="p-4">
                <span className="mb-3 block font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  Breakdown Level TP ({result.strategy === "xau_smc_liquidity_fvg_v1" ? "30/50/70/100 pips" : result.pair === "BTCUSDT" ? "150/200/500 pips (swing)" : "RR dinamis dari ATR"})
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {["tp1", "tp2", "tp3", "tp4"].map((k) => (
                    <div key={k} className="border px-2 py-2 text-center" style={{ borderColor: C.iron }}>
                      <span className="block font-mono text-[9px] uppercase text-slate-500">{k.toUpperCase()}</span>
                      <span className="block font-mono text-sm font-bold" style={{ color: C.green }}>{result.tpBreakdown[k] || 0}</span>
                    </div>
                  ))}
                </div>
                {result.openAtEndOfData > 0 && (
                  <span className="mt-3 block font-mono text-[9px] text-slate-500">
                    {result.openAtEndOfData} sinyal masih open di akhir periode data (belum resolve).
                  </span>
                )}
              </div>
            </Panel>

            {/* TRADE LIST */}
            <Panel size={12}>
              <CornerTicks />
              <div className="border-b px-4 py-2" style={{ borderColor: C.iron }}>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  RIWAYAT SINYAL SIMULASI <span className="text-slate-600">::</span> {result.pair}
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {result.trades.length === 0 ? (
                  <div className="py-8 text-center font-mono text-[10px] tracking-[0.2em] text-slate-600">
                    [ TIDAK ADA SINYAL PADA PERIODE INI — engine memang selektif ]
                  </div>
                ) : (
                  result.trades.map((t, idx) => {
                    const win = t.outcome !== "sl" && t.outcome !== "open_end_of_data";
                    const col = t.outcome === "sl" ? C.red : t.outcome === "open_end_of_data" ? C.gold : C.green;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b px-4 py-2 font-mono text-[10px]"
                        style={{ borderColor: "rgba(30,41,59,0.4)" }}
                      >
                        {t.direction === "BUY" ? (
                          <TrendingUp size={12} style={{ color: C.green }} />
                        ) : (
                          <TrendingDown size={12} style={{ color: C.red }} />
                        )}
                        <span className="text-slate-400">{fmtDate(t.ts)} @ {fmtPrice(t.entry)}</span>
                        <span className="uppercase" style={{ color: col }}>{t.outcome.replace("_", " ")}</span>
                        <span className="text-right font-bold tabular-nums" style={{ color: win ? C.green : t.outcome === "sl" ? C.red : "#94A3B8" }}>
                          {t.pipsResult >= 0 ? "+" : ""}{t.pipsResult.toFixed(1)}p
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>

            <p className="font-mono text-[8.5px] leading-relaxed text-slate-600">{result.note}</p>
          </>
        )}
      </div>

      {!isVip && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px]">
          <div className="flex h-12 w-12 items-center justify-center border border-yellow-500/50 bg-[#05080f]" style={chamferMicro(6)}>
            <Lock size={20} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-yellow-500">[ Fitur VIP ]</span>
          <button
            onClick={() => setGateOpen(true)}
            className="border border-cyan-400/40 bg-[#0b0f18]/80 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-cyan-300"
            style={chamferMicro(6)}
          >
            Upgrade untuk Akses
          </button>
        </div>
      )}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Backtest Results" />
    </main>
  );
}
