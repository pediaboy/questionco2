"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { ShieldCheck, Smartphone, Clock, Lock } from "lucide-react";

interface LoginRow {
  ip: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

function deviceLabel(ua: string): string {
  if (!ua) return "Unknown Device";
  if (/iphone|ipad/i.test(ua)) return "iOS Device";
  if (/android/i.test(ua)) return "Android Device";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/macintosh|mac os/i.test(ua)) return "Mac";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown Device";
}

export default function SecurityPage() {
  const { accessToken } = useMemberAuth();
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/security", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLogins(d.logins || []);
          setLastSignIn(d.last_sign_in_at);
        }
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SYSTEM // SECURITY CENTER ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Pusat <span className="text-cyan-300 text-glow-cyan">Keamanan</span>
        </h2>
      </div>

      {/* Current session */}
      <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 chamfer-sm bg-emerald-950/40 border border-emerald-400/30 flex items-center justify-center">
          <ShieldCheck size={18} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-[13px] font-semibold">Sesi Aktif Sekarang</p>
          <p className="text-white/40 text-[10.5px] font-mono">
            {lastSignIn ? new Date(lastSignIn).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : "-"}
          </p>
        </div>
      </div>

      {/* 2FA -- honest state, not a fake toggle */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Lock size={16} className="text-white/50" />
          <div>
            <p className="text-white text-[13px] font-semibold">Autentikasi Dua Faktor (2FA)</p>
            <p className="text-white/30 text-[10.5px]">Segera hadir untuk keamanan tambahan.</p>
          </div>
        </div>
        <span className="text-[9.5px] font-mono uppercase tracking-wider text-amber-400 border border-amber-400/30 px-2 py-1 chamfer-sm shrink-0">
          Coming Soon
        </span>
      </div>

      {/* Real login history */}
      <div className="mb-2">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase flex items-center gap-1.5">
          <Clock size={12} /> Riwayat Login
        </p>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-white/5 animate-pulse chamfer-sm" />
          ))}
        </div>
      ) : logins.length === 0 ? (
        <div className="text-center py-8 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA RIWAYAT TERCATAT ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          {logins.map((l, idx) => (
            <div key={idx} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex items-center gap-3">
              <Smartphone size={16} className="text-cyan-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white text-[12px] font-semibold truncate">{deviceLabel(l.user_agent)}</p>
                <p className="text-white/30 text-[10px] font-mono">
                  {l.ip} · {new Date(l.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                </p>
              </div>
              <span className="text-emerald-400 text-[10px] font-mono shrink-0">BERHASIL</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
