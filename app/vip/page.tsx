import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VipPricing from "@/components/VipPricing";

export const metadata = {
  title: "ELITE PROTOCOL: UNLOCKED — LASTQUESTION.CO",
};

export default function VipPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-8">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-3" style={{ color: "#FFD700" }}>
            [ CLEARANCE_LEVEL // VIP ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            Elite Protocol:
            <br />
            <span style={{ color: "#FFD700", textShadow: "0 0 16px rgba(255,215,0,0.4)" }}>
              Unlocked
            </span>
          </h1>
          <p className="text-white/45 text-[12.5px] mt-4 max-w-[300px] mx-auto leading-relaxed">
            Akses sinyal eksklusif, live trading, dan analisa tanpa delay.
          </p>
        </div>

        <VipPricing />
      </main>
      <Footer />
    </div>
  );
}
