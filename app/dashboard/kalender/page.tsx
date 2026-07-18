"use client";

import React, { useEffect, useRef } from "react";
import { Calendar, BellRing, Info } from "lucide-react";

export default function KalenderPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const widgetContainer = containerRef.current;
    // Clear any previous children
    widgetContainer.innerHTML = "";

    const scriptContainer = document.createElement("div");
    scriptContainer.className = "tradingview-widget-container__widget w-full h-[500px]";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "500",
      colorTheme: "dark",
      isTransparent: true,
      locale: "id",
      importanceFilter: "-1,0,1",
      countryFilter: "us,eu,gb,jp,id",
    });

    widgetContainer.appendChild(scriptContainer);
    widgetContainer.appendChild(script);

    return () => {
      if (widgetContainer) {
        widgetContainer.innerHTML = "";
      }
    };
  }, []);

  const fallbackEvents = [
    {
      title: "Non-Farm Employment Change (NFP)",
      frequency: "Setiap Jumat Pertama Akhir Bulan/Awal Bulan",
      impact: "HIGH (USD)",
      desc: "Mengukur perubahan jumlah tenaga kerja sektor non-pertanian di AS. Pemicu volatilitas tertinggi di market forex.",
    },
    {
      title: "FOMC Rate Decision & Press Conference",
      frequency: "8 Kali Per Tahun (Hari Rabu/Kamis Dini Hari WIB)",
      impact: "CRITICAL (USD)",
      desc: "Pengumuman suku bunga Federal Reserve dan pidato arah kebijakan ekonomi AS. Menentukan trend jangka panjang.",
    },
    {
      title: "Consumer Price Index (CPI) Inflation",
      frequency: "Bulanan (Sekitar tanggal 10-15 setiap bulan)",
      impact: "HIGH (USD)",
      desc: "Indikator utama inflasi konsumen di AS. Sangat memengaruhi spekulasi kenaikan/penurunan suku bunga FOMC.",
    },
  ];

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ DECK // ECONOMIC CALENDAR ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Kalender <span className="text-cyan-300 text-glow-cyan">Ekonomi</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Pantau jadwal rilis data ekonomi penting global secara real-time.
        </p>
      </div>

      {/* TradingView Widget Container */}
      <div className="chamfer bg-[#0b0f18]/60 border border-white/10 p-4 relative mb-6">
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-bold tracking-wider text-cyan-300 font-mono uppercase">
            [ TRADINGVIEW LIVE CALENDAR ]
          </span>
        </div>

        {/* This is where the widget renders */}
        <div 
          ref={containerRef} 
          className="w-full min-h-[500px] overflow-hidden bg-black/30 rounded"
        />
      </div>

      {/* Recurrent Major Events fallback/reference */}
      <div className="mb-4 mt-8 flex items-center gap-3">
        <span className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold uppercase font-mono">
          [ EVENT UTAMA RECURRING ]
        </span>
        <div className="flex-1 h-px bg-cyan-400/20" />
      </div>

      <div className="space-y-4">
        {fallbackEvents.map((item, idx) => (
          <div 
            key={idx} 
            className="chamfer-sm bg-[#0b0f18]/60 border border-cyan-400/10 p-4 relative"
          >
            <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 border-t border-l border-cyan-400/40" />
            <div className="absolute bottom-[3px] right-[3px] w-1.5 h-1.5 border-b border-r border-cyan-400/40" />

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-white font-display">
                {item.title}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 font-mono font-bold bg-red-950/40 border border-red-500/40 text-red-400 uppercase rounded">
                {item.impact}
              </span>
            </div>

            <div className="text-[10px] font-mono text-cyan-300/80 mb-1.5 flex items-center gap-1">
              <BellRing className="w-3 h-3 text-cyan-400" />
              Jadwal: {item.frequency}
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-cyan-950/10 border border-cyan-400/10 rounded-sm flex items-start gap-2">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="text-[10px] text-cyan-300/60 font-mono">
          Catatan: Pastikan koneksi internet stabil untuk meload data TradingView secara live. Widget di atas menggunakan waktu lokal browser Anda.
        </span>
      </div>
    </div>
  );
}
