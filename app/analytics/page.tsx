"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, Crown, Signal, Gauge, Globe2 } from "lucide-react";

interface AnalyticsData {
  total_signals: number;
  vip_members: number;
  free_members: number;
  signals_by_pair: Record<string, number>;
  avg_institutional_confidence: number | null;
  active_market_sessions: string[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      fetch("/api/public/analytics")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setData(d);
        })
        .finally(() => setLoading(false));
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const maxPairCount = data ? Math.max(1, ...Object.values(data.signals_by_pair)) : 1;

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ PLATFORM // ANALYTICS ]
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Data <span className="text-cyan-300 text-glow-cyan">Komunitas</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">Statistik real-time platform, update tiap 5 detik.</p>
        </div>

        {loading || !data ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-3 text-center">
                <Signal size={14} className="text-cyan-300 mx-auto mb-1.5" />
                <p className="text-lg font-bold font-mono text-white">{data.total_signals}</p>
                <p className="text-[9px] text-white/40 uppercase">Total Sinyal</p>
              </div>
              <div className="chamfer-sm border border-[#FFD700]/20 bg-[#0b0f18] p-3 text-center">
                <Crown size={14} className="text-[#FFD700] mx-auto mb-1.5" />
                <p className="text-lg font-bold font-mono text-white">{data.vip_members}</p>
                <p className="text-[9px] text-white/40 uppercase">VIP Aktif</p>
              </div>
              <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 text-center">
                <Users size={14} className="text-white/60 mx-auto mb-1.5" />
                <p className="text-lg font-bold font-mono text-white">{data.free_members}</p>
                <p className="text-[9px] text-white/40 uppercase">Free Member</p>
              </div>
            </div>

            <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4">
              <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3">Sinyal per Pair</p>
              <div className="space-y-2">
                {Object.entries(data.signals_by_pair).map(([pair, count]) => (
                  <div key={pair}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/70 font-mono">{pair}</span>
                      <span className="text-white/40 font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 chamfer-sm overflow-hidden">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${(count / maxPairCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5">
                <Gauge size={14} className="text-cyan-300 mb-1.5" />
                <p className="text-white font-mono font-bold text-[15px]">
                  {data.avg_institutional_confidence ?? "-"}%
                </p>
                <p className="text-[9.5px] text-white/40 uppercase">Avg Confidence SMC</p>
              </div>
              <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5">
                <Globe2 size={14} className="text-cyan-300 mb-1.5" />
                <p className="text-white font-mono font-bold text-[12.5px]">
                  {data.active_market_sessions.join(", ") || "-"}
                </p>
                <p className="text-[9.5px] text-white/40 uppercase">Sesi Aktif</p>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
