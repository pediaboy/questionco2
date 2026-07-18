"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, UserPlus, Edit2, Trash2, RefreshCw, Zap, Bot } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

type Entry = {
  id: string;
  email: string;
  full_name: string | null;
  is_dummy: boolean;
  auto_growth: boolean;
  broker_registered: boolean;
  total_lot: number | null;
  profit_pips: number | null;
  win_rate: number | null;
  total_trade: number | null;
  role: string;
};

export default function LeaderboardAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [tickLoading, setTickLoading] = useState(false);
  const [tickMessage, setTickMessage] = useState<string | null>(null);

  // Dummy account form
  const [dName, setDName] = useState("");
  const [dLot, setDLot] = useState("0");
  const [dPips, setDPips] = useState("0");
  const [dWinRate, setDWinRate] = useState("70");
  const [dTrades, setDTrades] = useState("0");
  const [dAutoGrowth, setDAutoGrowth] = useState(true);
  const [dLoading, setDLoading] = useState(false);

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/leaderboard").then((r) => r.json());
    if (res.success) setEntries(res.entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function handleCreateDummy(e: React.FormEvent) {
    e.preventDefault();
    setDLoading(true);
    try {
      const res = await fetch("/api/admin/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: dName,
          total_lot: Number(dLot),
          profit_pips: Number(dPips),
          win_rate: Number(dWinRate),
          total_trade: Number(dTrades),
          auto_growth: dAutoGrowth,
        }),
      });
      const json = await res.json();
      if (!json.success) return alert("Gagal: " + json.error);
      setDName("");
      setDLot("0");
      setDPips("0");
      setDWinRate("70");
      setDTrades("0");
      setDAutoGrowth(true);
      load();
    } finally {
      setDLoading(false);
    }
  }

  async function editEntry(entry: Entry) {
    const name = prompt("Nama tampilan:", entry.full_name || "");
    if (name === null) return;
    const lot = prompt("Total Lot (kontes):", (entry.total_lot ?? 0).toString());
    if (lot === null) return;
    const pips = prompt("Profit / Loss (pips):", (entry.profit_pips ?? 0).toString());
    if (pips === null) return;
    const winRate = prompt("Win Rate (%):", (entry.win_rate ?? 0).toString());
    if (winRate === null) return;
    const trades = prompt("Total Trade:", (entry.total_trade ?? 0).toString());
    if (trades === null) return;

    const res = await fetch("/api/admin/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: entry.id,
        full_name: name,
        total_lot: Number(lot),
        profit_pips: Number(pips),
        win_rate: Number(winRate),
        total_trade: Number(trades),
      }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function toggleBrokerRegistered(entry: Entry) {
    const res = await fetch("/api/admin/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, broker_registered: !entry.broker_registered }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function toggleAutoGrowth(entry: Entry) {
    const res = await fetch("/api/admin/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, auto_growth: !entry.auto_growth }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function deleteDummy(entry: Entry) {
    if (!confirm(`Hapus akun dummy "${entry.full_name}"?`)) return;
    const res = await fetch(`/api/admin/leaderboard?id=${entry.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function runTickNow() {
    setTickLoading(true);
    setTickMessage(null);
    try {
      const res = await fetch("/api/cron/leaderboard-tick", {
        method: "POST",
        headers: { "x-cron-secret": "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d" },
      });
      const json = await res.json();
      if (json.skipped) {
        setTickMessage(`Dilewati: ${json.reason}`);
      } else if (json.success) {
        setTickMessage(`Berhasil — ${json.updated} akun diperbarui.`);
        load();
      } else {
        setTickMessage("Gagal: " + json.error);
      }
    } finally {
      setTickLoading(false);
    }
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
            <Trophy size={18} className="text-yellow-400" /> Leaderboard
          </h1>
        </div>
        <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Manual tick trigger */}
      <div className="border border-yellow-500/25 chamfer-sm bg-yellow-950/10 mb-8 p-4">
        <h2 className="text-yellow-400 text-xs font-bold tracking-wider mb-2 uppercase flex items-center gap-1.5">
          <Zap size={14} /> Auto-Growth Kompetisi
        </h2>
        <p className="text-[10.5px] text-white/40 mb-3 leading-relaxed">
          Sistem otomatis menambah pips secara acak untuk semua akun dengan status &quot;Auto&quot; = ON, setiap beberapa jam di hari Senin–Jumat (market forex). Weekend otomatis dilewati. Tombol di bawah ini untuk uji coba manual kapan saja.
        </p>
        {tickMessage && <div className="text-[11px] font-mono text-cyan-300 mb-2">[ {tickMessage} ]</div>}
        <button
          onClick={runTickNow}
          disabled={tickLoading}
          className="chamfer-btn bg-yellow-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          <Zap size={14} /> {tickLoading ? "MEMPROSES..." : "JALANKAN TICK SEKARANG"}
        </button>
      </div>

      {/* Add dummy account */}
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 p-4">
        <h2 className="text-white/70 text-xs font-bold tracking-wider mb-3 uppercase flex items-center gap-1.5">
          <Bot size={14} className="text-cyan-300" /> Tambah Akun Dummy
        </h2>
        <form onSubmit={handleCreateDummy} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              required
              placeholder="NAMA TAMPILAN"
              value={dName}
              onChange={(e) => setDName(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm md:col-span-1"
            />
            <input
              type="number"
              placeholder="LOT AWAL"
              value={dLot}
              onChange={(e) => setDLot(e.target.value)}
              className="w-full bg-[#05080f] border border-amber-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/70 rounded-sm font-mono"
            />
            <input
              type="number"
              placeholder="PIPS AWAL"
              value={dPips}
              onChange={(e) => setDPips(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
            />
            <input
              type="number"
              placeholder="WIN RATE %"
              value={dWinRate}
              onChange={(e) => setDWinRate(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
            />
            <input
              type="number"
              placeholder="TOTAL TRADE"
              value={dTrades}
              onChange={(e) => setDTrades(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dAutoGrowth}
                onChange={(e) => setDAutoGrowth(e.target.checked)}
                className="w-3.5 h-3.5 accent-cyan-400 bg-transparent border-cyan-400/20"
              />
              Ikutkan Auto-Growth (pips bergerak otomatis)
            </label>
            <button
              type="submit"
              disabled={dLoading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-cyan-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={14} /> {dLoading ? "MEMBUAT..." : "TAMBAH"}
            </button>
          </div>
        </form>
      </div>

      {/* Ranking table */}
      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">[ RANKING SAAT INI ]</h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="text-white/40 border-b border-cyan-400/15">
              <th className="p-3">#</th>
              <th className="p-3">Nama / Email</th>
              <th className="p-3">Tipe</th>
              <th className="p-3">Lot</th>
              <th className="p-3">Pips</th>
              <th className="p-3">Win Rate</th>
              <th className="p-3">Trade</th>
              <th className="p-3">Broker</th>
              <th className="p-3">Auto</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry.id} className="border-b border-cyan-400/10 text-white/80">
                <td className="p-3 font-mono text-white/40">{idx + 1}</td>
                <td className="p-3">
                  <div className="font-semibold text-white">{entry.full_name || "-"}</div>
                  <div className="text-[10px] text-white/30 font-mono">{entry.email}</div>
                </td>
                <td className="p-3">
                  {entry.is_dummy ? (
                    <span className="text-[9px] bg-fuchsia-950/40 border border-fuchsia-500/40 text-fuchsia-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      DUMMY
                    </span>
                  ) : (
                    <span className="text-[9px] bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      REAL
                    </span>
                  )}
                </td>
                <td className="p-3 font-mono font-bold text-amber-400">{entry.total_lot ?? 0}</td>
                <td className="p-3 font-mono">
                  <span className={(entry.profit_pips ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {(entry.profit_pips ?? 0) >= 0 ? "+" : ""}
                    {entry.profit_pips ?? 0}
                  </span>
                </td>
                <td className="p-3 font-mono text-cyan-300">{entry.win_rate ?? 0}%</td>
                <td className="p-3 font-mono text-white/60">{entry.total_trade ?? 0}</td>
                <td className="p-3">
                  {entry.is_dummy ? (
                    <span className="text-white/20 text-[10px]">-</span>
                  ) : (
                    <button
                      onClick={() => toggleBrokerRegistered(entry)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        entry.broker_registered
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border-white/20 text-white/40"
                      }`}
                    >
                      {entry.broker_registered ? "YA" : "BELUM"}
                    </button>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleAutoGrowth(entry)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      entry.auto_growth
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                        : "bg-white/5 border-white/20 text-white/40"
                    }`}
                  >
                    {entry.auto_growth ? "ON" : "OFF"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => editEntry(entry)}
                      className="text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    {entry.is_dummy && (
                      <button
                        onClick={() => deleteDummy(entry)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-white/30">
                  Belum ada data leaderboard
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
