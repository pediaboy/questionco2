"use client";

import { useState } from "react";
import { X } from "lucide-react";
import LiveTicker from "./LiveTicker";

const NAV = [
  { label: "MARKET INTEL", href: "#market" },
  { label: "ECOSYSTEM", href: "#ecosystem" },
  { label: "ELITE SETUP", href: "#elite" },
];

function SignalHamburger({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col items-end gap-[5px] w-5">
      <span
        className="signal-bar h-[2px] bg-cyan-300 transition-all"
        style={{ width: open ? "20px" : "20px", animationDelay: "0s" }}
      />
      <span
        className="signal-bar h-[2px] bg-cyan-300/80 transition-all"
        style={{ width: open ? "20px" : "14px", animationDelay: "0.2s" }}
      />
      <span
        className="signal-bar h-[2px] bg-cyan-300/60 transition-all"
        style={{ width: open ? "20px" : "8px", animationDelay: "0.4s" }}
      />
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="flex items-center justify-between px-5 py-4 bg-black/55 backdrop-blur-xl border-b border-cyan-400/25">
        <a href="#top" className="font-display font-bold text-lg tracking-wide text-white">
          LASTQUESTION.CO<span className="text-cyan-300 text-glow-cyan">.</span>
        </a>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="p-2 -m-2"
        >
          {open ? <X size={20} className="text-cyan-300" /> : <SignalHamburger open={open} />}
        </button>
      </header>

      <LiveTicker />

      {open && (
        <nav className="bg-black/90 backdrop-blur-xl border-b border-cyan-400/25 px-5 py-6 flex flex-col gap-4">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="text-sm tracking-[0.15em] text-white/80 hover:text-cyan-300 transition-colors font-semibold"
            >
              [ {n.label} ]
            </a>
          ))}
          <a
            href="https://instagram.com/lastquestion.co"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-sm tracking-[0.15em] text-fuchsia-400 font-semibold mt-2"
          >
            [ @LASTQUESTION.CO ]
          </a>
        </nav>
      )}
    </div>
  );
}
