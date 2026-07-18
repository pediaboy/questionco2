import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, Video, Lock, ShieldAlert, ArrowRight } from "lucide-react";

export const metadata = {
  title: "PUBLIC TERMINAL // GRATIS — LASTQUESTION.CO",
};

export default function GratisPage() {
  const files = [
    { name: "FILE_01: Dasar Forex.pdf", type: "pdf" },
    { name: "FILE_02: Psikologi Trading.mp4", type: "video" },
    { name: "FILE_03: Cara Baca Chart.pdf", type: "pdf" },
    { name: "FILE_04: Money Management.mp4", type: "video" },
  ];

  const signals = [
    { pair: "XAU/USD", dir: "BUY", category: "FOREX" },
    { pair: "EUR/USD", dir: "SELL", category: "FOREX" },
    { pair: "BTC/USD", dir: "BUY", category: "CRYPTO" },
    { pair: "GBP/JPY", dir: "BUY", category: "FOREX" },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#05080F]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes red-pulse {
          0%, 100% {
            box-shadow: 0 -4px 12px rgba(239, 68, 68, 0.2), inset 0 0 4px rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 -4px 22px rgba(239, 68, 68, 0.7), inset 0 0 10px rgba(239, 68, 68, 0.4);
            border-color: rgba(239, 68, 68, 1);
          }
        }
        .red-pulse-banner {
          animation: red-pulse 1.8s infinite ease-in-out;
        }
      `}} />

      <Header />
      
      {/* Increased pb to pb-32 to avoid overlapping with fixed bottom banner */}
      <main className="pt-[104px] px-5 pb-32">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ CLEARANCE_LEVEL // PUBLIC ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            PUBLIC TERMINAL
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Akses edukasi taktis dasar dan direktori sinyal publik terenkripsi.
          </p>
        </div>

        {/* Warning notification */}
        <div className="chamfer border border-amber-500/20 bg-amber-500/5 p-4 mb-8 flex gap-3 items-start">
          <ShieldAlert className="text-amber-400 w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-amber-200/80 leading-relaxed font-mono">
            <span className="font-bold text-amber-400">WARNING:</span> Anda mengakses terminal publik tanpa enkripsi VIP. Data sinyal di bawah disamarkan &amp; tertunda 15-30 menit.
          </div>
        </div>

        {/* Section 1: Education module */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-dashed border-cyan-400/20 pb-2">
            <h2 className="font-display font-bold text-sm tracking-widest text-cyan-400 uppercase">
              // SYSTEM DIRECTORY
            </h2>
            <span className="text-[9px] font-mono text-cyan-400/50">4 FILES FOUND</span>
          </div>

          <div className="flex flex-col gap-2.5 font-mono">
            {files.map((file, i) => {
              const Icon = file.type === "pdf" ? FileText : Video;
              return (
                <a
                  key={i}
                  href="/vip"
                  className="flex items-center justify-between p-3.5 border border-cyan-400/10 bg-[#0b0f18]/60 hover:bg-cyan-500/5 hover:border-cyan-400/40 active:border-cyan-400 cursor-pointer transition-all chamfer-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-cyan-400/70 group-hover:text-cyan-400 w-4.5 h-4.5 transition-colors" />
                    <span className="text-[12px] text-white/80 group-hover:text-white transition-colors">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 font-semibold tracking-widest group-hover:text-cyan-300 transition-colors">
                    <span>GET</span>
                    <ArrowRight size={10} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Section 2: Signal Teaser Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-dashed border-cyan-400/20 pb-2">
            <h2 className="font-display font-bold text-sm tracking-widest text-cyan-400 uppercase">
              // SIGNAL FEED (DELAYED)
            </h2>
            <span className="text-[9px] font-mono text-red-500/70 animate-pulse">● LIVE BLOCKED</span>
          </div>

          <div className="w-full overflow-hidden border border-cyan-400/15 bg-[#0b0f18]/40 chamfer">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-cyan-400/20 bg-cyan-950/20 text-cyan-400/80 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Pair</th>
                  <th className="p-3 text-center">Dir</th>
                  <th className="p-3 text-right">Entry</th>
                  <th className="p-3 text-right">Target</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((sig, i) => (
                  <tr key={i} className="border-b border-cyan-400/10 hover:bg-cyan-500/5 transition-colors">
                    <td className="p-3 font-bold text-white">
                      {sig.pair}
                      <span className="block text-[8px] text-white/30 font-normal">{sig.category}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm ${
                          sig.dir === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {sig.dir}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1 text-[10px] text-red-400/90 font-semibold tracking-tight">
                        <Lock size={9} className="text-red-500/80 shrink-0" />
                        <span className="blur-[1.5px] select-none text-[8px] opacity-40">12.345</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1 text-[10px] text-red-400/90 font-semibold tracking-tight">
                        <Lock size={9} className="text-red-500/80 shrink-0" />
                        <span className="blur-[1.5px] select-none text-[8px] opacity-40">12.345</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-white/30 mt-3 text-center italic font-mono leading-relaxed">
            Data entri &amp; target dinonaktifkan secara otomatis pada terminal publik.
          </p>
        </div>
      </main>

      {/* Sticky upsell banner */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-40 px-5 pb-6 pt-3 bg-black/85 backdrop-blur-md">
        <a
          href="/vip"
          className="red-pulse-banner chamfer-btn w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-500 border border-red-500 text-white font-display font-bold text-[14.5px] tracking-[0.15em] py-4 shadow-lg transition-all"
        >
          [ INITIATE VIP PROTOCOL ] <ArrowRight size={16} />
        </a>
      </div>

      <Footer />
    </div>
  );
}
