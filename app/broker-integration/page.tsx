import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Handshake, CheckCircle2, Award, ExternalLink, Cpu } from "lucide-react";

export const metadata = {
  title: "BROKER INTEGRATION — LASTQUESTION.CO",
};

export default function BrokerIntegrationPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ ECOSYSTEM // BROKER COMPATIBILITY ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            BROKER INTEGRATION
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Sistem sinyal otomatis LASTQUESTION.CO didesain untuk kompatibilitas universal dan eksekusi presisi tinggi.
          </p>
        </div>

        {/* Compatibility Alert */}
        <div className="chamfer-sm border border-cyan-400/20 bg-cyan-950/10 p-4 mb-6 flex gap-3">
          <Cpu className="text-cyan-400 w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-bold text-white text-[12px] uppercase tracking-wide mb-1">
              Kompatibilitas Universal
            </h3>
            <p className="text-white/60 text-[11px] leading-relaxed">
              Sinyal kami mencakup parameter lengkap: <span className="text-cyan-300">Entry, Stop Loss (SL), dan Take Profit (TP)</span>. Parameter ini dapat dieksekusi secara manual maupun otomatis pada semua broker yang mendukung platform MT4/MT5.
            </p>
          </div>
        </div>

        {/* Official Partner Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 border-b border-dashed border-cyan-400/20 pb-2">
            <h2 className="font-display font-bold text-xs tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
              <Handshake size={14} /> // MITRA BROKER RESMI
            </h2>
            <span className="text-[9px] font-mono text-emerald-400">ACTIVE PARTNER</span>
          </div>

          <div className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-[18px] text-white tracking-wider">VALETAX</span>
              <span className="text-[9px] font-mono bg-cyan-400/10 text-cyan-300 px-2 py-0.5 border border-cyan-400/30">
                OFFICIAL PARTNER
              </span>
            </div>

            <p className="text-white/70 text-[12px] leading-relaxed mb-4">
              Valetax adalah satu-satunya mitra broker resmi LASTQUESTION.CO saat ini. Kami mengintegrasikan sistem registrasi Valetax langsung ke portal kami demi pengalaman pengguna yang lancar dan terenkripsi.
            </p>

            {/* Partner Code Box */}
            <div className="mb-4">
              <span className="text-[9px] font-mono text-cyan-400/70 uppercase block mb-1">
                [ KODE MITRA RESMI // PARTNER CODE ]
              </span>
              <div className="flex items-center justify-between bg-cyan-950/20 border border-cyan-400/30 px-3 py-2.5 chamfer-sm font-mono">
                <span className="font-bold text-lg text-cyan-300 tracking-widest">3038902</span>
                <span className="text-[9.5px] text-white/40 uppercase">VALIDATED CODE</span>
              </div>
            </div>

            {/* Benefits of Partner Registration */}
            <div className="space-y-2 mb-5">
              <span className="text-[9px] font-mono text-cyan-400/70 uppercase block">
                [ BENEFIT REGISTRASI MITRA ]
              </span>
              <div className="flex gap-2 text-[11.5px] text-white/60">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>Memenuhi syarat kelayakan untuk mengikuti Kontes Lot-Volume berhadiah eksklusif.</span>
              </div>
              <div className="flex gap-2 text-[11.5px] text-white/60">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>Konektivitas eksekusi sinyal real-time yang stabil dan bebas konflik kepentingan.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/upgrade"
                className="chamfer-btn text-center bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-[11px] tracking-widest py-3 transition-all"
              >
                [ UPGRADE / REGISTER VIA IFRAME ]
              </Link>
              <a
                href="https://ma.valetax.com/embed/register/block/Wx7aDnkGc1qc%2Fvw4nQRo2iUVqM6yrg%2Bto38T2btOGOXt%2Bm1CEd2IBn83c26UII77f67NdAs0AQ4lpigT24UVQ2FQxz6r67jvgCUWt5eNG4Cb%2FpUyD2OOWzmsHhAxkbf5?lang=id"
                target="_blank"
                rel="noopener noreferrer"
                className="chamfer-btn text-center border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/5 font-mono text-[10px] py-2.5 transition-all flex items-center justify-center gap-1"
              >
                REGISTRASI DIREK <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Future Integrations / Info Section */}
        <div className="chamfer-sm p-5 border border-white/10 bg-[#0b0f18]/40 relative">
          <h3 className="font-display font-bold text-sm text-white/80 mb-2 flex items-center gap-1.5 uppercase">
            <Award size={14} className="text-purple-400" /> Integrasi Masa Depan
          </h3>
          <p className="text-white/50 text-[11.5px] leading-relaxed">
            Kami berkomitmen untuk memperluas jangkauan ekosistem kami. Integrasi dengan broker tepercaya tambahan saat ini sedang direncanakan dan melewati proses audit ketat untuk menjamin keamanan likuiditas, transparansi eksekusi order, serta proteksi saldo anggota kami.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
