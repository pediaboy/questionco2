"use client";

import { useEffect, useState } from "react";

type TickerItem = {
  symbol: string;
  price: number;
  change: number;
};

const FALLBACK: TickerItem[] = [
  { symbol: "BTC/USD", price: 97240.5, change: 1.8 },
  { symbol: "ETH/USD", price: 3412.2, change: -0.6 },
  { symbol: "XAU/USD", price: 2648.9, change: 0.4 },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LiveTicker() {
  const [data, setData] = useState<TickerItem[]>(FALLBACK);

  useEffect(() => {
    let mounted = true;

    async function pull() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!mounted || !json?.bitcoin) return;
        setData((prev) => [
          { symbol: "BTC/USD", price: json.bitcoin.usd, change: json.bitcoin.usd_24h_change ?? 0 },
          { symbol: "ETH/USD", price: json.ethereum.usd, change: json.ethereum.usd_24h_change ?? 0 },
          prev[2] ?? FALLBACK[2],
        ]);
      } catch {
        // silently keep fallback / last known values
      }
    }

    pull();
    const id = setInterval(pull, 45000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

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
