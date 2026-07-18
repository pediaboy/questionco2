"use client";

import React, { useEffect, useState } from "react";
import { syncEmitter } from "@/lib/syncEmitter";

export default function SyncIndicator() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    return syncEmitter.subscribe(() => {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed top-2.5 right-2.5 z-[9999] w-1.5 h-1.5 rounded-full bg-emerald-400 transition-all duration-300 pointer-events-none ${
        pulse
          ? "opacity-100 scale-150 shadow-[0_0_10px_#34d399,0_0_20px_#34d399]"
          : "opacity-40 scale-100"
      }`}
    />
  );
}
