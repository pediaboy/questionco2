"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Star, Plus, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

interface WatchItem {
  id: string;
  pair: string;
  created_at: string;
}

interface LivePrice {
  price: number;
  change: number;
}

const AVAILABLE_PAIRS = SIGNAL_PAIRS.map((p) => p.label);

export default function WatchlistPage() {
  const { accessToken } = useMemberAuth();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");
  const [live, setLive] = useState<Record<string, LivePrice>>({});
  const [error, setError] = useState("");

  async function fetchItems() {
    if (!accessToken) return;
    const res = await fetch("/api/watchlist", { headers: { Authorization: `Bearer ${accessToken}` } });
    const d = await res.json();
    if (d.success) setItems(d.items);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Real live prices for saved pairs -- pulls from each pair's real OKX instId.
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    async function pull() {
      const results = await Promise.all(
        items.map(async (it) => {
          const cfg = SIGNAL_PAIRS.find((p) => p.label === it.pair);
          if (!cfg) return null;
          try {
            const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${cfg.dataInstId}`);
            const json = await res.json();
            const d = json?.data?.[0];
            if (!d) return null;
            const last = Number.parseFloat(d.last);
            const open24h = Number.parseFloat(d.open24h);
            const change = open24h ? ((last - open24h) / open24h) * 100 : 0;
            return { pair: it.pair, price: last, change };
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, LivePrice> = {};
      for (const r of results) if (r) map[r.pair] = { price: r.price, change: r.change };
      setLive(map);
    }
    pull();
    const id = setInterval(pull, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [items]);

  async function addPair() {
    if (!selected || !accessToken) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ pair: selected }),
      });
      const d = await res.json();
      if (!d.success) {
        setError(d.message || "Gagal menambah pair.");
        return;
      }
      setSelected("");
      await fetchItems();
    } finally {
      setAdding(false);
    }
  }

  async function removePair(id: string) {
    if (!accessToken) return;
    await fetch(`/api/watchlist?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const addablePairs = AVAILABLE_PAIRS.filter((p) => !items.some((i) => i.pair === p));

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ MARKET // WATCHLIST ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Watchlist <span className="text-cyan-300 text-glow-cyan">Pasar</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Simpan pair favorit, pantau harga real-time.</p>
      </div>

      {/* Add pair */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 mb-4 flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 px-2 py-2 text-[12.5px] text-white outline-none"
        >
          <option value="">Pilih pair...</option>
          {addablePairs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          onClick={addPair}
          disabled={!selected || adding}
          className="chamfer-sm bg-cyan-400 text-black px-3 flex items-center justify-center disabled:opacity-40"
        >
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </button>
      </div>
      {error && <p className="text-rose-400 text-[11px] font-mono mb-3">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-white/5 animate-pulse chamfer-sm" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <Star size={20} className="text-white/20 mx-auto mb-2" />
          <span className="text-[11px] text-slate-500 font-mono">[ WATCHLIST KOSONG ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const l = live[it.pair];
            const positive = l ? l.change >= 0 : true;
            return (
              <div
                key={it.id}
                className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Star size={14} className="text-[#FFD700] fill-[#FFD700]" />
                  <div>
                    <p className="text-white font-mono font-bold text-[13px]">{it.pair}</p>
                    {l ? (
                      <p className="text-white/40 text-[10.5px] font-mono">${l.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
                    ) : (
                      <p className="text-white/20 text-[10.5px] font-mono animate-pulse">connecting...</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {l && (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-bold font-mono ${
                        positive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {l.change.toFixed(2)}%
                    </span>
                  )}
                  <button onClick={() => removePair(it.id)} className="text-white/30 hover:text-rose-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
