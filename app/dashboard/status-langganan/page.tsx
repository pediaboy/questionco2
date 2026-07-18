"use client";

import React from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Shield, Sparkles, Zap, Award, Calendar } from "lucide-react";
import Link from "next/link";

export default function StatusLanggananPage() {
  const { profile, loading } = useMemberAuth();

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="text-xs text-cyan-300 font-mono animate-pulse">[ MEMUAT DATA SYSTEM... ]</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 bg-black/30 border border-dashed border-red-500/20 chamfer-sm">
        <span className="text-xs text-red-400 font-mono">[ KONEKSI GAGAL: PROFILE TIDAK DITEMUKAN ]</span>
      </div>
    );
  }

  let daysLeft: number | null = null;
  if (profile.is_vip && profile.expired_at) {
    const diffMs = new Date(profile.expired_at).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SUBSCRIPTION // BILLING STATUS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Status <span className="text-cyan-300 text-glow-cyan">Langganan</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Informasi paket aktif dan detail penagihan akun Anda.</p>
      </div>

      {/* Subscription Widget (same design pattern as profile page, but suited for subscription detail page) */}
      <div className="chamfer-sm p-4 mb-6 bg-[#0b0f18]/60 border border-white/10 relative">
        {/* Tactical Corner Accents */}
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/40" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/40" />

        {profile.is_vip && daysLeft !== null ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Award className="text-[#FFD700] w-4 h-4 animate-pulse" />
              <p className="text-xs text-white/70 font-mono">
                Masa Aktif VIP Anda tersisa: <span className="text-cyan-300 font-bold text-sm">{daysLeft} Hari</span>
              </p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="chamfer-btn mt-3 inline-flex items-center justify-center w-full py-3 border border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
            >
              [ RENEW VIP MEMBER ]
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="text-slate-500 w-4 h-4" />
              <p className="text-xs text-white/70 font-mono">Anda belum berlangganan VIP.</p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="chamfer-btn mt-3 inline-flex items-center justify-center w-full py-3 border border-cyan-400 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
            >
              [ UPGRADE VIP ]
            </Link>
          </>
        )}
      </div>

      {/* Detail Breakdown */}
      <div className="chamfer p-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative mb-6">
        <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-6">
          <Zap size={12} className="text-cyan-400" /> [ SUBSCRIPTION PROTOCOL ]
        </span>

        <div className="space-y-4 font-mono text-xs">
          {/* Tier Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/5">
            <span className="text-slate-400 uppercase tracking-wider">CURRENT TIER:</span>
            <span className={`font-bold uppercase tracking-widest ${profile.is_vip ? "text-[#FFD700] [text-shadow:0_0_8px_rgba(255,215,0,0.5)]" : "text-cyan-400"}`}>
              [ {profile.tier || "FREE"} ]
            </span>
          </div>

          {/* Role Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/5">
            <span className="text-slate-400 uppercase tracking-wider">ROLE CLASSIFICATION:</span>
            <span className="font-bold text-white uppercase">[ {profile.role || "MEMBER"} ]</span>
          </div>

          {/* VIP Active Status Row */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-white/5">
            <span className="text-slate-400 uppercase tracking-wider">VIP STATUS:</span>
            {profile.is_vip ? (
              <span className="text-emerald-400 font-bold tracking-widest">[ ACTIVE ]</span>
            ) : (
              <span className="text-slate-500 font-bold tracking-widest">[ INACTIVE ]</span>
            )}
          </div>

          {/* Expired At Row */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 uppercase tracking-wider">EXPIRED AT:</span>
            <span className="text-white">
              {profile.expired_at
                ? new Date(profile.expired_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "[ N/A ]"}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-600 font-mono tracking-wide">
          [ SECURE BILLING ENGINE // QCO2 VER. 1.0.4 ]
        </span>
      </div>
    </div>
  );
}
