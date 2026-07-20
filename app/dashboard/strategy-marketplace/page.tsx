"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, chamfer, chamferMicro, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  TrendingUp,
  Sliders,
  Cpu,
  Shield,
  Zap,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Layers,
  ChevronRight,
} from "lucide-react";

interface SettingsData {
  confidence_min: number;
  active_pairs: string[];
  atr_sl_multiplier: number;
  rr_targets: number[];
}

export default function StrategyMarketplacePage() {
  const { profile, loading: authLoading } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/strategy-marketplace");
        const json = await res.json();
        if (json.success) {
          setSettings(json);
        } else {
          setError(json.error || "Gagal memuat konfigurasi engine");
        }
      } catch (err) {
        setError("Gagal menghubungi server");
      } finally {
        setLoadingSettings(false);
      }
    }
    fetchSettings();
  }, []);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center font-mono text-xs tracking-widest text-slate-500 bg-[#05080f]">
        [ LOADING PROFILE... ]
      </main>
    );
  }

  const activePairs = settings?.active_pairs || [];
  const confidenceMin = settings?.confidence_min ?? 75;
  const atrMultiplier = settings?.atr_sl_multiplier ?? 1.5;

  const strategies = [
    {
      id: "institutional_smc_v3",
      name: "Institutional SMC Scalping v3",
      codeName: "SMC-V3-HYPER",
      description: "Strategi AI Institutional Scalping Trader yang hanya mengeksekusi posisi ketika terdapat high-confluence setup institusional murni. Menggunakan algoritma Smart Money Concepts (SMC) presisi tinggi untuk mendeteksi perubahan arah pasar yang kuat.",
      keyFeatures: [
        "M5 swing-based market structure (BOS & CHOCH detection).",
        "Pencarian area likuiditas (3-candle Fair Value Gaps / FVG).",
        "Deteksi Liquidity Sweeps (wick-based stop hunt on major swing levels).",
        "Evaluasi Premium & Discount Zones untuk entri diskon optimal.",
        "ADX & RSI momentum, Bollinger Bands rejection, dan CVD approximation.",
      ],
      pairs: [
        { symbol: "BTCUSDT", label: "BTC/USDT" },
        { symbol: "ETHUSDT", label: "ETH/USDT" },
        { symbol: "SOLUSDT", label: "SOL/USDT" },
      ],
      riskModel: `Risk-Reward 1:1, 1:2, dan 1:4 berdasarkan SL statis 50 pips. Jarak SL disesuaikan per instrumen menggunakan pipUnit terkalibrasi untuk menahan fluktuasi normal.`,
      confidenceWeightNote: `Menggunakan filter skor minimal konfidensi sistem (${confidenceMin}%) sebelum sinyal diijinkan untuk dirilis.`,
    },
    {
      id: "xau_aggressive_scalping",
      name: "XAU Aggressive Scalping Engine",
      codeName: "XAU-M1-AGGR",
      description: "Mesin scalping agresif khusus instrumen emas (XAUUSD) dengan fokus eksekusi sangat cepat pada timeframe M1. Mengkombinasikan berbagai pemicu momentum jangka pendek untuk menangkap volatilitas tinggi emas sebelum pergerakan besar terjadi.",
      keyFeatures: [
        "Pemicu utama wajib: Parabolic SAR (0.02 / 0.2) trend direction flip.",
        "Konfirmasi silang ganda: EMA 3 / EMA 7 fast crossover on M1 charts.",
        "Stochastic RSI (5,3,3) extreme overbought/oversold turns.",
        "Deteksi Liquidity Sweep on M3 timeframe (wick sweep beyond 10-bar fractal).",
        "Deteksi Momentum Breakout seketika (pergerakan bersih >= 25 pips on M1).",
      ],
      pairs: [
        { symbol: "XAUUSD", label: "XAU/USD" },
      ],
      riskModel: `Timeout 20 menit: Posisi otomatis dibatalkan jika target tidak tercapai dalam 20 menit demi keamanan modal dari sideways berkepanjangan. SL statis 50 pips ($5 move) dengan TP progresif.`,
      confidenceWeightNote: "Sistem agresif: Tidak dibatasi filter skor konfidensi minimum (selama pemicu wajib dan salah satu konfirmasi momentum terpenuhi, sinyal langsung dilepas).",
    },
  ];

  return (
    <main className="relative min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className={`mx-auto flex w-full max-w-6xl flex-col gap-6 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/40 pb-4 font-mono">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center border"
              style={{ borderColor: C.cyan + "66", backgroundColor: C.cyan + "11", ...chamferMicro(6) }}
            >
              <Cpu size={16} style={{ color: C.cyan }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-sm font-bold tracking-[0.3em] text-white md:text-base">
                STRATEGY <span style={{ color: C.cyan }}>MARKETPLACE</span>
              </h1>
              <span className="mt-1 text-[9px] tracking-[0.35em] text-slate-500">
                LASTQUESTION.CO {"//"} REAL-TIME TRADING ENGINES
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sliders size={12} style={{ color: C.cyan }} />
            <span className="text-[9px] tracking-[0.25em] text-slate-400">
              CONFIG MODE: READ-ONLY
            </span>
          </div>
        </header>

        {/* Global Stats bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="p-4 font-mono">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Global Min Confidence</div>
              <div className="mt-1 text-xl font-bold text-white" style={{ color: C.cyan }}>
                {loadingSettings ? "..." : `${confidenceMin}%`}
              </div>
              <div className="mt-1 text-[8px] text-slate-400">Ambang batas konfidensi SMC v3</div>
            </div>
          </Panel>
          
          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="p-4 font-mono">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">ATR Risk Multiplier</div>
              <div className="mt-1 text-xl font-bold text-white" style={{ color: C.gold }}>
                {loadingSettings ? "..." : `${atrMultiplier}x`}
              </div>
              <div className="mt-1 text-[8px] text-slate-400">Faktor risiko SL auto-signal</div>
            </div>
          </Panel>

          <Panel glowColor={C.cyan} size={10}>
            <CornerTicks color={C.cyan} />
            <div className="p-4 font-mono">
              <div className="text-[9px] uppercase tracking-widest text-slate-500">Active Trade Streams</div>
              <div className="mt-1 text-xl font-bold text-white text-emerald-400">
                {loadingSettings ? "..." : `${activePairs.length} Pairs`}
              </div>
              <div className="mt-1 text-[8px] text-slate-400">Instrumen yang sedang diawasi live</div>
            </div>
          </Panel>
        </div>

        {/* Info Box */}
        <Panel glowColor={C.cyan} size={10} className="w-full">
          <CornerTicks color={C.cyan} />
          <div className="flex flex-col gap-2 p-4 font-mono text-xs leading-relaxed text-slate-400">
            <div className="flex items-center gap-2 text-white font-bold uppercase text-[10px]">
              <Info size={14} style={{ color: C.cyan }} />
              <span>[ INFORMASI ENGINE MARKETPLACE ]</span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-400">
              Halaman ini menampilkan rincian algoritma dari dua sistem trading utama yang menggerakkan platform sinyal LASTQUESTION.CO secara otomatis. Semua parameter risiko, instrumen aktif, dan ambang batas konfidensi diambil secara langsung dari database sistem secara real-time. Status aktif/nonaktif dari instrumen masing-masing strategi dikendalikan oleh tim analis profesional kami melalui menu admin <span className="text-white">Engine Settings</span>.
            </p>
          </div>
        </Panel>

        {/* Strategy cards list */}
        <div className="flex flex-col gap-6">
          {strategies.map((strat) => {
            const hasActivePair = strat.pairs.some((p) => activePairs.includes(p.symbol));

            return (
              <Panel key={strat.id} glowColor={hasActivePair ? C.cyan : C.iron} size={14}>
                <CornerTicks color={hasActivePair ? C.cyan : C.iron} />
                <div className="p-5 md:p-6 font-mono flex flex-col gap-6">
                  
                  {/* Strategy Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/40 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 border border-cyan-500/20 bg-cyan-950/20 rounded text-cyan-400">
                          {strat.codeName}
                        </span>
                        <span className="text-[11px] tracking-widest text-slate-500">
                          {strat.id === "xau_aggressive_scalping" ? "GOLD ONLY ENGINE" : "MULTI-ASSET ENGINE"}
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-base md:text-lg font-bold tracking-wider text-white">
                        {strat.name}
                      </h2>
                    </div>

                    {/* Status Toggle (Read-Only) */}
                    <div className="flex items-center gap-3" title="Status dikelola dari Engine Settings admin">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        Status Sinyal:
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-800/80 bg-[#090d16] rounded select-none cursor-not-allowed opacity-80">
                        {hasActivePair ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">ACTIVE</span>
                            <ToggleRight className="text-emerald-400" size={18} />
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">INACTIVE</span>
                            <ToggleLeft className="text-slate-500" size={18} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Core contents */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left details (6 cols) */}
                    <div className="md:col-span-7 flex flex-col gap-4">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">[ DESKRIPSI STRATEGI ]</div>
                        <p className="mt-1 text-xs md:text-[13px] leading-relaxed text-slate-300">
                          {strat.description}
                        </p>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">[ ALGORITMA UTAMA ]</div>
                        <ul className="mt-2 flex flex-col gap-2">
                          {strat.keyFeatures.map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right stats/pairs (5 cols) */}
                    <div className="md:col-span-5 flex flex-col gap-4 border-l border-slate-800/40 md:pl-6">
                      
                      {/* Active instruments list */}
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">[ INSTRUMEN YANG TERHUBUNG ]</div>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {strat.pairs.map((p) => {
                            const isPairActive = activePairs.includes(p.symbol);
                            return (
                              <div
                                key={p.symbol}
                                className="flex items-center justify-between p-2 border border-slate-800/60 bg-[#090d16] rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronRight size={12} className={isPairActive ? "text-cyan-400" : "text-slate-600"} />
                                  <span className="text-xs font-bold text-white tracking-wider">{p.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest">
                                  {isPairActive ? (
                                    <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">LIVE ACTIVE</span>
                                  ) : (
                                    <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/20">STANDBY</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Risk parameters */}
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">[ ATURAN & PARAMETER RISIKO ]</div>
                        <div className="mt-2 p-3 border border-slate-800/60 bg-[#090d16] rounded flex flex-col gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 leading-relaxed block">
                              {strat.riskModel}
                            </span>
                          </div>
                          <div className="border-t border-slate-800/40 pt-2">
                            <span className="text-[10px] text-slate-400 italic leading-relaxed block" style={{ color: C.cyan + "dd" }}>
                              {strat.confidenceWeightNote}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Warning disclaimer */}
                  <div className="border-t border-slate-800/40 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield size={12} className="text-slate-500" />
                      <span>Sistem beroperasi 100% otomatis secara terdesentralisasi</span>
                    </span>
                    <span className="text-slate-600">Tooltip: status dikelola dari Engine Settings admin</span>
                  </div>

                </div>
              </Panel>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between font-mono text-[8.5px] tracking-[0.25em] text-slate-700">
          <span>LASTQUESTION © STRATEGY INDEX</span>
          <span>MARKETPLACE HUD v1.0 :: SYNCED</span>
        </footer>

      </div>

      {/* VIP lock overlay */}
      {!isVip && (
        <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
      )}

      {/* Upgrade modal */}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Strategy Marketplace" />
    </main>
  );
}
