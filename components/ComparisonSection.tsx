import { X, CheckCircle2 } from "lucide-react";

export default function ComparisonSection() {
  const COMPARISONS = [
    {
      id: "01",
      negative: "Sinyal lewat chat biasa, mudah hilang",
      positive: "Aplikasi mandiri, bukan sekadar grup chat",
    },
    {
      id: "02",
      negative: "Tidak ada track record terverifikasi",
      positive: "Track record live ditarik langsung dari database",
    },
    {
      id: "03",
      negative: "Tidak ada dashboard atau riwayat data",
      positive: "Dashboard pribadi dengan riwayat lengkap",
    },
    {
      id: "04",
      negative: "Rawan grup bubar / admin hilang tiba-tiba",
      positive: "Sistem permanen, bukan tergantung satu admin",
    },
  ];

  return (
    <section id="comparison" className="px-5 py-14 relative">
      {/* HUD Accent Brackets / Labels */}
      <div className="absolute top-[32px] left-5 text-cyan-400/40 text-[9px] font-mono tracking-widest uppercase">
        [ SYS.COMP_MATRIX ]
      </div>
      <div className="absolute top-[32px] right-5 text-cyan-400/40 text-[9px] font-mono tracking-widest uppercase">
        ANALYSIS // 2026
      </div>

      <div className="text-center mb-10 mt-4">
        <p className="text-[10.5px] tracking-[0.3em] text-[#00F0FF]/70 font-semibold mb-2 uppercase">
          [ HONEST_COMPARISON ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          GRUP BIASA VS <span className="text-[#00F0FF] text-glow-cyan">LASTQUESTION.</span>
        </h2>
      </div>

      <div className="flex flex-col gap-8">
        {COMPARISONS.map((item, idx) => (
          <div key={item.id} className="relative flex flex-col gap-2">
            {/* Index label / HUD tag */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500/60 px-2 tracking-wider">
              <span>METRIC // {item.id}</span>
              <span className="text-rose-500/50 uppercase">CONVENTIONAL</span>
            </div>

            {/* Negative (Grup Biasa) Point */}
            <div className="flex items-start gap-3 px-3 py-1">
              <X className="text-rose-500 w-4 h-4 shrink-0 mt-[1.5px]" />
              <p className="text-slate-500 text-[12.5px] leading-relaxed">
                {item.negative}
              </p>
            </div>

            {/* Connecting visual element */}
            <div className="flex items-center pl-[21px] gap-2 h-4">
              <div className="w-[1.5px] h-4 bg-gradient-to-b from-rose-500/40 to-cyan-400/40" />
              <span className="text-[8px] font-mono tracking-[0.2em] text-cyan-400/40 uppercase">
                VS_UPGRADE
              </span>
            </div>

            {/* Positive (LASTQUESTION) Point */}
            <div className="hud-card chamfer-sm border border-cyan-400/40 bg-cyan-400/5 px-4 py-3.5 flex items-start gap-3 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
              <CheckCircle2 className="text-emerald-400 w-5 h-5 shrink-0 mt-[1px]" />
              <p className="text-white font-semibold text-[13px] leading-relaxed">
                {item.positive}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] text-white/25 text-center mt-10 tracking-widest uppercase font-mono">
        SYSTEMATIC ANALYSIS · ENGAGE THE SUPERIOR ENVIRONMENT
      </p>
    </section>
  );
}
