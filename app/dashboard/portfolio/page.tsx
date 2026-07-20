"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay, ZeroDummyDisclosure } from "@/lib/cyberKit";
import CommunityActivityTicker from "@/components/CommunityActivityTicker";
import { CONTEST_TIERS, getNextTier, getProgressPercent } from "@/lib/contestTiers";
import { 
  Trophy, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Award, 
  ArrowRight,
  Layers,
  Percent,
  CheckCircle2
} from "lucide-react";

export default function PortfolioPage() {
  const router = useRouter();
  const { profile } = useMemberAuth();
  const [journalCount, setJournalCount] = useState<number | null>(null);
  const [loadingJournal, setLoadingJournal] = useState(true);

  useEffect(() => {
    async function fetchJournal() {
      try {
        const res = await fetch("/api/member/journal");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            setJournalCount(data.items.length);
          }
        }
      } catch (err) {
        console.error("Error fetching journal:", err);
      } finally {
        setLoadingJournal(false);
      }
    }
    if (profile?.is_vip) {
      fetchJournal();
    } else {
      setLoadingJournal(false);
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const isVip = profile.is_vip;

  // Real member stats
  const totalLot = profile.total_lot ?? 0;
  const winRate = profile.win_rate ?? 0;
  const profitPips = profile.profit_pips ?? 0;

  // Contest Milestone Calculations
  const nextTier = getNextTier(totalLot);
  const progressPercent = getProgressPercent(totalLot, nextTier);

  // Find completed tiers
  const completedTiersCount = CONTEST_TIERS.filter(t => totalLot >= t.lot).length;
  const currentTierIndex = CONTEST_TIERS.findIndex(t => nextTier && t.lot === nextTier.lot);
  const activeTierNum = currentTierIndex !== -1 ? currentTierIndex + 1 : CONTEST_TIERS.length;

  return (
    <div className="relative min-h-[80vh] pb-10">
      {/* Page Title & Tactical Accent */}
      <div className="relative mb-6 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4" style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
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
            [ PORTFOLIO OVERVIEW <span className="text-slate-700">//</span> SIGNAL STANDING ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Signal Portfolio
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Evaluasi keterlibatan sistem dan standing performa komunitas real-time.
        </p>
      </div>

      {/* Main Relative Container for VIP Gate */}
      <div className="relative">
        {/* Real content is blurred if not VIP */}
        <div className={`space-y-6 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          
          {/* Section: Performance & Standings Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Stat: Win Rate */}
            <Panel glowColor={C.cyan} size={10} contentClassName="p-4">
              <CornerTicks color={C.cyan} />
              <div className="flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">WIN RATE SYSTEM</span>
                  <Percent size={14} className="text-cyan-400" />
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-white">{winRate}%</span>
                </div>
                <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse rounded-full" />
                  Rasio Kemenangan Terlacak
                </span>
              </div>
            </Panel>

            {/* Stat: Net Profit Pips */}
            <Panel glowColor={profitPips >= 0 ? C.green : C.red} size={10} contentClassName="p-4">
              <CornerTicks color={profitPips >= 0 ? C.green : C.red} />
              <div className="flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">PROFIT PIPS</span>
                  {profitPips >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-500" />}
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-white">
                    {profitPips >= 0 ? `+${profitPips}` : profitPips} pips
                  </span>
                </div>
                <span className={`font-mono text-[9px] uppercase tracking-widest ${profitPips >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  Akumulasi Pips Performa Sinyal
                </span>
              </div>
            </Panel>

            {/* Stat: Documented Journal Entries */}
            <Panel glowColor={C.gold} size={10} contentClassName="p-4">
              <CornerTicks color={C.gold} />
              <div className="flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">JURNAL MANDIRI</span>
                  <BookOpen size={14} className="text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="font-mono text-3xl font-bold text-white">
                    {loadingJournal ? "..." : journalCount ?? 0}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-amber-400 uppercase tracking-widest">
                  Dokumentasi Trade Personal Anda
                </span>
              </div>
            </Panel>
          </div>

          {/* Section: Contest Progression Milestone */}
          <Panel glowColor={C.gold} size={12} contentClassName="p-5">
            <CornerTicks color={C.gold} />
            <div className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-block border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400">
                    KONTES CAPAI LOT
                  </span>
                  <h3 className="font-mono text-base font-bold text-white uppercase mt-1">
                    Progres Milestones Kontes Capai Lot
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] text-slate-400">
                    Sistem Tingkatan: <strong className="text-white">Tier {completedTiersCount === CONTEST_TIERS.length ? CONTEST_TIERS.length : activeTierNum} / {CONTEST_TIERS.length}</strong>
                  </span>
                </div>
              </div>

              {/* Progress HUD Bar */}
              <div className="relative border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-col justify-between md:flex-row font-mono text-xs mb-2 text-slate-400">
                  <span>Akumulasi Lot Real-Time: <strong className="text-cyan-400">{totalLot.toFixed(2)} Lot</strong></span>
                  {nextTier ? (
                    <span>Target Berikutnya: <strong className="text-amber-400">{nextTier.lot} Lot</strong></span>
                  ) : (
                    <span className="text-emerald-400">SEMUA TIER SELESAI 🎉</span>
                  )}
                </div>

                {/* The Bar */}
                <div className="h-3.5 w-full bg-slate-900 border border-slate-800 relative overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Grid tick overlay */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                    <span className="border-r border-slate-500 h-full w-px" />
                    <span className="border-r border-slate-500 h-full w-px" />
                    <span className="border-r border-slate-500 h-full w-px" />
                    <span className="border-r border-slate-500 h-full w-px" />
                  </div>
                </div>

                <div className="flex justify-between font-mono text-[9px] text-slate-500 mt-1.5">
                  <span>0%</span>
                  <span>{progressPercent}% PROGRES</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Active Milestone Card */}
              {nextTier ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800/60 bg-slate-950/40 p-3.5">
                  <div>
                    <span className="font-mono text-[10px] text-slate-500 block uppercase">Milestone Reward Aktif</span>
                    <span className="font-mono text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Trophy size={16} className="text-yellow-400" />
                      {nextTier.reward}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center text-left md:text-right">
                    <span className="font-mono text-[10px] text-slate-500 uppercase">Sisa Volume Lot Dibutuhkan</span>
                    <span className="font-mono text-sm font-bold text-cyan-400 mt-0.5">
                      {(nextTier.lot - totalLot).toFixed(2)} Lot Lagi
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <Award size={24} className="text-emerald-400 mx-auto mb-1.5" />
                  <p className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    Luar Biasa! Anda Telah Menyelesaikan Semua Tier Kontes
                  </p>
                </div>
              )}

              {/* All Milestone List */}
              <div className="space-y-2 pt-2">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">// ROADMAP MILESTONES</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONTEST_TIERS.map((tier, idx) => {
                    const isCompleted = totalLot >= tier.lot;
                    const isActive = nextTier && nextTier.lot === tier.lot;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between border p-2.5 font-mono text-xs ${
                          isCompleted 
                            ? "border-emerald-500/20 bg-emerald-950/10 text-slate-300" 
                            : isActive 
                            ? "border-cyan-500/40 bg-cyan-950/10 text-white" 
                            : "border-slate-800 bg-slate-950/10 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <div className={`h-2.5 w-2.5 rounded-full border shrink-0 ${isActive ? "border-cyan-400 animate-pulse bg-cyan-950" : "border-slate-700"}`} />
                          )}
                          <span>Tier {idx + 1}: <strong className={isCompleted ? "text-slate-400" : isActive ? "text-cyan-400" : "text-slate-500"}>{tier.lot} Lot</strong></span>
                        </div>
                        <span className={`font-bold ${isCompleted ? "text-emerald-500 line-through decoration-emerald-800" : isActive ? "text-amber-400" : "text-slate-600"}`}>
                          {tier.reward}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </Panel>

          {/* Section: Live Community Activity ticker (cosmetic ambient feed, see lib/communityActivityFeed.ts) */}
          <CommunityActivityTicker />

          {/* Section: Disclaimers / Community standing policies */}
          <ZeroDummyDisclosure />

        </div>

        {/* Gating Overlay for VIP members only */}
        <VipGateOverlay 
          isVip={isVip} 
          onUpgradeClick={() => router.push("/dashboard/upgrade")} 
        />
      </div>
    </div>
  );
}
