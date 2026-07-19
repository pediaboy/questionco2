import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RiskDisclosureContent from "@/components/RiskDisclosureContent";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "RISK DISCLAIMER // PENYANGKALAN RISIKO — LASTQUESTION.CO",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ LEGAL PROTOCOL // GENERAL DISCLAIMER ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide flex items-center justify-center gap-2">
            <ShieldAlert className="text-cyan-400 w-6 h-6 animate-pulse" /> RISK DISCLAIMER
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Pernyataan penyangkalan risiko resmi untuk seluruh layanan, produk, analisis, dan platform komunikasi LASTQUESTION.CO.
          </p>
        </div>

        <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/90 p-4 mb-6">
          <p className="text-[10.5px] tracking-[0.1em] font-mono text-cyan-400/70 mb-2 uppercase">
            [ NOTIFIKASI UMUM ]
          </p>
          <p className="text-white/70 text-[12px] leading-relaxed">
            Harap baca seluruh dokumen disclaimer ini dengan saksama. Dengan mengakses dan menggunakan platform kami, Anda secara sadar memahami, menyetujui, dan mengikatkan diri pada seluruh poin penolakan jaminan dan pembatasan tanggung jawab yang tertera di bawah.
          </p>
        </div>

        <RiskDisclosureContent />
      </main>
      <Footer />
    </div>
  );
}
