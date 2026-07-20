"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay, ZeroDummyDisclosure, GlitchText, chamferMicro } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  Coins,
  Cpu,
  User,
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Radio,
  Layers,
  CalendarClock,
  Hash,
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

const ALLOC_PALETTE = [C.cyan, C.green, C.gold, "#A78BFA", "#38BDF8", C.red, "#64748B"];

export default function WalletBalancePage() {
  const { accessToken, profile } = useMemberAuth();
  const [entries, setEntries] = useState<LotEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  const fetchLotEntries = async (silent = false) => {
    if (!accessToken) return;
    try {
      if (!silent) setLoadingEntries(true);
      const res = await fetch("/api/member/lot-entries", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
          setFlash(true);
          setTimeout(() => setFlash(false), 500);
        }
      }
    } catch (err) {
      console.error("Error fetching lot entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (!(accessToken && profile?.is_vip)) {
      setLoadingEntries(false);
      return;
    }
    fetchLotEntries();
    // house rule: 5s SWR polling on all dashboard data
    const iv = setInterval(() => fetchLotEntries(true), 5000);
    return () => clearInterval(iv);
  }, [accessToken, profile]);

  const isVip = profile?.is_vip ?? false;
  const totalLot = profile?.total_lot ?? 0;

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const lot7d = entries.filter((e) => new Date(e.created_at).getTime() >= sevenDaysAgo).reduce((s, e) => s + e.lot_size, 0);
    const autoCount = entries.filter((e) => e.is_auto).length;
    const autoPct = entries.length > 0 ? (autoCount / entries.length) * 100 : 0;

    const byPair = new Map<string, number>();
    for (const e of entries) byPair.set(e.pair, (byPair.get(e.pair) || 0) + e.lot_size);
    const totalPairLot = Array.from(byPair.values()).reduce((s, v) => s + v, 0);
    const allocation = Array.from(byPair.entries())
      .map(([pair, lot]) => ({ pair, lot, pct: totalPairLot > 0 ? (lot / totalPairLot) * 100 : 0 }))
      .sort((a, b) => b.lot - a.lot);

    return { lot7d, autoCount, autoPct, allocation };
  }, [entries]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative min-h-[80vh] pb-10">
      {/* HUD Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <GlitchText text="WALLET // VOLUMETRIC LEDGER" />
          <h2 className="mt-1.5 font-mono text-xl font-bold uppercase tracking-wider text-white md:text-2xl">
            Lot Wallet Ledger
          </h2>
          <p className="mt-1 max-w-lg font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Akumulasi volume transaksi perdagangan real-time yang terhubung ke program kontes kami.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={flash ? { opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-1.5 w-1.5"
            style={{ backgroundColor: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }}
          />
          <Radio size={12} style={{ color: C.green }} strokeWidth={1.6} />
          <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.green }}>LIVE</span>
        </div>
      </div>

      <div className="relative">
        <div className={`space-y-6 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>

          {/* Stat row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Panel glowColor={C.cyan} size={12} contentClassName="p-4">
              <CornerTicks color={C.cyan} />
              <div className="flex items-center gap-1.5">
                <Coins size={13} style={{ color: C.cyan }} strokeWidth={1.7} />
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Lot Wallet</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums" style={{ color: C.cyan }}>{totalLot.toFixed(2)}</div>
              <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-slate-600">AKUMULASI VOLUME (LOTS)</div>
            </Panel>
            <Panel glowColor={C.gold} size={12} contentClassName="p-4">
              <CornerTicks color={C.gold} />
              <div className="flex items-center gap-1.5">
                <CalendarClock size={13} style={{ color: C.gold }} strokeWidth={1.7} />
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">Lot 7 Hari Terakhir</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums" style={{ color: C.gold }}>{stats.lot7d.toFixed(2)}</div>
              <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-slate-600">VOLUME 7D ROLLING</div>
            </Panel>
            <Panel glowColor={C.green} size={12} contentClassName="p-4">
              <CornerTicks color={C.green} />
              <div className="flex items-center gap-1.5">
                <Hash size={13} style={{ color: C.green }} strokeWidth={1.7} />
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">Total Transaksi</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-bold tabular-nums" style={{ color: C.green }}>{entries.length}</div>
              <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-slate-600">
                {stats.autoCount} AUTO ENGINE • {entries.length - stats.autoCount} MANUAL
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT: Giant figure */}
            <div className="lg:col-span-5">
              <Panel glowColor={C.cyan} size={14} contentClassName="p-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
                <CornerTicks color={C.cyan} />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.2)_1px,transparent_1px)] bg-[size:16px_16px] opacity-25" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <Coins className="h-4 w-4 text-cyan-400" /> LOT WALLET VALUE
                    </span>
                    <span className="font-mono text-[9px] text-emerald-400">[ LIVE TRACKING ]</span>
                  </div>

                  <div className="relative border border-slate-900/60 bg-black/40 py-8 text-center">
                    <div className="absolute left-2 top-1 font-mono text-[8px] text-slate-600">[ METRIC: LOTS ]</div>
                    <motion.span
                      key={totalLot}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      className="block font-mono text-5xl font-extrabold tracking-wider text-white text-glow-cyan"
                    >
                      {totalLot.toFixed(2)}
                    </motion.span>
                    <span className="mt-2 block font-mono text-[9px] uppercase tracking-widest text-slate-400">
                      Total Akumulasi Volume Perdagangan
                    </span>
                  </div>

                  <ZeroDummyDisclosure />
                </div>

                <div className="relative z-10 flex justify-between border-t border-slate-800/80 pt-4 font-mono text-[9.5px] uppercase text-slate-500">
                  <span>LEDGER PROTOCOL: V14</span>
                  <span>NODE STATE: LINKED</span>
                </div>
              </Panel>
            </div>

            {/* RIGHT: Entries histogram */}
            <div className="lg:col-span-7">
              <Panel glowColor={C.cyan} size={12} contentClassName="p-5 space-y-4">
                <CornerTicks color={C.cyan} />
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                    <Database className="h-[18px] w-[18px] text-cyan-400" /> VOLUME INGESTION HISTOGRAM
                  </span>
                  <button onClick={() => fetchLotEntries()} className="text-slate-500 transition-colors hover:text-cyan-400" title="Refresh Ledger">
                    <RefreshCw size={11} className={loadingEntries ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="font-mono">
                  {loadingEntries ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse border border-slate-900 bg-black/40" />
                      ))}
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="border border-dashed border-slate-800 bg-black/20 p-12 text-center text-[10.5px] text-slate-500">
                      [ BELUM ADA DATA AKUMULASI TRANSAKSI LOT ]
                      <p className="mt-2 text-[9px] uppercase text-slate-600">
                        Sinyal yang dideploy ke akun broker terverifikasi akan dicatat di sini secara otomatis.
                      </p>
                    </div>
                  ) : (
                    <div className="custom-scrollbar max-h-[420px] divide-y divide-slate-900 overflow-y-auto border border-slate-800">
                      {entries.map((entry) => {
                        const isBuy = entry.direction.toLowerCase() === "buy";
                        return (
                          <div key={entry.id} className="flex items-center justify-between gap-3 bg-black/30 p-3 text-xs hover:bg-slate-900/40">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                                  isBuy ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                                }`}
                                style={chamferMicro(3)}
                              >
                                {isBuy ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold uppercase tracking-wider text-white">{entry.pair}</span>
                                <span className={`font-mono text-[8.5px] uppercase tracking-widest ${isBuy ? "text-emerald-400/80" : "text-rose-400/80"}`}>
                                  {entry.direction.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="hidden items-center gap-1 border border-slate-800 bg-black/40 px-2 py-1 text-[9px] text-slate-400 sm:flex">
                              {entry.is_auto ? (
                                <>
                                  <Cpu size={10} className="text-cyan-400" />
                                  <span className="uppercase tracking-widest">AUTO ENGINE</span>
                                </>
                              ) : (
                                <>
                                  <User size={10} className="text-yellow-500" />
                                  <span className="uppercase tracking-widest">MANUAL TRK</span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-col items-end text-right">
                              <span className="text-sm font-bold text-cyan-400">{entry.lot_size.toFixed(2)} Lots</span>
                              <span className="mt-0.5 font-mono text-[9px] text-slate-500">
                                {entry.price ? `@ ${entry.price}` : formatDate(entry.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>

          {/* Allocation distribution -- real lot volume contribution per pair */}
          {stats.allocation.length > 0 && (
            <Panel glowColor={C.gold} size={14} contentClassName="p-4">
              <CornerTicks color={C.gold} />
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400 flex items-center gap-1.5">
                  <Layers size={13} style={{ color: C.gold }} strokeWidth={1.7} />
                  Kontribusi Volume per Pair
                </span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-slate-500">{stats.allocation.length} PAIR</span>
              </div>
              <div className="mt-3 flex h-4 w-full overflow-hidden" style={chamferMicro(3)}>
                {stats.allocation.map((a, i) => (
                  <motion.div
                    key={a.pair}
                    className="h-full"
                    style={{ backgroundColor: ALLOC_PALETTE[i % ALLOC_PALETTE.length] }}
                    animate={{ width: `${a.pct}%` }}
                    transition={{ duration: 0.5 }}
                    title={`${a.pair}: ${a.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {stats.allocation.map((a, i) => (
                  <div key={a.pair} className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2" style={{ backgroundColor: ALLOC_PALETTE[i % ALLOC_PALETTE.length] }} />
                    <span className="font-mono text-[8px] tracking-[0.12em] text-slate-500">
                      {a.pair} {a.pct.toFixed(1)}% ({a.lot.toFixed(2)} lot)
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {!isVip && <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />}
      </div>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Lot Wallet Ledger" />
    </div>
  );
}
