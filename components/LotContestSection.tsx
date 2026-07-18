"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Trophy } from "lucide-react";
import { CONTEST_TIERS } from "@/lib/contestTiers";

interface PreviewItem {
  name: string;
  total_lot: number;
}

export default function LotContestSection() {
  const [leaders, setLeaders] = useState<PreviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/leaderboard-preview")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLeaders(d.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-4 py-10">
      <div className="mb-5">
        <span className="text-[10px] tracking-[0.25em] text-slate-500 font-mono uppercase block">
          [ PROTOCOL // KONTES CAPAI LOT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Trading Aktif, <span className="text-cyan-300 text-glow-cyan">Hadiah Nyata</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
          Kumpulkan volume lot dari aktivitas trading kamu dan raih hadiah eksklusif — mulai dari uang tunai
          hingga iPhone 17. Lot dihitung otomatis dari akun trading real yang sudah terverifikasi.
        </p>
      </div>

      {/* Milestone tiers */}
      <div className="chamfer bg-[#0b0f18]/70 border border-amber-400/25 p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-amber-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-amber-400/60" />
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-3 flex items-center gap-1.5">
          <Gift size={13} /> Hadiah Milestone
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CONTEST_TIERS.map((t) => (
            <div key={t.lot} className="chamfer-sm bg-black/30 border border-white/10 px-3 py-2">
              <div className="text-white font-mono font-bold text-sm">{t.lot.toLocaleString("id-ID")} Lot</div>
              <div className="text-emerald-400 text-[11px] font-semibold">{t.reward}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top trader preview */}
      {!loading && leaders.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-2 uppercase">
            [ Top Trader Saat Ini ]
          </p>
          <div className="space-y-2">
            {leaders.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-between chamfer-sm border border-[#FFD700]/25 bg-[#FFD700]/5 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 chamfer-sm bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700] font-mono font-bold text-[11px]">
                    {i === 0 ? <Trophy size={12} /> : i + 1}
                  </span>
                  <span className="text-white/80 text-[12px] font-mono">{l.name}</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-[12px]">
                  {l.total_lot.toLocaleString("id-ID")} Lot
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/register"
        className="flex items-center justify-center chamfer bg-cyan-400 text-black font-bold text-xs tracking-wider py-3 hover:bg-cyan-300 transition-colors"
      >
        GABUNG &amp; MULAI KUMPULKAN LOT
      </Link>
    </section>
  );
}
