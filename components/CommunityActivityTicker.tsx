"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, Panel, CornerTicks, chamferMicro } from "@/lib/cyberKit";
import { Radio, TrendingUp, TrendingDown } from "lucide-react";

interface FeedRow {
  id: string;
  alias: string;
  pair: string;
  direction: "BUY" | "SELL";
  modal: number;
  lot: number;
  secondsAgo: number;
}

const MAX_ROWS = 7;

/**
 * Ambient "Live Feed Aktivitas Komunitas" ticker for the Portfolio page.
 * Source: ONLY the existing is_dummy=true demo roster (dummy1-15@leaderboard.local,
 * the same accounts already used for the "Kontes Capai Lot" leaderboard auto-growth)
 * via /api/public/dummy-activity -- never real member data. Modal/lot/pair shown
 * are generated fresh server-side each poll purely for a "live" cosmetic feel;
 * nothing here is persisted or can affect the real contest standings.
 *
 * Runs as a "running trade" feed: ONE fresh trade is pushed onto the top every
 * ~2.5s and the oldest falls off the bottom -- not a full-list replace, which is
 * what caused the jarring "jump" the owner reported.
 */
export default function CommunityActivityTicker() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [flash, setFlash] = useState(false);
  const seqRef = useRef(0);

  const pushOne = async () => {
    try {
      const res = await fetch("/api/public/dummy-activity?count=1", { cache: "no-store" });
      const d = await res.json();
      if (d.success && Array.isArray(d.items) && d.items.length > 0) {
        seqRef.current += 1;
        const it = d.items[0];
        const row: FeedRow = { ...it, id: `${seqRef.current}-${it.id}`, secondsAgo: 0 };
        setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      }
    } catch {
      // silently skip this tick if the poll fails -- keep showing the existing rows
    }
  };

  const seed = async () => {
    try {
      const res = await fetch("/api/public/dummy-activity?count=" + MAX_ROWS, { cache: "no-store" });
      const d = await res.json();
      if (d.success && Array.isArray(d.items)) {
        seqRef.current += 1;
        const seq = seqRef.current;
        setRows(d.items.map((it: Omit<FeedRow, "secondsAgo" | "id"> & { id: string }, i: number) => ({
          ...it,
          id: `${seq}-${it.id}-${i}`,
          secondsAgo: i * 3,
        })));
      }
    } catch {
      // keep rows empty; the tick interval below will still try to populate it
    }
  };

  useEffect(() => {
    seed();
    // stagger the "new trade" ticks a bit (2-3.5s) so it doesn't feel mechanically uniform
    let tradeTimer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 1500;
      tradeTimer = setTimeout(async () => {
        await pushOne();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    const secondIv = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, secondsAgo: r.secondsAgo + 1 })));
    }, 1000);

    return () => {
      clearTimeout(tradeTimer);
      clearInterval(secondIv);
    };
  }, []);

  return (
    <Panel glowColor={C.cyan} size={12} contentClassName="p-4">
      <CornerTicks color={C.cyan} />
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300">
          <Radio size={13} style={{ color: C.cyan }} strokeWidth={1.8} />
          Live Feed Aktivitas Komunitas
        </span>
        <span className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5"
            style={{ backgroundColor: C.cyan, boxShadow: `0 0 6px ${C.cyan}` }}
            animate={flash ? { opacity: [0, 1, 0.3] } : { opacity: 0.3 }}
            transition={{ duration: 0.4 }}
          />
          <span className="font-mono text-[9px] tracking-[0.2em] text-emerald-400">LIVE</span>
        </span>
      </div>

      <div className="mt-2 divide-y divide-slate-900/80">
        <AnimatePresence initial={false}>
          {rows.map((row) => {
            const isBuy = row.direction === "BUY";
            const color = isBuy ? C.green : C.red;
            return (
              <motion.div
                key={row.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex items-center justify-between gap-2 py-2 font-mono text-[10.5px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center border"
                    style={{ borderColor: `${color}55`, backgroundColor: `${color}12`, color, ...chamferMicro(3) }}
                  >
                    {isBuy ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold text-slate-300">{row.alias}</span>
                    <span className="text-[9px] tracking-widest text-slate-600">{row.pair}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-slate-300">{row.lot.toFixed(2)} Lot</span>
                  <span className="text-[9px] text-slate-600">
                    ${row.modal.toLocaleString("en-US")} · {row.secondsAgo}s lalu
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
