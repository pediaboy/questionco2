"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, chamfer, chamferMicro, fmtPrice, fmtQty, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { Layers, Activity, Radio, Info } from "lucide-react";
import { motion } from "framer-motion";

// Major assets for liquidity heatmap
const HEATMAP_ASSETS = [
  { key: "BTCUSDT", label: "BTC/USDT", queryKey: "btcusdt" },
  { key: "ETHUSDT", label: "ETH/USDT", queryKey: "ethusdt" },
  { key: "SOLUSDT", label: "SOL/USDT", queryKey: "solusdt" },
  { key: "XRPUSDT", label: "XRP/USDT", queryKey: "xrpusdt" },
  { key: "ADAUSDT", label: "ADA/USDT", queryKey: "adausdt" },
  { key: "DOGEUSDT", label: "DOGE/USDT", queryKey: "dogeusdt" },
] as const;

interface AssetDepth {
  bids: [number, number][]; // [price, qty]
  asks: [number, number][]; // [price, qty]
  lastUpdate: number;
}

export default function LiquidityHeatmapPage() {
  const { profile, loading } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  // States
  const [depths, setDepths] = useState<Record<string, AssetDepth>>({});
  const [wsStatus, setWsStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [hoveredLevel, setHoveredLevel] = useState<{
    asset: string;
    type: "bid" | "ask";
    price: number;
    qty: number;
    percent: number;
  } | null>(null);

  // Ref for buffering updates to throttle React re-renders
  const depthsBuffer = useRef<Record<string, AssetDepth>>({});
  const dirty = useRef(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let flushInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;
    let retryCount = 0;

    // Flush buffer to state every 250ms
    flushInterval = setInterval(() => {
      if (isMounted && dirty.current) {
        setDepths((prev) => ({
          ...prev,
          ...depthsBuffer.current,
        }));
        dirty.current = false;
      }
    }, 250);

    const streams = HEATMAP_ASSETS.map((a) => `${a.queryKey}@depth20@100ms`).join("/");
    const url = `wss://data-stream.binance.vision/stream?streams=${streams}`;

    const connect = () => {
      if (!isMounted) return;
      setWsStatus("connecting");

      try {
        ws = new WebSocket(url);
      } catch (err) {
        console.error("WS Connection error:", err);
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
          const stream = payload.stream as string;
          const data = payload.data;
          if (!stream || !data) return;

          // Find which asset match this stream
          const asset = HEATMAP_ASSETS.find((a) => stream.startsWith(a.queryKey));
          if (!asset) return;

          const rawBids = data.bids as [string, string][] | undefined;
          const rawAsks = data.asks as [string, string][] | undefined;
          if (!rawBids || !rawAsks) return;

          const parsedBids = rawBids.map(
            ([p, q]) => [Number.parseFloat(p), Number.parseFloat(q)] as [number, number]
          );
          const parsedAsks = rawAsks.map(
            ([p, q]) => [Number.parseFloat(p), Number.parseFloat(q)] as [number, number]
          );

          depthsBuffer.current[asset.key] = {
            bids: parsedBids,
            asks: parsedAsks,
            lastUpdate: Date.now(),
          };
          dirty.current = true;
        } catch (err) {
          // Silent parsing error
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
              <Layers size={16} style={{ color: C.cyan }} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-mono text-sm font-bold tracking-[0.3em] text-white md:text-base">
                LIQUIDITY <span style={{ color: C.cyan }}>HEATMAP</span>
              </h1>
              <span className="mt-1 font-mono text-[9px] tracking-[0.35em] text-slate-500">
                LASTQUESTION.CO {"//"} ORDER BOOK DEPTH SPECTRUM
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

        {/* Info card */}
        <Panel glowColor={C.cyan} size={10} className="w-full">
          <CornerTicks color={C.cyan} />
          <div className="flex flex-col gap-2 p-4 font-mono text-xs leading-relaxed text-slate-400">
            <div className="flex items-center gap-2 text-white">
              <Info size={14} style={{ color: C.cyan }} />
              <span className="text-[10px] font-bold uppercase tracking-wider">[ PETUNJUK LIQUIDITY HEATMAP ]</span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-400">
              Visualisasi kedalaman order book secara real-time. Bagian kiri{" "}
              <span style={{ color: C.cyan }}>CYAN</span> menunjukkan antrean beli (Bids) dan bagian kanan{" "}
              <span style={{ color: C.gold }}>GOLD</span> menunjukkan antrean jual (Asks). Kecerahan dan kejenuhan warna
              pada tiap bar strip dihitung berdasarkan rasio volume di harga tersebut terhadap volume terbesar pada buku
              order aset bersangkutan. Warna yang lebih terang melambangkan likuiditas dinding (order wall) yang lebih besar.
            </p>
          </div>
        </Panel>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {HEATMAP_ASSETS.map((asset) => {
            const data = depths[asset.key];
            if (!data) {
              return (
                <Panel key={asset.key} glowColor={C.iron} size={12} className="h-64">
                  <CornerTicks color={C.iron} />
                  <div className="flex h-full w-full items-center justify-center font-mono text-[10px] tracking-widest text-slate-600">
                    [ CONNECTING FEED FOR {asset.label}... ]
                  </div>
                </Panel>
              );
            }

            // Slice top 10 bids & asks
            const sliceBids = data.bids.slice(0, 10);
            const sliceAsks = data.asks.slice(0, 10);

            // Calculate max volume for relative opacity
            const bidVolumes = sliceBids.map(([_, q]) => q);
            const askVolumes = sliceAsks.map(([_, q]) => q);
            const maxVol = Math.max(...bidVolumes, ...askVolumes, 0.0001);

            // Bids are sorted descending (e.g. 100, 99, 98) -> reverse to ascending (98, 99, 100)
            const chronologicalBids = [...sliceBids].reverse();
            // Asks are already sorted ascending (e.g. 101, 102, 103)
            const chronologicalAsks = sliceAsks;

            const lastPrice = sliceBids[0] && sliceAsks[0] ? (sliceBids[0][0] + sliceAsks[0][0]) / 2 : 0;

            return (
              <Panel key={asset.key} glowColor={C.cyan} size={12} contentClassName="flex flex-col p-4">
                <CornerTicks color={C.cyan} />
                
                {/* Panel Header */}
                <div className="mb-4 flex items-center justify-between font-mono min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold tracking-wider text-white min-w-0 break-words">{asset.label}</span>
                    <span className="text-[8px] tracking-widest text-slate-500">BINANCE PUBLIC ORDER DEPTH</span>
                  </div>
                  <div className="text-right min-w-0">
                    <span className="text-xs font-bold tracking-wider min-w-0 break-words" style={{ color: C.cyan }}>
                      ${fmtPrice(lastPrice)}
                    </span>
                    <div className="text-[8px] tracking-widest text-slate-500">MID PRICE</div>
                  </div>
                </div>

                {/* Heatmap spectrum container */}
                <div className="relative mb-4 flex flex-col gap-2">
                  <div className="text-left font-mono text-[8px] uppercase tracking-widest text-slate-500">
                    Kedalaman Buku Order (Spektrum)
                  </div>
                  
                  {/* Heatmap Bar Strip */}
                  <div className="flex h-10 w-full overflow-hidden border border-slate-800/80 bg-black/40 p-1" style={chamferMicro(4)}>
                    {/* Bids strip (Cyan spectrum, sorted ascending by price, low price to mid) */}
                    <div className="flex flex-1 gap-[2px]">
                      {chronologicalBids.map(([price, qty], idx) => {
                        const ratio = qty / maxVol;
                        const opacity = 0.15 + ratio * 0.85;
                        return (
                          <div
                            key={`bid-${idx}`}
                            className="h-full flex-1 transition-all duration-300 hover:scale-y-110 cursor-crosshair"
                            style={{
                              backgroundColor: C.cyan,
                              opacity: opacity,
                              boxShadow: ratio > 0.7 ? `0 0 6px ${C.cyan}` : "none",
                            }}
                            onMouseEnter={() =>
                              setHoveredLevel({
                                asset: asset.label,
                                type: "bid",
                                price,
                                qty,
                                percent: ratio * 100,
                              })
                            }
                            onMouseLeave={() => setHoveredLevel(null)}
                          />
                        );
                      })}
                    </div>

                    {/* Mid separator */}
                    <div className="mx-1 h-full w-[1px] bg-slate-700" />

                    {/* Asks strip (Gold spectrum, sorted ascending by price, mid to high price) */}
                    <div className="flex flex-1 gap-[2px]">
                      {chronologicalAsks.map(([price, qty], idx) => {
                        const ratio = qty / maxVol;
                        const opacity = 0.15 + ratio * 0.85;
                        return (
                          <div
                            key={`ask-${idx}`}
                            className="h-full flex-1 transition-all duration-300 hover:scale-y-110 cursor-crosshair"
                            style={{
                              backgroundColor: C.gold,
                              opacity: opacity,
                              boxShadow: ratio > 0.7 ? `0 0 6px ${C.gold}` : "none",
                            }}
                            onMouseEnter={() =>
                              setHoveredLevel({
                                asset: asset.label,
                                type: "ask",
                                price,
                                qty,
                                percent: ratio * 100,
                              })
                            }
                            onMouseLeave={() => setHoveredLevel(null)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Heatmap axis labels */}
                  <div className="flex items-center justify-between font-mono text-[7px] text-slate-500">
                    <span>${fmtPrice(chronologicalBids[0]?.[0] || 0)}</span>
                    <span className="text-center font-bold text-slate-400">MID</span>
                    <span>${fmtPrice(chronologicalAsks[chronologicalAsks.length - 1]?.[0] || 0)}</span>
                  </div>
                </div>

                {/* Micro Level Stats List */}
                <div className="flex flex-col gap-1.5 font-mono text-[9px] text-slate-400">
                  <div className="flex justify-between border-b border-slate-800/50 pb-1 text-[8px] font-bold tracking-widest text-slate-500">
                    <span>LEVEL HARGA</span>
                    <span>KUANTITAS (QTY)</span>
                  </div>
                  
                  {/* Top Ask (best depth block) */}
                  <div className="flex justify-between text-red-400 min-w-0">
                    <span className="min-w-0 break-words">ASK [Jual] ${fmtPrice(sliceAsks[0]?.[0] || 0)}</span>
                    <span className="font-bold text-slate-300 min-w-0 break-words">{fmtQty(sliceAsks[0]?.[1] || 0)}</span>
                  </div>

                  {/* Top Bid (best depth block) */}
                  <div className="flex justify-between text-emerald-400 min-w-0">
                    <span className="min-w-0 break-words">BID [Beli] ${fmtPrice(sliceBids[0]?.[0] || 0)}</span>
                    <span className="font-bold text-slate-300 min-w-0 break-words">{fmtQty(sliceBids[0]?.[1] || 0)}</span>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>

        {/* Active Tooltip Widget */}
        <div className="h-10 mt-2">
          {hoveredLevel ? (
            <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400 border border-slate-800/40 p-2 bg-black/40 rounded min-w-0">
              <span className="text-white font-bold min-w-0 break-words">{hoveredLevel.asset}</span>
              <span>•</span>
              <span className="min-w-0 break-words">Tipe: <span style={{ color: hoveredLevel.type === "bid" ? C.cyan : C.gold }} className="font-bold uppercase">{hoveredLevel.type === "bid" ? "Beli (Bid)" : "Jual (Ask)"}</span></span>
              <span>•</span>
              <span className="min-w-0 break-words">Harga: <span className="text-white font-bold">${fmtPrice(hoveredLevel.price)}</span></span>
              <span>•</span>
              <span className="min-w-0 break-words">Volume: <span className="text-white font-bold">{fmtQty(hoveredLevel.qty)}</span></span>
              <span>•</span>
              <span className="min-w-0 break-words">Kedalaman Relatif: <span className="text-white font-bold">{hoveredLevel.percent.toFixed(1)}%</span></span>
            </div>
          ) : (
            <div className="flex items-center justify-center font-mono text-[9px] text-slate-500 italic p-2 border border-dashed border-slate-900">
              [ Arahkan kursor pada bar strip heatmap untuk menampilkan rincian kedalaman order book ]
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between font-mono text-[8.5px] tracking-[0.25em] text-slate-700">
          <span>LASTQUESTION © LIQUIDITY GRID</span>
          <span>CYBERPUNK ENGINE v1.2 :: LIVE</span>
        </footer>
      </div>

      {/* VIP lock overlay */}
      {!isVip && (
        <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
      )}

      {/* Upgrade modal */}
      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Liquidity Heatmap" />
    </main>
  );
}
