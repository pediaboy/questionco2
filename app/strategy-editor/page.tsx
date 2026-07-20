"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Save, Loader2 } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

interface FactorWeights {
  trend: number; structure: number; orderBlock: number; fvg: number; liquiditySweep: number;
  zone: number; vwap: number; macd: number; rsi: number; adx: number; volume: number; cvd: number; bollinger: number;
}

const FACTOR_LABELS: Record<keyof FactorWeights, string> = {
  trend: "Trend (EMA 20/50/200)",
  structure: "Market Structure (BOS/CHOCH)",
  orderBlock: "Order Block",
  fvg: "Fair Value Gap (FVG)",
  liquiditySweep: "Liquidity Sweep",
  zone: "Premium/Discount Zone",
  vwap: "VWAP",
  macd: "MACD Cross",
  rsi: "RSI Zone",
  adx: "ADX Strength",
  volume: "Relative Volume",
  cvd: "CVD (Approx)",
  bollinger: "Bollinger Reject",
};

export default function StrategyEditorPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [weights, setWeights] = useState<FactorWeights | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/engine-settings").then((r) => r.json());
    if (res.success) setWeights(res.settings.factor_weights);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const total = weights ? Object.values(weights).reduce((s, v) => s + v, 0) : 0;

  function setWeight(key: keyof FactorWeights, val: number) {
    if (!weights) return;
    setWeights({ ...weights, [key]: val });
  }

  async function save() {
    if (!weights) return;
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/engine-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factor_weights: weights }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setSavedMsg("Bobot confluence tersimpan — langsung dipakai di formula weighted-sum confidence.");
      setTimeout(() => setSavedMsg(""), 5000);
    }
  }

  if (!checkedSession) return null;
  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 text-center">
        <p className="text-white/50 text-sm mb-4">Sesi admin tidak ditemukan.</p>
        <Link href="/admin" className="text-cyan-300 underline text-sm">Login ke Admin Panel dulu</Link>
      </div>
    );
  }
  if (!weights) {
    return <div className="min-h-screen flex items-center justify-center text-white/30 text-xs font-mono">[ MEMUAT... ]</div>;
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/engine-settings" className="text-white/40 hover:text-cyan-300">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display font-bold text-white text-xl uppercase flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-cyan-300" /> Strategy Editor
        </h1>
      </div>
      <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
        Ini bukan editor rule bebas — 2 hard-gate (Trend &amp; Structure alignment) tetap wajib match sebelum apapun
        dihitung. Yang bisa diatur disini adalah <span className="text-cyan-300">bobot 13 faktor confluence</span> dalam
        formula weighted-sum confidence. Total bobot idealnya = 1.0.
      </p>
      <p className={`text-[11px] mb-6 font-mono ${Math.abs(total - 1) < 0.005 ? "text-emerald-400" : "text-amber-400"}`}>
        Total bobot saat ini: {total.toFixed(3)} {Math.abs(total - 1) < 0.005 ? "✓" : "(idealnya persis 1.000)"}
      </p>

      <div className="space-y-4 mb-6">
        {(Object.keys(weights) as (keyof FactorWeights)[]).map((key) => (
          <div key={key} className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-white/70">{FACTOR_LABELS[key]}</span>
              <span className="text-cyan-300 font-mono text-xs">{(weights[key] * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.3}
              step={0.005}
              value={weights[key]}
              onChange={(e) => setWeight(key, Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase py-2.5 chamfer-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Simpan Bobot Strategi
      </button>
      {savedMsg && <p className="text-emerald-400 text-[11px] text-center mt-2">{savedMsg}</p>}
    </div>
  );
}
