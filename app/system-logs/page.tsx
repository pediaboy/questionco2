"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Terminal, RefreshCw, Search } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

interface LogRow {
  id: string;
  pair: string;
  action: string;
  confidence: number | null;
  direction: string | null;
  reasoning: string | null;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  created: "text-emerald-400",
  no_trigger: "text-white/40",
  monitoring: "text-cyan-300",
  closed: "text-amber-400",
  timeout: "text-amber-400",
  error: "text-rose-400",
  skipped_weekend: "text-white/25",
};

export default function SystemLogsPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairFilter, setPairFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (pairFilter) params.set("pair", pairFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/system-logs?${params.toString()}`).then((r) => r.json());
    if (res.success) setLogs(res.logs);
    setLoading(false);
  }, [pairFilter, actionFilter, q]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  if (!checkedSession) return null;
  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 text-center">
        <p className="text-white/50 text-sm mb-4">Sesi admin tidak ditemukan.</p>
        <Link href="/admin" className="text-cyan-300 underline text-sm">Login ke Admin Panel dulu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-white/40 hover:text-cyan-300">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display font-bold text-white text-xl uppercase flex items-center gap-2">
            <Terminal size={18} className="text-cyan-300" /> System Logs
          </h1>
        </div>
        <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <p className="text-[11px] text-white/40 mb-5 leading-relaxed">
        Log real setiap tick cron (tiap 5 menit, tiap pair) — bukti langsung engine jalan atau tidak, dan alasan real
        di balik setiap keputusan no_trigger/created/closed.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5 bg-[#0b0f18] border border-white/10 px-2.5 py-1.5 rounded-sm flex-1 min-w-[160px]">
          <Search size={12} className="text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari di reasoning..."
            className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-white/20"
          />
        </div>
        <select
          value={pairFilter}
          onChange={(e) => setPairFilter(e.target.value)}
          className="bg-[#0b0f18] border border-white/10 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-cyan-400/50"
        >
          <option value="">Semua Pair</option>
          {SIGNAL_PAIRS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-[#0b0f18] border border-white/10 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-cyan-400/50"
        >
          <option value="">Semua Action</option>
          <option value="created">created</option>
          <option value="no_trigger">no_trigger</option>
          <option value="monitoring">monitoring</option>
          <option value="closed">closed</option>
          <option value="timeout">timeout</option>
          <option value="error">error</option>
        </select>
      </div>

      <div className="border border-white/10 chamfer-sm bg-black/40 overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-white/10 text-white/40 uppercase text-[9px]">
              <th className="text-left px-3 py-2">Waktu (WIB)</th>
              <th className="text-left px-3 py-2">Pair</th>
              <th className="text-left px-3 py-2">Action</th>
              <th className="text-left px-3 py-2">Conf.</th>
              <th className="text-left px-3 py-2">Reasoning</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="px-3 py-2 text-white/40 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", hour12: false })}
                </td>
                <td className="px-3 py-2 text-white/70">{l.pair}</td>
                <td className={`px-3 py-2 font-bold ${ACTION_COLOR[l.action] || "text-white/50"}`}>{l.action}</td>
                <td className="px-3 py-2 text-cyan-300">{l.confidence != null ? `${l.confidence}%` : "-"}</td>
                <td className="px-3 py-2 text-white/40 max-w-md truncate" title={l.reasoning || ""}>
                  {l.reasoning || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !loading && (
          <div className="text-center py-10 text-white/25 text-[11px]">[ TIDAK ADA LOG ]</div>
        )}
      </div>
    </div>
  );
}
