"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Users, 
  Trophy, 
  MessageCircle, 
  Send, 
  Radio, 
  ArrowRight, 
  Award, 
  Sparkles,
  Zap
} from "lucide-react";
import { MemberAuthProvider, useMemberAuth } from "@/lib/MemberAuthContext";

interface PreviewItem {
  name: string;
  total_lot: number;
}

interface GlobalStats {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  kelas_completed: number;
  updated_at: string;
}

function CommunityClientContent() {
  const { profile, loading: authLoading, notLoggedIn } = useMemberAuth();

  const [leaderboard, setLeaderboard] = useState<PreviewItem[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [syncFlash, setSyncFlash] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/public/leaderboard-preview", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success) {
          setLeaderboard(json.items || []);
          setSyncFlash(true);
          setTimeout(() => setSyncFlash(false), 500);
        }
      } catch (err) {
        console.error("Error fetching leaderboard preview:", err);
      } finally {
        if (mounted) setLoadingLeaderboard(false);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/global-stats", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json.success) {
          setStats(json.stats || null);
        }
      } catch (err) {
        console.error("Error fetching global statistics:", err);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };

    fetchLeaderboard();
    fetchStats();

    const iv = setInterval(() => {
      fetchLeaderboard();
      fetchStats();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  // WhatsApp Admin Support URL configuration
  const waNumber = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6289663874700";
  const emailSuffix = profile?.email ? ` (email: ${profile.email})` : "";
  const waMsg = encodeURIComponent(
    `Halo admin, saya ingin bertanya tentang komunitas LASTQUESTION.CO${emailSuffix}`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712] text-white">
      <Header />
      
      <main className="pt-[104px] px-5 pb-6">
        {/* Page Hero Header */}
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ ECOSYSTEM // COMMUNITY HUB ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            COMMUNITY HUB
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Pusat koordinasi operasional, transparansi statistik ekosistem, dan saluran komunikasi taktis antar anggota.
          </p>
        </div>

        {/* Live Sync Status */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest border px-3 py-1.5 transition-all duration-300 ${
              syncFlash 
                ? "border-cyan-400/60 text-cyan-300 bg-cyan-400/5 shadow-[0_0_8px_rgba(0,240,255,0.1)]" 
                : "border-white/10 text-white/30"
            }`}
          >
            <Radio size={11} className={syncFlash ? "animate-pulse text-cyan-400" : ""} /> 
            {syncFlash ? "SYNCHRONIZING..." : "SYSTEM SYNCED"}
          </div>
        </div>

        {/* Real Global Statistics Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
              [ REALTIME // GLOBAL STATS ]
            </span>
          </div>

          {loadingStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[74px] bg-[#0b0f18]/40 border border-white/5 chamfer-sm animate-pulse" />
              ))}
            </div>
          ) : !stats ? (
            <div className="text-center py-6 border border-dashed border-white/10 chamfer-sm">
              <span className="text-xs text-slate-500 font-mono">[ GAGAL MEMUAT STATISTIK ]</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Win Rate */}
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-3 flex flex-col justify-between min-h-[74px] relative">
                <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 border-t border-l border-cyan-400/40" />
                <div>
                  <p className="text-[8.5px] tracking-[0.15em] font-mono text-cyan-400/60 uppercase">
                    [ WIN RATE ]
                  </p>
                  <p className="font-mono font-bold text-base text-white mt-1 uppercase">
                    {stats.win_rate}%
                  </p>
                </div>
                <div className="flex justify-end">
                  <Trophy className="text-cyan-400/40 w-3.5 h-3.5" />
                </div>
              </div>

              {/* Total Trades */}
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-3 flex flex-col justify-between min-h-[74px] relative">
                <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 border-t border-l border-cyan-400/40" />
                <div>
                  <p className="text-[8.5px] tracking-[0.15em] font-mono text-cyan-400/60 uppercase">
                    [ TOTAL TRADES ]
                  </p>
                  <p className="font-mono font-bold text-base text-white mt-1 uppercase">
                    {stats.total_trade?.toLocaleString("id-ID") || "0"}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Zap className="text-cyan-400/40 w-3.5 h-3.5" />
                </div>
              </div>

              {/* Profit Pips */}
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-3 flex flex-col justify-between min-h-[74px] relative">
                <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 border-t border-l border-cyan-400/40" />
                <div>
                  <p className="text-[8.5px] tracking-[0.15em] font-mono text-cyan-400/60 uppercase">
                    [ PROFIT PIPS ]
                  </p>
                  <p className="font-mono font-bold text-base text-white mt-1 uppercase">
                    +{stats.profit_pips?.toLocaleString("id-ID") || "0"}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Award className="text-cyan-400/40 w-3.5 h-3.5" />
                </div>
              </div>

              {/* Classes Completed */}
              <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-3 flex flex-col justify-between min-h-[74px] relative">
                <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 border-t border-l border-cyan-400/40" />
                <div>
                  <p className="text-[8.5px] tracking-[0.15em] font-mono text-cyan-400/60 uppercase">
                    [ EDUKASI SELESAI ]
                  </p>
                  <p className="font-mono font-bold text-base text-white mt-1 uppercase">
                    {stats.kelas_completed?.toLocaleString("id-ID") || "0"}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Users className="text-cyan-400/40 w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real Live Leaderboard Preview Section */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block mb-2">
            [ LIVE // LEADERBOARD PREVIEW ]
          </span>

          {loadingLeaderboard ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[#0b0f18]/40 border border-white/5 chamfer-sm animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 chamfer-sm">
              <span className="text-xs text-slate-500 font-mono">[ BELUM ADA DATA CONTEST ]</span>
            </div>
          ) : (
            <div className="chamfer bg-[#0b0f18]/60 border border-white/10 overflow-hidden relative">
              <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-cyan-400/60" />
              <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-cyan-400/60" />

              <div className="divide-y divide-white/10">
                {leaderboard.map((item, index) => {
                  const rank = index + 1;
                  let rankColor = "text-white/70";
                  let highlightBg = "bg-black/20";
                  let borderGlow = "";

                  if (rank === 1) {
                    rankColor = "text-[#FFD700] [text-shadow:0_0_8px_rgba(255,215,0,0.4)]";
                    highlightBg = "bg-[#FFD700]/5";
                    borderGlow = "border-l-2 border-l-[#FFD700]";
                  } else if (rank === 2) {
                    rankColor = "text-[#C0C0C0]";
                  } else if (rank === 3) {
                    rankColor = "text-[#CD7F32]";
                  }

                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-4 transition-all ${highlightBg} ${borderGlow} hover:bg-white/5`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 flex items-center justify-center font-mono text-center text-sm font-bold ${rankColor}`}>
                          {rank === 1 ? (
                            <Trophy size={16} className="text-[#FFD700]" />
                          ) : (
                            rank
                          )}
                        </span>
                        <div>
                          <div className="font-sans font-bold text-white text-[13.5px]">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider mt-0.5">
                            Rank {rank} Active Trader
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className="font-mono font-bold text-sm text-cyan-300">
                          {item.total_lot.toLocaleString("id-ID")} Lot
                        </span>
                        <span className="text-[8.5px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">
                          LOTS ACCUMULATED
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tactical Channels & Interaction */}
        <div className="mb-6 flex flex-col gap-4">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ TACTICAL // CHANNELS & COMMUNICATIONS ]
          </span>

          {/* Telegram Comms */}
          <div className="chamfer-sm bg-[#0b0f18]/60 border border-[#38BDF8]/20 p-5 relative overflow-hidden">
            <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-[#38BDF8]/50" />
            <div className="absolute top-0 right-0 w-20 h-24 bg-gradient-to-br from-[#38BDF8]/10 to-transparent pointer-events-none" />
            
            <h3 className="font-display font-bold text-white text-sm tracking-wide mb-2 flex items-center gap-2">
              <Send size={15} className="text-[#38BDF8] rotate-[-35deg]" /> 
              TELEGRAM COMMUNICATIONS
            </h3>
            
            <p className="text-white/60 text-[12px] leading-relaxed mb-4 font-sans">
              Saluran transmisi intelijen utama kami. Dapatkan broadcast analisis market harian secara gratis di Telegram Bot kami, atau akses VIP Group untuk sinyal trading dan diskusi eksklusif.
            </p>

            <div className="flex flex-col gap-2">
              <a
                href="https://t.me/LASTQUESTIONVIP_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="chamfer-btn w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/5 hover:bg-[#38BDF8]/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
              >
                <Send size={13} className="rotate-[-35deg]" />
                AKSES PUBLIC BOT
              </a>
              <p className="text-[9px] text-white/40 text-center font-mono uppercase tracking-wider mt-1">
                * VIP telegram channel membutuhkan verifikasi status langganan
              </p>
            </div>
          </div>

          {/* WhatsApp Contact Comms */}
          <div className="chamfer-sm bg-[#0b0f18]/60 border border-emerald-500/20 p-5 relative overflow-hidden">
            <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-emerald-500/50" />
            <div className="absolute top-0 right-0 w-20 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
            
            <h3 className="font-display font-bold text-white text-sm tracking-wide mb-2 flex items-center gap-2">
              <MessageCircle size={15} className="text-emerald-400" /> 
              WHATSAPP HELPDESK
            </h3>
            
            <p className="text-white/60 text-[12px] leading-relaxed mb-4 font-sans">
              Butuh panduan pendaftaran, detail program VIP, atau kendala administratif lainnya? Tim helpdesk ekosistem LASTQUESTION.CO siap membantu kendala Anda langsung secara privat.
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn w-full flex items-center justify-center gap-2 py-3 px-4 border border-emerald-400 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
            >
              <MessageCircle size={13} />
              HUBUNGI ADMIN VIA WA
            </a>
          </div>
        </div>

        {/* Global Action CTA Section */}
        <div className="mt-8 text-center">
          <div className="chamfer p-6 bg-gradient-to-b from-cyan-950/20 to-[#0b0f18]/90 border border-cyan-400/25 relative">
            <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
            <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />
            
            <Sparkles size={22} className="text-cyan-300 mx-auto mb-3" />
            
            <h2 className="font-display font-bold text-base text-white tracking-wide mb-2">
              BANYAK BENEFIT <span className="text-cyan-300 text-glow-cyan">DENGAN VIP ACCESS</span>
            </h2>
            <p className="text-white/60 text-[11.5px] leading-relaxed mb-5 max-w-xs mx-auto">
              Buka potensi penuh Anda dengan mengakses database VIP. Dapatkan analisa real-time harian, signal dengan akurasi teruji, serta hak akses penuh ke Telegram VIP Group.
            </p>

            {authLoading ? (
              <div className="h-11 bg-cyan-400/10 border border-cyan-400/20 chamfer animate-pulse" />
            ) : notLoggedIn ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/register"
                  className="chamfer bg-cyan-400 text-black font-bold text-xs tracking-wider py-3.5 hover:bg-cyan-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  BERGABUNG SEKARANG <ArrowRight size={13} />
                </Link>
                <div className="text-[10px] text-white/45 font-mono">
                  Sudah memiliki akun?{" "}
                  <Link href="/login" className="text-cyan-400 hover:underline">
                    Login disini
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/komunitas-vip"
                className="chamfer bg-[#FFD700] text-black font-bold text-xs tracking-wider py-3.5 hover:bg-[#ffe042] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 [box-shadow:0_0_12px_rgba(255,215,0,0.25)]"
              >
                AKSES VIP KOMUNITAS <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CommunityClient() {
  return (
    <MemberAuthProvider>
      <CommunityClientContent />
    </MemberAuthProvider>
  );
}
