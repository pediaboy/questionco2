"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Save, Bell, BellRing, BellOff } from "lucide-react";
import { enablePushNotifications, disablePushNotifications, isPushSupported } from "@/lib/webPush";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

function ChamferToggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-7 chamfer-sm transition-colors duration-200 focus:outline-none flex items-center ${
        checked ? "bg-cyan-500/25 border border-cyan-400" : "bg-[#05080f] border border-white/10"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute h-5 w-5 chamfer-sm transition-all duration-200 ${
          checked ? "left-[32px] bg-[#00F0FF] [box-shadow:0_0_8px_#00F0FF]" : "left-[4px] bg-slate-500"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { profile, accessToken, refreshProfile } = useMemberAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [telegramUsername, setTelegramUsername] = useState(profile?.telegram_username || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [prefs, setPrefs] = useState({ signal_alerts: true, announcement_alerts: true, promo_alerts: true });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "enabling" | "on" | "off" | "unsupported">("idle");
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    if (!isPushSupported()) {
      setPushStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushStatus(sub ? "on" : "off"))
      .catch(() => setPushStatus("off"));
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setTelegramUsername(profile.telegram_username || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/member/notification-prefs", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.prefs) {
          setPrefs({
            signal_alerts: d.prefs.signal_alerts,
            announcement_alerts: d.prefs.announcement_alerts,
            promo_alerts: d.prefs.promo_alerts,
          });
        }
      })
      .finally(() => setPrefsLoading(false));
  }, [accessToken]);

  async function updatePref(key: keyof typeof prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsSaving(true);
    setPushError("");
    try {
      await fetch("/api/member/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ [key]: value }),
      });

      // "Alert Sinyal Baru" doubles as the real push-notification opt-in/out --
      // this is what actually registers the device for OS/browser notifications.
      if (key === "signal_alerts") {
        if (value) {
          setPushStatus("enabling");
          const res = await enablePushNotifications(accessToken);
          if (res.ok) {
            setPushStatus("on");
          } else {
            setPushStatus("off");
            setPrefs((p) => ({ ...p, signal_alerts: false }));
            setPushError(res.reason || "Gagal mengaktifkan notifikasi.");
          }
        } else {
          await disablePushNotifications();
          setPushStatus("off");
        }
      }
    } finally {
      setPrefsSaving(false);
    }
  }

  async function handleSave() {
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ telegram_username: telegramUsername }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message || "Gagal menyimpan." });
        setSaving(false);
        return;
      }

      await refreshProfile();
      setPassword("");
      setMessage({ type: "success", text: "Perubahan tersimpan." });
    } catch {
      setMessage({ type: "error", text: "Gagal terhubung ke server." });
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SYSTEM // ACCOUNT SETTINGS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Pengaturan <span className="text-cyan-300 text-glow-cyan">Akun</span>
        </h2>
      </div>

      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-4 flex flex-col gap-3">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase">Informasi Profil</p>
        <div>
          <label className="text-[10.5px] text-white/40 font-mono block mb-1">Nama Lengkap</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-cyan-400/50"
          />
        </div>
        <div>
          <label className="text-[10.5px] text-white/40 font-mono block mb-1">Username Telegram</label>
          <input
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            placeholder="@username"
            className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-cyan-400/50"
          />
        </div>
        <div>
          <label className="text-[10.5px] text-white/40 font-mono block mb-1">Password Baru (opsional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tidak ingin diubah"
            className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-cyan-400/50"
          />
        </div>

        {message && (
          <p className={`text-[11px] font-mono ${message.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="chamfer-sm bg-cyan-400 text-black text-[12px] font-bold py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          SIMPAN PERUBAHAN
        </button>
      </div>

      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-3 uppercase flex items-center gap-1.5">
          <Bell size={12} /> Preferensi Notifikasi {prefsSaving && <Loader2 size={11} className="animate-spin" />}
        </p>
        {prefsLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse chamfer-sm" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white/70 text-[12.5px]">Alert Sinyal Baru</span>
                <span className="text-[9.5px] font-mono uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  {pushStatus === "on" && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <BellRing size={9} /> Notifikasi aktif di device ini
                    </span>
                  )}
                  {pushStatus === "enabling" && (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Loader2 size={9} className="animate-spin" /> Mengaktifkan...
                    </span>
                  )}
                  {pushStatus === "off" && (
                    <span className="text-slate-600 flex items-center gap-1">
                      <BellOff size={9} /> Belum aktif di device ini
                    </span>
                  )}
                  {pushStatus === "unsupported" && (
                    <span className="text-slate-600">Browser tidak mendukung notifikasi</span>
                  )}
                </span>
              </div>
              <ChamferToggle
                checked={prefs.signal_alerts}
                onChange={(v) => updatePref("signal_alerts", v)}
                disabled={pushStatus === "unsupported" || pushStatus === "enabling"}
              />
            </div>
            {pushError && <p className="text-[10px] text-rose-400 font-mono">{pushError}</p>}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-[12.5px]">Pengumuman Platform</span>
              <ChamferToggle
                checked={prefs.announcement_alerts}
                onChange={(v) => updatePref("announcement_alerts", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-[12.5px]">Promo &amp; Info VIP</span>
              <ChamferToggle checked={prefs.promo_alerts} onChange={(v) => updatePref("promo_alerts", v)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
