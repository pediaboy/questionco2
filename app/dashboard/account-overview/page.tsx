"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { C, Panel, CornerTicks, VipGateOverlay } from "@/lib/cyberKit";
import VipUpgradeModal from "@/components/VipUpgradeModal";
import {
  User,
  Shield,
  Clock,
  Send,
  Link2,
  Users,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  ChevronRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ReferralMember {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export default function AccountOverviewPage() {
  const { accessToken, profile, refreshProfile } = useMemberAuth();
  const [refCount, setRefCount] = useState<number | null>(null);
  const [referrals, setReferrals] = useState<ReferralMember[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [copied, setCopied] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // Telegram username update state
  const [tgInput, setTgInput] = useState("");
  const [updatingTg, setUpdatingTg] = useState(false);
  const [tgError, setTgError] = useState("");
  const [tgSuccess, setTgSuccess] = useState(false);

  useEffect(() => {
    if (profile?.telegram_username) {
      setTgInput(profile.telegram_username);
    }
  }, [profile]);

  const fetchReferrals = async () => {
    if (!accessToken) return;
    try {
      setLoadingRef(true);
      const res = await fetch("/api/member/referral-count", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRefCount(data.count);
          setReferrals(data.referrals || []);
        }
      }
    } catch (err) {
      console.error("Error fetching referral count:", err);
    } finally {
      setLoadingRef(false);
    }
  };

  useEffect(() => {
    if (accessToken && profile?.is_vip) {
      fetchReferrals();
    } else {
      setLoadingRef(false);
    }
  }, [accessToken, profile]);

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const isVip = profile.is_vip;

  const handleUpdateTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setUpdatingTg(true);
    setTgError("");
    setTgSuccess(false);

    try {
      const sanitized = tgInput.trim().replace(/^@/, "");
      const res = await fetch("/api/member/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ telegram_username: sanitized }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTgSuccess(true);
          await refreshProfile();
        } else {
          setTgError(data.error || "Gagal memperbarui username");
        }
      } else {
        setTgError("Gagal menghubungi server");
      }
    } catch (err) {
      console.error("Telegram update error:", err);
      setTgError("Terjadi kesalahan sistem");
    } finally {
      setUpdatingTg(false);
    }
  };

  const getReferralUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${profile.referral_code || ""}`;
  };

  const copyReferralLink = () => {
    const url = getReferralUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative min-h-[80vh] pb-10">
      {/* Tactical HUD Header */}
      <div
        className="relative mb-6 overflow-hidden border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-black to-black p-4"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}
      >
        <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />
        <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/30" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-cyan-400/80 [filter:drop-shadow(0_0_4px_rgba(0,240,255,0.6))]" />

        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-cyan-400 [box-shadow:0_0_6px_#00F0FF]" />
          </span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
            [ SECURE CORE // INSTANCE STATUS ]
          </span>
        </div>

        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl uppercase tracking-wider font-mono">
          Account Status HUD
        </h2>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
          Monitor status lisensi, integrasi API Telegram, dan pipa affiliasi Anda.
        </p>
      </div>

      <div className="relative">
        <div className={`grid grid-cols-1 gap-6 lg:grid-cols-12 transition-all duration-300 ${isVip ? "" : "blur-md select-none pointer-events-none"}`}>
          
          {/* LEFT PANEL: License & Verification Center (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <Panel glowColor={C.cyan} size={12}>
              <CornerTicks color={C.cyan} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="text-cyan-400 h-5 w-5 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      SUBSCRIPTION CONTROL NODE
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">[ SYSTEM ONLINE ]</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* VIP Access Badge */}
                  <div className="border border-slate-800 bg-[#080d16] p-3 font-mono">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">ACCESS LICENSE</span>
                    <div className="mt-2 flex items-center gap-2">
                      {isVip ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse [box-shadow:0_0_6px_#00FF66]" />
                          <span className="text-emerald-400 font-bold text-sm tracking-wider uppercase">VIP PREMIUM</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-amber-400 font-bold text-sm tracking-wider uppercase">FREE TIED ACCESS</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Level Tier Status */}
                  <div className="border border-slate-800 bg-[#080d16] p-3 font-mono">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">CONTEST SYSTEM LEVEL</span>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Zap className="text-yellow-400 h-4 w-4" />
                      <span className="text-white font-bold text-sm">
                        {profile.tier ? `TIER ${profile.tier.toUpperCase()}` : "UNRANKED"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiration Timer Banner */}
                <div className="border border-slate-800/80 bg-slate-950/60 p-4 font-mono relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Clock size={80} />
                  </div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <Clock className="text-slate-400 h-4 w-4" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">EXPIRATION TIMESTAMP</span>
                    </div>
                    <div className="text-sm font-bold text-white tracking-wide">
                      {isVip ? formatDate(profile.expired_at) : "LISENSI EXPIRED / BELUM AKTIF"}
                    </div>
                    <span className="text-[8.5px] text-slate-500 uppercase tracking-wider leading-relaxed">
                      Situs ini adalah layanan berlangganan edukasi & sinyal trading. Lisensi ini mengizinkan akses ke AI Engine dan sinyal real-time premium.
                    </span>
                  </div>
                </div>

                {/* Notice that this is not a brokerage */}
                <div className="border border-cyan-500/20 bg-cyan-950/10 p-3.5 font-mono text-[9px] text-cyan-400/80 leading-relaxed uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 mb-1 text-cyan-300 font-bold">
                    <ShieldCheck size={12} />
                    <span>[ ZERO-DUMMY POLICY COMPLIANCE ]</span>
                  </div>
                  LASTQUESTION.CO TIDAK MENYIMPAN ATAU MENYINKRONKAN SALDO BROKER SECARA STATIS. HUD INI ADALAH TAMPILAN STATUS BERLANGGANAN AKSES ENGINE DAN DATA MANDIRI.
                </div>
              </div>
            </Panel>

            {/* Telegram Linkage Control */}
            <Panel glowColor={profile.telegram_username ? C.cyan : C.gold} size={12}>
              <CornerTicks color={profile.telegram_username ? C.cyan : C.gold} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Send className="text-cyan-400 h-5 w-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      TELEGRAM LINKAGE GATEWAY
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {profile.telegram_username ? (
                      <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={8} /> CONNECTED
                      </span>
                    ) : (
                      <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={8} /> NOT LINKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-mono text-xs text-slate-400 leading-relaxed space-y-2">
                  <p>
                    Hubungkan akun Telegram Anda untuk menerima alert real-time langsung dari AI Engine.
                  </p>
                  <form onSubmit={handleUpdateTelegram} className="mt-3 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                      <input
                        type="text"
                        placeholder="username_telegram"
                        value={tgInput}
                        onChange={(e) => setTgInput(e.target.value)}
                        className="w-full bg-[#05080f] border border-cyan-400/20 px-3 py-2 pl-7 text-white text-xs font-mono focus:outline-none focus:border-cyan-400/70"
                        style={{ clipPath: "polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updatingTg}
                      className="border border-cyan-400/40 bg-cyan-950/20 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest text-cyan-300 hover:bg-cyan-950/40 active:scale-[0.98] transition-all disabled:opacity-50"
                      style={{ clipPath: "polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)" }}
                    >
                      {updatingTg ? "SAVING..." : "[ UPDATE LINK ]"}
                    </button>
                  </form>
                  {tgError && <span className="text-red-400 text-[9px] block font-mono uppercase mt-1">{tgError}</span>}
                  {tgSuccess && <span className="text-emerald-400 text-[9px] block font-mono uppercase mt-1">✓ Username Telegram berhasil diperbarui</span>}
                </div>
              </div>
            </Panel>

            {/* Broker Registration Verification Panel */}
            <Panel glowColor={profile.broker_registered ? C.cyan : C.gold} size={12}>
              <CornerTicks color={profile.broker_registered ? C.cyan : C.gold} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="text-cyan-400 h-5 w-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      BROKER INTEGRATION CORE
                    </span>
                  </div>
                  <div>
                    {profile.broker_registered ? (
                      <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={8} /> VERIFIED
                      </span>
                    ) : (
                      <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={8} /> PENDING REVIEW
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-mono text-xs text-slate-400 leading-relaxed space-y-2">
                  <p>
                    Status registrasi akun broker afiliasi resmi LASTQUESTION.CO Anda. Akun broker yang terverifikasi diperlukan untuk kualifikasi penarikan hadiah kontes lot.
                  </p>
                  <div className="border border-slate-800/60 bg-black/40 p-3 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">PARTNER BROKER:</span>
                      <span className="text-white font-bold">XM GLOBAL / EXNESS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">INTEGRATION STATUS:</span>
                      <span className={profile.broker_registered ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {profile.broker_registered ? "ACTIVE & VERIFIED" : "PENDING REVIEW"}
                      </span>
                    </div>
                  </div>
                  {!profile.broker_registered && (
                    <p className="text-[10px] text-amber-400/80 uppercase tracking-wide">
                      * Silakan hubungi Support Admin di Telegram jika Anda sudah mendaftarkan akun di bawah link afiliasi kami tetapi status masih Pending.
                    </p>
                  )}
                </div>
              </div>
            </Panel>
          </div>

          {/* RIGHT PANEL: Referral Affiliation Engine (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <Panel glowColor={C.gold} size={12}>
              <CornerTicks color={C.gold} />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="text-yellow-500 h-5 w-5" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      REFERRAL PIPELINE ENGINE
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-yellow-500">[ REVENUE SHARE ]</span>
                </div>

                {/* Copyable referral code area */}
                <div className="border border-slate-800 bg-[#080d16] p-4 font-mono space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">YOUR REFERRAL CODE</span>
                    <div className="mt-1 flex items-center justify-between bg-black/40 border border-slate-800 px-3 py-1.5 text-xs text-white">
                      <span className="font-bold tracking-wider">{profile.referral_code || "GEN-REF-ERR"}</span>
                      <button
                        onClick={copyReferralLink}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                        title="Copy Referral Link"
                      >
                        <Copy size={12} />
                        <span className="text-[9.5px] tracking-widest">{copied ? "[ COPIED ]" : "[ COPY ]"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">REFERRAL LINK</span>
                    <span className="text-[10px] text-slate-400 break-all select-all block p-2 bg-black/20 border border-dashed border-slate-800 mt-1">
                      {getReferralUrl()}
                    </span>
                  </div>
                </div>

                {/* Referral stats */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="border border-slate-800/80 bg-slate-950 p-3">
                    <span className="text-[8.5px] text-slate-500 block uppercase tracking-wider">REFERRED USERS</span>
                    <span className="text-xl font-bold text-yellow-400 block mt-1">
                      {loadingRef ? "..." : refCount ?? 0}
                    </span>
                  </div>
                  <div className="border border-slate-800/80 bg-slate-950 p-3">
                    <span className="text-[8.5px] text-slate-500 block uppercase tracking-wider">REFERRED BY</span>
                    <span className="text-xs font-bold text-white block mt-1.5 uppercase truncate">
                      {profile.referred_by || "DIRECT REGISTER"}
                    </span>
                  </div>
                </div>

                {/* Sub-section: Referral Roster */}
                <div className="font-mono">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <span>[ REFERRED MEMBERS ROSTER ]</span>
                    </span>
                    <button
                      onClick={fetchReferrals}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={11} className={loadingRef ? "animate-spin" : ""} />
                    </button>
                  </div>

                  {loadingRef ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-black/40 border border-slate-900 animate-pulse" />
                      <div className="h-10 bg-black/40 border border-slate-900 animate-pulse" />
                    </div>
                  ) : referrals.length === 0 ? (
                    <div className="border border-dashed border-slate-800 bg-black/20 p-6 text-center text-slate-500 text-[10px]">
                      [ BELUM ADA AKUN DIREFERENSIKAN ]
                    </div>
                  ) : (
                    <div className="border border-slate-800 max-h-48 overflow-y-auto divide-y divide-slate-900 custom-scrollbar">
                      {referrals.map((ref) => (
                        <div key={ref.id} className="p-2.5 bg-black/30 hover:bg-slate-900/40 flex items-center justify-between text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{ref.full_name || "MEMBER_CO2"}</span>
                            <span className="text-slate-500 text-[9px]">{ref.email}</span>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-slate-400 font-mono text-[9px]">
                              {new Date(ref.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            </span>
                            <span className="text-emerald-500 text-[8.5px] tracking-wider uppercase">[ VERIFIED ]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </div>

        </div>

        {/* Vip Gate Overlay if user is not VIP */}
        {!isVip && (
          <VipGateOverlay isVip={isVip} onUpgradeClick={() => setGateOpen(true)} />
        )}
      </div>

      <VipUpgradeModal open={gateOpen} onClose={() => setGateOpen(false)} featureName="Account Overview" />
    </div>
  );
}
