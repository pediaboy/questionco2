"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Gift, Copy, Users, CheckCircle2, Clock } from "lucide-react";

interface ReferralRow {
  referred_email: string;
  status: string;
  created_at: string;
}

export default function AffiliatePage() {
  const { accessToken } = useMemberAuth();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/referral", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCode(d.referral_code);
          setReferrals(d.referrals || []);
        }
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const link = code ? `https://lastquestion.store/register?ref=${code}` : "";

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ GROWTH // AFFILIATE PROGRAM ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Program <span className="text-cyan-300 text-glow-cyan">Afiliasi</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Ajak teman gabung, dapatkan reward tiap referral berhasil daftar.</p>
      </div>

      {/* How it works */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3">Cara Kerja</p>
        <div className="space-y-2 text-[12px] text-white/60">
          <p>1. Bagikan link referral unik Anda ke teman/komunitas.</p>
          <p>2. Teman mendaftar lewat link tersebut → tercatat otomatis di akun Anda.</p>
          <p>3. Admin akan menghubungi untuk proses reward/diskon langganan VIP.</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 mb-4">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3 flex items-center gap-1.5">
          <Gift size={12} /> Link Referral Anda
        </p>
        {loading ? (
          <div className="h-9 bg-white/5 animate-pulse chamfer-sm" />
        ) : (
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate bg-black/40 border border-white/10 px-2 py-2 text-[11px] text-cyan-300 font-mono">
              {link}
            </code>
            <button onClick={copyLink} className="chamfer-sm border border-white/10 p-2 text-white/60 hover:text-cyan-300 shrink-0">
              <Copy size={14} />
            </button>
          </div>
        )}
        {copied && <p className="text-emerald-400 text-[10px] mt-1.5 font-mono">[ LINK TERSALIN ]</p>}
      </div>

      {/* Stats */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4 text-center">
        <p className="text-[9px] tracking-widest text-white/40 uppercase mb-1 flex items-center justify-center gap-1.5">
          <Users size={12} /> Total Referral
        </p>
        <p className="text-2xl font-bold font-mono text-cyan-300">{referrals.length}</p>
      </div>

      {/* Referral list */}
      {referrals.length > 0 && (
        <div className="space-y-2">
          {referrals.map((r, idx) => (
            <div key={idx} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex items-center justify-between">
              <span className="text-white/70 text-[11.5px] font-mono truncate">{r.referred_email}</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 shrink-0">
                {r.status === "registered" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {r.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
