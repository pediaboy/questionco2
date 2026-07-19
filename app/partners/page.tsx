import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Handshake, Building2, Link2, Terminal, ArrowRight } from "lucide-react";

export const metadata = {
  title: "PARTNER PORTAL // SINERGI — LASTQUESTION.CO",
};

export default function PartnersPage() {
  const opportunities = [
    {
      icon: Building2,
      title: "Broker Integrations",
      desc: "Integrasikan broker Anda ke ekosistem LASTQUESTION.CO. Dapatkan akses langsung ke komunitas trader aktif kami melalui skema penempatan eksklusif, kampanye volume trading, dan aktivasi kontes trading kustom.",
    },
    {
      icon: Link2,
      title: "Data Providers & APIs",
      desc: "Berkolaborasilah dengan mesin analisis kami. Kami menyambut data pakan (feed) pasar real-time, sinyal analitis on-chain, sentimen berita, dan wawasan institusional untuk melengkapi terminal kecerdasan data kami.",
    },
    {
      icon: Terminal,
      title: "Institutional White-label",
      desc: "Gunakan infrastruktur pengiriman sinyal bertenaga tinggi kami untuk mendistribusikan analisis atau sinyal buatan tim riset Anda secara langsung kepada audiens internal Anda dengan performa tanpa latensi.",
    },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ INSTITUTIONAL // PARTNERSHIP GATEWAY ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            PARTNER PORTAL
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Bangun sinergi strategis dan jangkau ekosistem finansial modern bersama LASTQUESTION.CO.
          </p>
        </div>

        {/* Portal Manifesto */}
        <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/60 p-5 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Handshake size={14} className="text-cyan-400" /> // SINERGI EKOSISTEM
          </h2>
          <p className="text-white/70 text-[12px] leading-relaxed">
            Sebagai platform kecerdasan pasar dan edukasi finansial yang terus berkembang pesat, kami selalu terbuka terhadap kemitraan strategis yang dapat meningkatkan nilai tambah bagi anggota kami dan mendorong kemajuan ekosistem perdagangan digital yang transparan dan andal.
          </p>
        </div>

        {/* Opportunity Tracks */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 border-b border-dashed border-cyan-400/20 pb-2">
            <h2 className="font-display font-bold text-xs tracking-widest text-cyan-400 uppercase">
              // KEMITRAAN YANG TERSEDIA
            </h2>
            <span className="text-[9px] font-mono text-cyan-400/50">3 OPPORTUNITIES</span>
          </div>

          <div className="space-y-3">
            {opportunities.map((track) => {
              const Icon = track.icon;
              return (
                <div key={track.title} className="chamfer-sm p-4 bg-[#0b0f18]/40 border border-cyan-400/15 flex gap-3">
                  <div className="w-10 h-10 chamfer-sm bg-cyan-950/20 border border-cyan-400/25 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-cyan-400/80" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-[13px] mb-1">{track.title}</h3>
                    <p className="text-white/50 text-[11.5px] leading-relaxed">{track.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action Box */}
        <div className="chamfer p-5 border border-cyan-400/25 bg-cyan-950/10 relative text-center">
          <h3 className="font-display font-bold text-base text-white mb-2 uppercase tracking-wide">
            Diskusikan Kolaborasi Anda
          </h3>
          <p className="text-white/60 text-[12px] leading-relaxed mb-4 max-w-[280px] mx-auto">
            Apakah Anda perwakilan broker, penyedia data pasar, atau pengembang infrastruktur analitik? Tim kami siap mendiskusikan peluang kolaborasi khusus.
          </p>
          <Link
            href="/contact"
            className="chamfer-btn w-full flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-[11px] tracking-widest py-3.5 transition-all"
          >
            [ CONTACT PARTNERSHIP TEAM ] <ArrowRight size={13} />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
