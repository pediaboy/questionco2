import { ArrowUpRight } from "lucide-react";

export default function EliteCTA() {
  return (
    <section id="elite" className="px-5 pt-4 pb-2">
      <a
        href="https://instagram.com/lastquestion.co"
        target="_blank"
        rel="noopener noreferrer"
        className="hud-card chamfer relative flex items-center justify-between gap-4 px-5 py-6 border border-fuchsia-400/50 box-glow-magenta bg-gradient-to-br from-fuchsia-500/10 via-[#0b0f18] to-[#0b0f18] overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-fuchsia-500/20 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] tracking-[0.25em] text-fuchsia-300/80 font-semibold mb-1">
            [ FUNNEL // @LASTQUESTION.CO ]
          </p>
          <p className="font-display font-bold text-white text-[17px] tracking-wide">
            ACCESS ELITE SETUP
          </p>
          <p className="text-white/45 text-[11px] mt-1">
            Join the ecosystem on Instagram.
          </p>
        </div>
        <ArrowUpRight size={26} className="text-fuchsia-300 shrink-0 text-glow-magenta" />
      </a>
    </section>
  );
}
