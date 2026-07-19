import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { UserPlus, ShieldCheck, Globe2, Database, Rocket } from "lucide-react";

export const metadata = {
  title: "ONBOARDING // SYSTEM DEPLOYMENT — LASTQUESTION.CO",
};

const STEPS = [
  {
    number: "01",
    title: "Daftar Akun Web (Gratis)",
    desc: "Buat ID protokol unik Anda dalam hitungan detik tanpa biaya pendaftaran melalui halaman registrasi.",
    icon: UserPlus,
    badge: "FREE ID",
    linkText: "Buka Registrasi",
    linkUrl: "/register",
  },
  {
    number: "02",
    title: "Verifikasi Akun & Hubungkan Broker",
    desc: "Hubungkan akun broker partner resmi kami (Valetax / Broker) untuk validasi sinkronisasi sistem. Sistem AI kami mendeteksi status pendaftaran dan membuka akses secara otomatis.",
    icon: ShieldCheck,
    badge: "AUTOMATIC VERIFICATION",
  },
  {
    number: "03",
    title: "Eksplorasi Dashboard Utama",
    desc: "Masuk ke panel utama untuk melihat visualisasi data real-time, grafik interaktif, analisis pasar komprehensif, serta fungsionalitas dashboard ETF (/dashboard/etf).",
    icon: Globe2,
    badge: "DATA VISUALIZATION",
  },
  {
    number: "04",
    title: "Hubungkan Telegram di /settings",
    desc: "Daftarkan username Telegram Anda di menu pengaturan (/settings) untuk menerima integrasi notifikasi sinyal instan dan alert volatilitas pasar tanpa delay.",
    icon: Database,
    badge: "ALERT INTEGRATION",
    linkText: "Ke Pengaturan",
    linkUrl: "/settings",
  },
  {
    number: "05",
    title: "Gunakan Watchlist & Sinyal",
    desc: "Tambahkan instrumen favorit Anda di menu /watchlist dan pantau rilis sinyal dengan presisi tinggi melalui panel khusus di /dashboard/sinyal.",
    icon: Rocket,
    badge: "LIVE SIGNALS",
    linkText: "Lihat Sinyal",
    linkUrl: "/dashboard/sinyal",
  },
  {
    number: "06",
    title: "Upgrade VIP (Opsional)",
    desc: "Buka filter algoritma canggih, parameter analisis terdalam, dan dapatkan akses penuh sinyal premium eksklusif tanpa batasan dengan beralih ke level VIP.",
    icon: ShieldCheck,
    badge: "PREMIUM ACCESS",
    linkText: "Lihat Paket VIP",
    linkUrl: "/vip",
  },
];

export default function OnboardingPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712] text-white">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="mb-8 text-center">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2 font-mono">
            [ SYSTEM_DEPLOYMENT // ONBOARDING ]
          </p>
          <h1 className="font-display font-bold text-white text-[24px] leading-tight uppercase tracking-wide">
            MISSION ONBOARDING
          </h1>
          <p className="text-white/45 text-[12px] mt-2 leading-relaxed font-mono max-w-[320px] mx-auto">
            Panduan komprehensif langkah-demi-langkah untuk mengaktifkan seluruh fungsionalitas sistem dan memulai navigasi pasar Anda.
          </p>
        </div>

        {/* Steps container */}
        <div className="flex flex-col gap-5 mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-5 relative overflow-hidden"
              >
                {/* Visual grid overlay */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full border border-cyan-400/30 bg-[#05080F] flex items-center justify-center text-[10px] font-mono font-bold text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
                      {step.number}
                    </span>
                    <div>
                      <span className="text-[8.5px] font-mono tracking-widest text-cyan-400/60 uppercase block">
                        [{step.badge}]
                      </span>
                      <h3 className="font-display font-bold text-[13.5px] text-white uppercase tracking-wider leading-tight">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <Icon size={16} className="text-cyan-400/60 shrink-0 mt-0.5" />
                </div>

                {/* Card Body */}
                <p className="text-white/70 text-[11.5px] leading-relaxed font-sans mb-3">
                  {step.desc}
                </p>

                {/* Inline step CTA if exists */}
                {step.linkUrl && step.linkText && (
                  <Link
                    href={step.linkUrl}
                    className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-mono text-[10.5px] uppercase tracking-wider font-semibold transition-colors duration-200"
                  >
                    [&gt; {step.linkText}]
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Global CTA */}
        <div className="max-w-sm mx-auto mt-10">
          <Link
            href="/register"
            className="chamfer-btn w-full block text-center bg-cyan-400 hover:bg-cyan-300 text-black font-display font-bold text-[13.5px] tracking-[0.1em] py-4 transition-all duration-200 active:scale-[0.99]"
          >
            [ DAFTAR AKUN SEKARANG - GRATIS ]
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
