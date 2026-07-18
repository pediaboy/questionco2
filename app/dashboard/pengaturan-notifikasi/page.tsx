"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Bell, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

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

export default function PengaturanNotifikasiPage() {
  const { accessToken } = useMemberAuth();
  
  const [signalAlerts, setSignalAlerts] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPrefs = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/member/notification-prefs", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.prefs) {
          setSignalAlerts(data.prefs.signal_alerts);
          setAnnouncementAlerts(data.prefs.announcement_alerts);
          setPromoAlerts(data.prefs.promo_alerts);
        } else {
          setError("Gagal memuat preferensi notifikasi");
        }
      } else {
        setError("Gagal memuat preferensi notifikasi");
      }
    } catch (err) {
      console.error(err);
      setError("Error memuat preferensi notifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPrefs();
    }
  }, [accessToken]);

  const handleToggle = async (key: "signal_alerts" | "announcement_alerts" | "promo_alerts", val: boolean) => {
    if (!accessToken || saving) return;
    setSaving(true);
    setSuccessMsg("");
    setError("");

    // Optimistically update UI
    if (key === "signal_alerts") setSignalAlerts(val);
    else if (key === "announcement_alerts") setAnnouncementAlerts(val);
    else if (key === "promo_alerts") setPromoAlerts(val);

    try {
      const res = await fetch("/api/member/notification-prefs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ [key]: val }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.prefs) {
          setSignalAlerts(data.prefs.signal_alerts);
          setAnnouncementAlerts(data.prefs.announcement_alerts);
          setPromoAlerts(data.prefs.promo_alerts);
          setSuccessMsg("Konfigurasi notifikasi berhasil disimpan.");
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setError("Gagal menyimpan preferensi");
          // Revert optimistic update
          if (key === "signal_alerts") setSignalAlerts(!val);
          else if (key === "announcement_alerts") setAnnouncementAlerts(!val);
          else if (key === "promo_alerts") setPromoAlerts(!val);
        }
      } else {
        setError("Gagal menyimpan preferensi");
        if (key === "signal_alerts") setSignalAlerts(!val);
        else if (key === "announcement_alerts") setAnnouncementAlerts(!val);
        else if (key === "promo_alerts") setPromoAlerts(!val);
      }
    } catch (err) {
      console.error(err);
      setError("Error menyimpan preferensi");
      if (key === "signal_alerts") setSignalAlerts(!val);
      else if (key === "announcement_alerts") setAnnouncementAlerts(!val);
      else if (key === "promo_alerts") setPromoAlerts(!val);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SYSTEM // NOTIFICATIONS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Pengaturan <span className="text-cyan-300 text-glow-cyan">Notifikasi</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Kelola preferensi sinyal dan pemberitahuan Anda.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Controls Card */}
          <div className="chamfer p-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative">
            <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
            <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-6">
              <Bell size={12} className="text-cyan-400" /> [ SYSTEM ALERTS PROTOCOL ]
            </span>

            <div className="space-y-6">
              {/* Signal Alerts */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-dashed border-white/5">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase">Notifikasi Sinyal Baru</h3>
                  <p className="text-xs text-white/50 font-sans mt-0.5">Dapatkan pemberitahuan realtime setiap kali ada sinyal trading baru.</p>
                </div>
                <ChamferToggle
                  checked={signalAlerts}
                  onChange={(val) => handleToggle("signal_alerts", val)}
                  disabled={saving}
                />
              </div>

              {/* Announcement Alerts */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-dashed border-white/5">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase">Notifikasi Pengumuman</h3>
                  <p className="text-xs text-white/50 font-sans mt-0.5">Pemberitahuan rilis materi, berita, dan pengumuman platform.</p>
                </div>
                <ChamferToggle
                  checked={announcementAlerts}
                  onChange={(val) => handleToggle("announcement_alerts", val)}
                  disabled={saving}
                />
              </div>

              {/* Promo VIP Alerts */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase">Notifikasi Promo VIP</h3>
                  <p className="text-xs text-white/50 font-sans mt-0.5">Dapatkan penawaran khusus dan potongan harga langganan VIP.</p>
                </div>
                <ChamferToggle
                  checked={promoAlerts}
                  onChange={(val) => handleToggle("promo_alerts", val)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono chamfer-sm">
              <ShieldAlert size={14} />
              <span>[ ERROR: {error.toUpperCase()} ]</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-mono chamfer-sm">
              <CheckCircle size={14} />
              <span>[ SUCCESS: {successMsg.toUpperCase()} ]</span>
            </div>
          )}

          {saving && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-mono tracking-widest mt-2 uppercase">
              <Loader2 size={12} className="animate-spin text-cyan-400" />
              <span>TRANSMITTING UPDATED SETTINGS...</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <span className="text-[10px] text-slate-600 font-mono tracking-wide">
          [ ALL PREFERENCES STORED ON SECURE ENDCRYPTED DB NODE ]
        </span>
      </div>
    </div>
  );
}
