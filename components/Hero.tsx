"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section id="top" className="relative pt-[104px] px-5 pb-10">
      {/* corner HUD brackets */}
      <div className="absolute top-[100px] left-2 text-cyan-400/50 text-[10px] font-semibold tracking-widest hud-bracket">
        [ SYS.ONLINE ]
      </div>

      <div className="flex gap-3 items-stretch">
        {/* left scroll indicator rail */}
        <div className="flex flex-col items-center gap-3 pt-6 pb-6 w-6 shrink-0">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="dot-pulse w-1.5 h-1.5 rounded-full bg-cyan-300"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
          <div className="flex-1 border-l border-dashed border-cyan-400/30 mt-1" />
        </div>

        {/* portrait visual */}
        <div className="relative flex-1 chamfer border-2 border-cyan-400/60 box-glow-cyan overflow-hidden bg-[#080b12]">
          <Image
            src="https://media.base44.com/images/public/6a5413f9f4a9bb312f976df7/3ba057aeb_generated_image.png"
            alt="LASTQUESTION.CO abstract crypto visual"
            width={900}
            height={1100}
            className="w-full h-[420px] object-cover"
            priority
          />
          <div className="scan-line" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute bottom-3 left-3 text-[10px] tracking-widest text-cyan-300/80 font-semibold">
            [ FEED_01 // LIVE ]
          </div>
          <div className="absolute top-3 right-3 text-[10px] tracking-widest text-fuchsia-400/80 font-semibold">
            REC ●
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[11px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-3">
          ECOSYSTEM // ANALYTICS + SIGNALS + COMMUNITY
        </p>
        <h1
          className="glitch font-display font-bold text-white text-[38px] leading-[1.05] tracking-tight uppercase"
          data-text="Master The Market"
        >
          Master The
          <br />
          <span className="text-cyan-300 text-glow-cyan">Market</span>
        </h1>
        <p className="mt-5 text-white/50 text-[13px] leading-relaxed max-w-[320px] mx-auto">
          Real-time market intelligence, crypto &amp; forex signals, and an elite
          trading community — engineered for the ones who move first.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="#elite"
            className="chamfer-btn inline-flex items-center gap-2 bg-cyan-400 text-black font-bold text-[13px] tracking-[0.1em] px-7 py-3.5 active:brightness-150 active:shadow-[0_0_30px_rgba(0,240,255,0.8)] transition-all"
          >
            [ INITIALIZE TRADING ]
          </a>
          <a
            href="#market"
            className="text-[11px] tracking-[0.2em] text-white/40 font-semibold"
          >
            SCROLL TO EXPLORE ↓
          </a>
        </div>
      </div>
    </section>
  );
}
