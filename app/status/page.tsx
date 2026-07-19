"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, XCircle, AlertTriangle, Activity } from "lucide-react";

interface Check {
  name: string;
  status: "operational" | "degraded" | "down";
  latency_ms: number;
}
interface StatusData {
  overall: string;
  checked_at: string;
  checks: Check[];
  last_signal_generated_at: string | null;
}

const STATUS_META: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  operational: { icon: CheckCircle2, color: "text-emerald-400", label: "OPERATIONAL" },
  degraded: { icon: AlertTriangle, color: "text-amber-400", label: "DEGRADED" },
  down: { icon: XCircle, color: "text-rose-400", label: "DOWN" },
};

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      fetch("/api/public/system-status")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setData(d);
        })
        .finally(() => setLoading(false));
    }
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const overallMeta = data ? STATUS_META[data.overall] || STATUS_META.degraded : null;

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ SYSTEM // STATUS ]
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Status <span className="text-cyan-300 text-glow-cyan">Sistem</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">Live check tiap komponen inti platform, bukan angka historis.</p>
        </div>

        {loading || !data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : (
          <>
            <div
              className={`chamfer-sm border p-4 mb-5 text-center ${
                data.overall === "operational" ? "border-emerald-400/30" : "border-amber-400/30"
              }`}
            >
              {overallMeta && <overallMeta.icon size={22} className={`${overallMeta.color} mx-auto mb-2`} />}
              <p className="text-white font-bold text-[15px]">
                {data.overall === "operational" ? "SEMUA SISTEM NORMAL" : "ADA GANGGUAN TERDETEKSI"}
              </p>
              <p className="text-white/30 text-[10px] font-mono mt-1">
                Dicek: {new Date(data.checked_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {data.checks.map((c) => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <div key={c.name} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5 flex items-center justify-between">
                    <span className="text-white/70 text-[12.5px]">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/25 text-[10px] font-mono">{c.latency_ms}ms</span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold font-mono ${meta.color}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.last_signal_generated_at && (
              <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5 flex items-center gap-2.5">
                <Activity size={16} className="text-cyan-300" />
                <div>
                  <p className="text-white/50 text-[10.5px] uppercase tracking-wider">Sinyal Terakhir Dihasilkan</p>
                  <p className="text-white text-[12.5px] font-mono">
                    {new Date(data.last_signal_generated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
