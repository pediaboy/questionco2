"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, Lock, Zap, Radio } from "lucide-react";
import { useSignals } from "@/lib/useSignals";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(diffMs / 60000));
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}j`;
}

export default function SignalsPage() {
  const { items, isLoading, isError } = useSignals();
  const activeItems = (items || []).filter((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ LIVE // SIGNAL FEED ]
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Trading <span className="text-cyan-300 text-glow-cyan">Signals</span>
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest border chamfer-sm px-3 py-1.5 border-cyan-400/40 text-cyan-300">
            <Radio size={11} className="animate-pulse" /> Live · Update Real-time
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-8 bg-black/30 border border-dashed border-rose-500/20 chamfer-sm">
            <span className="text-xs text-rose-400 font-mono">[ ERROR MEMUAT SINYAL ]</span>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-12 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <span className="text-xs text-slate-500 font-mono">[ TIDAK ADA SINYAL AKTIF SAAT INI ]</span>
          </div>
        ) : (
          <div className="border border-white/10 chamfer-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-white/5 text-[9.5px] uppercase tracking-wider text-white/40 font-mono">
              <span>Pair</span>
              <span>Arah</span>
              <span>Entry</span>
              <span className="text-right">Waktu</span>
            </div>
            {activeItems.map((sig) => {
              const isBuy = sig.direction === "BUY";
              const isLocked = sig.audience !== "public";
              return (
                <div
                  key={sig.id}
                  className="grid grid-cols-4 gap-2 px-3 py-3 border-t border-white/5 items-center text-[12px]"
                >
                  <span className="font-mono font-bold text-white flex items-center gap-1">
                    {sig.pair}
                    {sig.source === "auto" && <Zap size={10} className="text-amber-400" />}
                  </span>
                  <span className={`flex items-center gap-1 font-bold font-mono ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                    {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {sig.direction}
                  </span>
                  {isLocked ? (
                    <span className="col-span-1 flex items-center gap-1 text-white/25 font-mono blur-[3px] select-none">
                      <Lock size={10} /> ****.**
                    </span>
                  ) : (
                    <span className="font-mono text-white/70">{sig.entry.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  )}
                  <span className="text-right font-mono text-white/30 text-[10.5px]">{timeAgo(sig.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 mt-5 text-center">
          <Lock size={16} className="text-cyan-300 mx-auto mb-2" />
          <p className="text-white text-[12.5px] mb-3">Login untuk melihat harga entry lengkap &amp; sinyal VIP eksklusif.</p>
          <Link href="/login" className="chamfer-btn bg-cyan-400 text-black font-bold text-[11px] px-4 py-2.5 inline-block">
            [ SYSTEM LOGIN -&gt; ]
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
