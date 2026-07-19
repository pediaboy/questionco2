"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { ShieldCheck, KeyRound, Calendar, Bell, Copy, RefreshCw, Loader2, Award } from "lucide-react";

interface ApiKeyState {
  key: string | null;
  loading: boolean;
  copied: boolean;
}

export default function ProfilePage() {
  const { profile, accessToken } = useMemberAuth();
  const [apiKey, setApiKey] = useState<ApiKeyState>({ key: null, loading: true, copied: false });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/profile/api-key", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setApiKey({ key: d.api_key, loading: false, copied: false });
      })
      .catch(() => setApiKey((s) => ({ ...s, loading: false })));
  }, [accessToken]);

  async function generateKey() {
    if (!accessToken) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      if (d.success) setApiKey({ key: d.api_key, loading: false, copied: false });
    } finally {
      setGenerating(false);
    }
  }

  function copyKey() {
    if (!apiKey.key) return;
    navigator.clipboard.writeText(apiKey.key);
    setApiKey((s) => ({ ...s, copied: true }));
    setTimeout(() => setApiKey((s) => ({ ...s, copied: false })), 1500);
  }

  if (!profile) return null;

  const initial = (profile.full_name || profile.email || "?").charAt(0).toUpperCase();
  let daysLeft: number | null = null;
  if (profile.is_vip && profile.expired_at) {
    const diffMs = new Date(profile.expired_at).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ OPERATOR // PROFILE ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Profil <span className="text-cyan-300 text-glow-cyan">Anda</span>
        </h2>
      </div>

      {/* Identity card */}
      <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 flex items-center gap-3 mb-4">
        <div className="w-12 h-12 chamfer-sm bg-cyan-950/40 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-display font-bold text-lg">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] truncate">{profile.full_name || "Belum diatur"}</p>
          <p className="text-white/40 text-[11px] font-mono truncate">{profile.email}</p>
        </div>
        {profile.is_vip && <ShieldCheck size={18} className="text-[#FFD700] shrink-0" />}
      </div>

      {/* Subscription details -- real data */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-3 uppercase flex items-center gap-1.5">
          <Award size={12} /> Status Langganan
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-[14px]">
              {profile.is_vip ? "VIP MEMBER" : "FREE MEMBER"}
              {profile.tier ? ` · ${profile.tier}` : ""}
            </p>
            {profile.is_vip && daysLeft !== null && (
              <p className="text-white/40 text-[11px] mt-1 flex items-center gap-1">
                <Calendar size={11} /> {daysLeft} hari tersisa
              </p>
            )}
          </div>
          {!profile.is_vip && (
            <Link
              href="/dashboard/upgrade"
              className="chamfer-sm bg-cyan-400 text-black text-[11px] font-bold px-3 py-2"
            >
              UPGRADE
            </Link>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-3 uppercase flex items-center gap-1.5">
          <KeyRound size={12} /> API Key
        </p>
        {apiKey.loading ? (
          <div className="h-9 bg-white/5 animate-pulse chamfer-sm" />
        ) : apiKey.key ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate bg-black/40 border border-white/10 px-2 py-2 text-[11px] text-cyan-300 font-mono">
              {apiKey.key}
            </code>
            <button
              onClick={copyKey}
              className="chamfer-sm border border-white/10 p-2 text-white/60 hover:text-cyan-300 shrink-0"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={generateKey}
              disabled={generating}
              className="chamfer-sm border border-white/10 p-2 text-white/60 hover:text-cyan-300 shrink-0"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>
        ) : (
          <button
            onClick={generateKey}
            disabled={generating}
            className="chamfer-sm bg-cyan-400 text-black text-[11px] font-bold px-3 py-2.5 w-full flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            GENERATE API KEY
          </button>
        )}
        {apiKey.copied && <p className="text-emerald-400 text-[10px] mt-1.5 font-mono">[ TERSALIN ]</p>}
        <p className="text-white/30 text-[10.5px] mt-2 leading-relaxed">
          Gunakan key ini untuk mengakses sinyal via API. Lihat dokumentasi di{" "}
          <Link href="/api-docs" className="text-cyan-300 underline">
            /api-docs
          </Link>
          .
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/settings"
          className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex items-center gap-2 text-white/70 text-[12px] font-mono hover:border-cyan-400/40"
        >
          <Bell size={14} /> Notifikasi
        </Link>
        <Link
          href="/affiliate"
          className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex items-center gap-2 text-white/70 text-[12px] font-mono hover:border-cyan-400/40"
        >
          <Award size={14} /> Affiliate
        </Link>
      </div>
    </div>
  );
}
