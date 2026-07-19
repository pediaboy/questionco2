"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Radio, ArrowRight } from "lucide-react";

interface PreviewItem {
  name: string;
  total_lot: number;
}

const PODIUM_STYLES = [
  {
    order: "order-2 md:order-2",
    height: "h-52",
    icon: Trophy,
    color: "#FFD700",
    ring: "border-[#FFD700]/50",
    glow: "shadow-[0_0_30px_rgba(255,215,0,0.25)]",
    label: "RANK 1",
  },
  {
    order: "order-1 md:order-1",
    height: "h-40",
    icon: Medal,
    color: "#C0C0C0",
    ring: "border-white/25",
    glow: "shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    label: "RANK 2",
  },
  {
    order: "order-3 md:order-3",
    height: "h-32",
    icon: Award,
    color: "#CD7F32",
    ring: "border-[#CD7F32]/40",
    glow: "shadow-[0_0_20px_rgba(205,127,50,0.15)]",
    label: "RANK 3",
  },
];

export default function PapanPeringkatPage() {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [lastValues, setLastValues] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/public/leaderboard-preview", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success) {
          setLastValues(items.map((i) => i.total_lot));
          setItems(json.items || []);
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const podiumOrder = [1, 0, 2];

  return (
    <div>
      {/* Title */}
      <div className="mb-6 text-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ LIVE // PAPAN PERINGKAT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Kontes <span className="text-cyan-300 text-glow-cyan">Capai Lot</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-2">Top 3 trader dengan akumulasi lot tertinggi — update otomatis.</p>

        <div
          className={`inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest border chamfer-sm px-3 py-1.5 transition-colors ${
            flash ? "border-cyan-400/60 text-cyan-300" : "border-white/15 text-white/40"
          }`}
        >
          <Radio size={11} className={flash ? "animate-pulse" : ""} /> Live Sync
        </div>
      </div>

      {loading ? (
        <div className="flex items-end justify-center gap-3 h-56">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-24 bg-black/40 border border-white/5 chamfer-sm animate-pulse h-32" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-white/10 chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ BELUM ADA DATA ]</span>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 mb-8">
            {podiumOrder.map((idx) => {
              const item = items[idx];
              if (!item) return null;
              const style = PODIUM_STYLES[idx];
              const Icon = style.icon;
              const prevVal = lastValues[idx];
              const isUp = prevVal !== undefined && item.total_lot > prevVal;

              return (
                <motion.div key={idx} layout className={`flex flex-col items-center ${style.order} w-24`}>
                  <Icon size={22} style={{ color: style.color }} className="mb-2" />
                  <span className="text-[11px] font-bold text-white/80 text-center mb-1 truncate w-full">
                    {item.name}
                  </span>
                  <motion.span
                    key={item.total_lot}
                    initial={{ opacity: 0.4, y: isUp ? 6 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-mono font-bold text-sm text-emerald-400 mb-2"
                  >
                    {item.total_lot.toLocaleString("id-ID")} Lot
                  </motion.span>
                  <div
                    className={`w-full ${style.height} chamfer-sm bg-[#0b0f18]/80 border ${style.ring} ${style.glow} flex items-start justify-center pt-3 relative overflow-hidden`}
                  >
                    <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l" style={{ borderColor: style.color }} />
                    <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r" style={{ borderColor: style.color }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Link
            href="/dashboard/kontes"
            className="flex items-center justify-center gap-2 chamfer bg-cyan-400 text-black font-bold text-xs tracking-wider py-3 hover:bg-cyan-300 transition-colors"
          >
            LIHAT SYARAT &amp; KETENTUAN <ArrowRight size={14} />
          </Link>
        </>
      )}
    </div>
  );
}
