"use client";

import { useState } from "react";
import Link from "next/link";
import LiveTicker from "./LiveTicker";
import HamburgerOverlay from "./HamburgerOverlay";

function SignalHamburger() {
  return (
    <div className="flex flex-col items-end gap-[5px] w-5">
      <span className="signal-bar h-[2px] bg-cyan-300 w-5" style={{ animationDelay: "0s" }} />
      <span className="signal-bar h-[2px] bg-cyan-300/80 w-3.5" style={{ animationDelay: "0.2s" }} />
      <span className="signal-bar h-[2px] bg-cyan-300/60 w-2" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="flex items-center justify-between px-5 py-4 bg-black/55 backdrop-blur-xl border-b border-cyan-400/25">
        <a href="/" className="font-display font-bold text-lg tracking-wide text-white">
          LASTQUESTION.CO<span className="text-cyan-300 text-glow-cyan">.</span>
        </a>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="chamfer-btn bg-cyan-400 text-black font-bold text-[10px] px-3 py-2 transition-all hover:bg-cyan-300 active:scale-95"
          >
            [ SYSTEM LOGIN -&gt; ]
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Menu" className="p-2 -m-2">
            <SignalHamburger />
          </button>
        </div>
      </header>

      <LiveTicker />

      <HamburgerOverlay open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
