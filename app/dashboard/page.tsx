"use client";

import React from "react";
import Link from "next/link";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { useMemberStats } from "@/lib/useMemberStats";
import MemberHeroStats from "@/components/MemberHeroStats";
import QuickMenuGrid from "@/components/QuickMenuGrid";

export default function MemberDashboard() {
  const { profile: authProfile } = useMemberAuth();
  const { profile: statsProfile } = useMemberStats();

  if (!authProfile) return null;

  // Use live stats profile if loaded, otherwise fall back to auth profile
  const displayProfile = statsProfile || authProfile;
  const displayName = displayProfile.full_name || displayProfile.email.split("@")[0];

  return (
    <div>
      {/* Welcome Line */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SESSION // ESTABLISHED ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Selamat Datang, <span className="text-cyan-300 text-glow-cyan">{displayName}</span>
        </h2>
      </div>

      {/* Hero Stats */}
      <MemberHeroStats profile={displayProfile} />

      {/* Quick Menu Grid */}
      <QuickMenuGrid />

      {/* VIP Upsell Banner (if not already VIP) */}
      {!displayProfile.is_vip && (
        <Link
          href="/vip"
          className="block my-6 chamfer-sm p-4 border border-[#FFD700]/30 bg-gradient-to-r from-amber-950/20 to-black relative overflow-hidden group active:border-[#FFD700]/80 transition-all duration-200"
        >
          {/* Tactical Corner Accents */}
          <div className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t border-l border-[#FFD700]/80" />
          <div className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b border-r border-[#FFD700]/80" />

          <div className="flex items-center justify-between">
            <div className="flex-1 pr-3">
              <span className="text-[9.5px] font-bold tracking-widest text-[#FFD700] uppercase font-mono block mb-1">
                [ ELITE PROTOCOL ACCESS ]
              </span>
              <h3 className="font-display font-bold text-white text-[15px] uppercase tracking-wide">
                Upgrade ke VIP Sinyal
              </h3>
              <p className="text-white/60 text-[11px] mt-1.5 leading-relaxed max-w-[260px]">
                Dapatkan akses sinyal trading real-time, live analysis, dan support premium sekarang juga.
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] chamfer-sm transition-transform duration-200 group-hover:translate-x-1">
              <span className="font-bold text-base">→</span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
