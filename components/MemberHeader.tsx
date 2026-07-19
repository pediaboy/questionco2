"use client";

import { useState } from "react";
import { UserRound, MoreVertical } from "lucide-react";
import Link from "next/link";
import DashboardHamburgerOverlay from "./DashboardHamburgerOverlay";
import AllFeaturesSheet from "./AllFeaturesSheet";
import HudClock from "./HudClock";

function SignalHamburger() {
  return (
    <div className="flex flex-col items-end gap-[5px] w-5">
      <span className="signal-bar h-[2px] bg-cyan-300 w-5" style={{ animationDelay: "0s" }} />
      <span className="signal-bar h-[2px] bg-cyan-300/80 w-3.5" style={{ animationDelay: "0.2s" }} />
      <span className="signal-bar h-[2px] bg-cyan-300/60 w-2" style={{ animationDelay: "0.4s" }} />
    </div>
  );
}

export default function MemberHeader() {
  const [open, setOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <header className="flex items-center justify-between px-5 py-3 bg-black/55 backdrop-blur-xl border-b border-dashed border-cyan-400/25 max-w-md mx-auto">
        <button onClick={() => setOpen(true)} aria-label="Menu Akun" className="p-2 -m-2">
          <SignalHamburger />
        </button>

        <div className="flex flex-col items-center">
          <Link href="/dashboard" className="font-display font-bold text-base tracking-[0.15em] text-white">
            LASTQUESTION<span className="text-cyan-300 text-glow-cyan">.</span>
          </Link>
          <HudClock />
        </div>

        <div className="flex items-center gap-1">
          {/* Consolidated dashboard-only features menu (mirrors bottom-nav "Fitur",
              scoped strictly to /dashboard/* pages -- never mixed with public
              marketing nav from HamburgerOverlay). */}
          <button
            onClick={() => setFeaturesOpen(true)}
            aria-label="Semua Fitur"
            className="p-2 -m-2 text-white/70 hover:text-cyan-300 transition-colors"
          >
            <MoreVertical size={20} strokeWidth={1.5} />
          </button>

          <Link href="/dashboard/profil" className="relative p-2 -m-2 block">
            <UserRound size={22} strokeWidth={1.5} className="text-white/70" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </Link>
        </div>
      </header>

      <DashboardHamburgerOverlay open={open} onClose={() => setOpen(false)} />
      <AllFeaturesSheet open={featuresOpen} onClose={() => setFeaturesOpen(false)} />
    </div>
  );
}
