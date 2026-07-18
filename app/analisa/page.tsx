import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalisaClient from "./AnalisaClient";

export const metadata = {
  title: "MARKET INTEL & ANALYTICS — LASTQUESTION.CO",
  description: "Live market intelligence dashboard, technical indicators, and daily fundamental briefs for Forex, Crypto, and Commodities.",
};

export default function AnalisaPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#05080F]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-2 text-cyan-400">
            [ INTEL_HUB // SECTOR_ANALYSIS ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            Market Intelligence
          </h1>
          <p className="text-white/45 text-[12px] mt-1.5 max-w-[300px] mx-auto leading-relaxed">
            Real-time market charts, trend indexes, and tactical technical briefings.
          </p>
        </div>

        <AnalisaClient />
      </main>
      <Footer />
    </div>
  );
}
