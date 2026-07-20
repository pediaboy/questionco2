"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrendingUp, TrendingDown, Lock, CheckCircle2, XCircle, Clock } from "lucide-react";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";
import { supabase } from "@/lib/supabaseClient";

interface SignalRow {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  status: string;
  source: string;
  audience: string;
  confidence: number | null;
  created_at: string;
  locked?: boolean;
}

const STATUS_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; label: string }> = {
  active: { icon: Clock, color: "text-cyan-300", label: "AKTIF" },
  tp_hit: { icon: CheckCircle2, color: "text-emerald-400", label: "TP HIT" },
  sl_hit: { icon: XCircle, color: "text-rose-400", label: "SL HIT" },
  closed: { icon: Clock, color: "text-white/40", label: "CLOSED" },
};

export default function SignalHistoryPage() {
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairFilter, setPairFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isVip, setIsVip] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || null;
    const params = new URLSearchParams();
    if (pairFilter) params.set("pair", pairFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/signal-history?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.json());
    if (res.success) {
      setSignals(res.signals);
      setIsVip(res.is_vip);
    }
    setLoading(false);
  }, [pairFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-4xl mx-auto px-5 py-10">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ ARCHIVE // SIGNAL HISTORY ]
        </span>
        <h1 className="text-2xl font-bold font-display text-white mt-1 mb-2">
          Riwayat <span className="text-cyan-300 text-glow-cyan">Sinyal Trading</span>
        </h1>
        <p className="text-xs text-[#94A3B8] mb-6">
          Log historis seluruh sinyal (manual &amp; auto-engine) beserta hasil akhirnya. Sinyal VIP ditampilkan terkunci untuk non-member.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="bg-[#0b0f18] border border-white/10 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-cyan-400/50"
          >
            <option value="">Semua Pair</option>
            {SIGNAL_PAIRS.map((p) => (
              <option key={p.key} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0b0f18] border border-white/10 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-cyan-400/50"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="tp_hit">TP Hit</option>
            <option value="sl_hit">SL Hit</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-14 bg-black/30 border border-dashed border-white/10 chamfer-sm">
            <span className="text-[11px] text-slate-500 font-mono">[ TIDAK ADA SINYAL DITEMUKAN ]</span>
          </div>
        ) : (
          <div className="space-y-2">
            {signals.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META.active;
              const Icon = meta.icon;
              const locked = s.locked;
              return (
                <Link
                  key={s.id}
                  href={locked ? "/vip" : `/signal-details?id=${s.id}`}
                  className={`block chamfer-sm border border-white/10 bg-[#0b0f18] p-4 relative overflow-hidden ${
                    locked ? "opacity-80" : "hover:border-cyan-400/40 transition-colors"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white font-mono text-[13px] font-bold flex items-center gap-1.5">
                      {s.direction === "BUY" ? (
                        <TrendingUp size={13} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={13} className="text-rose-400" />
                      )}
                      {s.pair}
                      {s.audience === "vip" && (
                        <span className="text-[9px] px-1.5 py-0.5 border border-amber-400/40 text-amber-400 rounded-sm ml-1">VIP</span>
                      )}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold font-mono ${meta.color}`}>
                      <Icon size={11} /> {meta.label}
                    </span>
                  </div>
                  {locked ? (
                    <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
                      <Lock size={11} /> Entry &amp; hasil terkunci — khusus member VIP
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/50">Entry: {s.entry}</span>
                      {s.confidence != null && <span className="text-cyan-300 font-mono">{s.confidence}% confidence</span>}
                    </div>
                  )}
                  <p className="text-white/25 text-[10px] font-mono mt-1.5">
                    {new Date(s.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB · {s.source === "auto" ? "AUTO-ENGINE" : "MANUAL"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
        {!isVip && (
          <div className="mt-6 text-center">
            <Link href="/vip" className="text-cyan-300 text-xs underline">
              Upgrade ke VIP untuk buka semua entry &amp; detail sinyal
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
