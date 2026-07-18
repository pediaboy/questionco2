"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Instagram({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export default function KontakPage() {
  const [formData, setFormData] = useState({ nama: "", email: "", pesan: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;

    setStatus("sending");
    setProgress(0);

    // Real backend endpoint can be wired here in the future
    // e.g., await fetch("/api/contact", { method: "POST", body: JSON.stringify(formData) })

    const duration = 1200; // 1.2s submission simulation
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setStatus("success");
      }
    }, 30);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#05080F]">
      <Header />
      <main className="pt-[104px] px-5 pb-12 flex flex-col min-h-screen">
        <div className="text-center mt-6 mb-8">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-3 text-[#00F0FF] text-glow-cyan">
            [ CLEARANCE_LEVEL // SECURE ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            Comm-Link:
            <br />
            <span className="text-[#00F0FF] text-glow-cyan">
              Encrypted Terminal
            </span>
          </h1>
          <p className="text-white/45 text-[12.5px] mt-4 max-w-[300px] mx-auto leading-relaxed">
            Hubungi tim pusat komando LASTQUESTION.CO secara rahasia dan aman.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-grow">
          {/* NAMA field */}
          <div className="relative">
            <label className="block font-mono text-[10.5px] font-bold tracking-[0.15em] text-[#00F0FF] text-glow-cyan uppercase mb-2">
              NAMA
            </label>
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00F0FF]" />

              <input
                type="text"
                required
                disabled={status !== "idle"}
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="MASUKKAN NAMA ANDA"
                className="w-full bg-[#0d1017]/50 text-white font-mono text-[12px] px-4 py-3 focus:outline-none placeholder-white/10 uppercase tracking-wide border-0"
              />
            </div>
          </div>

          {/* EMAIL field */}
          <div className="relative">
            <label className="block font-mono text-[10.5px] font-bold tracking-[0.15em] text-[#00F0FF] text-glow-cyan uppercase mb-2">
              EMAIL
            </label>
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00F0FF]" />

              <input
                type="email"
                required
                disabled={status !== "idle"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ALAMAT EMAIL AKTIF"
                className="w-full bg-[#0d1017]/50 text-white font-mono text-[12px] px-4 py-3 focus:outline-none placeholder-white/10 uppercase tracking-wide border-0"
              />
            </div>
          </div>

          {/* PESAN field */}
          <div className="relative">
            <label className="block font-mono text-[10.5px] font-bold tracking-[0.15em] text-[#00F0FF] text-glow-cyan uppercase mb-2">
              PESAN
            </label>
            <div className="relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00F0FF]" />

              <textarea
                rows={4}
                required
                disabled={status !== "idle"}
                value={formData.pesan}
                onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                placeholder="TULIS PESAN PROTOKOL ANDA..."
                className="w-full bg-[#0d1017]/50 text-white font-mono text-[12px] px-4 py-3 focus:outline-none placeholder-white/10 uppercase tracking-wide border-0 resize-none"
              />
            </div>
          </div>

          {/* TRANSMIT BUTTON */}
          <div className="mt-4">
            <button
              type="submit"
              disabled={status !== "idle"}
              style={{ clipPath: "polygon(8% 0, 92% 0, 100% 100%, 0% 100%)" }}
              className={`relative w-full py-4 font-mono text-[13px] font-extrabold tracking-widest transition-all duration-300 select-none cursor-pointer ${
                status === "idle"
                  ? "bg-[#00F0FF] text-[#05080F] hover:bg-[#00d8e6] active:scale-[0.98]"
                  : status === "sending"
                  ? "bg-[#0d1017] text-white/45 cursor-not-allowed"
                  : "bg-[#10B981] text-[#05080F]"
              }`}
            >
              {/* The progress filling overlay */}
              {status === "sending" && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 bg-[#00F0FF]/15 transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-[#00F0FF] transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                </>
              )}

              <span className="relative z-10">
                {status === "idle" && "> TRANSMIT MESSAGE"}
                {status === "sending" && "TRANSMITTING..."}
                {status === "success" && "[ SECURELY SENT ]"}
              </span>
            </button>
          </div>
        </form>

        {/* Divider / HUD style */}
        <div className="relative flex items-center justify-center my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative px-3 bg-[#05080F] font-mono text-[9px] font-bold text-white/30 tracking-[0.25em]">
            SOCIAL LINKS
          </span>
        </div>

        {/* Social Link Buttons */}
        <div className="flex gap-4 w-full">
          {/* Instagram Button */}
          <a
            href="https://instagram.com/lastquestion.co"
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer-btn w-1/2 flex flex-col items-center justify-center gap-2 py-4 px-2 border border-[#B026FF] text-[#B026FF] bg-[#B026FF]/5 hover:bg-[#B026FF]/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Instagram size={20} className="text-glow-magenta" />
            <span className="font-mono text-[9px] font-bold tracking-widest text-center whitespace-nowrap">
              ACCESS @LASTQUESTION.CO
            </span>
          </a>

          {/* Telegram Button */}
          <a
            href="https://t.me/thoriqpedia"
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer-btn w-1/2 flex flex-col items-center justify-center gap-2 py-4 px-2 border border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/5 hover:bg-[#38BDF8]/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Send size={20} className="rotate-[-35deg] translate-x-[2px] translate-y-[-1px]" />
            <span className="font-mono text-[9px] font-bold tracking-widest text-center whitespace-nowrap">
              ACCESS @THORIQPEDIA
            </span>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
