"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Coins,
  Cpu,
  User,
  Activity,
  ArrowRight,
  Database,
  RefreshCw,
  Terminal,
  Zap,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface LotEntry {
  id: string;
  pair: string;
  lot_size: number;
  price: number | null;
  direction: string;
  is_auto: boolean;
  created_at: string;
}

export default function WalletBalancePage() {
  const { accessToken, profile } = useMemberAuth();
  const [entries, setEntries] = useState<LotEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);

  const fetchLotEntries = async () => {
    if (!accessToken) return;
    try {
      setLoadingEntries(true);
      const res = await fetch("/api/member/lot-entries", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      }
    } catch (err) {
      console.error("Error fetching lot entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (accessToken && profile?.is_vip) {
      fetchLotEntries();
    } else {
      setLoadingEntries(false);
    }
  }, [accessToken, profile]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const isVip = profile.is_vip;
  const totalLot = profile.total_lot ?? 0;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative min-h-[80vh] pb-10">
      {/* Tactical HUD Header */}
      <div
        className="relative mb-6 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />

        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-cyan-400 [box-shadow:0_0_6px_#00F0FF]" />
          </span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
            [ METRIC MATRIX // VOLUMETRIC LEDGER ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Lot Wallet Ledger
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Akumulasi volume transaksi perdagangan real-time yang terhubung ke program kontes kami.
        </p>
      </div>

      <div className="relative">
        <div className={`grid grid-cols-1 gap-6 lg:grid-cols-12 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          
          {/* LEFT COLUMN: The Volumetric Wallet Display (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <Panel glowColor={C.cyan} size={14}>
              <CornerTicks color={C.cyan} />
              <div className="p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
                
                {/* Tactical grid background effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.2)_1px,transparent_1px)] bg-[size:16px_16px] opacity-25 pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Coins className="text-cyan-400 h-4 w-4" /> LOT WALLET VALUE
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400">[ LIVE TRACKING ]</span>
                  </div>

                  {/* Giant Glowing Figure */}
                  <div className="py-8 text-center relative border border-slate-900/60 bg-black/40">
                    <div className="absolute top-1 left-2 font-mono text-[8px] text-slate-600">[ METRIC: LOTS ]</div>
                    <span className="block font-mono text-5xl font-extrabold text-white tracking-wider text-glow-cyan">
                      {totalLot.toFixed(2)}
                    </span>
                    <span className="block font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-2">
                      Total Akumulasi Volume Perdagangan
                    </span>
                  </div>

                  {/* Clarifying Disclaimer Caption (CRITICAL - site zero-dummy policy) */}
                  <div className="border border-cyan-500/20 bg-cyan-950/10 p-4 font-mono text-[9px] leading-relaxed uppercase tracking-wider text-cyan-400/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Info size={12} className="shrink-0" />
                      <span>[ SPESIFIKASI METRIK DOMPET ]</span>
                    </div>
                    <p>
                      Situs LASTQUESTION.CO murni merupakan layanan penyedia sinyal & edukasi. Angka di atas mewakili volume total &apos;Lot Kontes&apos; yang berhasil dikumpulkan oleh akun trading terafiliasi Anda untuk kualifikasi hadiah kontes capai lot.
                    </p>
                    <p className="text-yellow-400/90 font-semibold border-t border-cyan-500/10 pt-1.5">
                      * INI BUKAN SALDO FINANSIAL ATAU AKUN PERTUKARAN MONETER. NILAI DI ATAS TIDAK DAPAT DITARIK SECARA TUNAI SECARA LANGSUNG KARENA BUKAN MERUPAKAN DANA DEPOSIT.
                    </p>
                  </div>
                </div>

                {/* Cyber HUD decorative status bar */}
                <div className="relative z-10 pt-4 border-t border-slate-800/80 font-mono text-[9.5px] text-slate-500 flex justify-between uppercase">
                  <span>LEDGER PROTOCOL: V14</span>
                  <span>NODE STATE: LINKED</span>
                </div>
              </div>
            </Panel>
          </div>

          {/* RIGHT COLUMN: Recent Lot Entries (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <Panel glowColor={C.cyan} size={12}>
              <CornerTicks color={C.cyan} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Database className="text-cyan-400 h-4.5 w-4.5" /> VOLUME INGESTION HISTOGRAM
                  </span>
                  <button
                    onClick={fetchLotEntries}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Refresh Ledger"
                  >
                    <RefreshCw size={11} className={loadingEntries ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="font-mono">
                  {loadingEntries ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-12 bg-black/40 border border-slate-900 animate-pulse" />
                      ))}
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="border border-dashed border-slate-800 bg-black/20 p-12 text-center text-slate-500 text-[10.5px]">
                      [ BELUM ADA DATA AKUMULASI TRANSAKSI LOT ]
                      <p className="text-[9px] text-slate-600 mt-2 uppercase">
                        Sinyal yang dideploy ke akun broker terverifikasi akan dicatat di sini secara otomatis.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-800 divide-y divide-slate-900 max-h-[420px] overflow-y-auto custom-scrollbar">
                      {entries.map((entry) => {
                        const isBuy = entry.direction.toLowerCase() === "buy";
                        return (
                          <div key={entry.id} className="p-3 bg-black/30 hover:bg-slate-900/40 flex items-center justify-between text-xs gap-3">
                            {/* Direction & Asset Pair Info */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-8 w-8 flex items-center justify-center shrink-0 border ${
                                  isBuy ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                }`}
                                style={{ clipPath: "polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)" }}
                              >
                                {isBuy ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-bold tracking-wider uppercase text-[12px]">
                                  {entry.pair}
                                </span>
                                <span className={`text-[8.5px] uppercase font-mono tracking-widest ${isBuy ? "text-emerald-400/80" : "text-rose-400/80"}`}>
                                  {entry.direction.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Execution mode: auto-engine or manual user entry */}
                            <div className="hidden sm:flex items-center gap-1 border border-slate-800 bg-black/40 px-2 py-1 text-[9px] text-slate-400">
                              {entry.is_auto ? (
                                <>
                                  <Cpu size={10} className="text-cyan-400" />
                                  <span className="tracking-widest uppercase">AUTO ENGINE</span>
                                </>
                              ) : (
                                <>
                                  <User size={10} className="text-yellow-500" />
                                  <span className="tracking-widest uppercase">MANUAL TRK</span>
                                </>
                              )}
                            </div>

                            {/* Volume Ledger Metrics */}
                            <div className="text-right flex flex-col items-end">
                              <span className="text-cyan-400 font-bold text-sm">
                                {entry.lot_size.toFixed(2)} Lots
                              </span>
                              <span className="text-slate-500 text-[9px] mt-0.5 font-mono">
                                {entry.price ? `@ ${entry.price}` : formatDate(entry.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </div>

        </div>

        {/* Vip Gate Overlay if user is not VIP */}
        {!isVip && (
          <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
        )}
      </div>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Lot Wallet Ledger" />
    </div>
  );
}
