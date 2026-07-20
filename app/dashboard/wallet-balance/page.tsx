"use client";

/**
 * LASTQUESTION.CO :: WHALE WALLET MONITOR
 * Owner correction 2026-07-21: this page is NOT a personal lot ledger -- it's a
 * live multi-asset "whale wallet" board: crypto + forex + komoditas, all real
 * prices, all real-time. No balance/quantity is simulated, no dummy-data
 * disclaimer needed here because nothing is a stand-in for real member funds --
 * it's a live market price board, framed like peeking into a big trader's wallet.
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay, GlitchText, chamferMicro, fmtPrice } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { Radar, Radio, TrendingUp, TrendingDown, Bitcoin, Landmark, Flame } from "lucide-react";

interface WhaleItem {
  symbol: string;
  category: "Crypto" | "Forex" | "Komoditas";
  price: number;
  change: number;
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Crypto: Bitcoin,
  Forex: Landmark,
  Komoditas: Flame,
};
const CATEGORY_COLOR: Record<string, string> = {
  Crypto: C.cyan,
  Forex: "#A78BFA",
  Komoditas: C.gold,
};

function AssetCard({ item }: { item: WhaleItem }) {
  const up = item.change >= 0;
  const color = up ? C.green : C.red;
  const CatIcon = CATEGORY_ICON[item.category];
  const catColor = CATEGORY_COLOR[item.category];

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}>
      <Panel glowColor={color} size={12} contentClassName="p-3.5">
        <CornerTicks color={color} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border" style={{ borderColor: catColor, backgroundColor: `${catColor}15`, ...chamferMicro(4) }}>
              <CatIcon size={13} style={{ color: catColor }} strokeWidth={1.8} />
            </span>
            <span className="font-mono text-[12px] font-bold tracking-wide text-slate-100">{item.symbol}</span>
          </div>
          <span className="inline-flex items-center gap-0.5 border px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums" style={{ borderColor: color, color, ...chamferMicro(2) }}>
            {up ? <TrendingUp size={9} strokeWidth={2.2} /> : <TrendingDown size={9} strokeWidth={2.2} />}
            {up ? "+" : ""}{item.change.toFixed(2)}%
          </span>
        </div>
        <div className="mt-2.5 font-mono text-lg font-bold tabular-nums text-slate-200">
          {item.price >= 1 ? fmtPrice(item.price) : item.price.toFixed(5)}
        </div>
      </Panel>
    </motion.div>
  );
}

function CategorySection({ title, items }: { title: "Crypto" | "Forex" | "Komoditas"; items: WhaleItem[] }) {
  const color = CATEGORY_COLOR[title];
  const Icon = CATEGORY_ICON[title];
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon size={14} style={{ color }} strokeWidth={1.8} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color }}>{title}</span>
        <span className="font-mono text-[9px] tracking-[0.15em] text-slate-600">// {items.length} ASET</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {items.map((item) => (
            <AssetCard key={item.symbol} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function WhaleWalletPage() {
  const { profile } = useMemberAuth();
  const [items, setItems] = useState<WhaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function pull() {
      try {
        const res = await fetch("/api/whale-wallet", { cache: "no-store" });
        const d = await res.json();
        if (mounted && d.success) {
          setItems(d.items);
          setUpdatedAt(d.updated_at);
          setFlash(true);
          setTimeout(() => setFlash(false), 500);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    pull();
    const iv = setInterval(pull, 5000); // house rule: 5s SWR polling
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const isVip = profile?.is_vip ?? false;

  const grouped = useMemo(() => {
    const crypto = items.filter((i) => i.category === "Crypto");
    const forex = items.filter((i) => i.category === "Forex");
    const komoditas = items.filter((i) => i.category === "Komoditas");
    return { crypto, forex, komoditas };
  }, [items]);

  const gainers = items.filter((i) => i.change >= 0).length;
  const losers = items.length - gainers;

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] pb-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <GlitchText text="MONITOR // WHALE WALLET" />
          <h2 className="mt-1.5 flex items-center gap-2 font-mono text-xl font-bold uppercase tracking-wider text-white md:text-2xl">
            <Radar size={18} style={{ color: C.cyan }} strokeWidth={1.8} />
            Whale Wallet
          </h2>
          <p className="mt-1 max-w-xl font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Live real-time isi wallet lintas Crypto, Forex, dan Komoditas -- semua harga langsung dari pasar, update setiap 5 detik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={flash ? { opacity: [0, 1, 0] } : { opacity: 0 }} transition={{ duration: 0.5 }} className="h-1.5 w-1.5" style={{ backgroundColor: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
          <Radio size={12} style={{ color: C.green }} strokeWidth={1.6} />
          <span className="font-mono text-[9px] tracking-[0.25em]" style={{ color: C.green }}>LIVE</span>
        </div>
      </div>

      <div className="relative">
        <div className={`space-y-6 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-3 border-y px-3 py-2 font-mono text-[9px] tracking-[0.18em]" style={{ borderColor: C.iron, backgroundColor: "rgba(17,21,32,0.5)" }}>
            <span className="flex items-center gap-1.5">
              <motion.span className="h-1.5 w-1.5" style={{ backgroundColor: C.green, boxShadow: `0 0 6px ${C.green}` }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
              <span className="text-slate-500">FEED ONLINE</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">TOTAL ASET <span style={{ color: C.cyan }}>{items.length}</span></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">NAIK <span style={{ color: C.green }}>{gainers}</span></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">TURUN <span style={{ color: C.red }}>{losers}</span></span>
            <span className="ml-auto text-slate-600">{loading ? "MEMUAT DATA..." : "SUMBER: OKX + TRADINGVIEW"}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Panel key={i} glowColor={C.iron} size={12} contentClassName="p-3.5 h-[92px] flex items-center justify-center">
                  <CornerTicks color={C.iron} />
                  <span className="font-mono text-[9px] tracking-widest text-slate-600 animate-pulse">[ SYNCING... ]</span>
                </Panel>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <CategorySection title="Crypto" items={grouped.crypto} />
              <CategorySection title="Forex" items={grouped.forex} />
              <CategorySection title="Komoditas" items={grouped.komoditas} />
            </div>
          )}
        </div>

        {!isVip && <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />}
      </div>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Whale Wallet Monitor" />
    </div>
  );
}
