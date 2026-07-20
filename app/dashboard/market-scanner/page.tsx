"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, chamfer, chamferMicro, fmtPrice, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { Activity, Radio, Cpu, TrendingUp, TrendingDown, RefreshCw, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface ScannerResult {
  key: string;
  label: string;
  instId: string;
  latestPrice?: number;
  priorHigh?: number;
  priorLow?: number;
  breakoutStatus?: "BREAKOUT_UP" | "BREAKOUT_DOWN" | "RANGING";
  lastEma9?: number;
  lastEma21?: number;
  isEmaBullCross?: boolean;
  isEmaBearCross?: boolean;
  currentEmaTrend?: "up" | "down" | "flat";
  levelTested?: number;
  levelTestedType?: "HIGH" | "LOW";
  lastUpdated?: number;
  error?: string;
}

export default function MarketScannerPage() {
  const { profile, loading } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // Scanner polling state
  const [scannerData, setScannerData] = useState<ScannerResult[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<number | null>(null);

  const fetchScannerData = async () => {
    if (isPolling) return;
    setIsPolling(true);
    try {
      const res = await fetch("/api/market-scanner", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setScannerData(json.data);
          setLastPollTime(Date.now());
        }
      }
    } catch (err) {
      console.error("Error polling scanner data:", err);
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchScannerData();

    // Poll every 10s
    const interval = setInterval(fetchScannerData, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center font-mono text-xs tracking-widest text-slate-500 bg-[#05080f]">
        [ LOADING PROFILE... ]
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className={`mx-auto flex w-full max-w-6xl flex-col gap-6 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center border"
              style={{ borderColor: C.cyan + "66", backgroundColor: C.cyan + "11", ...chamferMicro(6) }}
            >
              <Cpu size={16} style={{ color: C.cyan }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-mono text-sm font-bold tracking-[0.3em] text-white md:text-base">
                MARKET <span style={{ color: C.cyan }}>SCANNER</span>
              </h1>
              <span className="mt-1 font-mono text-[9px] tracking-[0.35em] text-slate-500">
                LASTQUESTION.CO {"//"} REAL-TIME BREAKOUT SCANNER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchScannerData}
              disabled={isPolling}
              className="flex items-center gap-1.5 border border-slate-800 bg-black/40 px-3 py-1 font-mono text-[9px] tracking-widest text-slate-400 hover:border-cyan-400/40 hover:text-white transition-all disabled:opacity-50"
              style={chamferMicro(4)}
            >
              <RefreshCw size={10} className={isPolling ? "animate-spin" : ""} />
              {isPolling ? "POLLING..." : "REFRESH"}
            </button>
            <div className="flex items-center gap-2">
              <Radio size={12} style={{ color: C.green }} strokeWidth={2} />
              <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.green }}>
                SCANNER ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Status Row */}
        {lastPollTime && (
          <div className="font-mono text-[9px] text-slate-500 text-right leading-none uppercase tracking-widest">
            UPDATE TERAKHIR: {new Date(lastPollTime).toLocaleTimeString("id-ID")}
          </div>
        )}

        {/* Scanner Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {scannerData.length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Panel key={idx} glowColor={C.iron} size={12} className="h-48" contentClassName="flex flex-col p-4 justify-center items-center">
                <CornerTicks color={C.iron} />
                <div className="font-mono text-[10px] tracking-widest text-slate-600">
                  [ SCANNING ENGINE... ]
                </div>
              </Panel>
            ))
          ) : (
            scannerData.map((pair) => {
              if (pair.error) {
                return (
                  <Panel key={pair.key} glowColor={C.red} size={12} className="h-48" contentClassName="flex flex-col p-4 justify-between">
                    <CornerTicks color={C.red} />
                    <div className="font-mono text-xs font-bold text-white">{pair.label}</div>
                    <div className="font-mono text-[10px] text-red-400 tracking-wider">
                      ERROR: {pair.error}
                    </div>
                  </Panel>
                );
              }

              const isBreakoutUp = pair.breakoutStatus === "BREAKOUT_UP";
              const isBreakoutDown = pair.breakoutStatus === "BREAKOUT_DOWN";
              const isRanging = pair.breakoutStatus === "RANGING";

              const badgeColor = isBreakoutUp ? C.green : isBreakoutDown ? C.red : C.iron;
              const badgeText = isBreakoutUp ? "BREAKOUT UP" : isBreakoutDown ? "BREAKOUT DOWN" : "RANGING";

              const emaTrendColor = pair.currentEmaTrend === "up" ? C.green : pair.currentEmaTrend === "down" ? C.red : "white";

              return (
                <Panel key={pair.key} glowColor={isBreakoutUp ? C.green : isBreakoutDown ? C.red : C.cyan} size={12} contentClassName="flex flex-col p-5 justify-between">
                  <CornerTicks color={isBreakoutUp ? C.green : isBreakoutDown ? C.red : C.cyan} />
                  
                  {/* Pair Name */}
                  <div className="flex items-center justify-between font-mono">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold tracking-wider text-white">{pair.label}</span>
                      <span className="text-[7.5px] tracking-widest text-slate-500">OKX: {pair.instId}</span>
                    </div>
                    {/* Status Badge */}
                    <div
                      className="px-2 py-0.5 font-mono text-[7.5px] font-bold tracking-widest border"
                      style={{
                        borderColor: badgeColor + "aa",
                        backgroundColor: badgeColor + "15",
                        color: isRanging ? "#94a3b8" : badgeColor,
                        ...chamferMicro(4),
                      }}
                    >
                      {badgeText}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="my-3 font-mono">
                    <span className="text-xl font-bold tracking-wider text-white">
                      ${fmtPrice(pair.latestPrice || 0)}
                    </span>
                    <div className="text-[7.5px] tracking-widest text-slate-500">HARGA CLOSED (1M)</div>
                  </div>

                  {/* Tested Levels */}
                  <div className="mb-3 border-y border-slate-900/60 py-2.5 flex flex-col gap-1 font-mono text-[9px] text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-500">20M HIGH:</span>
                      <span className="text-slate-300 font-semibold">${fmtPrice(pair.priorHigh || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">20M LOW:</span>
                      <span className="text-slate-300 font-semibold">${fmtPrice(pair.priorLow || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900/60 pt-1.5">
                      <span className="text-slate-500">TES LEVEL:</span>
                      <span className="font-bold text-white uppercase flex items-center gap-1">
                        <span style={{ color: pair.levelTestedType === "HIGH" ? C.green : C.red }}>
                          {pair.levelTestedType}
                        </span>
                        <span>(${fmtPrice(pair.levelTested || 0)})</span>
                      </span>
                    </div>
                  </div>

                  {/* Indicator cross and EMA Info */}
                  <div className="font-mono text-[8.5px] text-slate-400 flex flex-col gap-1 leading-none">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TREN EMA:</span>
                      <span className="font-bold uppercase" style={{ color: emaTrendColor }}>
                        {pair.currentEmaTrend === "up" ? "BULLISH" : pair.currentEmaTrend === "down" ? "BEARISH" : "RANGING"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">EMA SIGNALS:</span>
                      {pair.isEmaBullCross ? (
                        <span style={{ color: C.green }} className="font-bold">EMA GOLD CROSS</span>
                      ) : pair.isEmaBearCross ? (
                        <span style={{ color: C.red }} className="font-bold">EMA DEAD CROSS</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </div>

                </Panel>
              );
            })
          )}
        </div>

        {/* Info panel */}
        <Panel glowColor={C.cyan} size={10} className="w-full">
          <CornerTicks color={C.cyan} />
          <div className="flex flex-col gap-2 p-4 font-mono text-xs leading-relaxed text-slate-400">
            <div className="flex items-center gap-2 text-white">
              <Layers size={14} style={{ color: C.cyan }} />
              <span className="text-[10px] font-bold uppercase tracking-wider">[ ANALISIS SCANNER BREAKOUT ]</span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-400">
              Sistem ini memantau candlestick 1 menit (1M) dari bursa OKX untuk mendeteksi breakout. Ketika harga melewati batas
              tertinggi dari 20 lilin terakhir (20M High), sinyal <span style={{ color: C.green }}>BREAKOUT UP</span> aktif. Jika melewati
              batas terendah (20M Low), sinyal <span style={{ color: C.red }}>BREAKOUT DOWN</span> aktif. Indikator persilangan EMA9 dan EMA21
              menampilkan persilangan emas (Gold Cross) atau persilangan maut (Dead Cross) untuk membantu konfirmasi momentum.
            </p>
          </div>
        </Panel>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between font-mono text-[8.5px] tracking-[0.25em] text-slate-700">
          <span>LASTQUESTION © SCANNER ENGINE</span>
          <span>CYBERPUNK ENGINE v1.2 :: LIVE</span>
        </footer>
      </div>

      {/* VIP lock overlay */}
      {!isVip && (
        <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
      )}

      {/* Upgrade modal */}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Market Scanner" />
    </main>
  );
}
