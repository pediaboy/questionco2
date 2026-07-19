import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Code2, Terminal, KeyRound, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "DEVELOPER HUB // LASTQUESTION.CO",
};

export default function DeveloperHubPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ CONNECT TO THE ENGINE // DEV HUB ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            DEVELOPER HUB
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Build on top of the LASTQUESTION market intelligence engine. Access live signals, integrate customized workflows, and automate your strategies.
          </p>
        </div>

        {/* Hero visual */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
          <div className="absolute inset-0 border border-dashed border-cyan-400/30 rounded-full animate-[spin_30s_linear_infinite]"></div>
          <div className="absolute inset-3 border border-cyan-400/10 rounded-full bg-cyan-950/5 flex items-center justify-center">
            <Code2 className="text-cyan-400 w-12 h-12 text-glow-cyan animate-[pulse_2s_infinite_ease-in-out]" />
          </div>
        </div>

        {/* What you can build SECTION */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-4 text-center">
            [ WHAT YOU CAN BUILD ]
          </h2>
          <div className="flex flex-col gap-4">
            <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="p-1.5 border border-cyan-400/20 bg-cyan-400/5 rounded-sm mt-0.5 animate-[pulse_3s_infinite_ease-in-out]">
                  <Terminal size={14} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[14px] text-white tracking-wide uppercase">
                    Personal Trading Bots
                  </h3>
                  <p className="text-white/60 text-[11.5px] mt-1 leading-relaxed">
                    Connect our high-accuracy signals directly to your custom execution scripts or automated trading platforms (e.g., PineScript, MetaTrader, custom Python bots).
                  </p>
                </div>
              </div>
            </div>

            <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="p-1.5 border border-cyan-400/20 bg-cyan-400/5 rounded-sm mt-0.5 animate-[pulse_3s_infinite_ease-in-out_500ms]">
                  <Code2 size={14} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[14px] text-white tracking-wide uppercase">
                    Custom Dashboards
                  </h3>
                  <p className="text-white/60 text-[11.5px] mt-1 leading-relaxed">
                    Aggregate real-time and historical signal data to design your personal trading HUD, stats tracker, or performance analytics interface.
                  </p>
                </div>
              </div>
            </div>

            <div className="hud-card chamfer border border-cyan-400/20 bg-[#0b0f18]/80 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="p-1.5 border border-cyan-400/20 bg-cyan-400/5 rounded-sm mt-0.5 animate-[pulse_3s_infinite_ease-in-out_1000ms]">
                  <BookOpen size={14} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[14px] text-white tracking-wide uppercase">
                    Notification Integrations
                  </h3>
                  <p className="text-white/60 text-[11.5px] mt-1 leading-relaxed">
                    Forward signals directly to your private Discord server, Telegram group, email alerts, or mobile push notification services instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-step getting-started summary */}
        <div className="mb-8">
          <h2 className="text-[11px] tracking-[0.2em] font-mono text-cyan-400/70 uppercase mb-4 text-center">
            [ GETTING STARTED ]
          </h2>
          <div className="flex flex-col gap-3 font-mono">
            <div className="chamfer-sm border border-white/10 bg-black/40 p-4 flex gap-3">
              <div className="font-bold text-cyan-400 text-sm">[01]</div>
              <div className="text-[12px] leading-relaxed">
                <span className="text-white font-bold block mb-0.5">GENERATE API KEY</span>
                Log in and navigate to your <Link href="/profile" className="text-cyan-400 underline hover:text-cyan-300">[ /profile ]</Link> page to generate a personal secure API key under the Developer section.
              </div>
            </div>

            <div className="chamfer-sm border border-white/10 bg-black/40 p-4 flex gap-3">
              <div className="font-bold text-cyan-400 text-sm">[02]</div>
              <div className="text-[12px] leading-relaxed">
                <span className="text-white font-bold block mb-0.5">EXECUTE FIRST CALL</span>
                Authenticate your HTTP request with the generated key passed as a header or query parameter to query our active signal feeds.
              </div>
            </div>

            <div className="chamfer-sm border border-white/10 bg-black/40 p-4 flex gap-3">
              <div className="font-bold text-cyan-400 text-sm">[03]</div>
              <div className="text-[12px] leading-relaxed">
                <span className="text-white font-bold block mb-0.5">BUILD INTEGRATION</span>
                Parse the JSON payload, process signal entries, stops, and take-profits, and build your bespoke automated workflows.
              </div>
            </div>
          </div>
        </div>

        {/* CTA button linking to /api-docs and /profile */}
        <div className="flex flex-col gap-3">
          <Link
            href="/api-docs"
            className="chamfer-btn inline-flex items-center justify-center gap-2 bg-cyan-400 text-black hover:bg-cyan-300 font-mono font-bold text-[11px] tracking-widest py-3 px-4 w-full transition-all active:scale-[0.98]"
          >
            EXPLORE API REFERENCE <ArrowRight size={12} />
          </Link>
          
          <Link
            href="/profile"
            className="chamfer-btn inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-white/5 border border-white/10 text-white font-mono text-[11px] tracking-widest py-3 px-4 w-full transition-all active:scale-[0.98]"
          >
            GET API KEY <KeyRound size={12} className="text-cyan-400" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
