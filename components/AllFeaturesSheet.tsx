"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Home,
  Radio,
  LineChart,
  Newspaper,
  Globe2,
  GraduationCap,
  Calculator,
  Trophy,
  Bell,
  BookOpen,
  Wallet,
  Lock,
  Gem,
  Award,
  Activity,
  PieChart,
  UserRound,
  Settings as SettingsIcon,
  Star,
  Receipt,
  ShieldCheck,
  Gift,
  Ticket,
  MessageCircle,
  History,
  BellRing,
  Cpu,
} from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import VipUpgradeModal from "./VipUpgradeModal";

interface FeatureItem {
  label: string;
  href: string;
  icon: React.ElementType;
  vipOnly?: boolean;
}

const CATEGORIES: { title: string; items: FeatureItem[] }[] = [
  {
    title: "SINYAL & ANALISA",
    items: [
      { label: "Sinyal", href: "/dashboard/sinyal", icon: Radio, vipOnly: true },
      { label: "Chart", href: "/dashboard/chart", icon: LineChart },
      { label: "Terminal", href: "/dashboard/terminal", icon: Activity, vipOnly: true },
      { label: "Analisa", href: "/analisa", icon: Newspaper },
      { label: "Riwayat Sinyal", href: "/dashboard/signal-history", icon: History },
      { label: "AI Engine Terminal", href: "/dashboard/pending", icon: Cpu, vipOnly: true },
    ],
  },
  {
    title: "PASAR",
    items: [
      { label: "Sesi Trading", href: "/dashboard/sesi", icon: Globe2 },
      { label: "Kalender", href: "/dashboard/kalender", icon: BookOpen },
      { label: "ETF", href: "/dashboard/etf", icon: PieChart },
    ],
  },
  {
    title: "EDUKASI & ALAT",
    items: [
      { label: "Kelas", href: "/dashboard/kelas", icon: GraduationCap },
      { label: "Kalkulator", href: "/dashboard/kalkulator", icon: Calculator },
      { label: "Jurnal", href: "/dashboard/journal", icon: BookOpen },
    ],
  },
  {
    title: "CUAN",
    items: [
      { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
      { label: "Papan Peringkat", href: "/dashboard/papan-peringkat", icon: Award },
      { label: "Open Posisi", href: "/dashboard/entry", icon: Activity },
      { label: "Kontes Lot", href: "/dashboard/kontes", icon: Gem },
      { label: "Pengumuman", href: "/dashboard/pengumuman", icon: Bell },
      { label: "Upgrade VIP", href: "/dashboard/upgrade", icon: Wallet },
    ],
  },
  {
    title: "AKUN",
    items: [
      { label: "Ke Beranda", href: "/", icon: Home },
      { label: "Profil", href: "/profile", icon: UserRound },
      { label: "Pengaturan", href: "/settings", icon: SettingsIcon },
      { label: "Watchlist", href: "/watchlist", icon: Star },
      { label: "Ledger", href: "/ledger", icon: Receipt },
      { label: "Keamanan", href: "/security", icon: ShieldCheck },
      { label: "Affiliate", href: "/affiliate", icon: Gift },
      { label: "Tiket Bantuan", href: "/support-tickets", icon: Ticket },
      { label: "Live Chat", href: "/live-chat", icon: MessageCircle },
      { label: "Alert Rules", href: "/alert-rules", icon: BellRing },
    ],
  },
];

export default function AllFeaturesSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useMemberAuth();
  const isVip = !!profile?.is_vip;
  const [gateOpen, setGateOpen] = useState(false);
  const [gateFeature, setGateFeature] = useState<string>("");

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[149] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed inset-x-0 bottom-0 z-[150] max-h-[80vh] overflow-y-auto bg-[#05080f]/95 backdrop-blur-md border-t border-dashed border-cyan-400/25 rounded-t-2xl p-5"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                  [ SEMUA FITUR ]
                </span>
                <button onClick={onClose} className="text-cyan-300 hover:text-cyan-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 pb-6">
                {CATEGORIES.map((cat) => (
                  <div key={cat.title}>
                    <span className="text-[10px] tracking-[0.2em] text-slate-500 font-mono block mb-3">
                      {cat.title}
                    </span>
                    <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                      {cat.items.map((item) => {
                        const locked = !!item.vipOnly && !isVip;
                        const Icon = item.icon;
                        const content = (
                          <div className="flex flex-col items-center">
                            <div className="relative w-[60px] h-[60px] octagon-precise bg-[#0b0f18] border border-cyan-400/25 flex items-center justify-center">
                              <Icon size={22} className={locked ? "text-slate-500" : "text-cyan-300"} />
                              {locked && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#05080f] border border-yellow-500 flex items-center justify-center">
                                  <Lock size={9} className="text-yellow-500" />
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] mt-2 text-white/70 text-center">{item.label}</span>
                          </div>
                        );

                        if (locked) {
                          return (
                            <button
                              key={item.href}
                              onClick={() => {
                                setGateFeature(item.label);
                                setGateOpen(true);
                              }}
                            >
                              {content}
                            </button>
                          );
                        }

                        return (
                          <Link key={item.href} href={item.href} onClick={onClose}>
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName={gateFeature} />
    </>
  );
}
