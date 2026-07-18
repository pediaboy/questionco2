export default function Footer() {
  return (
    <footer className="px-5 pt-10 pb-8 border-t border-dashed border-cyan-400/15 mt-6">
      <div className="flex items-center justify-between mb-6">
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

      <p className="text-white/30 text-[10.5px] leading-relaxed">
        LASTQUESTION.CO is a market intelligence &amp; education ecosystem covering
        crypto, forex, and financial analytics. Nothing on this site constitutes
        financial advice or a solicitation to trade. Trading involves substantial
        risk, including potential loss of principal. Past performance does not
        guarantee future results — always do your own research.
      </p>

      <p className="text-white/20 text-[9.5px] mt-6 tracking-wide">
        © {new Date().getFullYear()} LASTQUESTION.CO — ALL SYSTEMS OPERATIONAL
      </p>
    </footer>
  );
}
