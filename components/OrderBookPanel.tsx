"use client";

/**
 * LASTQUESTION :: Live Order Book (Depth) panel
 * Public Binance spot depth stream, no API key required.
 * wss://data-stream.binance.vision/stream?streams=<symbol>@depth20@100ms
 */

import { useCallback, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { useReconnectingSocket } from "@/lib/useReconnectingSocket";
import { TERMINAL_PAIRS, priceDecimalsFor } from "@/lib/terminalPairs";

const COLOR = {
  green: "#00FF66",
  red: "#FF0044",
  cyan: "#00F0FF",
  iron: "#1E293B",
};

interface Level {
  price: number;
  qty: number;
}

const LEVELS_SHOWN = 10;

function fmt(n: number, decimals: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function OrderBookPanel() {
  const [activeIdx, setActiveIdx] = useState(1); // default BTC (index 1, after XAU)
  const pair = TERMINAL_PAIRS[activeIdx];
  const decimals = priceDecimalsFor(pair.symbol);

  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);

  const handleMessage = useCallback((msg: unknown) => {
    const m = msg as { data?: { bids?: [string, string][]; asks?: [string, string][] } };
    const data = m?.data;
    if (!data?.bids || !data?.asks) return;
    setBids(
      data.bids
        .map(([p, q]) => ({ price: Number.parseFloat(p), qty: Number.parseFloat(q) }))
        .filter((l) => l.qty > 0)
        .slice(0, LEVELS_SHOWN)
    );
    setAsks(
      data.asks
        .map(([p, q]) => ({ price: Number.parseFloat(p), qty: Number.parseFloat(q) }))
        .filter((l) => l.qty > 0)
        .slice(0, LEVELS_SHOWN)
    );
  }, []);

  const url = useMemo(
    () => `wss://data-stream.binance.vision/stream?streams=${pair.symbol.toLowerCase()}@depth20@100ms`,
    [pair.symbol]
  );
  const status = useReconnectingSocket(url, handleMessage);

  const maxQty = useMemo(() => {
    const all = [...bids, ...asks].map((l) => l.qty);
    return all.length ? Math.max(...all) : 1;
  }, [bids, asks]);

  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : null;
  const spreadPct = spread && bestBid ? (spread / bestBid) * 100 : null;

  return (
    <div>
      <div className="flex items-center justify-between border-b px-3 py-1.5" style={{ borderColor: COLOR.iron }}>
        <span className="text-[10px] tracking-[0.3em] flex items-center gap-1.5" style={{ color: COLOR.cyan }}>
          <Layers size={12} /> ORDER BOOK
        </span>
        <span className="text-[10px] tracking-[0.2em] text-slate-500">
          {status === "online" ? (
            <span style={{ color: COLOR.green }}>● LIVE</span>
          ) : status === "connecting" ? (
            <span style={{ color: "#FFC53D" }}>● CONNECTING</span>
          ) : (
            <span style={{ color: COLOR.red }}>● OFFLINE</span>
          )}
        </span>
      </div>

      {/* Pair selector tabs */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b" style={{ borderColor: COLOR.iron }}>
        {TERMINAL_PAIRS.map((p, i) => (
          <button
            key={p.symbol}
            onClick={() => {
              setActiveIdx(i);
              setBids([]);
              setAsks([]);
            }}
            className="px-2.5 py-1 text-[10px] font-mono tracking-widest border transition-colors"
            style={{
              borderColor: i === activeIdx ? COLOR.cyan : COLOR.iron,
              color: i === activeIdx ? COLOR.cyan : "#64748b",
              backgroundColor: i === activeIdx ? "rgba(0,240,255,0.08)" : "transparent",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 font-mono text-[11px]">
        {/* Asks (sell side) - lowest ask closest to spread, so reverse to show ascending toward middle */}
        <div className="border-r" style={{ borderColor: COLOR.iron }}>
          <div className="grid grid-cols-2 px-3 py-1 text-[9px] tracking-widest text-slate-500">
            <span>PRICE</span>
            <span className="text-right">QTY</span>
          </div>
          {asks.length === 0 ? (
            <div className="px-3 py-4 text-center text-slate-600 text-[10px]">{"> "}LOADING</div>
          ) : (
            [...asks].reverse().map((l) => (
              <div key={l.price} className="relative grid grid-cols-2 px-3 py-1">
                <div
                  className="absolute inset-y-0 right-0"
                  style={{ width: `${(l.qty / maxQty) * 100}%`, backgroundColor: "rgba(255,0,68,0.12)" }}
                />
                <span className="relative" style={{ color: COLOR.red }}>
                  {fmt(l.price, decimals)}
                </span>
                <span className="relative text-right text-slate-300">{l.qty.toFixed(4)}</span>
              </div>
            ))
          )}
        </div>

        {/* Bids (buy side) - highest bid closest to spread (first) */}
        <div>
          <div className="grid grid-cols-2 px-3 py-1 text-[9px] tracking-widest text-slate-500">
            <span>PRICE</span>
            <span className="text-right">QTY</span>
          </div>
          {bids.length === 0 ? (
            <div className="px-3 py-4 text-center text-slate-600 text-[10px]">{"> "}LOADING</div>
          ) : (
            bids.map((l) => (
              <div key={l.price} className="relative grid grid-cols-2 px-3 py-1">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${(l.qty / maxQty) * 100}%`, backgroundColor: "rgba(0,255,102,0.12)" }}
                />
                <span className="relative" style={{ color: COLOR.green }}>
                  {fmt(l.price, decimals)}
                </span>
                <span className="relative text-right text-slate-300">{l.qty.toFixed(4)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {spread !== null && spreadPct !== null && (
        <div className="flex items-center justify-center gap-2 border-t px-3 py-1.5 text-[10px] tracking-widest text-slate-500" style={{ borderColor: COLOR.iron }}>
          SPREAD :: <span style={{ color: COLOR.cyan }}>{fmt(spread, decimals)}</span> ({spreadPct.toFixed(3)}%)
        </div>
      )}
    </div>
  );
}
