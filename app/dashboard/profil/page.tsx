"use client";

import React, { useState } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilPage() {
  const { profile, accessToken, refreshProfile } = useMemberAuth();
  const router = useRouter();

  const [telegramUsername, setTelegramUsername] = useState(profile?.telegram_username || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!profile) return null;

  const initial = (profile.full_name || profile.email || "?").charAt(0).toUpperCase();

  let daysLeft: number | null = null;
  if (profile.is_vip && profile.expired_at) {
    const diffMs = new Date(profile.expired_at).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (password.trim().length > 0) {
        if (password.trim().length < 6) {
          setMessage({ type: "error", text: "Password minimal 6 karakter." });
          setSaving(false);
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({ password: password.trim() });
        if (pwError) {
          setMessage({ type: "error", text: `Gagal ubah password: ${pwError.message}` });
          setSaving(false);
          return;
        }
      }

      const res = await fetch("/api/member/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ telegram_username: telegramUsername }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan profil." });
        setSaving(false);
        return;
      }

      await refreshProfile();
      setPassword("");
      setMessage({ type: "success", text: "Profil berhasil disimpan." });
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Yakin ingin keluar dari akun?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <div>
      {/* Header Profil */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 avatar-octagon border-2 border-cyan-400 bg-[#111520] flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-2xl text-white">{initial}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-white text-lg truncate">
            {profile.full_name || profile.email.split("@")[0]}
          </h2>
          <p className="text-xs text-white/50 truncate">{profile.email}</p>
          {profile.is_vip ? (
            <span className="inline-block mt-1 text-[10px] font-mono font-bold tracking-widest text-[#FFD700] [text-shadow:0_0_8px_rgba(255,215,0,0.5)]">
              [ VIP ACTIVE ]
            </span>
          ) : (
            <span className="inline-block mt-1 text-[10px] font-mono font-bold tracking-widest text-slate-500">
              [ FREE MEMBER ]
            </span>
          )}
        </div>
      </div>

      {/* Subscription Widget */}
      <div className="chamfer-sm p-4 mb-6 bg-[#0b0f18]/60 border border-white/10 relative">
        {profile.is_vip && daysLeft !== null ? (
          <>
            <p className="text-xs text-white/70 font-mono">
              Masa Aktif VIP Anda tersisa: <span className="text-cyan-300 font-bold text-sm">{daysLeft} Hari</span>
            </p>
            <a
              href="/vip"
              className="chamfer-btn mt-3 inline-flex items-center justify-center w-full py-3 border border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
            >
              [ RENEW 80K NOW ]
            </a>
          </>
        ) : (
          <>
            <p className="text-xs text-white/70 font-mono">Anda belum berlangganan VIP.</p>
            <a
              href="/vip"
              className="chamfer-btn mt-3 inline-flex items-center justify-center w-full py-3 border border-cyan-400 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
            >
              [ UPGRADE VIP ]
            </a>
          </>
        )}
      </div>

      {/* Account Settings Form */}
      <div className="chamfer p-5 mb-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative">
        <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-4">
          <ShieldCheck size={12} /> [ ACCOUNT SETTINGS ]
        </span>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] text-cyan-300/70 mb-1 block font-mono">[ EMAIL ]</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="chamfer-sm w-full bg-[#0b0f18] border border-white/10 px-4 py-3 text-white/50 text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] text-cyan-300/70 mb-1 block font-mono">[ PASSWORD ]</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="chamfer-sm w-full bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] text-cyan-300/70 mb-1 block font-mono">
              [ USERNAME TELEGRAM ]
            </label>
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="@username"
              className="chamfer-sm w-full bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          {message && (
            <p className={`text-xs font-mono ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="chamfer-btn w-full py-3 border border-cyan-400 text-cyan-300 bg-cyan-400/5 hover:bg-cyan-400/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest disabled:opacity-50"
          >
            {saving ? "MENYIMPAN..." : "> SAVE PROTOCOL"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mb-4">
        <button
          onClick={handleLogout}
          className="chamfer-btn w-full flex items-center justify-center gap-2 py-4 border-2 border-red-500 text-red-500 bg-red-500/5 hover:bg-red-500/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
        >
          <LogOut size={14} /> [ DISCONNECT / LOGOUT ]
        </button>
      </div>
    </div>
  );
}
