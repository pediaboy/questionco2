import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Terminal, 
  Cpu, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Code2, 
  Activity, 
  TrendingUp
} from "lucide-react";

export const metadata = {
  title: "SYSTEM CORE: ABOUT US // LASTQUESTION.CO",
};

export default function AboutPage() {
  const stats = [
    { label: "[ SYSTEM ARCHITECTURE ]", value: "SMC-V4 CORE", icon: Cpu },
    { label: "[ OPERATIONAL UNITS ]", value: "3 DIVISIONS", icon: ShieldCheck },
    { label: "[ DATA BANDWIDTH ]", value: "REAL-TIME FLOW", icon: Activity },
  ];

  const features = [
    {
      title: "SMC AUTOMATED SIGNAL ENGINE",
      desc: "Sistem sinyal berbasis Smart Money Concepts (SMC) otomatis untuk memetakan market structure secara mekanis, order blocks, fair value gaps, dan likuiditas pada instrumen XAUUSD, BTCUSDT, ETHUSDT, dan SOLUSDT.",
      icon: Cpu,
      colorClass: "text-cyan-400",
      accentBorder: "border-cyan-400/25",
      accentBg: "bg-cyan-400/5",
    },
    {
      title: "LIVE MARKET TERMINAL",
      desc: "Layar monitor data intelijen real-time untuk memantau transaksi whale, likuiditas bursa kripto, volume market profile, dan anomali orderbook untuk membaca pergerakan institusi besar sebelum terjadi pergerakan signifikan.",
      icon: Terminal,
      colorClass: "text-purple-400",
      accentBorder: "border-purple-500/25",
      accentBg: "bg-purple-500/5",
    },
    {
      title: "COMMUNITY & LEADERBOARD",
      desc: "Ekosistem diskusi interaktif, leaderboard real-time, dan turnamen trading berkala untuk menguji konsistensi trading. Temukan tempat terbaik bertukar taktik dan intelijen bersama ribuan member aktif.",
      icon: Users,
      colorClass: "text-emerald-400",
      accentBorder: "border-emerald-500/25",
      accentBg: "bg-emerald-500/5",
    },
    {
      title: "TRADING EDUCATION",
      desc: "Modul bimbingan sistematis dari level dasar hingga strategi SMC tingkat lanjut. Dirancang untuk mencetak trader mandiri yang berfokus pada kedisiplinan tinggi, validitas data, dan manajemen risiko presisi.",
      icon: BookOpen,
      colorClass: "text-amber-400",
      accentBorder: "border-amber-500/25",
      accentBg: "bg-amber-500/5",
    },
  ];

  const teamRoles = [
    {
      role: "RESEARCH & ANALYST DECK",
      desc: "Melakukan kurasi harian, validasi sinyal algoritmik secara manual, riset fundamental makroekonomi, serta pemantauan volatilitas tinggi guna melindungi manajemen risiko modal anggota.",
      icon: TrendingUp,
    },
    {
      role: "SYSTEMS & ENGINEERING CORE",
      desc: "Mengembangkan algoritma pengolah data pasar tercepat, pemeliharaan server latensi rendah, serta integrasi bot notifikasi instan Telegram LASTQUESTION.",
      icon: Code2,
    },
    {
      role: "COMMUNITY OPERATIVES",
      desc: "Mengelola jalannya kompetisi, program edukasi terarah, serta mengasuh ekosistem forum diskusi agar tetap kondusif, beretika, dan produktif bagi pertumbuhan portofolio anggota.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        
        {/* Header HUD section */}
        <div className="text-center mb-8">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ ABOUT THE TEAM // LASTQUESTION.CO ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            SYSTEM ARCHITECTURE
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Mengenal pilar teknologi, visi operasional, dan divisi pendukung di balik platform LASTQUESTION.
          </p>
        </div>

        {/* HUD Data boxes */}
        <div className="flex flex-col gap-3 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="chamfer border border-cyan-400/20 bg-[#0b0f18] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] tracking-[0.15em] font-mono text-cyan-400/60 uppercase">
                    {stat.label}
                  </p>
                  <p className="font-mono font-bold text-base text-white mt-1 uppercase">
                    {stat.value}
                  </p>
                </div>
                <Icon className="text-cyan-400/50 w-5 h-5" />
              </div>
            );
          })}
        </div>

        {/* Section 1: Vision / Mission */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] font-mono text-cyan-400 mb-3 uppercase">
            [ EST. 2021 // SYSTEM VISION ]
          </p>
          <div className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide mb-3 flex items-center gap-2">
              <span className="text-cyan-400 font-mono">[01]</span> DEMOCRATIZING SIGNALS
            </h2>
            <p className="text-white/70 text-[12.5px] leading-relaxed font-sans">
              LASTQUESTION.CO berkomitmen meruntuhkan monopoli informasi trading kelas kakap. Kami hadir untuk **mendemokratisasi akses ke sinyal trading berstandar institusi** bagi para trader ritel di Indonesia. Menggabungkan ketajaman metode kuantitatif Smart Money Concepts (SMC) dengan kemudahan akses platform digital, kami melengkapi trader individu dengan amunisi data profesional untuk menghadapi dinamika market global.
            </p>
          </div>
        </div>

        {/* Section 2: Platform Capabilities (What the platform does) */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.2em] font-mono text-cyan-400 mb-3 uppercase">
            [ CORE PROTOCOL // PLATFORM CAPABILITIES ]
          </p>
          <div className="flex flex-col gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={i} 
                  className={`chamfer-sm border ${feature.accentBorder} ${feature.accentBg} p-4 relative overflow-hidden`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 border border-white/10 rounded bg-black/40 mt-0.5">
                      <Icon className={`${feature.colorClass} w-4 h-4`} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-white/60 text-[11.5px] leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Generic Team / Role divisions */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.2em] font-mono text-cyan-400 mb-3 uppercase">
            [ TEAM PROTOCOL // OPERATIONAL CORES ]
          </p>
          
          <div className="hud-card chamfer border border-purple-500/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide mb-3 flex items-center gap-2">
              <span className="text-purple-400 font-mono">[02]</span> HUMANS &amp; ALGORITHMS
            </h2>
            <p className="text-white/70 text-[12.5px] leading-relaxed font-sans mb-4">
              Dibalik ekosistem LASTQUESTION.CO, terdapat kolaborasi erat antara algoritma pemrosesan data pasar otomatis dan ketelitian tim profesional yang berpengalaman di sektor pasar keuangan sejak tahun 2021. Kami tidak menggunakan figur kepala rekaan; komitmen kami diletakkan sepenuhnya pada efisiensi operasional dan akurasi sistem.
            </p>
            
            <div className="border-t border-purple-500/15 pt-4 flex flex-col gap-4">
              {teamRoles.map((role, idx) => {
                const RoleIcon = role.icon;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-0.5">
                      <RoleIcon className="text-purple-400 w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-bold text-purple-300 tracking-wider">
                        {role.role}
                      </p>
                      <p className="text-white/60 text-[11px] mt-0.5 leading-normal">
                        {role.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
