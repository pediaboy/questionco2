"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

export default function PengumumanPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/member/announcements");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setItems(data.items);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const formatIndonesianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // BROADCASTS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Pengumuman <span className="text-cyan-300 text-glow-cyan">Penting</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Informasi dan pembaruan sistem terbaru untuk para member.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-[#0f172a]/50 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ ERROR LOADING ANNOUNCEMENTS ]</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-[#0f172a]/30 border border-dashed border-white/10 chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ TIDAK ADA PENGUMUMAN ]</span>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`chamfer-sm p-5 relative bg-[#0b0f18]/60 border ${
                item.pinned ? "border-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]" : "border-white/10"
              }`}
            >
              {/* Tactical Corner Accents */}
              <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/60" />
              <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/60" />

              {/* Tag/Header Row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatIndonesianDate(item.created_at)}
                </span>
                {item.pinned && (
                  <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 border border-cyan-500/30">
                    <Pin size={8} className="text-cyan-300" /> [ PINNED ]
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-display font-bold text-white text-[15px] mb-2 uppercase tracking-wide flex items-center gap-2">
                {!item.pinned && <Megaphone size={14} className="text-slate-400" />}
                {item.title}
              </h3>

              {/* Body */}
              <p className="text-white/70 text-xs font-sans leading-relaxed whitespace-pre-wrap">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
