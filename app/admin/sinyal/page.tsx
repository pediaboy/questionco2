"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, RefreshCw, PlusCircle, Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

// Must exactly match SIGNAL_PAIRS keys in lib/signalPairs.ts -- the auto-signal
// cron's monitoring query matches on this EXACT string (no slash, no spaces). A
// free-text pair field previously let a stale "XAU/USD" (with slash) row get
// created, which the cron could never match -> forever "active" with zero
// TP/SL/BE monitoring or alerts. Fixed 2026-07-20 by restricting to this list.
const VALID_PAIRS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;

type Signal = {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number;
  stop_loss: number;
  take_profit: number;
  tp2?: number | null;
  tp3?: number | null;
  tp4?: number | null;
  source?: string;
  hit_level?: string | null;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "active", label: "AKTIF", color: "text-cyan-300 border-cyan-400/40 bg-cyan-400/10" },
  { value: "tp_hit", label: "TP HIT", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
  { value: "sl_hit", label: "SL HIT", color: "text-rose-400 border-rose-400/40 bg-rose-400/10" },
  { value: "closed", label: "CLOSED", color: "text-white/40 border-white/20 bg-white/5" },
];

function statusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

export default function SinyalAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/signals").then((r) => r.json());
    if (res.success) setSignals(res.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!pair.trim() || !entry || !stopLoss || !takeProfit) {
      alert("Lengkapi semua field dulu.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair,
          direction,
          entry: Number(entry),
          stop_loss: Number(stopLoss),
          take_profit: Number(takeProfit),
          status: "active",
        }),
      });
      const json = await res.json();
      if (!json.success) return alert("Gagal: " + json.error);
      setPair("");
      setDirection("BUY");
      setEntry("");
      setStopLoss("");
      setTakeProfit("");
      load();
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(sig: Signal, status: string) {
    const res = await fetch("/api/admin/signals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sig.id, status }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function editSignal(sig: Signal) {
    const pRaw = prompt(`Pair (harus salah satu: ${VALID_PAIRS.join(", ")}):`, sig.pair);
    if (pRaw === null) return;
    const p = pRaw.trim().toUpperCase();
    if (!VALID_PAIRS.includes(p as (typeof VALID_PAIRS)[number])) {
      alert(`Pair harus persis salah satu dari: ${VALID_PAIRS.join(", ")} (tanpa spasi/garis miring) -- kalau tidak, sinyal ini tidak akan pernah dipantau otomatis (TP/SL/BE) oleh cron.`);
      return;
    }
    const e = prompt("Entry:", sig.entry.toString());
    if (e === null) return;
    const sl = prompt("Stop Loss:", sig.stop_loss.toString());
    if (sl === null) return;
    const tp = prompt("Take Profit:", sig.take_profit.toString());
    if (tp === null) return;

    const res = await fetch("/api/admin/signals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sig.id,
        pair: p,
        entry: Number(e),
        stop_loss: Number(sl),
        take_profit: Number(tp),
      }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function deleteSignal(sig: Signal) {
    if (!confirm(`Hapus sinyal ${sig.pair}?`)) return;
    const res = await fetch(`/api/admin/signals?id=${sig.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
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

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-white/40 hover:text-cyan-300">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display font-bold text-white text-xl uppercase flex items-center gap-2">
            <Radio size={18} className="text-emerald-400" /> Sinyal Trading
          </h1>
        </div>
        <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <p className="text-[11px] text-white/40 mb-6 leading-relaxed">
        Sinyal baru langsung tersinkron ke halaman member{" "}
        <span className="text-cyan-300 font-mono">/dashboard/sinyal</span> (polling otomatis setiap 5 detik) —
        tidak perlu redeploy.
      </p>

      {/* Add signal form */}
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 p-4">
        <h2 className="text-white/70 text-xs font-bold tracking-wider mb-3 uppercase flex items-center gap-1.5">
          <PlusCircle size={14} className="text-cyan-300" /> Tambah Sinyal Baru
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              required
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/70 rounded-sm md:col-span-1"
            >
              <option value="">Pilih Pair</option>
              {VALID_PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "BUY" | "SELL")}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400/70 rounded-sm"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input
              type="number"
              step="any"
              placeholder="ENTRY"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
            />
            <input
              type="number"
              step="any"
              placeholder="STOP LOSS"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-[#05080f] border border-rose-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-rose-400/70 rounded-sm font-mono"
            />
            <input
              type="number"
              step="any"
              placeholder="TAKE PROFIT"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-[#05080f] border border-emerald-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/70 rounded-sm font-mono"
            />
          </div>
          <button
            disabled={creating}
            className="chamfer-btn bg-emerald-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-emerald-300 disabled:opacity-50 transition-colors"
          >
            {creating ? "MENYIMPAN..." : "PUBLISH SINYAL"}
          </button>
        </form>
      </div>

      {/* Signal list */}
      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">[ SEMUA SINYAL ]</h2>
      <div className="space-y-3">
        {signals.length === 0 && (
          <div className="text-center py-10 border border-dashed border-white/10 chamfer-sm">
            <span className="text-xs text-slate-500 font-mono">[ BELUM ADA SINYAL ]</span>
          </div>
        )}
        {signals.map((sig) => {
          const isBuy = sig.direction === "BUY";
          const meta = statusMeta(sig.status);
          return (
            <div key={sig.id} className="border border-white/10 chamfer-sm bg-[#0b0f18]/70 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-sm">{sig.pair}</span>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 border ${
                      isBuy
                        ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                        : "text-rose-400 border-rose-400/40 bg-rose-400/10"
                    }`}
                  >
                    {isBuy ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {sig.direction}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 border ${meta.color}`}>
                    {meta.label}
                  </span>
                  {sig.source === "auto" && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 border text-yellow-400 border-yellow-500/40 bg-yellow-500/10">
                      AUTO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => editSignal(sig)} className="text-cyan-300 hover:text-cyan-200">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteSignal(sig)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">Entry</span>
                  <span className="text-white font-mono font-bold text-sm">{sig.entry}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">Stop Loss</span>
                  <span className="text-rose-400 font-mono font-bold text-sm">{sig.stop_loss}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">TP1</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{sig.take_profit}</span>
                </div>
                {(sig.tp2 || sig.tp3 || sig.tp4) && (
                  <>
                    {sig.tp2 && (
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">TP2</span>
                        <span className="text-emerald-400/80 font-mono font-bold text-sm">{sig.tp2}</span>
                      </div>
                    )}
                    {sig.tp3 && (
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">TP3</span>
                        <span className="text-emerald-400/70 font-mono font-bold text-sm">{sig.tp3}</span>
                      </div>
                    )}
                    {sig.tp4 && (
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono block uppercase">TP4</span>
                        <span className="text-emerald-400/60 font-mono font-bold text-sm">{sig.tp4}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => changeStatus(sig, opt.value)}
                    className={`text-[9px] font-bold font-mono px-2 py-1 border transition-colors ${
                      sig.status === opt.value ? opt.color : "text-white/25 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
