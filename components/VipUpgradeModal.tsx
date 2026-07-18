"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface VipUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

/**
 * Shared VIP-gating pop-up. Used across dashboard pages instead of a forced
 * redirect whenever a Free user taps a premium feature.
 */
export default function VipUpgradeModal({ open, onClose, featureName }: VipUpgradeModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[199] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[200] max-w-sm mx-auto"
          >
            <div className="chamfer p-6 bg-[#0b0f18] border border-yellow-500/40 relative shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-yellow-500/60" />
              <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-yellow-500/60" />

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-14 h-14 flex items-center justify-center bg-yellow-500/10 border border-yellow-500/40 chamfer-sm">
                  <Lock size={26} className="text-yellow-500" />
                </div>
                <h3 className="font-display font-bold text-white text-base">
                  Akses Terkunci
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {featureName ? `Fitur "${featureName}"` : "Fitur ini"} khusus untuk member{" "}
                  <span className="text-yellow-500 font-bold">VIP</span>. Upgrade sekarang untuk buka
                  akses penuh.
                </p>

                <button
                  onClick={() => {
                    onClose();
                    router.push("/dashboard/upgrade");
                  }}
                  className="chamfer-btn w-full mt-2 py-3 border border-yellow-500 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
                >
                  [ UPGRADE VIP SEKARANG ]
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
