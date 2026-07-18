const PRINCIPLES = [
  {
    id: "01",
    title: "Satu Pair Fokus",
    desc: "Fokus penuh di instrumen bergejolak tinggi.",
  },
  {
    id: "02",
    title: "Zero Floating",
    desc: "Posisi tidak dibiarkan mengambang. Kena target, SL, atau ditutup paksa.",
  },
  {
    id: "03",
    title: "Risk-First",
    desc: "Manajemen risiko dihitung sebelum eksekusi.",
  },
  {
    id: "04",
    title: "AI-Assisted",
    desc: "Struktur market 24 jam dipantau oleh algoritma.",
  },
];

export default function Methodology() {
  return (
    <section id="methodology" className="px-5 py-14">
      <div className="text-center mb-8">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2">
          [ METHODOLOGY ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          Metode <span className="text-cyan-300 text-glow-cyan">Zero Floating.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRINCIPLES.map((p) => (
          <div
            key={p.id}
            className="chamfer-sm border border-cyan-400/20 bg-[#111520] p-5 relative overflow-hidden"
          >
            <span className="absolute -top-2 -right-1 font-mono font-bold text-5xl text-cyan-400/10 select-none pointer-events-none">
              {p.id}
            </span>
            <div className="relative">
              <span className="font-mono text-[11px] font-bold text-cyan-300 tracking-widest">
                [ {p.id} ]
              </span>
              <h3 className="text-white font-display font-bold text-[15px] tracking-wide mt-2">
                {p.title}
              </h3>
              <p className="text-white/50 text-[12px] leading-relaxed mt-2">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
