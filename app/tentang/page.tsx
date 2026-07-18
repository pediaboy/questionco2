import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Users, TrendingUp, Cpu, ExternalLink } from "lucide-react";

export const metadata = {
  title: "MISSION CONTROL // TENTANG — LASTQUESTION.CO",
};

export default function TentangPage() {
  // TODO: wire to live Supabase count when available
  const stats = [
    { label: "[ ACTIVE OPERATIVES ]", value: "1,204 Members", icon: Users },
    { label: "[ TOTAL TRADES ]", value: "45,900+ Executed", icon: TrendingUp },
    { label: "[ SYSTEM UPTIME ]", value: "99.9%", icon: Cpu },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ EST. 2021 // SYSTEM MANIFESTO ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            MISSION CONTROL
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Pusat kendali operasional, koordinasi intelijen, dan sinergi ekosistem finansial.
          </p>
        </div>

        {/* Hero animation */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
          {/* Rotating dashed outer ring */}
          <div className="absolute inset-0 border border-dashed border-cyan-400/40 rounded-full animate-[spin_25s_linear_infinite]"></div>
          {/* Rotating dashed inner ring (opposite direction) */}
          <div className="absolute inset-4 border border-dashed border-purple-500/30 rounded-full animate-[spin_35s_linear_infinite_reverse]"></div>
          {/* Concentric grid lines */}
          <div className="absolute inset-10 border border-cyan-400/10 rounded-full bg-cyan-950/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-dashed border-cyan-400/20"></div>
          </div>
          
          {/* Pulsing Dots (distribution nodes) */}
          <div className="absolute top-4 left-1/2 -ml-1.5 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f0ff]" />
          <div className="absolute top-4 left-1/2 -ml-1.5 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f0ff] animate-ping" />

          <div className="absolute bottom-10 left-6 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_#b026ff] animate-[pulse_1.5s_infinite_ease-in-out_200ms]" />
          <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#00f0ff] animate-[pulse_2s_infinite_ease-in-out_600ms]" />
        </div>
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.15em] font-mono text-cyan-400/70 uppercase">
            [ GLOBAL NETWORK VISUALIZATION ]
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
                  <p className="font-mono font-bold text-lg text-white mt-1 uppercase">
                    {stat.value}
                  </p>
                </div>
                <Icon className="text-cyan-400/50 w-6 h-6" />
              </div>
            );
          })}
        </div>

        {/* Card A & Card B stacked */}
        <div className="flex flex-col gap-6">
          {/* Card A */}
          <div className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide mb-3 flex items-center gap-2">
              <span className="text-cyan-400 font-mono">[01]</span> VISION &amp; MISSION
            </h2>
            <p className="text-white/70 text-[12.5px] leading-relaxed font-sans">
              LASTQUESTION.CO didirikan pada tahun 2021 sebagai pusat komando taktis dan wadah kolaboratif bagi para pelaku pasar kripto dan forex. Misi utama kami adalah menyediakan akses instan ke intelijen pasar berakurasi tinggi, memfasilitasi pertukaran strategi secara real-time, dan mengikis ketimpangan informasi di era digital. Melalui ekosistem terenkripsi dan riset tanpa henti, kami memandu setiap anggota untuk mematangkan navigasi risiko dan menguasai pergerakan market secara mandiri.
            </p>
          </div>

          {/* Card B */}
          <div className="hud-card chamfer border border-purple-500/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide mb-3 flex items-center gap-2">
              <span className="text-purple-400 font-mono">[02]</span> ECOSYSTEM PARTNER
            </h2>
            <p className="text-white/70 text-[12.5px] leading-relaxed font-sans mb-4">
              RITELCOMMUNITY merupakan pilar pendukung utama ekosistem kami yang berfokus penuh pada instrumen pasar saham domestik (IHSG). Di bawah naungan visi besar LASTQUESTION, RITELCOMMUNITY menyajikan edukasi fundamental, diskusi emiten, dan analisis mendalam untuk memaksimalkan potensi investasi saham ritel di Indonesia. Keduanya saling terintegrasi guna membangun ketahanan finansial multiaset yang tangguh.
            </p>
            <a
              href="https://ritelcommunity.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn inline-flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 font-mono text-[11px] tracking-widest py-2.5 px-4 w-full transition-all"
            >
              VISIT RITELCOMMUNITY <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
