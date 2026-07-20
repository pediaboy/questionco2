"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Save, Loader2 } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

interface Settings {
  confidence_min: number;
  active_pairs: string[];
}

export default function EngineSettingsPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allPairs, setAllPairs] = useState<{ key: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/engine-settings").then((r) => r.json());
    if (res.success) {
      setSettings(res.settings);
      setAllPairs(res.all_pairs);
    }
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
      body: JSON.stringify({ confidence_min: settings.confidence_min, active_pairs: settings.active_pairs }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setSavedMsg("Konfigurasi engine tersimpan — berlaku mulai tick cron berikutnya (maks. 5 menit).");
      setTimeout(() => setSavedMsg(""), 5000);
    }
  }

  function togglePair(key: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      active_pairs: settings.active_pairs.includes(key)
        ? settings.active_pairs.filter((p) => p !== key)
        : [...settings.active_pairs, key],
    });
  }

  if (!checkedSession) return null;

  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 text-center">
        <p className="text-white/50 text-sm mb-4">Sesi admin tidak ditemukan.</p>
        <Link href="/admin" className="text-cyan-300 underline text-sm">
          Login ke Admin Panel dulu
        </Link>
      </div>
    );
  }

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center text-white/30 text-xs font-mono">[ MEMUAT... ]</div>;
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-white/40 hover:text-cyan-300">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display font-bold text-white text-xl uppercase flex items-center gap-2">
          <Cpu size={18} className="text-cyan-300" /> Engine Configuration
        </h1>
      </div>
      <p className="text-[11px] text-white/40 mb-6 leading-relaxed">
        Kontrol langsung ke <span className="text-cyan-300 font-mono">evaluateInstitutional()</span> — perubahan disini
        BENERAN mengubah perilaku sinyal auto-engine di production, dibaca ulang setiap tick cron (5 menit).
      </p>

      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Confidence Minimum</span>
          <span className="text-cyan-300 font-mono font-bold">{settings.confidence_min}%</span>
        </div>
        <input
          type="range"
          min={40}
          max={95}
          value={settings.confidence_min}
          onChange={(e) => setSettings({ ...settings, confidence_min: Number(e.target.value) })}
          className="w-full accent-cyan-400"
        />
        <p className="text-[10px] text-white/30 mt-1">
          Ambang batas sinyal fire. Sebelumnya di-tuning ke 76% via backtest OKX untuk target 4-10 sinyal/hari — turunkan
          untuk lebih sering, naikkan untuk lebih selektif.
        </p>
      </div>

      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 p-4 mb-5">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-3">Pair Aktif Dimonitor</span>
        <div className="grid grid-cols-2 gap-2">
          {allPairs.map((p) => (
            <button
              key={p.key}
              onClick={() => togglePair(p.key)}
              className={`px-3 py-2 text-[11px] chamfer-sm border ${
                settings.active_pairs.includes(p.key) ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase py-2.5 chamfer-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Simpan Konfigurasi
      </button>
      {savedMsg && <p className="text-emerald-400 text-[11px] text-center mt-2">{savedMsg}</p>}

      <div className="flex gap-3 mt-6 text-[11px]">
        <Link href="/risk-management" className="text-cyan-300 underline">Risk Parameters →</Link>
        <Link href="/strategy-editor" className="text-cyan-300 underline">Strategy Editor →</Link>
        <Link href="/system-logs" className="text-cyan-300 underline">System Logs →</Link>
      </div>
    </div>
  );
}
