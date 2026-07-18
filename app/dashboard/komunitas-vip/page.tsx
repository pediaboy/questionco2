"use client";

import React from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Send, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 127.14 96.36"
      fill="currentColor"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,73,0c.79.7,1.63,1.39,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.56-18.83C129.1,50.12,122.52,27.39,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
    </svg>
  );
}

export default function KomunitasVipPage() {
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

  const isVip = profile.is_vip;

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ VIP MEMBERS // COMMUNICATIONS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Komunitas <span className="text-[#FFD700] [text-shadow:0_0_8px_rgba(255,215,0,0.5)]">VIP</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Saluran komunikasi eksklusif bagi anggota premium.</p>
      </div>

      {!isVip ? (
        /* Locked screen for non-VIPs */
        <div className="chamfer p-6 bg-[#0b0f18]/60 border border-red-500/20 relative text-center flex flex-col items-center py-10">
          <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-red-500/60" />
          <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-red-500/60" />

          <div className="w-14 h-14 flex items-center justify-center bg-red-950/20 border border-red-500/30 chamfer-sm mb-4">
            <Lock size={24} className="text-red-500 animate-pulse" />
          </div>

          <h3 className="font-display font-bold text-white text-base mb-1 uppercase tracking-wide">
            AKSES DIBATASI (VIP ONLY)
          </h3>
          <p className="text-xs text-white/60 leading-relaxed max-w-xs mb-6">
            Halaman ini khusus untuk anggota VIP. Silakan upgrade akun Anda untuk bergabung dengan Komunitas VIP kami di Telegram dan Discord.
          </p>

          <Link
            href="/dashboard/upgrade"
            className="chamfer-btn w-full max-w-xs flex items-center justify-center gap-2 py-4 px-4 border border-cyan-400 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
          >
            UPGRADE SEKARANG
          </Link>
        </div>
      ) : (
        /* Links screen for VIPs */
        <div className="chamfer p-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative mb-6">
          <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
          <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-6">
            <Sparkles size={12} className="text-cyan-400" /> [ VERIFIED VIP COMMS ]
          </span>

          <div className="flex flex-col gap-4 w-full">
            {/* Telegram VIP Group */}
            <a
              href="https://t.me/+lastquestionvipgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn w-full flex flex-col items-center justify-center gap-2 py-5 px-4 border border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/5 hover:bg-[#38BDF8]/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Send size={24} className="rotate-[-35deg] translate-x-[2px] translate-y-[-1px]" />
              <span className="font-display font-bold text-sm tracking-widest text-center uppercase mt-1">
                TELEGRAM VIP GROUP
              </span>
              <span className="font-mono text-[9px] text-[#38BDF8]/70 tracking-wider">
                [ SECURE SIGNAL TRANSMISSION FEED ]
              </span>
            </a>

            {/* Discord VIP Server */}
            <a
              href="https://discord.gg/lastquestionvip"
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn w-full flex flex-col items-center justify-center gap-2 py-5 px-4 border border-[#5865F2] text-[#5865F2] bg-[#5865F2]/5 hover:bg-[#5865F2]/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <DiscordIcon size={24} />
              <span className="font-display font-bold text-sm tracking-widest text-center uppercase mt-1">
                DISCORD VIP SERVER
              </span>
              <span className="font-mono text-[9px] text-[#5865F2]/70 tracking-wider">
                [ VIP VOICE & CHAT CHANNELS ]
              </span>
            </a>
          </div>
        </div>
      )}

      <div className="text-center mt-6">
        <span className="text-[10px] text-slate-600 font-mono tracking-wide">
          [ CONFIDENTIAL CHANNELS // DO NOT DISTRIBUTE INVIATION LINKS ]
        </span>
      </div>
    </div>
  );
}
