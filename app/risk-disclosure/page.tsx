import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RiskDisclosureContent from "@/components/RiskDisclosureContent";
import { AlertTriangle } from "lucide-react";

export const metadata = {
  title: "RISK DISCLOSURE // PENGUNGKAPAN RISIKO — LASTQUESTION.CO",
};

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-purple-400 mb-2">
            [ RISK CAPABILITY // MARKET VOLATILITY ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide flex items-center justify-center gap-2">
            <AlertTriangle className="text-purple-400 w-6 h-6 animate-bounce" /> RISK DISCLOSURE
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Pengungkapan risiko perdagangan aset finansial digital dengan fokus volatilitas tinggi pada market kripto (BTC, ETH, SOL, dsb).
          </p>
        </div>

        <div className="hud-card chamfer border border-purple-500/20 bg-[#0b0f18]/90 p-4 mb-6">
          <p className="text-[10.5px] tracking-[0.1em] font-mono text-purple-400/70 mb-2 uppercase">
            [ CRYPTOCURRENCY RISK BRIEFING ]
          </p>
          <p className="text-white/70 text-[12px] leading-relaxed">
            Perdagangan aset kripto (termasuk Bitcoin, Ethereum, Solana, dan aset digital lainnya) memiliki volatilitas yang jauh lebih ekstrem dibanding pasar tradisional. Anda berisiko kehilangan seluruh modal dalam waktu singkat akibat guncangan pasar, slippage, serta fluktuasi likuiditas global.
          </p>
        </div>

        <RiskDisclosureContent />
      </main>
      <Footer />
    </div>
  );
}
