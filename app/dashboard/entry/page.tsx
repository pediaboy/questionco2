"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Radio } from "lucide-react";
import { useOpenPositions } from "@/lib/useOpenPositions";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}d lalu`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}mnt lalu`;
  const hr = Math.floor(min / 60);
  return `${hr}j lalu`;
}

export default function OpenPositionsPage() {
  const { items, isLoading, isError } = useOpenPositions();
  const [, setTick] = useState(0);

  // Re-render every second so the "x detik lalu" timestamps stay live.
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ LIVE // OPEN POSISI ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1 flex items-center gap-2">
          <Activity size={18} className="text-cyan-300" /> Open Posisi <span className="text-cyan-300 text-glow-cyan">Realtime</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Aktivitas trading peserta Kontes Capai Lot yang baru saja dibuka — update otomatis.
        </p>

        <div className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest border chamfer-sm px-3 py-1.5 border-cyan-400/40 text-cyan-300">
          <Radio size={11} className="animate-pulse" /> Live Feed
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-black/40 border border-white/5 chamfer-sm animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING FEED ]</span>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a]/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ BELUM ADA AKTIVITAS ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const isBuy = item.direction === "BUY";
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="chamfer-sm bg-[#0b0f18]/70 border border-white/10 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 chamfer-sm flex items-center justify-center border ${
                        isBuy ? "border-emerald-400/40 bg-emerald-950/30" : "border-rose-400/40 bg-rose-950/30"
                      }`}
                    >
                      {isBuy ? (
                        <TrendingUp size={15} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={15} className="text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white text-[13px] font-bold">{item.name}</div>
                      <div className="text-[10px] text-white/40 font-mono flex items-center gap-1.5">
                        <span className={isBuy ? "text-emerald-400" : "text-rose-400"}>{item.direction}</span>
                        <span className="text-white/20">|</span>
                        <span>{item.pair}</span>
                        <span className="text-white/20">|</span>
                        <span>@{Number(item.price).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-cyan-300">
                      {Number(item.lot_size).toFixed(2)} Lot
                    </div>
                    <div className="text-[9.5px] text-white/30 font-mono mt-0.5">{timeAgo(item.created_at)}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
