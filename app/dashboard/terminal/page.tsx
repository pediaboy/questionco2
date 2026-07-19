"use client";

import { Lock, Radio } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import CryptoTerminal from "@/components/CryptoTerminal";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import { useState } from "react";

export default function TerminalPage() {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ LIVE // WHALE FLOW ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1 flex items-center gap-2">
          <Radio size={18} className="text-cyan-300" /> Market <span className="text-cyan-300 text-glow-cyan">Terminal</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Streaming langsung dari Binance — harga tick-by-tick, whale trade, dan liquidation feed real-time.
        </p>
      </div>

      <div className="relative">
        <div className={isVip ? "" : "blur-md select-none pointer-events-none"}>
          <CryptoTerminal />
        </div>

        {!isVip && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px]">
            <div className="w-12 h-12 chamfer-sm bg-[#05080f] border border-yellow-500/50 flex items-center justify-center">
              <Lock size={20} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-yellow-500">
              [ Fitur VIP ]
            </span>
            <button
              onClick={() => setGateOpen(true)}
              className="chamfer-sm border border-cyan-400/40 px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-cyan-300 bg-[#0b0f18]/80"
            >
              Upgrade untuk Akses
            </button>
          </div>
        )}
      </div>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Market Terminal" />
    </div>
  );
}
