"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, Coins, Landmark, Globe, Activity } from "lucide-react";

const PAIRS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XAUUSD", "EURUSD"] as const;
type PairType = (typeof PAIRS)[number];

const SYMBOL_MAP: Record<PairType, string> = {
  BTCUSDT: "BINANCE:BTCUSDT",
  ETHUSDT: "BINANCE:ETHUSDT",
  SOLUSDT: "BINANCE:SOLUSDT",
  XAUUSD: "OANDA:XAUUSD",
  EURUSD: "FX:EURUSD",
};

function TradingViewWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget content
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.id = "tradingview-widget-inner";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "240",
      timezone: "Asia/Jakarta",
      theme: "dark",
      style: "1",
      locale: "id",
      enable_publishing: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}

export default function ChartPage() {
  const [selectedPair, setSelectedPair] = useState<PairType>("BTCUSDT");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getIcon = (pair: PairType) => {
    switch (pair) {
      case "BTCUSDT":
        return <Coins size={12} className="text-amber-400" />;
      case "ETHUSDT":
        return <Activity size={12} className="text-purple-400" />;
      case "SOLUSDT":
        return <TrendingUp size={12} className="text-emerald-400" />;
      case "XAUUSD":
        return <Landmark size={12} className="text-yellow-500" />;
      case "EURUSD":
        return <Globe size={12} className="text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SYSTEM // MARKET_CHARTS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Grafik <span className="text-cyan-300 text-glow-cyan">Pasar Real-Time</span>
        </h2>
        <p className="text-white/45 text-[11px] mt-1 leading-relaxed font-sans">
          Analisis pergerakan harga instrumen utama dunia secara langsung dengan indikator teknikal tingkat lanjut.
        </p>
      </div>

      {/* Keyboard keycaps style selector */}
      <div className="grid grid-cols-5 bg-[#05080f] p-1 border border-zinc-800/40 shadow-inner relative select-none">
        {PAIRS.map((pair) => {
          const isSelected = selectedPair === pair;
          const baseName = pair.replace("USDT", "").replace("USD", "");
          const quoteName = pair.endsWith("USDT") ? "USDT" : "USD";
          
          return (
            <button
              key={pair}
              onClick={() => setSelectedPair(pair)}
              className={`font-mono py-2 px-1 uppercase transition-all tracking-wider flex flex-col items-center justify-center cursor-pointer relative select-none rounded-[3px]
                ${
                  isSelected
                    ? "border-t border-x border-cyan-400 text-cyan-300 bg-cyan-950/20 z-10"
                    : "border-t border-x border-zinc-800/50 text-zinc-500 bg-zinc-950/40 hover:text-zinc-300"
                }
              `}
              style={{
                transform: isSelected ? "translateY(-1px)" : "translateY(1px)",
                boxShadow: isSelected
                  ? "0 -1px 0px 0px rgba(0, 240, 255, 0.4), 0 3px 0 0 #00F0FF, 0 8px 16px rgba(0, 240, 255, 0.15)"
                  : "0 3px 0 0 #18181b",
              }}
            >
              <div className="mb-1">{getIcon(pair)}</div>
              <span className="text-[10px] font-bold leading-none tracking-tight">{baseName}</span>
              <span className={`text-[7px] font-medium leading-none mt-0.5 tracking-tighter ${isSelected ? 'text-cyan-500/80' : 'text-zinc-600'}`}>
                {quoteName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart container with 4-corner cropped border (octagon shape) and absolute tactical accents */}
      <div className="relative p-[1px] bg-cyan-400/30 overflow-hidden octagon">
        <div className="w-full bg-[#0b0f18] h-[420px] overflow-hidden relative octagon">
          {/* Tactical Corner Accents - slightly offset from corners to clear octagon clip-path */}
          <div className="absolute top-[12px] left-[12px] w-2 h-2 border-t border-l border-cyan-400/60 z-20 pointer-events-none" />
          <div className="absolute top-[12px] right-[12px] w-2 h-2 border-t border-r border-cyan-400/60 z-20 pointer-events-none" />
          <div className="absolute bottom-[12px] left-[12px] w-2 h-2 border-b border-l border-cyan-400/60 z-20 pointer-events-none" />
          <div className="absolute bottom-[12px] right-[12px] w-2 h-2 border-b border-r border-cyan-400/60 z-20 pointer-events-none" />

          {mounted ? (
            <div key={selectedPair} className="h-full w-full">
              <TradingViewWidget symbol={SYMBOL_MAP[selectedPair]} />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs gap-3">
              <div className="w-6 h-6 border-2 border-t-cyan-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <span>MEMUAT_SISTEM_GRAFIK...</span>
            </div>
          )}
        </div>
      </div>

      {/* Additional details card */}
      <div className="chamfer border border-zinc-800/40 p-4 bg-[#0b0f18] relative">
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/40" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/40" />
        <h4 className="font-mono text-[10px] text-cyan-300 font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse rounded-full" />
          [ KONEKSI_PASAR // STABIL ]
        </h4>
        <p className="text-[11px] text-white/60 leading-relaxed font-sans">
          Sumber data langsung dari bursa utama dunia ({selectedPair.includes("USDT") ? "Binance" : selectedPair === "XAUUSD" ? "Oanda" : "FX/Oanda"}). TF default diatur pada 4 Jam (240m) untuk mendeteksi tren institusional mayor.
        </p>
      </div>
    </div>
  );
}
