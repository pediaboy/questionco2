"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { NotebookPen, Trash2, Plus, Loader2 } from "lucide-react";

interface JournalEntry {
  id: string;
  pair: string;
  direction: string;
  result: string;
  pips: number;
  notes: string | null;
  created_at: string;
}

export default function JournalPage() {
  const { accessToken, refreshProfile } = useMemberAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState("buy");
  const [result, setResult] = useState("win");
  const [pips, setPips] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/member/journal", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setEntries(data.items);
        } else {
          setError("Gagal memuat entri jurnal");
        }
      } else {
        setError("Gagal memuat entri jurnal");
      }
    } catch (err) {
      console.error(err);
      setError("Error memuat entri jurnal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEntries();
    }
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!pair.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/member/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          pair: pair.toUpperCase().trim(),
          direction,
          result,
          pips: Number(pips) || 0,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Reset form
          setPair("");
          setPips("");
          setNotes("");
          // Refetch list and refresh dashboard stats
          await fetchEntries();
          await refreshProfile();
        } else {
          setError(data.message || "Gagal menyimpan entri");
        }
      } else {
        setError("Gagal menghubungi server");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm("Hapus entri jurnal ini?")) return;

    try {
      const res = await fetch(`/api/member/journal?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchEntries();
          await refreshProfile();
        } else {
          alert(data.error || "Gagal menghapus entri");
        }
      } else {
        alert("Gagal menghubungi server");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // TRADING JOURNAL ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Jurnal <span className="text-cyan-300 text-glow-cyan">Trading</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Catat dan analisis performa trading harian Anda.</p>
      </div>

      {/* Form Card */}
      <div className="chamfer-sm bg-[#0b0f18]/60 border border-white/10 p-5 relative mb-6">
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

        <span className="text-[9px] font-bold tracking-wider text-cyan-300 font-mono block mb-3">
          [ INPUT NEW TRANSACTION ]
        </span>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Pair */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">PAIR / ASSET</label>
              <input
                type="text"
                required
                placeholder="misal: XAUUSD"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70"
              />
            </div>

            {/* Pips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">PIP GAIN / LOSS</label>
              <input
                type="number"
                required
                placeholder="misal: 45 atau -12"
                value={pips}
                onChange={(e) => setPips(e.target.value)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Direction */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">ARAH (DIR)</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/70"
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </div>

            {/* Result */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">HASIL (OUTCOME)</label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/70"
              >
                <option value="win">WIN</option>
                <option value="loss">LOSS</option>
                <option value="be">BREAK EVEN (BE)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">CATATAN (NOTES)</label>
            <textarea
              placeholder="Tambahkan catatan analisa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 resize-none font-sans"
            />
          </div>

          {error && <p className="text-red-400 text-[10px] font-mono">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="chamfer-btn w-full flex items-center justify-center gap-2 bg-cyan-400 text-black font-bold text-xs tracking-widest py-3 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} strokeWidth={2.5} />
            )}
            SIMPAN ENTRI JURNAL
          </button>
        </form>
      </div>

      {/* Entries List */}
      <div className="flex items-center gap-3 mb-4 mt-8">
        <span className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold uppercase font-mono">
          [ DAFTAR JURNAL ]
        </span>
        <div className="flex-1 h-px bg-cyan-400/20" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <NotebookPen size={20} className="text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
          <span className="text-xs text-slate-500 font-mono">[ JURNAL KOSONG ]</span>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isWin = entry.result === "win";
            const isLoss = entry.result === "loss";
            let outcomeColor = "text-yellow-400";
            let outcomeBg = "bg-yellow-950/20 border-yellow-500/20";
            if (isWin) {
              outcomeColor = "text-emerald-400";
              outcomeBg = "bg-emerald-950/20 border-emerald-500/20";
            } else if (isLoss) {
              outcomeColor = "text-rose-400";
              outcomeBg = "bg-rose-950/20 border-rose-500/20";
            }

            return (
              <div
                key={entry.id}
                className="chamfer-sm bg-[#0b0f18]/40 border border-white/10 p-4 relative"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>

                {/* Entry Info Row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono font-bold text-white text-[13.5px]">
                    {entry.pair}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 border uppercase font-mono font-bold ${
                    entry.direction === "buy" ? "text-cyan-400 border-cyan-500/20 bg-cyan-950/20" : "text-purple-400 border-purple-500/20 bg-purple-950/20"
                  }`}>
                    {entry.direction}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 border uppercase font-mono font-bold ${outcomeBg} ${outcomeColor}`}>
                    {entry.result}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto mr-6">
                    {formatDate(entry.created_at)}
                  </span>
                </div>

                {/* Performance & Notes */}
                <div className="flex flex-col gap-1 pr-6">
                  <div className="text-[11px] font-mono text-white/90">
                    Profit/Loss:{" "}
                    <span className={entry.pips >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {entry.pips >= 0 ? `+${entry.pips}` : entry.pips} pips
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-white/60 text-xs mt-1 leading-relaxed italic font-sans">
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
