import { LineChart, Coins, Landmark, Users } from "lucide-react";

const SERVICES = [
  {
    icon: LineChart,
    label: "ANALYTICS",
    desc: "Deep technical & on-chain analysis across every major asset class.",
  },
  {
    icon: Landmark,
    label: "FOREX",
    desc: "Institutional-grade signals for major & minor currency pairs.",
  },
  {
    icon: Coins,
    label: "CRYPTO",
    desc: "Real-time momentum tracking on BTC, ETH & top-tier altcoins.",
  },
  {
    icon: Users,
    label: "COMMUNITY",
    desc: "An elite circle of traders sharing setups, risk & alpha daily.",
  },
];

export default function Ecosystem() {
  return (
    <section id="ecosystem" className="px-5 py-14">
      <div className="text-center mb-8">
        <p className="text-[10.5px] tracking-[0.3em] text-fuchsia-400/70 font-semibold mb-2">
          [ ECOSYSTEM ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          Services Grid
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map((s) => (
          <div
            key={s.label}
            className="hud-card chamfer-sm border border-cyan-400/20 bg-[#111520] p-4 flex flex-col gap-3"
          >
            <s.icon size={20} className="text-cyan-300" />
            <div className="text-white font-display font-bold text-[13px] tracking-wide">
              [ {s.label} ]
            </div>
            <p className="text-white/40 text-[10.5px] leading-relaxed text-left">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
