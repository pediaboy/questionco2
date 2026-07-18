import Link from "next/link";

const STEPS = [
  {
    title: "Daftar akun web (Gratis)",
    desc: "Buat ID protokol unik Anda dalam hitungan detik tanpa biaya pendaftaran.",
  },
  {
    title: "Buka dashboard",
    desc: "Masuk ke panel utama untuk melihat visualisasi data, analisis pasar, dan sinyal live.",
  },
  {
    title: "Ikuti panduan aktivasi (Valetax / Broker)",
    desc: "Hubungkan akun broker partner resmi kami untuk validasi sinkronisasi sistem.",
  },
  {
    title: "Terverifikasi otomatis",
    desc: "Sistem AI kami mendeteksi status pendaftaran dan membuka akses VIP secara instan.",
  },
];

export default function OnboardingSection() {
  return (
    <section className="px-5 py-12 border-t border-dashed border-cyan-400/15">
      <div className="text-center mb-10">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-400/70 font-semibold mb-2">
          [ JOIN_PROTOCOL ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          CARA GABUNG BROTHERHOOD.
        </h2>
      </div>

      <div className="flex flex-col gap-0 max-w-sm mx-auto mb-10">
        {STEPS.map((step, idx) => {
          const isLast = idx === STEPS.length - 1;
          return (
            <div key={idx} className="flex gap-4 relative">
              {/* Left timeline line and dot */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border border-cyan-400/40 bg-[#05080F] flex items-center justify-center text-xs font-mono font-bold text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.15)] shrink-0 z-10">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                {!isLast && (
                  <div className="w-0 flex-1 border-l border-dashed border-cyan-400/30 my-2" />
                )}
              </div>

              {/* Right content */}
              <div className="pb-8 pt-1 flex-1">
                <h3 className="font-display font-bold text-[13.5px] text-white tracking-wide uppercase">
                  {step.title}
                </h3>
                <p className="text-white/45 text-[11px] leading-relaxed mt-1.5 font-mono">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-sm mx-auto">
        <Link
          href="/register"
          className="chamfer-btn w-full block text-center bg-cyan-400 hover:bg-cyan-300 text-black font-display font-bold text-[13.5px] tracking-[0.1em] py-4 transition-all duration-200 active:scale-[0.99]"
        >
          [ DAFTAR AKUN - GRATIS ]
        </Link>
      </div>
    </section>
  );
}
