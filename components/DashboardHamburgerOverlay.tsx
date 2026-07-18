"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface DashboardHamburgerOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function DashboardHamburgerOverlay({
  open,
  onClose,
}: DashboardHamburgerOverlayProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      onClose();
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  const menuItems = [
    { label: "[ PENGATURAN AKUN ]", href: "/dashboard/profil" },
    { label: "[ INVOICE & SUBSCRIPTION ]", href: "/dashboard/invoice" },
    { label: "[ NOTIFIKASI SISTEM ]", href: "/dashboard/notifikasi" },
    { label: "[ SUPPORT TICKET ]", href: "/dashboard/support" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-[100] w-[75%] max-w-[320px] bg-[#05080f]/95 backdrop-blur-md border-l border-dashed border-cyan-400/25 flex flex-col p-6"
          >
            {/* Header of Drawer */}
            <div className="flex items-center justify-between pb-6 border-b border-dashed border-cyan-400/20 mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                [ TERMINAL MENU ]
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="text-cyan-300 text-2xl leading-none w-8 h-8 flex items-center justify-center hover:text-cyan-100 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Menu Items list */}
            <nav className="flex-1 flex flex-col gap-6 text-left">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="font-mono text-[13px] tracking-wider text-slate-300 hover:text-cyan-300 transition-colors block w-fit"
                >
                  {item.label}
                </Link>
              ))}

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="font-mono text-[13px] tracking-wider text-red-500 hover:text-red-400 transition-colors text-left block w-fit"
              >
                [ LOGOUT / DISCONNECT ]
              </button>
            </nav>

            {/* Footer / System status */}
            <div className="pt-6 border-t border-dashed border-cyan-400/10 text-center">
              <span className="font-mono text-[9px] text-slate-500 tracking-widest block uppercase">
                SYSTEM OPERATIONAL
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
