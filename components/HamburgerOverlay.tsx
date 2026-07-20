"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Info,
  Gift,
  Newspaper,
  BookOpen,
  HelpCircle,
  Mail,
  Signal,
  TrendingUp,
  History,
  BarChart3,
  Activity,
  DollarSign,
  Star,
  Database,
  Users,
  GraduationCap,
  Library,
  MessageSquareQuote,
  Rocket,
  Code2,
  FileText,
  Send,
  Handshake,
  Building2,
  ScrollText,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// Consolidated public navigation, grouped into categories so a large page
// count stays scannable inside a single overlay menu (same "one consolidated
// menu" principle used by the dashboard's AllFeaturesSheet).
const GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: "UTAMA",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Tentang", href: "/tentang", icon: Info },
      { label: "Analisa", href: "/analisa", icon: Newspaper },
      { label: "Blog", href: "/blog", icon: BookOpen },
      { label: "Gratis", href: "/gratis", icon: Gift },
    ],
  },
  {
    title: "SINYAL & DATA",
    items: [
      { label: "Sinyal", href: "/signals", icon: Signal },
      { label: "Riwayat Sinyal", href: "/signal-history", icon: History },
      { label: "Performance", href: "/performance", icon: TrendingUp },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Status Sistem", href: "/status", icon: Activity },
      { label: "Data Sources", href: "/data-sources", icon: Database },
    ],
  },
  {
    title: "HARGA & FITUR",
    items: [
      { label: "Pricing", href: "/pricing", icon: DollarSign },
      { label: "Features", href: "/features", icon: Star },
      { label: "Affiliate", href: "/affiliate", icon: Gift },
      { label: "Broker Integration", href: "/broker-integration", icon: Handshake },
      { label: "Partners", href: "/partners", icon: Building2 },
    ],
  },
  {
    title: "KOMUNITAS & EDUKASI",
    items: [
      { label: "Community", href: "/community", icon: Users },
      { label: "Learning Center", href: "/learning-center", icon: GraduationCap },
      { label: "Strategy Library", href: "/strategy-library", icon: Library },
      { label: "Testimonials", href: "/testimonials", icon: MessageSquareQuote },
      { label: "Onboarding", href: "/onboarding", icon: Rocket },
      { label: "Newsletter", href: "/newsletter", icon: Send },
    ],
  },
  {
    title: "DEVELOPER",
    items: [
      { label: "Developer Hub", href: "/developer-hub", icon: Code2 },
      { label: "API Docs", href: "/api-docs", icon: FileText },
    ],
  },
  {
    title: "BANTUAN & LEGAL",
    items: [
      { label: "FAQ", href: "/faq", icon: HelpCircle },
      { label: "Roadmap", href: "/roadmap", icon: Rocket },
      { label: "Kontak", href: "/contact", icon: Mail },
      { label: "Terms", href: "/terms", icon: ScrollText },
      { label: "Disclaimer", href: "/disclaimer", icon: ShieldAlert },
      { label: "Risk Disclosure", href: "/risk-disclosure", icon: AlertTriangle },
    ],
  },
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
            background: "rgba(5, 8, 15, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between px-6 pt-6 shrink-0">
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
              open: { transition: { staggerChildren: 0.03, delayChildren: 0.08 } },
              closed: {},
            }}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
          >
            {GROUPS.map((group) => (
              <div key={group.title}>
                <span className="text-[10px] tracking-[0.2em] text-slate-500 font-mono block mb-2.5">
                  [ {group.title} ]
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        variants={{
                          closed: { opacity: 0, x: -10 },
                          open: { opacity: 1, x: 0 },
                        }}
                        className="flex items-center gap-2 text-[12.5px] tracking-wide text-[#E2E8F0] font-medium hover:text-cyan-300 transition-colors w-fit"
                      >
                        <Icon size={13} className="text-cyan-400/70 shrink-0" />
                        {item.label}
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            ))}

            <motion.a
              href="/vip"
              onClick={onClose}
              variants={{
                closed: { opacity: 0, x: -14 },
                open: { opacity: 1, x: 0 },
              }}
              className="flex items-center gap-2.5 w-fit pt-2"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
