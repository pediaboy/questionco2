"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { TrendingUp, TrendingDown, Lock, ArrowLeft, Cpu } from "lucide-react";

interface SignalFull {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number;
  stop_loss: number;
  take_profit: number;
  tp2: number | null;
  tp3: number | null;
  tp4: number | null;
  status: string;
  source: string;
  audience: string;
  confidence: number | null;
  reasoning: string | null;
  strategy_mode: string | null;
  created_at: string;
  closed_at: string | null;
  hit_level: string | null;
}

interface EngineLog {
  action: string;
  confidence: number | null;
  direction: string | null;
  reasoning: string | null;
  created_at: string;
}

function DetailsInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const { accessToken } = useMemberAuth();
  const [signal, setSignal] = useState<SignalFull | null>(null);
  const [logs, setLogs] = useState<EngineLog[]>([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/signal-details?id=${id}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }).then((r) => r.json());
      if (res.success) {
        setLocked(!!res.locked);
        setSignal(res.signal);
        setLogs(res.engine_logs || []);
      }
      setLoading(false);
    })();
  }, [id, accessToken]);

  if (loading) {
    return <div className="py-20 text-center text-white/30 text-xs font-mono">[ MEMUAT DETAIL SINYAL... ]</div>;
  }

  if (!signal) {
    return <div className="py-20 text-center text-white/30 text-xs font-mono">[ SINYAL TIDAK DITEMUKAN ]</div>;
  }

  if (locked) {
    return (
      <div className="py-16 text-center">
        <Lock size={28} className="text-amber-400 mx-auto mb-3" />
        <p className="text-white font-mono text-sm mb-1">
          {signal.pair} — {signal.direction}
        </p>
        <p className="text-white/40 text-xs mb-4">Detail lengkap sinyal ini khusus member VIP.</p>
        <Link href="/dashboard/upgrade" className="text-cyan-300 text-xs underline">
          Upgrade ke VIP
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/signal-history" className="text-white/40 hover:text-cyan-300 flex items-center gap-1.5 text-xs mb-6">
        <ArrowLeft size={13} /> Kembali ke Riwayat
      </Link>

      <div className="chamfer-sm border border-cyan-400/30 bg-[#0b0f18] p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-mono text-lg font-bold flex items-center gap-2">
            {signal.direction === "BUY" ? (
              <TrendingUp size={18} className="text-emerald-400" />
            ) : (
              <TrendingDown size={18} className="text-rose-400" />
            )}
            {signal.pair}
          </span>
          {signal.confidence != null && (
            <span className="text-cyan-300 font-mono text-sm font-bold">{signal.confidence}% CONFIDENCE</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div>
            <p className="text-white/30 mb-0.5">ENTRY</p>
            <p className="text-white font-mono">{signal.entry}</p>
          </div>
          <div>
            <p className="text-white/30 mb-0.5">STOP LOSS</p>
            <p className="text-rose-400 font-mono">{signal.stop_loss}</p>
          </div>
          <div>
            <p className="text-white/30 mb-0.5">TP1</p>
            <p className="text-emerald-400 font-mono">{signal.take_profit}</p>
          </div>
          <div>
            <p className="text-white/30 mb-0.5">STATUS</p>
            <p className="text-white font-mono">{signal.status.toUpperCase()}</p>
          </div>
        </div>
        {(signal.tp2 || signal.tp3 || signal.tp4) && (
          <div className="grid grid-cols-3 gap-3 text-[11px] mt-3 pt-3 border-t border-white/10">
            {signal.tp2 && (
              <div>
                <p className="text-white/30 mb-0.5">TP2</p>
                <p className="text-emerald-400/70 font-mono">{signal.tp2}</p>
              </div>
            )}
            {signal.tp3 && (
              <div>
                <p className="text-white/30 mb-0.5">TP3</p>
                <p className="text-emerald-400/70 font-mono">{signal.tp3}</p>
              </div>
            )}
            {signal.tp4 && (
              <div>
                <p className="text-white/30 mb-0.5">TP4</p>
                <p className="text-emerald-400/70 font-mono">{signal.tp4}</p>
              </div>
            )}
          </div>
        )}
        <p className="text-white/25 text-[10px] font-mono mt-3">
          Dibuat {new Date(signal.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
          {signal.closed_at && ` · Ditutup ${new Date(signal.closed_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`}
          {" · "}
          {signal.source === "auto" ? "AUTO-ENGINE" : "MANUAL"}
        </p>
      </div>

      {signal.reasoning && (
        <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-5">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu size={13} className="text-cyan-300" /> AI Reasoning
          </h3>
          <p className="text-white/60 text-[12px] leading-relaxed">{signal.reasoning}</p>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-2">
            [ ENGINE EXECUTION LOG — SEKITAR WAKTU SINYAL ]
          </h3>
          <div className="space-y-1.5">
            {logs.map((l, i) => (
              <div key={i} className="chamfer-sm border border-white/10 bg-black/30 p-2.5 text-[10px] font-mono flex items-center justify-between">
                <span className="text-white/50">
                  {new Date(l.created_at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB — {l.action}
                </span>
                {l.confidence != null && <span className="text-cyan-300">{l.confidence}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignalDetailsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-white/30 text-xs font-mono">[ MEMUAT... ]</div>}>
      <DetailsInner />
    </Suspense>
  );
}
