"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, Coins, Landmark, Calendar, Hash } from "lucide-react";

type MarketType = "FOREX" | "CRYPTO" | "COMMODITIES";

const BRIEF_CARDS: Record<
  MarketType,
  { date: string; text: string; tags: string[] }[]
> = {
  FOREX: [
    {
      date: "[ 19.JUL.2026 / 08:00 WIB ]",
      text: "EURUSD sedang berkonsolidasi di dekat area support psikologis 1.0850 setelah rilis data retail sales AS yang lebih kuat dari perkiraan. Indikator RSI menunjukkan kondisi jenuh jual (oversold) pada timeframe 4 jam, membuka peluang technical rebound jangka pendek menuju resistance 1.0920.",
      tags: ["#EURUSD", "#CONSOLIDATION", "#REBOUND"],
    },
    {
      date: "[ 18.JUL.2026 / 21:30 WIB ]",
      text: "Pasangan mata uang GBPUSD berhasil bertahan di atas level support dinamis EMA 50 harian. Jika penutupan lilin harian berada di atas 1.2910, momentum bullish kemungkinan besar akan berlanjut dengan target terdekat di zona supply 1.3000.",
      tags: ["#GBPUSD", "#BULLISH", "#EMA50"],
    },
    {
      date: "[ 18.JUL.2026 / 14:15 WIB ]",
      text: "USDJPY kembali menghadapi tekanan jual yang signifikan setelah Bank of Japan memberikan sinyal hawkish tambahan mengenai kebijakan suku bunga. Pergerakan menembus ke bawah level 155.00 mengonfirmasi kelanjutan tren bearish jangka menengah.",
      tags: ["#USDJPY", "#BEARISH", "#BOJ"],
    },
  ],
  CRYPTO: [
    {
      date: "[ 19.JUL.2026 / 08:00 WIB ]",
      text: "Bitcoin (BTCUSD) kembali menguji batas atas pola descending triangle di kisaran $92,500. Volume perdagangan yang stabil menunjukkan potensi breakout jika harga mampu bertahan di atas level EMA 200 timeframe 1 jam untuk sesi harian ini.",
      tags: ["#BTCUSD", "#BREAKOUT", "#EMA200"],
    },
    {
      date: "[ 18.JUL.2026 / 23:45 WIB ]",
      text: "Ethereum (ETHUSD) memperlihatkan formasi bullish divergence pada indikator MACD di grafik harian. Area $3,450 kini bertindak sebagai support kuat, sementara penembusan resistance $3,600 akan memicu short squeeze menuju level psikologis berikutnya.",
      tags: ["#ETHUSD", "#ACCUMULATION", "#MACD"],
    },
    {
      date: "[ 18.JUL.2026 / 16:20 WIB ]",
      text: "Solana (SOLUSD) menunjukkan performa mengesankan dengan kenaikan volume sebesar 25% dalam 24 jam terakhir. Pola cup and handle yang terbentuk pada grafik 4 jam mengindikasikan kelanjutan tren naik menuju target teoritis di $185.",
      tags: ["#SOLUSD", "#BULLISH", "#CUPANDHANDLE"],
    },
  ],
  COMMODITIES: [
    {
      date: "[ 19.JUL.2026 / 08:00 WIB ]",
      text: "Harga Emas (XAUUSD) merayap naik mendekati rekor tertinggi sepanjang masa di $2,480 per troy ounce di tengah meningkatnya ketegangan geopolitik di Timur Tengah dan spekulasi pemangkasan suku bunga Fed. Breakout di atas level ini akan membuka jalan menuju target psikologis $2,500.",
      tags: ["#XAUUSD", "#BULLISH", "#BREAKOUT"],
    },
    {
      date: "[ 18.JUL.2026 / 19:10 WIB ]",
      text: "Minyak mentah WTI (USOIL) terpantau melemah ke level $78.20 setelah peningkatan tak terduga dalam stok persediaan minyak mentah domestik AS. Tekanan jual diperkirakan mereda jika harga mendekati zona demand penting di kisaran $76.50 - $77.00.",
      tags: ["#USOIL", "#BEARISH", "#INVENTORY"],
    },
    {
      date: "[ 18.JUL.2026 / 11:30 WIB ]",
      text: "Perak (XAGUSD) berhasil mengonfirmasi pola double bottom di level support $29.00. Konfirmasi penutupan harga di atas resistance jangka pendek $30.20 berpotensi memicu reli lanjutan menuju level target berikutnya di kisaran harga $31.50.",
      tags: ["#XAGUSD", "#DOUBLEBOTTOM", "#REVERSAL"],
    },
  ],
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

export default function AnalisaClient() {
  const [activeTab, setActiveTab] = useState<MarketType>("FOREX");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSymbol = (tab: MarketType) => {
    switch (tab) {
      case "FOREX":
        return "FX:EURUSD";
      case "CRYPTO":
        return "BINANCE:BTCUSDT";
      case "COMMODITIES":
        return "OANDA:XAUUSD";
    }
  };

  const getIcon = (tab: MarketType) => {
    switch (tab) {
      case "FOREX":
        return <Landmark size={14} />;
      case "CRYPTO":
        return <Coins size={14} />;
      case "COMMODITIES":
        return <TrendingUp size={14} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Mechanical-keyboard style tabs container */}
      <div className="flex bg-[#05080f] p-1 border border-zinc-800/40 relative shadow-inner">
        {(["FOREX", "CRYPTO", "COMMODITIES"] as MarketType[]).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[11px] font-bold py-3 px-2 uppercase transition-all tracking-wider flex-1 flex items-center justify-center gap-1.5 cursor-pointer relative select-none
                ${
                  isSelected
                    ? "border-t border-x border-cyan-400 text-cyan-300 bg-cyan-950/20 shadow-[0_3px_0_0_#00F0FF] translate-y-[-2px] z-10"
                    : "border-t border-x border-zinc-800 text-zinc-500 bg-zinc-950/40 shadow-[0_3px_0_0_#27272a] hover:text-zinc-300"
                }
              `}
              style={{
                // active pressed feeling
                transform: isSelected ? "translateY(-1px)" : "translateY(1px)",
                boxShadow: isSelected
                  ? "0 -1px 0px 0px rgba(0, 240, 255, 0.4), 0 3px 0 0 #00F0FF, 0 8px 16px rgba(0, 240, 255, 0.15)"
                  : "0 3px 0 0 #18181b",
              }}
            >
              {getIcon(tab)}
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Embedded Chart inside nested double clip-path wrappers to get a perfect border along the clipped shape */}
      <div
        className="relative p-[1px] bg-cyan-400/30 overflow-hidden"
        style={{
          clipPath:
            "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
        }}
      >
        <div
          className="w-full bg-[#0b0f18] h-[360px] overflow-hidden relative"
          style={{
            clipPath:
              "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
          }}
        >
          {mounted ? (
            <TradingViewWidget symbol={getSymbol(activeTab)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs">
              LOADING CHARTS_SYS...
            </div>
          )}
        </div>
      </div>

      {/* Fundamental Briefs Section */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-dashed border-zinc-800 pb-2">
          <div className="h-2 w-2 bg-cyan-400 animate-pulse rounded-full" />
          <h2 className="font-display font-bold text-[14px] text-white tracking-widest uppercase">
            FUNDAMENTAL_BRIEFS_LATEST
          </h2>
        </div>

        <div className="flex flex-col gap-3.5">
          {BRIEF_CARDS[activeTab].map((card, idx) => (
            <div
              key={idx}
              className="hud-card chamfer border border-zinc-800/40 p-4 bg-[#0b0f18] flex flex-col gap-2.5 transition-all hover:border-cyan-400/40"
            >
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] tracking-wider">
                <Calendar size={11} className="text-cyan-400" />
                <span>{card.date}</span>
              </div>
              <p className="text-white/70 text-[12px] leading-relaxed font-sans">
                {card.text}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center font-mono text-[9.5px] text-cyan-300/80 border border-cyan-400/25 px-1.5 py-0.5"
                  >
                    <Hash size={9} className="mr-0.5 text-cyan-400/60" />
                    {tag.replace("#", "")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
