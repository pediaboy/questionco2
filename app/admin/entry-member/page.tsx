"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ListPlus, RefreshCw, Zap, Bot, User, Radio } from "lucide-react";
import { isAdminAuthed } from "@/lib/adminAuth";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  total_lot: number | null;
  is_dummy: boolean;
  auto_growth: boolean;
};

type Entry = {
  id: string;
  profile_id: string;
  profile_name: string;
  pair: string;
  lot_size: number;
  price: number;
  is_auto: boolean;
  created_at: string;
};

type TickerItem = { symbol: string; price: number; change: number };

const PAIR_LABEL: Record<string, string> = { XAUUSD: "XAU/USD", BTCUSDT: "BTC/USDT" };

export default function EntryMemberAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [flash, setFlash] = useState(false);

  // Per-row form state
  const [pairFor, setPairFor] = useState<Record<string, "XAUUSD" | "BTCUSDT">>({});
  const [lotFor, setLotFor] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/lot-entries").then((r) => r.json());
    if (res.success) {
      setProfiles(res.profiles);
      setEntries(res.entries);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  // Live TradingView price feed — refresh every second while this page is open.
  useEffect(() => {
    if (!authed) return;
    let mounted = true;
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success) {
          setTicker(json.items);
          setFlash(true);
          setTimeout(() => setFlash(false), 300);
        }
      } catch {
        // keep last known values on failure
      }
    };
    fetchTicker();
    const iv = setInterval(fetchTicker, 1000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [authed]);

  function priceFor(pair: "XAUUSD" | "BTCUSDT"): number {
    const symbol = pair === "XAUUSD" ? "XAU/USD" : "BTC/USD";
    const item = ticker.find((t) => t.symbol === symbol);
    return item?.price ?? 0;
  }

  async function submitEntry(profile: Profile) {
    const pair = pairFor[profile.id] || "XAUUSD";
    const lotRaw = lotFor[profile.id];
    const lot = Number(lotRaw);

    if (!lotRaw || Number.isNaN(lot) || lot < 0.01 || lot > 1) {
      alert("Lot harus antara 0.01 - 1.00");
      return;
    }

    const price = priceFor(pair);
    if (!price) {
      alert("Harga live belum siap, tunggu sebentar.");
      return;
    }

    setSubmitting(profile.id);
    try {
      const res = await fetch("/api/admin/lot-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profile.id, pair, lot_size: lot, price }),
      });
      const json = await res.json();
      if (!json.success) return alert("Gagal: " + json.error);
      setLotFor((prev) => ({ ...prev, [profile.id]: "" }));
      load();
    } finally {
      setSubmitting(null);
    }
  }

  function randomizeLot(profileId: string) {
    const val = (Math.random() * (1 - 0.01) + 0.01).toFixed(2);
    setLotFor((prev) => ({ ...prev, [profileId]: val }));
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
            <ListPlus size={18} className="text-cyan-300" /> Setup Entry Member
          </h1>
        </div>
        <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
        Tambahin entry trade (XAU/USD atau BTC/USDT) buat tiap member dengan lot 0.01 – 1.00. Harga otomatis
        diambil dari feed live TradingView (refresh tiap detik). Entry manual maupun otomatis (dari sistem
        auto-growth) sama-sama nambah ke total lot kontes.
      </p>

      {/* Live price bar */}
      <div
        className={`border chamfer-sm bg-[#0b0f18]/70 p-3 mb-6 flex items-center justify-between transition-colors ${
          flash ? "border-cyan-400/60" : "border-cyan-400/20"
        }`}
      >
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-300 font-mono">
          <Radio size={12} className={flash ? "animate-pulse" : ""} /> Live Feed
        </div>
        <div className="flex items-center gap-5 font-mono text-xs">
          {ticker.length === 0 ? (
            <span className="text-white/30">Menghubungkan...</span>
          ) : (
            ticker
              .filter((t) => t.symbol === "XAU/USD" || t.symbol === "BTC/USD")
              .map((t) => (
                <span key={t.symbol} className="text-white">
                  {t.symbol}:{" "}
                  <span className={t.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {t.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                </span>
              ))
          )}
        </div>
      </div>

      {/* Member list with add-entry controls */}
      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">[ SEMUA MEMBER — TAMBAH ENTRY ]</h2>
      <div className="space-y-2 mb-8">
        {profiles.map((p) => {
          const pair = pairFor[p.id] || "XAUUSD";
          const livePrice = priceFor(pair);
          return (
            <div key={p.id} className="border border-white/10 chamfer-sm bg-[#0b0f18]/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {p.is_dummy ? (
                    <Bot size={13} className="text-white/30" />
                  ) : (
                    <User size={13} className="text-cyan-300" />
                  )}
                  <span className="text-white text-sm font-medium">{p.full_name || p.email}</span>
                  {!p.auto_growth && (
                    <span className="text-[9px] font-mono text-white/30 border border-white/15 px-1.5 py-0.5">
                      AUTO OFF
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {(p.total_lot ?? 0).toLocaleString("id-ID")} Lot
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={pair}
                  onChange={(e) =>
                    setPairFor((prev) => ({ ...prev, [p.id]: e.target.value as "XAUUSD" | "BTCUSDT" }))
                  }
                  className="bg-[#05080f] border border-white/15 px-2 py-1.5 text-[11px] text-white rounded-sm focus:outline-none focus:border-cyan-400/60"
                >
                  <option value="XAUUSD">XAU/USD</option>
                  <option value="BTCUSDT">BTC/USDT</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1"
                  placeholder="Lot 0.01–1.00"
                  value={lotFor[p.id] || ""}
                  onChange={(e) => setLotFor((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-28 bg-[#05080f] border border-white/15 px-2 py-1.5 text-[11px] text-white placeholder:text-white/20 rounded-sm font-mono focus:outline-none focus:border-cyan-400/60"
                />
                <button
                  onClick={() => randomizeLot(p.id)}
                  title="Random lot"
                  className="text-[10px] text-yellow-400 border border-yellow-400/30 px-2 py-1.5 rounded-sm hover:bg-yellow-400/10"
                >
                  <Zap size={12} />
                </button>
                <span className="text-[10px] text-white/30 font-mono">
                  @ {livePrice ? livePrice.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
                </span>
                <button
                  onClick={() => submitEntry(p)}
                  disabled={submitting === p.id}
                  className="ml-auto chamfer-btn bg-cyan-400 text-black font-bold text-[11px] px-3 py-1.5 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
                >
                  {submitting === p.id ? "..." : "TAMBAH ENTRY"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent entries feed */}
      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">[ RIWAYAT ENTRY TERBARU ]</h2>
      <div className="border border-white/10 chamfer-sm bg-[#0b0f18]/70 divide-y divide-white/5">
        {entries.length === 0 && <div className="p-4 text-center text-xs text-slate-500 font-mono">[ BELUM ADA ENTRY ]</div>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-white/70">{e.profile_name}</span>
              <span className="text-white/30 font-mono">{PAIR_LABEL[e.pair] || e.pair}</span>
              {!e.is_auto && (
                <span className="text-[9px] font-mono text-cyan-300 border border-cyan-400/30 px-1 py-0.5">
                  MANUAL
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-emerald-400">+{Number(e.lot_size).toFixed(2)} Lot</span>
              <span className="text-white/30">@ {Number(e.price).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
              <span className="text-white/20">{new Date(e.created_at).toLocaleTimeString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
