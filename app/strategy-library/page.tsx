import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  BookOpen,
  TrendingUp,
  Layers,
  GraduationCap,
} from "lucide-react";

export const metadata = {
  title: "TACTICAL PLAYBOOK // STRATEGY LIBRARY — LASTQUESTION.CO",
};

interface StrategyTopic {
  id: string;
  title: string;
  subtitle: string;
  conceptCode: string;
  iconType: "BookOpen" | "TrendingUp" | "Layers" | "GraduationCap";
  explanation: string;
}

const STRATEGY_TOPICS: StrategyTopic[] = [
  {
    id: "smc_01",
    title: "Market Structure (BOS & CHOCH)",
    subtitle: "Pilar Utama Aliran Harga Institusi",
    conceptCode: "[ SMC-MS ]",
    iconType: "TrendingUp",
    explanation: "Struktur pasar adalah pondasi utama analisis SMC. Break of Structure (BOS) mengonfirmasi kelanjutan tren searah ketika harga berhasil menembus swing high atau swing low sebelumnya secara solid. Sebaliknya, Change of Character (CHOCH) menandai sinyal awal pembalikan arah tren atau perubahan karakter pergerakan harga. Mengidentifikasi CHOCH dan BOS secara akurat membantu scalper menghindari jebakan koreksi sementara."
  },
  {
    id: "smc_02",
    title: "Institutional Order Blocks (OB)",
    subtitle: "Zona Transaksi Volume Besar",
    conceptCode: "[ SMC-OB ]",
    iconType: "Layers",
    explanation: "Order Block merupakan jejak area harga di mana institusi finansial besar menyuntikkan pesanan beli atau jual dalam jumlah masif. OB biasanya diidentifikasi sebagai lilin (candle) turun terakhir sebelum pergerakan naik yang kuat, atau lilin naik terakhir sebelum penurunan tajam. Ketika harga kembali ke area ini (mitigasi), ketidakseimbangan order yang tersisa sering kali memicu respons pembalikan arah yang presisi."
  },
  {
    id: "smc_03",
    title: "Fair Value Gaps (FVG)",
    subtitle: "Imbalance Likuiditas Pasar",
    conceptCode: "[ SMC-FVG ]",
    iconType: "BookOpen",
    explanation: "Fair Value Gap (FVG) terjadi ketika pergerakan harga yang sangat cepat dan impulsif menciptakan ketidakseimbangan (imbalance) likuiditas, menyisakan rentang harga di mana transaksi hanya didominasi oleh satu pihak (pembeli saja atau penjual saja). FVG terdeteksi pada pola tiga candle, di mana terdapat celah kosong antara sumbu (wick) candle pertama dan ketiga. Harga cenderung kembali ditarik ke area FVG ini untuk memulihkan efisiensi pasar sebelum melanjutkan trennya."
  },
  {
    id: "smc_04",
    title: "Liquidity Sweeps",
    subtitle: "Pembersihan Stop-Loss Ritel",
    conceptCode: "[ SMC-LS ]",
    iconType: "GraduationCap",
    explanation: "Institusi besar membutuhkan likuiditas tinggi untuk mengisi posisi raksasa mereka tanpa menggeser harga terlalu jauh. Liquidity Sweep adalah manipulasi harga yang disengaja untuk menembus level support/resistance ritel yang menampung tumpukan stop-loss (selayaknya buy stops di atas swing high atau sell stops di bawah swing low). Setelah likuiditas tersapu, harga akan segera berbalik arah secara instan dan agresif."
  },
  {
    id: "smc_05",
    title: "Premium & Discount Zones",
    subtitle: "Rasio Fibonacci Optimal Entry",
    conceptCode: "[ SMC-PD ]",
    iconType: "Layers",
    explanation: "Menggunakan rentang ukur (dealing range) dari swing low ke swing high saat ini, area dibagi menjadi dua wilayah utama: wilayah Premium (di atas level keseimbangan 50%) dan wilayah Discount (di bawah level 50%). Sesuai aturan perdagangan logis institusi, kita hanya mencari peluang penjualan (short) saat harga berada di area Premium (mahal) dan peluang pembelian (long) saat harga berada di area Discount (murah/diskon) untuk mengoptimalkan potensi profit."
  },
  {
    id: "smc_06",
    title: "Multi-Indicator Confluence",
    subtitle: "Konfirmasi Momentum & Filter Trend",
    conceptCode: "[ SMC-MIC ]",
    iconType: "TrendingUp",
    explanation: "Meskipun SMC sangat bergantung pada struktur harga murni, platform kami mengintegrasikannya dengan indikator teknikal matematis untuk konfirmasi ekstra. Kami memadukan EMA 200 sebagai penentu bias tren makro, VWAP (Volume Weighted Average Price) untuk memvalidasi nilai wajar sesi intraday, serta indikator RSI, ADX, dan MACD untuk mengukur kekuatan tren dan mendeteksi divergensi momentum sebelum mengeksekusi scalping."
  },
  {
    id: "smc_07",
    title: "ATR-Based Risk Management",
    subtitle: "Konsistensi Stop-Loss Berbasis Volatilitas",
    conceptCode: "[ SMC-ATR ]",
    iconType: "BookOpen",
    explanation: "Scalping yang sukses membutuhkan konsistensi risiko yang sangat ketat. Teknik manajemen risiko kami menggunakan indikator Average True Range (ATR) untuk menghitung jarak stop-loss secara dinamis berdasarkan tingkat volatilitas aktual market. Dengan mengukur ATR, besaran jarak stop-loss disesuaikan secara presisi agar tidak mudah tersapu noise pasar, sementara volume ukuran lot disesuaikan secara otomatis demi mempertahankan risiko risiko tetap seragam di setiap transaksi."
  }
];

export default function StrategyLibraryPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712] font-mono selection:bg-cyan-400/30 selection:text-white">
      <Header />
      
      <main className="pt-[104px] px-5 pb-6">
        
        {/* Title Section */}
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-cyan-400 uppercase">
            [ TACTICAL PLAYBOOK // SYSTEM STRATEGY ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wider mt-1">
            STRATEGY LIBRARY
          </h1>
          <p className="text-white/45 text-[11.5px] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Dokumentasi taktis mengenai metodologi trading Smart Money Concepts (SMC) dan analisis kuantitatif yang dijalankan di platform kami.
          </p>
        </div>

        {/* Hero Concept Summary card */}
        <div className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
          <h2 className="font-display font-bold text-sm text-white tracking-widest mb-2 uppercase flex items-center gap-2">
            <GraduationCap className="text-cyan-400 w-4 h-4" /> INSTITUTIONAL SCALPING
          </h2>
          <p className="text-white/70 text-[11px] leading-relaxed">
            Strategi trading kami difokuskan pada pengenalan jejak transaksi pelaku pasar institusi besar (Smart Money) di pasar berjangka. Menggabungkan ketajaman aksi harga murni (Price Action) dengan konfirmasi matematis yang ketat untuk mengidentifikasi skenario rasio Risk-to-Reward tinggi dalam skala waktu intraday.
          </p>
        </div>

        {/* List of Concepts / Library Cards */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-dashed border-cyan-400/15 pb-2">
            <BookOpen className="text-cyan-400 w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
              INDEX MATERI STRATEGI
            </span>
          </div>

          {STRATEGY_TOPICS.map((topic) => {
            // Dynamically select the icon based on iconType field
            let IconComponent = BookOpen;
            if (topic.iconType === "TrendingUp") IconComponent = TrendingUp;
            else if (topic.iconType === "Layers") IconComponent = Layers;
            else if (topic.iconType === "GraduationCap") IconComponent = GraduationCap;

            return (
              <div 
                key={topic.id}
                className="chamfer-sm border border-cyan-400/10 bg-[#0b0f18]/40 p-4 transition-all duration-300 hover:border-cyan-400/20"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-cyan-950/30 border border-cyan-400/15 flex items-center justify-center shrink-0">
                      <IconComponent className="text-cyan-400 w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xs text-white tracking-wide uppercase leading-tight">
                        {topic.title}
                      </h3>
                      <span className="text-[9px] text-white/40 block">
                        {topic.subtitle}
                      </span>
                    </div>
                  </div>
                  
                  <span className="text-[8.5px] font-bold font-mono text-cyan-400/60 tracking-wider">
                    {topic.conceptCode}
                  </span>
                </div>

                {/* Explanation Paragraph */}
                <p className="text-white/70 text-[11px] leading-relaxed border-l border-cyan-400/15 pl-2.5 mt-2.5">
                  {topic.explanation}
                </p>
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}
