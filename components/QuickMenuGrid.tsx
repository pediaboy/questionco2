"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Radio,
  GraduationCap,
  NotebookPen,
  CalendarDays,
  Calculator,
  Trophy,
  Megaphone,
  Award,
  Activity,
  Cpu,
  History,
  BellRing,
} from "lucide-react";

// Icon mapping based on keys returned by the API
const ICONS: Record<string, React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>> = {
  LineChart,
  Radio,
  GraduationCap,
  NotebookPen,
  CalendarDays,
  Calculator,
  Trophy,
  Megaphone,
  Award,
  Activity,
  Cpu,
  History,
  BellRing,
};

interface QuickMenuItem {
  id: string;
  label: string;
  icon_key: string;
  href: string;
  sort_order: number;
  active: boolean;
}

export default function QuickMenuGrid() {
  const [items, setItems] = useState<QuickMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/quick-menu");
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
        console.error("Failed to fetch quick menu:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  return (
    <div className="my-6">
      {/* Section Title with Accents */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold uppercase font-mono">
          [ MENU CEPAT ]
        </span>
        <div className="flex-1 h-px bg-cyan-400/20" />
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
            >
              <div className="w-[60px] h-[60px] bg-black/40 border border-white/5 octagon-precise animate-pulse" />
              <div className="w-12 h-2.5 bg-white/10 mt-2 rounded" />
            </div>
          ))}
        </div>
      ) : error || items.length === 0 ? (
        <div className="text-center py-4 bg-black/40 border border-dashed border-white/10 rounded-none chamfer-sm">
          <span className="text-xs text-slate-500 font-mono">[ TIDAK ADA MENU CEPAT AKTIF ]</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {items.map((item) => {
            const IconComponent = ICONS[item.icon_key] || NotebookPen;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col items-center justify-start text-center"
              >
                <div className="w-[60px] h-[60px] flex items-center justify-center bg-black/60 border border-white/10 octagon-precise transition-all duration-200 group-active:border-cyan-400/60 group-active:bg-cyan-950/20 group-active:shadow-[0_0_12px_rgba(0,240,255,0.15)]">
                  <IconComponent
                    size={22}
                    strokeWidth={1.5}
                    className="text-slate-300 group-active:text-cyan-300 transition-colors duration-200"
                  />
                </div>
                <span className="text-[11px] text-white/70 group-active:text-cyan-300 mt-2 font-sans leading-tight block truncate w-full px-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
