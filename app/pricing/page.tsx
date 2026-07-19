import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VipPricing from "@/components/VipPricing";
import FeatureGatingList from "@/components/FeatureGatingList";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata = {
  title: "Pricing Plans — LASTQUESTION.CO",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ MEMBERSHIP // PRICING ]
          </span>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide mt-1">
            Pilih <span className="text-cyan-300 text-glow-cyan">Level Akses</span>
          </h1>
          <p className="text-white/45 text-[12.5px] mt-3 max-w-[300px] mx-auto leading-relaxed">
            Mulai gratis, upgrade kapan saja untuk akses sinyal real-time dan fitur institusional penuh.
          </p>
        </div>

        {/* Free tier summary */}
        <div className="chamfer p-5 bg-[#0b0f18]/60 border border-white/10 relative mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-bold text-white text-base">FREE MEMBER</span>
            <span className="text-white font-mono font-bold">Rp 0</span>
          </div>
          <ul className="space-y-1.5 text-[12px] text-white/50">
            <li className="flex items-center gap-2">
              <Check size={13} className="text-cyan-300 shrink-0" /> Leaderboard &amp; Kontes Publik
            </li>
            <li className="flex items-center gap-2">
              <Check size={13} className="text-cyan-300 shrink-0" /> Kalender Ekonomi &amp; Sesi Market
            </li>
            <li className="flex items-center gap-2">
              <Check size={13} className="text-cyan-300 shrink-0" /> Kelas Trading Dasar
            </li>
            <li className="flex items-center gap-2 text-white/25">
              <X size={13} className="shrink-0" /> Sinyal Live Real-time (VIP only)
            </li>
            <li className="flex items-center gap-2 text-white/25">
              <X size={13} className="shrink-0" /> Crypto Terminal Whale Flow (VIP only)
            </li>
          </ul>
          <Link href="/register" className="chamfer-btn bg-white/10 text-white text-[11px] font-bold px-4 py-2.5 mt-4 block text-center">
            DAFTAR GRATIS
          </Link>
        </div>

        <VipPricing />
      </main>

      <FeatureGatingList />
      <Footer />
    </div>
  );
}
