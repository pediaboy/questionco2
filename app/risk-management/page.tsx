"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Save, Loader2 } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

interface Settings {
  atr_sl_multiplier: number;
  rr_targets: number[];
}

export default function RiskManagementPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/engine-settings").then((r) => r.json());
    if (res.success) setSettings({ atr_sl_multiplier: res.settings.atr_sl_multiplier, rr_targets: res.settings.rr_targets });
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/engine-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atr_sl_multiplier: settings.atr_sl_multiplier, rr_targets: settings.rr_targets }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setSavedMsg("Risk parameters tersimpan — berlaku untuk sinyal auto-engine berikutnya.");
      setTimeout(() => setSavedMsg(""), 5000);
    }
  }

  function setRR(index: number, val: number) {
    if (!settings) return;
    const next = [...settings.rr_targets];
    next[index] = val;
    setSettings({ ...settings, rr_targets: next });
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
  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-white/30 text-xs font-mono">[ MEMUAT... ]</div>;
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/engine-settings" className="text-white/40 hover:text-cyan-300">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display font-bold text-white text-xl uppercase flex items-center gap-2">
          <ShieldAlert size={18} className="text-cyan-300" /> Risk Parameters
        </h1>
      </div>
      <p className="text-[11px] text-white/40 mb-6 leading-relaxed">
        SL &amp; TP dihitung real-time dari ATR(14) candle terbaru — bukan angka fixed. Parameter ini mengatur
        kelipatannya (dipakai langsung di <span className="text-cyan-300 font-mono">route.ts</span>).
      </p>

      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">ATR Stop-Loss Multiplier</span>
          <span className="text-cyan-300 font-mono font-bold">{settings.atr_sl_multiplier}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.1}
          value={settings.atr_sl_multiplier}
          onChange={(e) => setSettings({ ...settings, atr_sl_multiplier: Number(e.target.value) })}
          className="w-full accent-cyan-400"
        />
        <p className="text-[10px] text-white/30 mt-1">SL = Entry ∓ ({settings.atr_sl_multiplier} × ATR14). Makin besar, makin lebar SL-nya.</p>
      </div>

      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 p-4 mb-5">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-3">Risk:Reward Targets (TP1/TP2/TP3/TP4)</span>
        <div className="grid grid-cols-4 gap-3">
          {settings.rr_targets.map((rr, i) => (
            <div key={i}>
              <p className="text-[10px] text-white/30 mb-1">TP{i + 1}</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={0.5}
                  min={1}
                  value={rr}
                  onChange={(e) => setRR(i, Number(e.target.value))}
                  className="w-full bg-[#05080f] border border-cyan-400/25 px-2 py-1.5 text-xs text-white rounded-sm focus:outline-none focus:border-cyan-400/70"
                />
                <span className="text-white/30 text-[11px]">x</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/30 mt-2">TP{"{n}"} = Entry ± (RR{"{n}"} × jarak SL). Contoh RR 1:2/1:3/1:4/1:6 default.</p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase py-2.5 chamfer-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Simpan Risk Parameters
      </button>
      {savedMsg && <p className="text-emerald-400 text-[11px] text-center mt-2">{savedMsg}</p>}
    </div>
  );
}
