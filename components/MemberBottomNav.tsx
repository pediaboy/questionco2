"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LineChart, Radio, GraduationCap, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function MemberBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Home", href: "/member", icon: LineChart },
    { label: "Kelas", href: "/gratis", icon: GraduationCap },
    { label: "Sinyal", href: "/vip", icon: Radio },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-[calc(28rem-32px)] mx-auto z-40 bg-black/70 backdrop-blur-xl border border-cyan-400/15 trapezoid-nav shadow-[0_-4px_20px_rgba(0,240,255,0.05)]">
      <div className="flex items-center justify-around py-2 px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1.5 w-16 transition-colors duration-200 ${
                isActive ? "text-cyan-300 font-bold" : "text-white/50 hover:text-white/80"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
              )}
              <IconComponent size={20} strokeWidth={isActive ? 2 : 1.5} className="mb-0.5" />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}

        {/* Profil / Logout Button */}
        <button
          onClick={handleLogout}
          className="relative flex flex-col items-center justify-center py-1.5 w-16 text-white/50 hover:text-white/80 transition-colors duration-200"
        >
          <UserRound size={20} strokeWidth={1.5} className="mb-0.5" />
          <span className="text-[10px] uppercase tracking-wider">Profil</span>
        </button>
      </div>
    </nav>
  );
}
