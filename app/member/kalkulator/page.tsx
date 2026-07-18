"use client";

import React, { useState } from "react";
import { Calculator, ShieldAlert } from "lucide-react";

export default function KalkulatorPage() {
  const [pair, setPair] = useState("EURUSD");
  const [lotSize, setLotSize] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number>(10);

  // Constants
  const PIP_VALUES: Record<string, number> = {
    EURUSD: 10,
    GBPUSD: 10,
    USDJPY: 9.30,
    XAUUSD: 10, // consistent with roughly $10/pip/lot
  };

  const pipValue = PIP_VALUES[pair] || 10;
  const totalRisk = pipValue * lotSize * stopLoss;

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ DECK // RISK MANAGEMENT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Kalkulator <span className="text-cyan-300 text-glow-cyan">Pip & Lot</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Hitung risiko transaksi sebelum masuk ke market.
        </p>
      </div>

      {/* Main Card */}
      <div className="chamfer-sm bg-[#0b0f18]/60 border border-white/10 p-5 relative mb-6">
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

        <span className="text-[9px] font-bold tracking-wider text-cyan-300 font-mono block mb-3">
          [ CONFIG RISK PARAMETERS ]
        </span>

        <div className="space-y-4">
          {/* Pair Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">
              ASSET PAIR
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/70"
            >
              <option value="EURUSD">EURUSD (Pip Value: $10.00)</option>
              <option value="GBPUSD">GBPUSD (Pip Value: $10.00)</option>
              <option value="USDJPY">USDJPY (Pip Value: $9.30)</option>
              <option value="XAUUSD">XAUUSD (Pip Value: $10.00)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Lot Size */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">
                LOT SIZE
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={lotSize === 0 ? "" : lotSize}
                onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/70"
              />
            </div>

            {/* Stop Loss in Pips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] text-[#94A3B8] uppercase font-mono tracking-wider">
                STOP LOSS (PIPS)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={stopLoss === 0 ? "" : stopLoss}
                onChange={(e) => setStopLoss(parseInt(e.target.value) || 0)}
                className="chamfer-sm bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400/70"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="chamfer-sm bg-cyan-950/20 border border-cyan-400/20 p-5 relative mb-6">
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold tracking-wider text-cyan-300 font-mono">
            [ ESTIMATED EXPOSURE // RISK ]
          </span>
          <Calculator className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="text-center py-4 bg-black/40 border border-cyan-400/10 rounded-sm">
          <span className="text-xs text-cyan-400/60 font-mono block mb-1">TOTAL POTENTIAL LOSS</span>
          <span className="text-3xl font-bold font-display text-cyan-300 text-glow-cyan">
            ${totalRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 text-[10px] text-cyan-300/60 font-mono">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-cyan-300 mb-0.5">DETAIL CALCULATIONS:</p>
            <p>• Pip Value/Lot: ${pipValue.toFixed(2)}</p>
            <p>• Total Lots: {lotSize}</p>
            <p>• Total Stop Loss: {stopLoss} pips</p>
            <p className="mt-1 text-slate-500 italic text-[9px]">
              Estimasi, bukan harga real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
