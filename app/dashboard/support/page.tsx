"use client";

import React from "react";
import { LifeBuoy, MessageCircle } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";

export default function SupportPage() {
  const { profile } = useMemberAuth();

  const waNumber = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6289663874700";
  const email = profile?.email || "";
  const msg = encodeURIComponent(
    `Halo admin, saya butuh bantuan terkait akun LASTQUESTION.CO (email: ${email})`
  );
  const waLink = `https://wa.me/${waNumber}?text=${msg}`;

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ HELPDESK // SUPPORT TICKET ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Support <span className="text-cyan-300 text-glow-cyan">Ticket</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Butuh bantuan? Hubungi admin langsung via WhatsApp.</p>
      </div>

      <div className="chamfer p-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative">
        <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 flex items-center justify-center bg-cyan-950/40 border border-cyan-400/30 chamfer-sm">
            <LifeBuoy size={26} className="text-cyan-300" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-base mb-1">
              Butuh Bantuan Teknis?
            </h3>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              Tim admin LASTQUESTION.CO siap bantu masalah akun, pembayaran, atau kendala teknis lainnya.
              Klik tombol di bawah untuk terhubung langsung.
            </p>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer-btn w-full flex items-center justify-center gap-2 py-4 px-4 border border-emerald-400 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest mt-2"
          >
            <MessageCircle size={16} />
            HUBUNGI ADMIN VIA WA
          </a>
        </div>
      </div>

      <div className="mt-6 text-center">
        <span className="text-[10px] text-slate-600 font-mono tracking-wide">
          [ RESPON RATA-RATA: 5-15 MENIT PADA JAM KERJA ]
        </span>
      </div>
    </div>
  );
}
