"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, Panel, CornerTicks, chamferMicro } from "@/lib/cyberKit";
import { Radio, TrendingUp, TrendingDown } from "lucide-react";
import { useOpenPositions, OpenPositionItem } from "@/lib/useOpenPositions";

interface FeedRow {
  key: string;
  item: OpenPositionItem;
  secondsAgo: number;
}

const MAX_ROWS = 7;

/**
 * "Live Feed Aktivitas Komunitas" ticker for the Portfolio page.
 *
 * Shares the EXACT same data source as /dashboard/entry (Open Posisi Realtime) via
 * useOpenPositions -> /api/member/open-positions -- real qco2_lot_entries rows (from
 * the "Kontes Capai Lot" leaderboard auto-growth, is_dummy accounts only, real lot/price),
 * with a stable lot-proportional "modal" figure and live-price-based BE/SL status computed
 * server-side. This was previously a SEPARATE ephemeral random generator that showed
 * disconnected lot/dollar numbers -- now both pages always agree on the same trades.
 *
 * The "running trade" feel is achieved by cycling through the shared entry list and
 * revealing one row at a time onto the visible feed (fast pace, ~0.5-1.2s), looping back
 * to the top of the list once exhausted -- the underlying list itself refreshes every 2s
 * (same poll as the Entry page) so it stays live and in sync.
 */
export default function CommunityActivityTicker() {
  const { items } = useOpenPositions();
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [flash, setFlash] = useState(false);
  const cursorRef = useRef(0);
  const seqRef = useRef(0);

  useEffect(() => {
    let cycleTimer: ReturnType<typeof setTimeout>;

    const pushNext = () => {
      const list = items;
      if (list && list.length > 0) {
        const idx = cursorRef.current % list.length;
        cursorRef.current += 1;
        seqRef.current += 1;
        const item = list[idx];
        const row: FeedRow = { key: `${seqRef.current}-${item.id}`, item, secondsAgo: 0 };
        setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      }
      const delay = 500 + Math.random() * 700; // fast running-trade feel
      cycleTimer = setTimeout(pushNext, delay);
    };

    cycleTimer = setTimeout(pushNext, 300);

    const secondIv = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, secondsAgo: r.secondsAgo + 1 })));
    }, 1000);

    return () => {
      clearTimeout(cycleTimer);
      clearInterval(secondIv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

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
            const it = row.item;
            const isBuy = it.direction === "BUY";
            const color = isBuy ? C.green : C.red;
            return (
              <motion.div
                key={row.key}
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
                    <span className="truncate font-bold text-slate-300">{it.name}</span>
                    <span className="text-[9px] tracking-widest text-slate-600">{it.pair}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-slate-300">{Number(it.lot_size).toFixed(2)} Lot</span>
                  <span className="text-[9px] text-slate-600">
                    ${it.modal.toLocaleString("en-US")} · {row.secondsAgo}s lalu
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
