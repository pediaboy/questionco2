"use client";

import React from "react";
import Link from "next/link";
import { Lock, TrendingUp, TrendingDown } from "lucide-react";
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
        <p className="text-xs text-[#94A3B8] mt-1">Sinyal aktif dari tim analis LASTQUESTION.CO.</p>
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
            return (
              <div
                key={sig.id}
                className="chamfer-sm p-5 relative bg-[#0b0f18]/60 border border-white/10"
              >
                <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
                <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-white text-base tracking-wide">{sig.pair}</h3>
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
                <div className="relative grid grid-cols-3 gap-2 text-center">
                  {!isVip && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <Lock size={30} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    </div>
                  )}
                  <div className={!isVip ? "blur-md select-none" : ""}>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Entry</span>
                    <span className="text-white font-mono font-bold text-sm">{sig.entry}</span>
                  </div>
                  <div className={!isVip ? "blur-md select-none" : ""}>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Stop Loss</span>
                    <span className="text-rose-400 font-mono font-bold text-sm">{sig.stop_loss}</span>
                  </div>
                  <div className={!isVip ? "blur-md select-none" : ""}>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">Take Profit</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{sig.take_profit}</span>
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
