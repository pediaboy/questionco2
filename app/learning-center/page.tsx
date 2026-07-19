import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  GraduationCap,
  BookOpen,
  Layers,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "PORTAL ACADEMY // LEARNING CENTER — LASTQUESTION.CO",
};

interface ModuleInfo {
  name: string;
  duration: string;
  isBasic: boolean;
  description: string;
}

interface CategoryGroup {
  category: "Fundamental" | "Teknikal" | "Psikologi";
  description: string;
  modules: ModuleInfo[];
}

const PREVIEW_MODULES_DATA: CategoryGroup[] = [
  {
    category: "Fundamental",
    description: "Analisis fundamental ekosistem makro ekonomi, rilis berita kunci, serta mekanisme pergerakan harga komparatif.",
    modules: [
      {
        name: "Dasar Forex",
        duration: "15 Menit",
        isBasic: true,
        description: "Pengenalan dasar pasar foreign exchange, mekanisme trading, dan pemahaman dasar pips & leverage."
      },
      {
        name: "Membaca Berita Ekonomi",
        duration: "25 Menit",
        isBasic: false,
        description: "Cara menganalisis kalender ekonomi global, mengukur dampak rilis suku bunga FOMC, NFP, dan inflasi CPI."
      }
    ]
  },
  {
    category: "Teknikal",
    description: "Pemetaan pergerakan harga menggunakan instrumen visual, pemahaman pola candlestick, dan rasio matematis presisi.",
    modules: [
      {
        name: "Analisa Candlestick",
        duration: "20 Menit",
        isBasic: true,
        description: "Memahami formasi candlestick tunggal dan kombinasi (pinbar, engulfing, doji) sebagai sinyal pembalikan harga."
      },
      {
        name: "Support & Resistance",
        duration: "30 Menit",
        isBasic: false,
        description: "Teknik memetakan level penawaran dan permintaan kunci menggunakan swing highs/lows dan garis tren."
      },
      {
        name: "Fibonacci Advanced",
        duration: "35 Menit",
        isBasic: false,
        description: "Penerapan rasio Fibonacci retracement dan extension untuk mengidentifikasi area entri optimal dan target profit."
      }
    ]
  },
  {
    category: "Psikologi",
    description: "Pertahanan mentalitas trading, manajemen risiko modal yang kokoh, serta pencegahan bias emosional.",
    modules: [
      {
        name: "Manajemen Risiko",
        duration: "18 Menit",
        isBasic: true,
        description: "Aturan posisi ukuran lot yang aman, menetapkan rasio Risk-to-Reward minimum 1:2, dan menjaga modal Anda."
      },
      {
        name: "Psikologi Trading Pro",
        duration: "22 Menit",
        isBasic: false,
        description: "Mengatasi bias emosional seperti FOMO (Fear of Missing Out) dan balas dendam (revenge trading) setelah kerugian."
      }
    ]
  }
];

export default function LearningCenterPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712] font-mono selection:bg-cyan-400/30 selection:text-white">
      <Header />
      
      <main className="pt-[104px] px-5 pb-6">
        
        {/* Title Section */}
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.25em] font-semibold text-cyan-400 uppercase">
            [ PORTAL ACADEMY // LEARNING CENTER ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wider mt-1">
            PREVIEW KURIKULUM
          </h1>
          <p className="text-white/45 text-[11.5px] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Eksplorasi modul edukasi taktis LASTQUESTION.CO yang dirancang khusus untuk mematangkan akurasi trading Anda.
          </p>
        </div>

        {/* Hero Visual Hub */}
        <div className="relative w-full py-4 flex flex-col items-center justify-center mb-6 border border-dashed border-cyan-400/10 bg-cyan-950/5 chamfer-sm">
          <GraduationCap className="text-cyan-400 w-10 h-10 mb-2 animate-pulse" />
          <p className="text-[10px] tracking-[0.15em] font-mono text-cyan-400/70 uppercase">
            [ INTEL COMPILATION ACTIVE ]
          </p>
          <div className="text-[11px] text-white/50 text-center mt-1 px-4 max-w-[280px]">
            Platform membagi kurikulum menjadi <span className="text-cyan-400 font-bold">2 Tingkatan Akses</span>: Modul Dasar (Gratis) dan Modul Lanjutan (VIP).
          </div>
        </div>

        {/* Kurikulum Skill Paths (Basic vs Advanced) */}
        <div className="flex flex-col gap-4 mb-8">
          
          {/* Path 1: Basic */}
          <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18]/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="text-cyan-400 w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-xs tracking-wider text-white uppercase">
                1. JALUR DASAR (FREE)
              </h3>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed">
              Materi orientasi dasar pasar forex, membaca candlestick, dan pondasi paling vital yaitu manajemen risiko lot & drawdown. Tersedia langsung untuk pengguna terdaftar.
            </p>
          </div>

          {/* Path 2: VIP Advanced */}
          <div className="chamfer-sm border border-purple-500/20 bg-[#0b0f18]/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="text-purple-400 w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-xs tracking-wider text-white uppercase">
                2. JALUR LANJUTAN (VIP)
              </h3>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed">
              Strategi tingkat lanjut meliputi analisis berita ekonomi makro presisi, identifikasi level supply & demand institusional, penggunaan instrumen Fibonacci, serta kontrol bias psikologis pro.
            </p>
          </div>
        </div>

        {/* Module Categories Directory */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-cyan-400 w-4 h-4 shrink-0" />
            <h2 className="text-xs font-bold tracking-widest text-cyan-300 uppercase">
              DIREKTORI MODUL PREVIEW
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {PREVIEW_MODULES_DATA.map((group, index) => (
              <div 
                key={index}
                className="chamfer-sm border border-cyan-400/10 bg-[#0b0f18]/40 p-4 relative"
              >
                {/* Visual Corner Anchors */}
                <div className="absolute top-[2px] left-[2px] w-1.5 h-1.5 border-t border-l border-cyan-400/30" />
                <div className="absolute bottom-[2px] right-[2px] w-1.5 h-1.5 border-b border-r border-cyan-400/30" />

                {/* Category Header */}
                <div className="border-b border-dashed border-cyan-400/15 pb-2.5 mb-3">
                  <span className="text-[9px] tracking-wider font-bold text-cyan-400 block mb-0.5">
                    [ KATEGORI // {group.category.toUpperCase()} ]
                  </span>
                  <p className="text-white/40 text-[10.5px] leading-relaxed">
                    {group.description}
                  </p>
                </div>

                {/* List of Modules */}
                <div className="flex flex-col gap-2.5">
                  {group.modules.map((module, mIndex) => (
                    <div 
                      key={mIndex}
                      className="border border-cyan-400/5 bg-black/35 p-3 chamfer-sm relative overflow-hidden"
                    >
                      {/* Left vertical status line */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          module.isBasic ? "bg-cyan-400/60" : "bg-purple-500/40"
                        }`} 
                      />

                      <div className="pl-1.5">
                        {/* Title & Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white tracking-wide truncate">
                            {module.name}
                          </span>
                          
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase ${
                            module.isBasic 
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20" 
                              : "bg-purple-500/10 text-purple-300 border border-purple-400/20"
                          }`}>
                            {module.isBasic ? "FREE" : "VIP"}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-white/60 text-[10.5px] leading-relaxed mb-1.5">
                          {module.description}
                        </p>

                        {/* Duration Metadata */}
                        <div className="text-[9px] text-white/35 font-mono">
                          DURASI ESTIMASI: {module.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Conversion Box */}
        <div className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/90 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-2.5">
            <GraduationCap className="text-cyan-400 w-5 h-5 shrink-0" />
            <span className="text-xs font-bold text-white tracking-wider font-mono">
              [ ACCESS CONTROL // REGISTRATION REQUIRED ]
            </span>
          </div>

          <p className="text-white/70 text-[11.5px] leading-relaxed mb-4">
            Materi di atas merupakan peta kurikulum asli yang berjalan di platform internal kami. Untuk membaca penuh penjelasan, menonton video instruksi, dan mengikuti ujian evaluasi, Anda wajib memiliki akun aktif. 
            <br /><br />
            Silakan lakukan registrasi akun gratis sekarang juga untuk memulai dari tingkat dasar.
          </p>

          <Link
            href="/register"
            className="chamfer-btn block w-full text-center bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-black font-bold text-[11px] tracking-widest py-3.5 transition-all"
          >
            [ DAFTAR AKUN BARU ]
          </Link>
          
          <div className="text-center mt-3">
            <Link 
              href="/login" 
              className="text-[9.5px] text-cyan-400/60 hover:text-cyan-300 transition-colors tracking-wider uppercase underline"
            >
              SUDAH MEMILIKI AKUN? SYSTEM LOGIN
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
