"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import RevealText from "./RevealText";

// Real Binance spot symbol + OKX instId (for the sparkline) per displayed asset.
// XAU uses PAXG (PAX Gold token) as a live price proxy, same convention used
// elsewhere on this site for gold price data.
const ASSETS = [
  { id: "01", label: "XAU/USD", okxInstId: "XAUT-USDT", tvSymbol: "OANDA:XAUUSD", market: "cfd" as const },
  { id: "02", label: "BTC/USDT", okxInstId: "BTC-USDT", tvSymbol: "BINANCE:BTCUSDT", market: "crypto" as const },
  { id: "03", label: "ETH/USDT", okxInstId: "ETH-USDT", tvSymbol: "BINANCE:ETHUSDT", market: "crypto" as const },
  { id: "04", label: "SOL/USDT", okxInstId: "SOL-USDT", tvSymbol: "BINANCE:SOLUSDT", market: "crypto" as const },
];

interface AssetState {
  price: number | null;
  change: number | null;
  spark: number[] | null;
}

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MarketIntel() {
  const [state, setState] = useState<Record<string, AssetState>>(() =>
    Object.fromEntries(ASSETS.map((a) => [a.id, { price: null, change: null, spark: null }]))
  );

  // Live price + 24h change via our own /api/ticker (BTC/ETH/XAU) -- extend with
  // a direct OKX ticker call for SOL since /api/ticker only covers 3 symbols.
  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const [tickerRes, solRes] = await Promise.all([
          fetch("/api/ticker", { cache: "no-store" }).then((r) => r.json()),
          fetch("https://www.okx.com/api/v5/market/ticker?instId=SOL-USDT").then((r) => r.json()),
        ]);
        if (cancelled) return;

        setState((prev) => {
          const next = { ...prev };
          if (tickerRes?.success) {
            const bySymbol: Record<string, { symbol: string; price: number; change: number }> = {};
            for (const it of tickerRes.items) bySymbol[it.symbol] = it;
            if (bySymbol["XAU/USD"]) next["01"] = { ...next["01"], price: bySymbol["XAU/USD"].price, change: bySymbol["XAU/USD"].change };
            if (bySymbol["BTC/USD"]) next["02"] = { ...next["02"], price: bySymbol["BTC/USD"].price, change: bySymbol["BTC/USD"].change };
            if (bySymbol["ETH/USD"]) next["03"] = { ...next["03"], price: bySymbol["ETH/USD"].price, change: bySymbol["ETH/USD"].change };
          }
          const sol = solRes?.data?.[0];
          if (sol) {
            const last = Number.parseFloat(sol.last);
            const open24h = Number.parseFloat(sol.open24h);
            const change = open24h ? ((last - open24h) / open24h) * 100 : 0;
            next["04"] = { ...next["04"], price: last, change };
          }
          return next;
        });
      } catch {
        /* keep last known values, no dummy fallback */
      }
    }
    pull();
    const id = setInterval(pull, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Real historical closes for the sparkline (OKX 15m candles, fetched once per asset).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ASSETS.map((a) =>
        fetch(`https://www.okx.com/api/v5/market/candles?instId=${a.okxInstId}&bar=15m&limit=20`)
          .then((r) => r.json())
          .then((json) => ({ id: a.id, closes: Array.isArray(json?.data) ? json.data.map((c: string[]) => Number.parseFloat(c[4])).reverse() : null }))
          .catch(() => ({ id: a.id, closes: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      setState((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (r.closes) next[r.id] = { ...next[r.id], spark: r.closes };
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="market" className="px-5 py-14 relative">
      <div className="text-center mb-8">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2">[ DATA_FEED ]</p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">Market Intelligence</h2>
        <RevealText
          text="Live-monitored assets, ditarik langsung dari feed harga real-time."
          className="text-white/45 text-[12.5px] mt-3 max-w-[300px] mx-auto leading-relaxed"
        />
      </div>

      <div className="border border-dashed border-cyan-400/25 chamfer bg-[#0b0f18]/70">
        {ASSETS.map((a, idx) => {
          const s = state[a.id];
          const positive = s.change !== null ? s.change >= 0 : true;
          return (
            <div
              key={a.id}
              className={`hud-card flex items-center gap-3 px-4 py-4 ${
                idx !== ASSETS.length - 1 ? "border-b border-dashed border-cyan-400/15" : ""
              }`}
            >
              <span className="font-display font-bold text-cyan-300 text-sm w-6 text-glow-cyan">{a.id}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-[13px]">{a.label}</div>
                <div className="text-white/40 text-[10.5px] mt-0.5">
                  {s.price !== null ? `$${fmtPrice(s.price)}` : <span className="animate-pulse">connecting...</span>}
                </div>
              </div>
              {s.spark ? (
                <Sparkline points={s.spark} positive={positive} />
              ) : (
                <div className="w-16 h-[22px] bg-white/5 animate-pulse" />
              )}
              <span
                className={`text-[11px] font-bold w-16 text-right ${
                  s.change === null ? "text-white/20" : positive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {s.change !== null ? `${s.change >= 0 ? "+" : ""}${s.change.toFixed(2)}%` : "--"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[9.5px] text-white/25 text-center mt-3 tracking-wide">
        DATA REFRESHED VIA LIVE MARKET FEED · FOR EDUCATIONAL PURPOSES ONLY
      </p>
    </section>
  );
}
