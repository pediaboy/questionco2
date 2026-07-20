"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, Panel, CornerTicks, chamferMicro } from "@/lib/cyberKit";
import { FeedRow, generateFeedRow, seedFeed } from "@/lib/communityActivityFeed";
import { Radio, TrendingUp, TrendingDown } from "lucide-react";

const MAX_ROWS = 7;

/**
 * Ambient "Live Community Activity" ticker for the Portfolio page.
 * Purely cosmetic client-side simulation (see lib/communityActivityFeed.ts for
 * exactly what this is/isn't) -- generic aliases, random modal/lot, ticks every
 * second. Does not touch real member data or the real contest standings.
 */
export default function CommunityActivityTicker() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setRows(seedFeed(MAX_ROWS));

    const tick = setInterval(() => {
      setRows((prev) => {
        const next = [generateFeedRow(), ...prev.map((r) => ({ ...r, secondsAgo: r.secondsAgo + 1 }))];
        return next.slice(0, MAX_ROWS);
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
    }, 1000);

    return () => clearInterval(tick);
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
