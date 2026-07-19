"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, TrendingUp, TrendingDown, Zap, Radio, Crosshair, ShieldAlert, Target } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { useSignals } from "@/lib/useSignals";

const RR_LABELS = ["1:1", "1:2", "1:4"];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}D LALU`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}MNT LALU`;
  const hr = Math.floor(min / 60);
  return `${hr}J LALU`;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function SinyalPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;

  const { items, isLoading, isError } = useSignals();
  const activeItems = (items || []).filter((s) => s.status === "active");

  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ LIVE // SIGNAL FEED ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Sinyal <span className="text-cyan-300 text-glow-cyan">Trading</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Sinyal aktif dari tim analis &amp; sistem Auto Signal LASTQUESTION.CO.</p>

        <div className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest border chamfer-sm px-3 py-1.5 border-cyan-400/40 text-cyan-300">
          <Radio size={11} className="animate-pulse" /> Live Feed
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 bg-black/40 border border-white/5 chamfer-sm animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING SIGNALS ]</span>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a]/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ TIDAK ADA SINYAL AKTIF ]</span>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence initial={false}>
            {activeItems.map((sig) => {
              const isBuy = sig.direction === "BUY";
              const tps = [sig.take_profit, sig.tp2, sig.tp3, sig.tp4].filter(
                (v): v is number => v !== null && v !== undefined
              );
              const accent = isBuy ? "emerald" : "rose";

              return (
                <motion.div
                  key={sig.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`chamfer relative overflow-hidden bg-gradient-to-b from-[#0b0f18] to-[#080b12] border ${
                    isBuy ? "border-emerald-400/25 box-glow-emerald" : "border-rose-400/25 box-glow-rose"
                  }`}
                >
                  {/* scan-line sweep for auto/live signals */}
                  {sig.source === "auto" && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
                      <div className="scan-line" style={{ background: `linear-gradient(90deg, transparent, ${isBuy ? "#34d399" : "#fb7185"}, transparent)` }} />
                    </div>
                  )}

                  {/* corner brackets */}
                  <div className={`absolute top-[3px] left-[3px] w-3 h-3 border-t border-l ${isBuy ? "border-emerald-400/70" : "border-rose-400/70"}`} />
                  <div className={`absolute top-[3px] right-[3px] w-3 h-3 border-t border-r ${isBuy ? "border-emerald-400/70" : "border-rose-400/70"}`} />
                  <div className={`absolute bottom-[3px] left-[3px] w-3 h-3 border-b border-l ${isBuy ? "border-emerald-400/70" : "border-rose-400/70"}`} />
                  <div className={`absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r ${isBuy ? "border-emerald-400/70" : "border-rose-400/70"}`} />

                  <div className="relative p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-white text-lg tracking-wide">{sig.pair}</h3>
                        {sig.source === "auto" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 border text-yellow-400 border-yellow-500/40 bg-yellow-500/10">
                            <Zap size={9} /> AUTO
                          </span>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] font-mono px-3 py-1.5 chamfer-sm border ${
                          isBuy
                            ? "text-emerald-300 border-emerald-400/50 bg-emerald-400/10 text-glow-emerald"
                            : "text-rose-300 border-rose-400/50 bg-rose-400/10 text-glow-rose"
                        }`}
                      >
                        {isBuy ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {sig.direction}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isBuy ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`}
                      />
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                        Setup Aktif · {timeAgo(sig.created_at)}
                      </span>
                    </div>

                    {/* dashed divider */}
                    <div className={`border-t border-dashed mb-4 ${isBuy ? "border-emerald-400/20" : "border-rose-400/20"}`} />

                    {/* Values */}
                    <div className="relative">
                      {!isVip && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30 backdrop-blur-[2px]">
                          <Lock size={26} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-yellow-500/80 border border-dashed border-yellow-500/40 px-2 py-1 chamfer-sm">
                            [ ENCRYPTED — VIP ONLY ]
                          </span>
                        </div>
                      )}

                      <div className={`grid grid-cols-2 gap-2 mb-3 ${!isVip ? "blur-md select-none" : ""}`}>
                        <div className="chamfer-sm border border-cyan-400/20 bg-cyan-400/[0.03] p-2.5 text-center">
                          <span className="flex items-center justify-center gap-1 text-[8px] text-cyan-400/70 font-mono uppercase tracking-widest mb-1">
                            <Crosshair size={9} /> Entry
                          </span>
                          <span className="text-white font-mono font-bold text-sm block">{fmt(sig.entry)}</span>
                        </div>
                        <div className="chamfer-sm border border-rose-400/20 bg-rose-400/[0.03] p-2.5 text-center">
                          <span className="flex items-center justify-center gap-1 text-[8px] text-rose-400/70 font-mono uppercase tracking-widest mb-1">
                            <ShieldAlert size={9} /> Stop Loss
                          </span>
                          <span className="text-rose-400 font-mono font-bold text-sm block">{fmt(sig.stop_loss)}</span>
                        </div>
                      </div>

                      <div
                        className={`grid gap-2 ${!isVip ? "blur-md select-none" : ""} ${
                          tps.length === 1 ? "grid-cols-1" : tps.length === 2 ? "grid-cols-2" : tps.length === 3 ? "grid-cols-3" : "grid-cols-4"
                        }`}
                      >
                        {tps.map((tp, i) => (
                          <div
                            key={i}
                            className="chamfer-sm border border-emerald-400/15 bg-emerald-400/[0.02] p-2.5 text-center"
                            style={{ opacity: 1 - i * 0.08 }}
                          >
                            <span className="flex items-center justify-center gap-1 text-[8px] text-emerald-400/60 font-mono uppercase tracking-widest mb-1">
                              <Target size={9} /> TP{i + 1}
                            </span>
                            <span
                              className="font-mono font-bold text-sm block"
                              style={{ color: `rgba(52, 211, 153, ${1 - i * 0.15})` }}
                            >
                              {fmt(tp)}
                            </span>
                            {sig.source === "auto" && RR_LABELS[i] && (
                              <span className="text-[7px] font-mono text-white/25 tracking-widest block mt-0.5">RR {RR_LABELS[i]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!isVip && activeItems.length > 0 && (
        <Link
          href="/dashboard/upgrade"
          className="chamfer-btn mt-6 w-full flex items-center justify-center py-4 border border-yellow-500 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
        >
          [ UNLOCK FULL SIGNAL - UPGRADE VIP ]
        </Link>
      )}
    </div>
  );
}
