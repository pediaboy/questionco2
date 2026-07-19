"use client";

import React from "react";
import Link from "next/link";
import { Lock, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { useSignals } from "@/lib/useSignals";

export default function SinyalPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;

  const { items, isLoading, isError } = useSignals();
  const activeItems = (items || []).filter((s) => s.status === "active");

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
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-black/40 border border-white/5 chamfer-sm animate-pulse" />
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
        <div className="space-y-4">
          {activeItems.map((sig) => {
            const isBuy = sig.direction === "BUY";
            const tps = [sig.take_profit, sig.tp2, sig.tp3, sig.tp4].filter(
              (v): v is number => v !== null && v !== undefined
            );
            return (
              <div
                key={sig.id}
                className="chamfer-sm p-5 relative bg-[#0b0f18]/60 border border-white/10"
              >
                <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
                <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-white text-base tracking-wide">{sig.pair}</h3>
                    {sig.source === "auto" && (
                      <span className="flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 border text-yellow-400 border-yellow-500/40 bg-yellow-500/10">
                        <Zap size={9} /> AUTO
                      </span>
                    )}
                  </div>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold tracking-widest font-mono px-2 py-1 border ${
                      isBuy
                        ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                        : "text-rose-400 border-rose-400/40 bg-rose-400/10"
                    }`}
                  >
                    {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {sig.direction}
                  </span>
                </div>

                {/* Values */}
                <div className="relative">
                  {!isVip && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <Lock size={30} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    </div>
                  )}
                  <div className={`grid grid-cols-2 gap-2 text-center mb-2 ${!isVip ? "blur-md select-none" : ""}`}>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Entry</span>
                      <span className="text-white font-mono font-bold text-sm">{sig.entry}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">Stop Loss</span>
                      <span className="text-rose-400 font-mono font-bold text-sm">{sig.stop_loss}</span>
                    </div>
                  </div>
                  <div
                    className={`grid gap-2 text-center ${!isVip ? "blur-md select-none" : ""} ${
                      tps.length === 1 ? "grid-cols-1" : tps.length === 2 ? "grid-cols-2" : tps.length === 3 ? "grid-cols-3" : "grid-cols-4"
                    }`}
                  >
                    {tps.map((tp, i) => (
                      <div key={i}>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">TP{i + 1}</span>
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: `rgba(52, 211, 153, ${1 - i * 0.15})` }}
                        >
                          {tp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
