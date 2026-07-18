"use client";

import Sparkline from "./Sparkline";

export default function Hero() {
  return (
    <section id="top" className="relative pt-[124px] px-5 pb-10">
      {/* corner HUD brackets */}
      <div className="absolute top-[108px] left-5 text-cyan-400/50 text-[10px] font-semibold tracking-widest hud-bracket select-none">
        [ SYS.ONLINE ]
      </div>

      <div className="text-center mb-10">
        <p className="text-[11px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-3">
          ECOSYSTEM // ANALYTICS + SIGNALS + COMMUNITY
        </p>
        <h1 className="font-display font-bold text-white text-[32px] leading-[1.1] tracking-tight uppercase">
          TERMINAL LENGKAP<br />DI <span className="text-cyan-300 text-glow-cyan">GENGGAMANMU</span>.
        </h1>
        <p className="mt-4 text-white/50 text-[13px] leading-relaxed max-w-[320px] mx-auto">
          Empat modul unggulan. Akses sinyal, analisis whale, dan sesi market dalam satu ekosistem.
        </p>
      </div>

      {/* Feature Cards Stack */}
      <div className="flex flex-col gap-4">
        {/* Card 1 — Signal AI - XAUUSD */}
        <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 01 ]</span>
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
                SYSTEM MODUL // ALPHA_SIGNAL
              </span>
            </div>
          </div>

          <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">
            Signal AI — XAUUSD
          </h3>

          <div className="flex items-center justify-between border-t border-cyan-400/10 pt-3 mt-1">
            <div className="flex flex-col gap-1">
              <span className="text-cyan-300 font-bold text-sm tracking-widest">
                [ BUY XAUUSD ]
              </span>
              <span className="text-emerald-400 font-bold text-xs tracking-wider">
                [ TP1 HIT ]
              </span>
            </div>

            <div className="relative flex items-center pr-2">
              <Sparkline points={[12, 14, 13, 17, 16, 22]} positive={true} />
              <span className="absolute right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Card 2 — Crypto Terminal */}
        <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 02 ]</span>
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
                SYSTEM MODUL // WHALE_FLOW
              </span>
            </div>
          </div>

          <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">
            Crypto Terminal
          </h3>

          <div className="font-mono text-[11px] leading-relaxed flex flex-col gap-1 border-t border-cyan-400/10 pt-3 mt-1">
            <div className="flex justify-between">
              <span className="text-rose-500 font-bold">[ LIQ SHORT ]</span>
              <span className="text-rose-400">-$2.4M BTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400 font-bold">[ BUY BTC ]</span>
              <span className="text-emerald-400">+$1.1M</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1 border-t border-cyan-400/10 pt-3">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-white/50">FEAR &amp; GREED INDEX</span>
              <span className="text-emerald-400 font-bold">72 — GREED</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-400/10">
              <div className="h-full bg-emerald-400" style={{ width: "72%" }} />
            </div>
          </div>
        </div>

        {/* Card 3 — EA / Indikator Builder */}
        <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 03 ]</span>
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
                SYSTEM MODUL // COMPILER
              </span>
            </div>
          </div>

          <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">
            EA / Indikator Builder
          </h3>

          <div className="mt-1 flex flex-col rounded border border-cyan-400/10 bg-[#05080f]/80 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-cyan-400/5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[8px] font-mono text-white/30">strategy.mq5</span>
            </div>
            <pre className="p-3 font-mono text-[10.5px] text-emerald-400/90 leading-relaxed overflow-x-auto">
              <code>
{`if (EMA50 cross EMA200) {
  Buy("XAUUSD");
}`}
              </code>
            </pre>
          </div>
        </div>

        {/* Card 4 — Sesi Market */}
        <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 04 ]</span>
              <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
                SYSTEM MODUL // HUD_GLOBE
              </span>
            </div>
          </div>

          <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">
            Sesi Market
          </h3>

          <div className="relative flex items-center justify-center py-6 border border-cyan-400/10 bg-[#05080f]/40 rounded mt-1 overflow-hidden h-[150px]">
            {/* rotating ring */}
            <div
              className="absolute w-24 h-24 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center"
              style={{ animation: "spin 30s linear infinite" }}
            >
              <div className="w-16 h-16 rounded-full border border-dotted border-cyan-400/20" />
              <div className="absolute w-24 h-[1px] bg-cyan-400/20" />
              <div className="absolute h-24 w-[1px] bg-cyan-400/20" />
            </div>

            {/* static labels around the globe */}
            <div className="absolute top-4 left-6 flex items-center gap-1 select-none">
              <span className="w-1 h-1 rounded-full bg-cyan-300" />
              <span className="text-[8px] font-mono text-cyan-300/70">NEW YORK</span>
            </div>
            <div className="absolute bottom-4 left-10 flex items-center gap-1 select-none">
              <span className="w-1 h-1 rounded-full bg-cyan-300" />
              <span className="text-[8px] font-mono text-cyan-300/70">LONDON</span>
            </div>
            <div className="absolute top-10 right-4 flex items-center gap-1 select-none">
              <span className="w-1 h-1 rounded-full bg-cyan-300" />
              <span className="text-[8px] font-mono text-cyan-300/70">TOKYO</span>
            </div>
            <div className="absolute bottom-6 right-8 flex items-center gap-1 select-none">
              <span className="w-1 h-1 rounded-full bg-cyan-300" />
              <span className="text-[8px] font-mono text-cyan-300/70">SYDNEY</span>
            </div>

            {/* center indicator */}
            <div className="absolute flex flex-col items-center select-none">
              <span className="text-[9px] font-mono text-cyan-300 font-bold tracking-widest uppercase">
                ACTIVE
              </span>
              <span className="text-[8px] font-mono text-white/40">3D_GLOBE_v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
