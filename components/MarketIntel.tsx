import Sparkline from "./Sparkline";
import RevealText from "./RevealText";

const ASSETS = [
  { id: "01", pair: "BTC/USDT", price: "97,240.50", change: "+1.82%", positive: true, spark: [40, 42, 39, 45, 48, 46, 52, 55] },
  { id: "02", pair: "ETH/USDT", price: "3,412.20", change: "-0.61%", positive: false, spark: [50, 48, 51, 47, 44, 45, 42, 40] },
  { id: "03", pair: "XAU/USD", price: "2,648.90", change: "+0.44%", positive: true, spark: [30, 31, 30, 33, 34, 33, 36, 37] },
  { id: "04", pair: "SOL/USDT", price: "241.75", change: "+4.12%", positive: true, spark: [20, 22, 21, 26, 25, 29, 33, 38] },
];

export default function MarketIntel() {
  return (
    <section id="market" className="px-5 py-14 relative">
      <div className="text-center mb-8">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2">
          [ DATA_FEED ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          Market Intelligence
        </h2>
        <RevealText
          text="Live-monitored assets, curated by the LASTQUESTION signal engine."
          className="text-white/45 text-[12.5px] mt-3 max-w-[300px] mx-auto leading-relaxed"
        />
      </div>

      <div className="border border-dashed border-cyan-400/25 chamfer bg-[#0b0f18]/70">
        {ASSETS.map((a, idx) => (
          <div
            key={a.id}
            className={`hud-card flex items-center gap-3 px-4 py-4 ${
              idx !== ASSETS.length - 1 ? "border-b border-dashed border-cyan-400/15" : ""
            }`}
          >
            <span className="font-display font-bold text-cyan-300 text-sm w-6 text-glow-cyan">
              {a.id}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-[13px]">{a.pair}</div>
              <div className="text-white/40 text-[10.5px] mt-0.5">${a.price}</div>
            </div>
            <Sparkline points={a.spark} positive={a.positive} />
            <span
              className={`text-[11px] font-bold w-16 text-right ${
                a.positive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {a.change}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] text-white/25 text-center mt-3 tracking-wide">
        DATA REFRESHED VIA LIVE MARKET FEED · FOR EDUCATIONAL PURPOSES ONLY
      </p>
    </section>
  );
}
