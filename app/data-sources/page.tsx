import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Database, Globe2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "DATA SOURCES // TRANSPARENCY — LASTQUESTION.CO",
};

const PROVIDERS = [
  {
    name: "OKX Public Market API",
    description: "Menyediakan data lilin (candles) dan harga terkini (tickers) untuk BTC, ETH, SOL, serta XAUT-USDT sebagai proxy harga emas fisik untuk komputasi sinyal XAUUSD secara real-time. Platform juga tersambung ke WebSocket channel publik untuk pemantauan likuidasi paksa (liquidation-orders) secara langsung.",
    category: "Crypto & Gold Spot Data",
  },
  {
    name: "Binance Public SPOT Websocket",
    description: "Terhubung langsung ke data-stream.binance.vision untuk mendengarkan live ticker, deteksi transaksi whale dalam skala besar melalui stream aggTrade, serta mengamati kedalaman order book (order book depth) secara instan.",
    category: "Market Depth & Whale Detection",
  },
  {
    name: "TradingView Scanner Endpoints",
    description: "Memindai endpoint publik untuk pasar kripto, CFD, dan bursa Amerika (America scan markets). Data ini digunakan untuk menampilkan ticker harga langsung serta mendukung fungsionalitas halaman analisis ETF (/dashboard/etf).",
    category: "Multi-Asset Scanner & ETF",
  },
  {
    name: "ForexFactory Economic Calendar",
    description: "Mengonsumsi feed kalender ekonomi publik untuk mendeteksi peristiwa berita berdampak tinggi (high-impact news). Data ini krusial untuk memblokir aktivitas trading otomatis di sekitar rilis berita guna meminimalisir risiko slippage ekstrem.",
    category: "Economic News & Risk Control",
  },
];

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712] text-white">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="mb-6 text-center">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2 font-mono">
            [ SYSTEM_INFRASTRUCTURE // TRANSPARENCY ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            REAL-TIME DATA FEED
          </h1>
          <p className="text-white/45 text-[12px] mt-2 leading-relaxed font-mono max-w-[320px] mx-auto">
            Transparansi penuh mengenai infrastruktur data riil yang mentenagai feed platform kami. Seluruh koneksi bersifat publik dan bebas ketergantungan API key pihak ketiga yang berbayar.
          </p>
        </div>

        {/* Outer visual element */}
        <div className="relative border border-cyan-400/10 p-3 mb-6 bg-cyan-950/5 flex items-center gap-3">
          <div className="p-2 border border-cyan-400/20 bg-[#0b0f18] text-cyan-400 shrink-0">
            <Database size={18} />
          </div>
          <div className="font-mono text-[10.5px]">
            <p className="text-cyan-400 font-bold">[ SOURCE_INTEGRITY_VERIFIED ]</p>
            <p className="text-white/50">4 Active Nodes Connected Successfully</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">LIVE</span>
          </div>
        </div>

        {/* Providers grid/list */}
        <div className="flex flex-col gap-4">
          {PROVIDERS.map((p, idx) => (
            <div
              key={idx}
              className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-5 relative overflow-hidden"
            >
              {/* Corner accent decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-[9.5px] font-mono tracking-widest text-cyan-400/60 uppercase">
                  [{String(idx + 1).padStart(2, "0")} // {p.category}]
                </span>
                {/* Badge */}
                <div className="inline-flex items-center gap-1 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 text-[8.5px] font-mono text-cyan-300 tracking-wider">
                  <ShieldCheck size={9} />
                  PUBLIC / NO API KEY REQUIRED
                </div>
              </div>

              <h2 className="font-display font-bold text-base text-white tracking-wide mb-2 flex items-center gap-1.5">
                <Globe2 size={14} className="text-cyan-400/70" />
                {p.name}
              </h2>
              
              <p className="text-white/70 text-[11.5px] leading-relaxed font-sans">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
