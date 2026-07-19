"use client";

import { TrendingUp, TrendingDown, PieChart, Radio } from "lucide-react";
import { useEtf, EtfItem } from "@/lib/useEtf";
import { ETF_CATEGORIES } from "@/lib/etfList";

function formatPrice(price: number | null): string {
  if (price === null) return "-";
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(vol: number | null): string {
  if (vol === null) return "-";
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return `${vol}`;
}

function EtfCard({ item }: { item: EtfItem }) {
  const up = (item.change ?? 0) >= 0;
  return (
    <div className="chamfer-sm bg-[#0b0f18]/70 border border-white/10 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 chamfer-sm flex items-center justify-center border shrink-0 ${
            up ? "border-emerald-400/40 bg-emerald-950/30" : "border-rose-400/40 bg-rose-950/30"
          }`}
        >
          {up ? (
            <TrendingUp size={15} className="text-emerald-400" />
          ) : (
            <TrendingDown size={15} className="text-rose-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-white text-[13px] font-bold">{item.symbol}</div>
          <div className="text-[10px] text-white/40 font-mono truncate max-w-[140px]">{item.name}</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono font-bold text-sm text-cyan-300">${formatPrice(item.price)}</div>
        <div className={`text-[10px] font-mono mt-0.5 flex items-center justify-end gap-1 ${up ? "text-emerald-400" : "text-rose-400"}`}>
          <span>
            {up ? "+" : ""}
            {item.change !== null ? item.change.toFixed(2) : "-"}%
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">Vol {formatVolume(item.volume)}</span>
        </div>
      </div>
    </div>
  );
}

export default function EtfPage() {
  const { items, isLoading, isError } = useEtf();

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ LIVE // ETF TRACKER ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1 flex items-center gap-2">
          <PieChart size={18} className="text-cyan-300" /> Data <span className="text-cyan-300 text-glow-cyan">ETF</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Harga live ETF populer AS — indeks, komoditas, sektor, obligasi, dan pasar global. Gratis, update otomatis.
        </p>

        <div className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono uppercase tracking-widest border chamfer-sm px-3 py-1.5 border-cyan-400/40 text-cyan-300">
          <Radio size={11} className="animate-pulse" /> Live Feed
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-black/40 border border-white/5 chamfer-sm animate-pulse" />
          ))}
        </div>
      ) : isError || !items ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING DATA ]</span>
        </div>
      ) : (
        <div className="space-y-6">
          {ETF_CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <span className="text-[10px] tracking-[0.2em] text-slate-500 font-mono block mb-2">
                  {cat.toUpperCase()}
                </span>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <EtfCard key={item.symbol} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
