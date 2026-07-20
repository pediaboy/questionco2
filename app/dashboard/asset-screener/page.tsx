"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, chamfer, chamferMicro, fmtPrice, fmtQty, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { Activity, Radio, ArrowUpDown, Search, Percent, Flame } from "lucide-react";

const SCREENER_ASSETS = [
  { key: "BTCUSDT", label: "BTC" },
  { key: "ETHUSDT", label: "ETH" },
  { key: "SOLUSDT", label: "SOL" },
  { key: "XRPUSDT", label: "XRP" },
  { key: "ADAUSDT", label: "ADA" },
  { key: "DOGEUSDT", label: "DOGE" },
  { key: "DOTUSDT", label: "DOT" },
  { key: "LINKUSDT", label: "LINK" },
  { key: "AVAXUSDT", label: "AVAX" },
  { key: "LTCUSDT", label: "LTC" },
  { key: "PAXGUSDT", label: "XAU" }, // PAXG is proxy for XAU
] as const;

interface TickerData {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
  volumeBase: number;
  volumeQuote: number;
  high: number;
  low: number;
  volatility: number;
  dir: "up" | "down" | "flat";
}

type SortField = "label" | "price" | "changePercent" | "volatility" | "volumeQuote" | "high" | "low";
type SortOrder = "asc" | "desc";

export default function AssetScreenerPage() {
  const { profile, loading } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // Screener settings
  const [searchQuery, setSearchQuery] = useState("");
  const [minChange, setMinChange] = useState(-15);
  const [maxChange, setMaxChange] = useState(15);
  const [minVolatility, setMinVolatility] = useState(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("volumeQuote");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // WebSocket state
  const [tickerMap, setTickerMap] = useState<Record<string, TickerData>>({});
  const [wsStatus, setWsStatus] = useState<"connecting" | "online" | "offline">("connecting");

  // Buffer and references for throttling
  const tickerBuffer = useRef<Record<string, TickerData>>({});
  const lastPrices = useRef<Record<string, number>>({});
  const dirty = useRef(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let flushInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;
    let retryCount = 0;

    // Throttle state flushes to 200ms
    flushInterval = setInterval(() => {
      if (isMounted && dirty.current) {
        setTickerMap((prev) => ({
          ...prev,
          ...tickerBuffer.current,
        }));
        dirty.current = false;
      }
    }, 200);

    const streams = SCREENER_ASSETS.map((a) => `${a.key.toLowerCase()}@ticker`).join("/");
    const url = `wss://data-stream.binance.vision/stream?streams=${streams}`;

    const connect = () => {
      if (!isMounted) return;
      setWsStatus("connecting");

      try {
        ws = new WebSocket(url);
      } catch (err) {
        console.error("WS connection error:", err);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        retryCount = 0;
        setWsStatus("online");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data;
          if (!data) return;

          const symbol = data.s as string;
          const config = SCREENER_ASSETS.find((a) => a.key === symbol);
          if (!config) return;

          const price = Number.parseFloat(data.c);
          const changePercent = Number.parseFloat(data.P);
          const volumeBase = Number.parseFloat(data.v);
          const volumeQuote = Number.parseFloat(data.q);
          const high = Number.parseFloat(data.h);
          const low = Number.parseFloat(data.l);

          // Calculate volatility proxy: (high - low) / low * 100
          const volatility = low > 0 ? ((high - low) / low) * 100 : 0;

          const prevPrice = lastPrices.current[symbol] ?? price;
          lastPrices.current[symbol] = price;

          tickerBuffer.current[symbol] = {
            symbol,
            label: config.label,
            price,
            changePercent,
            volumeBase,
            volumeQuote,
            high,
            low,
            volatility,
            dir: price > prevPrice ? "up" : price < prevPrice ? "down" : "flat",
          };
          dirty.current = true;
        } catch (err) {
          // ignore parsing errs
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setWsStatus("offline");
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (!isMounted) return;
      const delay = Math.min(1000 * 2 ** retryCount, 10000);
      retryCount++;
      reconnectTimeout = setTimeout(connect, delay);
    };

    connect();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (flushInterval) clearInterval(flushInterval);
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter and sort the 11 assets
  const filteredAndSortedAssets = useMemo(() => {
    const list = SCREENER_ASSETS.map((asset) => {
      return (
        tickerMap[asset.key] || {
          symbol: asset.key,
          label: asset.label,
          price: 0,
          changePercent: 0,
          volumeBase: 0,
          volumeQuote: 0,
          high: 0,
          low: 0,
          volatility: 0,
          dir: "flat" as const,
        }
      );
    });

    // Apply filtering
    return list
      .filter((asset) => {
        // Search filter
        const matchSearch = asset.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Change % filter
        const matchChange = asset.price === 0 || (asset.changePercent >= minChange && asset.changePercent <= maxChange);
        
        // Volatility filter
        const matchVolatility = asset.price === 0 || asset.volatility >= minVolatility;

        return matchSearch && matchChange && matchVolatility;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        valA = valA as number;
        valB = valB as number;

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [tickerMap, searchQuery, minChange, maxChange, minVolatility, sortField, sortOrder]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center font-mono text-xs tracking-widest text-slate-500 bg-[#05080f]">
        [ LOADING PROFILE... ]
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full px-4 py-8 md:px-8" style={{ backgroundColor: C.bg }}>
      <div className={`mx-auto flex w-full max-w-6xl flex-col gap-6 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center border"
              style={{ borderColor: C.cyan + "66", backgroundColor: C.cyan + "11", ...chamferMicro(6) }}
            >
              <Activity size={16} style={{ color: C.cyan }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-mono text-sm font-bold tracking-[0.3em] text-white md:text-base">
                ASSET <span style={{ color: C.cyan }}>SCREENER</span>
              </h1>
              <span className="mt-1 font-mono text-[9px] tracking-[0.35em] text-slate-500">
                LASTQUESTION.CO {"//"} REAL-TIME COCKPIT SCREENER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Radio size={12} style={{ color: wsStatus === "online" ? C.green : wsStatus === "connecting" ? C.gold : C.red }} strokeWidth={2} />
            <span
              className="font-mono text-[9px] tracking-[0.25em]"
              style={{ color: wsStatus === "online" ? C.green : wsStatus === "connecting" ? C.gold : C.red }}
            >
              WS FEED {wsStatus.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Filters Panel */}
        <Panel glowColor={C.cyan} size={12}>
          <CornerTicks color={C.cyan} />
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-4">
            
            {/* Search filter */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Search size={10} style={{ color: C.cyan }} /> CARI ASET
              </label>
              <div className="relative flex items-center bg-black/40 border border-slate-800" style={chamferMicro(4)}>
                <input
                  type="text"
                  placeholder="e.g. BTC, ETH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Min Change % filter */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1"><Percent size={10} style={{ color: C.cyan }} /> MIN PERUBAHAN 24H</span>
                <span className="text-white font-bold">{minChange}%</span>
              </label>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={minChange}
                onChange={(e) => setMinChange(Number.parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Max Change % filter */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1"><Percent size={10} style={{ color: C.cyan }} /> MAX PERUBAHAN 24H</span>
                <span className="text-white font-bold">{maxChange}%</span>
              </label>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={maxChange}
                onChange={(e) => setMaxChange(Number.parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Volatility filter */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1"><Flame size={10} style={{ color: C.gold }} /> MIN VOLATILITY</span>
                <span className="text-white font-bold">{minVolatility.toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={minVolatility}
                onChange={(e) => setMinVolatility(Number.parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

          </div>
        </Panel>

        {/* Main Screener Table */}
        <Panel glowColor={C.cyan} size={14}>
          <CornerTicks color={C.cyan} />
          <div className="overflow-x-auto p-1">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-500 uppercase tracking-wider text-[9px]">
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("label")}>
                    <div className="flex items-center gap-1.5">
                      ASSET <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("price")}>
                    <div className="flex items-center justify-end gap-1.5">
                      HARGA <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("changePercent")}>
                    <div className="flex items-center justify-end gap-1.5">
                      PERUBAHAN 24H <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("volatility")}>
                    <div className="flex items-center justify-end gap-1.5">
                      VOLATILITAS <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("volumeQuote")}>
                    <div className="flex items-center justify-end gap-1.5">
                      VOLUME (USDT) <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("high")}>
                    <div className="flex items-center justify-end gap-1.5">
                      TERTINGGI (24H) <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("low")}>
                    <div className="flex items-center justify-end gap-1.5">
                      TERENDAH (24H) <ArrowUpDown size={10} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-600 tracking-wider">
                      [ TIDAK ADA ASET YANG COCOK DENGAN KRITERIA FILTER ]
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedAssets.map((asset) => {
                    const isPriceZero = asset.price === 0;
                    const changeColor = asset.changePercent > 0 ? C.green : asset.changePercent < 0 ? C.red : "#94a3b8";
                    const isPriceUp = asset.dir === "up";
                    const isPriceDown = asset.dir === "down";

                    return (
                      <tr
                        key={asset.symbol}
                        className="border-b border-slate-900/60 hover:bg-[#111520]/40 transition-colors"
                      >
                        {/* Label */}
                        <td className="p-4 font-bold text-white">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-cyan-400" style={{ boxShadow: `0 0 6px ${C.cyan}` }} />
                            {asset.label}
                          </span>
                        </td>

                        {/* Price */}
                        <td
                          className="p-4 text-right font-bold transition-all duration-300"
                          style={{
                            color: isPriceUp ? C.green : isPriceDown ? C.red : "white",
                          }}
                        >
                          {isPriceZero ? (
                            <span className="text-slate-600">[ CONNECTING ]</span>
                          ) : (
                            `$${fmtPrice(asset.price)}`
                          )}
                        </td>

                        {/* Change % */}
                        <td className="p-4 text-right font-bold" style={{ color: changeColor }}>
                          {isPriceZero ? "—" : `${asset.changePercent > 0 ? "+" : ""}${asset.changePercent.toFixed(2)}%`}
                        </td>

                        {/* Volatility proxy */}
                        <td className="p-4 text-right text-slate-300">
                          {isPriceZero ? "—" : `${asset.volatility.toFixed(2)}%`}
                        </td>

                        {/* Volume Quote */}
                        <td className="p-4 text-right text-slate-400">
                          {isPriceZero ? "—" : `$${asset.volumeQuote.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                        </td>

                        {/* High */}
                        <td className="p-4 text-right text-slate-400 font-semibold">
                          {isPriceZero ? "—" : `$${fmtPrice(asset.high)}`}
                        </td>

                        {/* Low */}
                        <td className="p-4 text-right text-slate-400 font-semibold">
                          {isPriceZero ? "—" : `$${fmtPrice(asset.low)}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between font-mono text-[8.5px] tracking-[0.25em] text-slate-700">
          <span>LASTQUESTION © ASSET SCREENER</span>
          <span>CYBERPUNK ENGINE v1.2 :: LIVE</span>
        </footer>
      </div>

      {/* VIP lock overlay */}
      {!isVip && (
        <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
      )}

      {/* Upgrade modal */}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Asset Screener" />
    </main>
  );
}
