"use client";

import { useEffect, useRef, useState } from "react";

type TickerItem = {
  symbol: string;
  price: number;
  change: number;
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LiveTicker() {
  const [data, setData] = useState<TickerItem[] | null>(null);
  const [stale, setStale] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function pull() {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const json = await res.json();
        if (!mountedRef.current) return;
        if (json.success && Array.isArray(json.items)) {
          setData(json.items);
          setStale(false);
        } else {
          setStale(true);
        }
      } catch {
        if (mountedRef.current) setStale(true);
      }
    }

    pull();
    const id = setInterval(pull, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, []);

  if (!data) {
    return (
      <div className="w-full overflow-hidden border-b border-cyan-400/15 bg-black/40 py-1.5">
        <div className="flex items-center gap-2 px-4 text-[11px] text-white/30 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse" />
          [ CONNECTING_TO_MARKET_FEED... ]
        </div>
      </div>
    );
  }

  const row = (
    <div className="flex items-center gap-8 px-4 shrink-0">
      {data.map((d) => (
        <span key={d.symbol} className="flex items-center gap-2 text-[11px] tracking-wide">
          <span className="text-white/50">{d.symbol}</span>
          <span className="text-white/90 font-semibold">${fmt(d.price)}</span>
          <span
            className={
              d.change >= 0
                ? "text-emerald-400 [text-shadow:0_0_8px_rgba(52,211,153,0.6)]"
                : "text-red-400 [text-shadow:0_0_8px_rgba(248,113,113,0.6)]"
            }
          >
            {d.change >= 0 ? "▲" : "▼"} {Math.abs(d.change).toFixed(2)}%
          </span>
        </span>
      ))}
      {stale && (
        <span className="text-[9px] text-amber-400/70 font-mono tracking-wider">[ FEED_DELAYED ]</span>
      )}
    </div>
  );

  return (
    <div className="w-full overflow-hidden border-b border-cyan-400/15 bg-black/40 py-1.5">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
