import { Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="px-5 pt-10 pb-8 border-t border-dashed border-cyan-400/15 mt-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-bold text-white text-sm">
          LASTQUESTION.CO<span className="text-cyan-300">.</span>
        </span>
        <a
          href="https://instagram.com/lastquestion.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-widest text-cyan-300/80 font-semibold"
        >
          [ @LASTQUESTION.CO ]
        </a>
      </div>

      <div className="mb-6 flex">
        <a
          href="https://t.me/LASTQUESTIONVIP_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="chamfer-btn inline-flex items-center gap-2 px-3 py-1.5 border border-cyan-400/30 text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-[0.98] transition-all font-mono text-[10.5px] font-bold tracking-wider"
        >
          <Send size={11} className="rotate-[-35deg]" />
          [ CHAT ADMIN ]
        </a>
      </div>

      <p className="text-white/30 text-[10.5px] leading-relaxed mb-4">
        LASTQUESTION.CO is a market intelligence &amp; education ecosystem covering
        crypto, forex, and financial analytics. Nothing on this site constitutes
        financial advice or a solicitation to trade. Trading involves substantial
        risk, including potential loss of principal. Past performance does not
        guarantee future results — always do your own research.
      </p>

      <p className="text-white/20 text-[9.5px] leading-relaxed mb-6">
        RISK WARNING: Trading forex, cryptocurrencies, and CFDs carries a high level of risk and may not be suitable for all investors. All trade signals, analytics, and content are provided for informational and educational purposes only, and should not be construed as financial advice. LASTQUESTION.CO is not a registered financial advisor or broker-dealer. Past performance of any system or strategy is not indicative of future results.
      </p>

      <p className="text-white/20 text-[9.5px] tracking-wide">
        © {new Date().getFullYear()} LASTQUESTION.CO — ALL SYSTEMS OPERATIONAL
      </p>
    </footer>
  );
}
