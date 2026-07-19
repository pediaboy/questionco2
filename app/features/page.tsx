import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeatureGatingList from "@/components/FeatureGatingList";
import { Brain, Radio, TrendingUp, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Features Overview — LASTQUESTION.CO",
};

const TECH_HIGHLIGHTS = [
  {
    icon: Brain,
    title: "Institutional SMC Engine",
    desc: "Mesin sinyal otomatis dengan 16-point confluence check (market structure, order block, FVG, liquidity sweep) + ambang confidence 90% sebelum sinyal dikirim.",
  },
  {
    icon: Radio,
    title: "Real-time Signal Delivery",
    desc: "Sinyal VIP terkirim langsung ke dashboard & Telegram begitu confluence terpenuhi -- tanpa delay manual.",
  },
  {
    icon: TrendingUp,
    title: "Live Market Terminal",
    desc: "Whale-trade detection & liquidation flow real-time dari data publik Binance/OKX untuk 10 pair utama.",
  },
  {
    icon: ShieldCheck,
    title: "News-Aware Risk Filter",
    desc: "Sinyal otomatis diblokir 30 menit sebelum/sesudah rilis berita high-impact (ForexFactory calendar) untuk hindari volatilitas liar.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ CAPABILITY // OVERVIEW ]
          </span>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide mt-1">
            Fitur <span className="text-cyan-300 text-glow-cyan">Unggulan</span>
          </h1>
        </div>

        <div className="space-y-3 mb-8">
          {TECH_HIGHLIGHTS.map((f) => (
            <div key={f.title} className="chamfer-sm p-4 bg-[#0b0f18]/60 border border-cyan-400/20 flex gap-3">
              <div className="w-10 h-10 chamfer-sm bg-cyan-950/40 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <f.icon size={18} className="text-cyan-300" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-[13.5px] mb-1">{f.title}</h3>
                <p className="text-white/50 text-[11.5px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <FeatureGatingList />
      <Footer />
    </div>
  );
}
