"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";

const MENU = [
  { label: "Home", href: "/" },
  { label: "Tentang", href: "/tentang" },
  { label: "Gratis", href: "/gratis" },
  { label: "Analisa", href: "/analisa" },
  { label: "Blog", href: "/blog" },
  { label: "Papan Peringkat", href: "/papan-peringkat" },
  { label: "FAQ", href: "/faq" },
  { label: "Kontak", href: "/kontak" },
];

export default function HamburgerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col"
          style={{
            background: "rgba(5, 8, 15, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between px-6 pt-6">
            <span className="font-display font-bold text-white text-base">
              LASTQUESTION.CO<span className="text-cyan-300">.</span>
            </span>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="text-cyan-300 text-2xl leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          <motion.nav
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
              closed: {},
            }}
            className="flex-1 flex flex-col justify-center pl-6 gap-5"
          >
            {MENU.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                onClick={onClose}
                variants={{
                  closed: { opacity: 0, x: -14 },
                  open: { opacity: 1, x: 0 },
                }}
                className="text-[16px] tracking-wide text-[#E2E8F0] font-medium hover:text-cyan-300 transition-colors w-fit"
              >
                {item.label}
              </motion.a>
            ))}

            <motion.a
              href="/vip"
              onClick={onClose}
              variants={{
                closed: { opacity: 0, x: -14 },
                open: { opacity: 1, x: 0 },
              }}
              className="flex items-center gap-2.5 w-fit mt-2"
            >
              <span
                className="font-display font-bold text-[16px] tracking-wide"
                style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.5)" }}
              >
                [ VIP ACCESS ]
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#FFD700",
                  animation: "blink 1.1s ease-in-out infinite",
                  boxShadow: "0 0 8px rgba(255,215,0,0.9)",
                }}
              />
            </motion.a>
          </motion.nav>

          <div className="border-t border-dashed border-cyan-400/40 px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <a
              href="/login"
              onClick={onClose}
              className="chamfer-btn w-full flex items-center justify-center gap-2.5 bg-cyan-400 text-black font-bold text-[14px] tracking-wide py-3.5 active:brightness-150 transition-all"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <UserRound size={18} strokeWidth={2.2} />
              Login / Daftar
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
