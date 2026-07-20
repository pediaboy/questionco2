"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { BellRing, Check, Loader2, TrendingUp, TrendingDown, Inbox } from "lucide-react";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

interface NotifRow {
  id: string;
  pair: string;
  direction: string;
  confidence: number;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AlertRulesPage() {
  const { accessToken } = useMemberAuth();
  const [minConfidence, setMinConfidence] = useState(76);
  const [pairMode, setPairMode] = useState<"all" | "custom">("all");
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await fetch("/api/alert-rules", { headers: { Authorization: `Bearer ${accessToken}` } }).then((r) => r.json());
    if (res.success) {
      setMinConfidence(res.rule.min_confidence);
      setEnabled(res.rule.enabled);
      if (res.rule.pairs === "all") {
        setPairMode("all");
      } else {
        setPairMode("custom");
        setSelectedPairs(res.rule.pairs);
      }
      setNotifs(res.notifications || []);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/alert-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        min_confidence: minConfidence,
        pairs: pairMode === "all" ? "all" : selectedPairs,
        enabled,
      }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setSavedMsg("Aturan alert tersimpan.");
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  function togglePair(label: string) {
    setSelectedPairs((prev) => (prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]));
  }

  if (loading) {
    return <div className="py-16 text-center text-white/30 text-xs font-mono">[ MEMUAT ATURAN ALERT... ]</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ NOTIFICATION // ALERT RULES ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Aturan <span className="text-cyan-300 text-glow-cyan">Alert Sinyal</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Atur kapan Anda mau dikirimi notifikasi berdasarkan confidence score sinyal auto-engine.
        </p>
      </div>

      <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
            <BellRing size={14} className="text-cyan-300" /> Status Alert
          </span>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`px-3 py-1 text-[10px] font-bold uppercase chamfer-sm border ${
              enabled ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/40"
            }`}
          >
            {enabled ? "AKTIF" : "NONAKTIF"}
          </button>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/60">Minimal Confidence Score</span>
            <span className="text-cyan-300 font-mono font-bold text-sm">{minConfidence}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-[10px] text-white/30 mt-1">Hanya dapat notif untuk sinyal dengan confidence ≥ nilai ini.</p>
        </div>

        <div className="mb-5">
          <span className="text-[11px] text-white/60 block mb-2">Pair yang Dipantau</span>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPairMode("all")}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase chamfer-sm border ${
                pairMode === "all" ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/40"
              }`}
            >
              Semua Pair
            </button>
            <button
              onClick={() => setPairMode("custom")}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase chamfer-sm border ${
                pairMode === "custom" ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/40"
              }`}
            >
              Pilih Manual
            </button>
          </div>
          {pairMode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              {SIGNAL_PAIRS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => togglePair(p.label)}
                  className={`flex items-center justify-between px-3 py-2 text-[11px] chamfer-sm border ${
                    selectedPairs.includes(p.label) ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/40"
                  }`}
                >
                  {p.label}
                  {selectedPairs.includes(p.label) && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase py-2.5 chamfer-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Simpan Aturan
        </button>
        {savedMsg && <p className="text-emerald-400 text-[11px] text-center mt-2">{savedMsg}</p>}
      </div>

      <div className="mb-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block mb-2">
          [ RIWAYAT NOTIFIKASI ]
        </span>
      </div>
      {notifs.length === 0 ? (
        <div className="text-center py-10 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <Inbox size={20} className="text-white/20 mx-auto mb-2" />
          <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA NOTIFIKASI YANG COCOK ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-mono text-[12px] font-bold flex items-center gap-1.5">
                  {n.direction === "BUY" ? (
                    <TrendingUp size={12} className="text-emerald-400" />
                  ) : (
                    <TrendingDown size={12} className="text-rose-400" />
                  )}
                  {n.pair}
                </span>
                <span className="text-cyan-300 font-mono text-[11px]">{n.confidence}%</span>
              </div>
              <p className="text-white/40 text-[10px] font-mono">
                {new Date(n.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
