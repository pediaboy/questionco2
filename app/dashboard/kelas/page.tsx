"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import {
  Folder,
  FolderOpen,
  FolderLock,
  FileText,
  Lock,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  Play,
  LockKeyhole
} from "lucide-react";

interface ModuleItem {
  id: string;
  name: string;
  category: "Fundamental" | "Teknikal" | "Psikologi";
  isBasic: boolean;
  duration: string;
  description: string;
}

const MODULES_DATA: ModuleItem[] = [
  {
    id: "fun_01",
    name: "Dasar Forex",
    category: "Fundamental",
    isBasic: true,
    duration: "15 Menit",
    description: "Pengenalan dasar pasar foreign exchange, mekanisme trading, dan pemahaman dasar pips & leverage."
  },
  {
    id: "fun_02",
    name: "Membaca Berita Ekonomi",
    category: "Fundamental",
    isBasic: false,
    duration: "25 Menit",
    description: "Cara menganalisis kalender ekonomi global, mengukur dampak rilis suku bunga FOMC, NFP, dan inflasi CPI."
  },
  {
    id: "tek_01",
    name: "Analisa Candlestick",
    category: "Teknikal",
    isBasic: true,
    duration: "20 Menit",
    description: "Memahami formasi candlestick tunggal dan kombinasi (pinbar, engulfing, doji) sebagai sinyal pembalikan harga."
  },
  {
    id: "tek_02",
    name: "Support & Resistance",
    category: "Teknikal",
    isBasic: false,
    duration: "30 Menit",
    description: "Teknik memetakan level penawaran dan permintaan kunci menggunakan swing highs/lows dan garis tren."
  },
  {
    id: "tek_03",
    name: "Fibonacci Advanced",
    category: "Teknikal",
    isBasic: false,
    duration: "35 Menit",
    description: "Penerapan rasio Fibonacci retracement dan extension untuk mengidentifikasi area entri optimal dan target profit."
  },
  {
    id: "psi_01",
    name: "Manajemen Risiko",
    category: "Psikologi",
    isBasic: true,
    duration: "18 Menit",
    description: "Aturan posisi ukuran lot yang aman, menetapkan rasio Risk-to-Reward minimum 1:2, dan menjaga modal Anda."
  },
  {
    id: "psi_02",
    name: "Psikologi Trading Pro",
    category: "Psikologi",
    isBasic: false,
    duration: "22 Menit",
    description: "Mengatasi bias emosional seperti FOMO (Fear of Missing Out) dan balas dendam (revenge trading) setelah kerugian."
  }
];

export default function KelasPage() {
  const { profile } = useMemberAuth();
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [shakingRowId, setShakingRowId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; message: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!profile) return null;

  const isVip = !!profile.is_vip;

  const handleModuleClick = (module: ModuleItem) => {
    const isLocked = !module.isBasic && !isVip;
    if (isLocked) {
      setShakingRowId(module.id);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setToast({ id: module.id, message: "Akses Terkunci. Khusus VIP." });

      setTimeout(() => {
        setShakingRowId(null);
      }, 400);

      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 2000);
      return;
    }

    if (expandedModuleId === module.id) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(module.id);
    }
  };

  const categories: ("Fundamental" | "Teknikal" | "Psikologi")[] = [
    "Fundamental",
    "Teknikal",
    "Psikologi"
  ];

  return (
    <div className="font-mono">
      {/* CSS injection for fade in & slide down animations if not standard */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 5px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideDown {
          from { opacity: 0; height: 0; overflow: hidden; transform: translateY(-5px); }
          to { opacity: 1; height: auto; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Header Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-semibold block">
          [ ACADEMY TERMINAL // AC02 ]
        </span>
        <h1 className="text-xl font-bold font-display text-white mt-1 uppercase tracking-wide">
          Direktori Pembelajaran
        </h1>
        <p className="text-white/45 text-[11.5px] mt-1.5 leading-relaxed">
          Modul edukasi taktis untuk menunjang akurasi analisis trading Anda.
        </p>
      </div>

      {/* VIP Access Level Indicator Banner */}
      {isVip ? (
        <div className="chamfer-sm border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6 flex gap-3 items-start">
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
            <GraduationCap size={13} />
          </div>
          <div className="text-[11px] leading-relaxed text-emerald-200/80">
            <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
              [ ACCESS_LEVEL // VIP ENCRYPTED ]
            </span>
            Terminal Anda terenkripsi penuh. Seluruh modul dasar & lanjutan dapat diakses secara real-time.
          </div>
        </div>
      ) : (
        <div className="chamfer-sm border border-amber-500/20 bg-amber-500/5 p-4 mb-6 flex gap-3 items-start">
          <ShieldAlert className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-[11.5px] leading-relaxed text-amber-200/80">
            <span className="font-bold text-amber-400 uppercase tracking-wider block mb-0.5">
              [ ACCESS_LEVEL // PUBLIC DEGRADED ]
            </span>
            Akses terbatas pada modul dasar. Beberapa modul tingkat lanjut membutuhkan lisensi VIP.
          </div>
        </div>
      )}

      {/* Category Folder Cards */}
      <div className="flex flex-col gap-6">
        {categories.map((category) => {
          const categoryModules = MODULES_DATA.filter((m) => m.category === category);
          const isFolderExpanded =
            expandedModuleId &&
            categoryModules.some((m) => m.id === expandedModuleId);

          // Render Folder icons dynamically based on status
          let FolderIcon = Folder;
          if (isFolderExpanded) {
            FolderIcon = FolderOpen;
          } else if (!isVip) {
            // If user is not VIP and folder contains locked modules, show FolderLock
            const hasLockedModules = categoryModules.some((m) => !m.isBasic);
            if (hasLockedModules) {
              FolderIcon = FolderLock;
            }
          }

          return (
            <div
              key={category}
              className="chamfer-sm border border-cyan-400/10 bg-[#0b0f18]/60 p-5 relative transition-all duration-300 hover:border-cyan-400/20"
            >
              {/* Folder Accent Corner Lines */}
              <div className="absolute top-[2px] left-[2px] w-2 h-2 border-t border-l border-cyan-400/40" />
              <div className="absolute bottom-[2px] right-[2px] w-2 h-2 border-b border-r border-cyan-400/40" />

              {/* Folder Header */}
              <div className="flex items-center gap-3.5 mb-4 border-b border-dashed border-cyan-400/15 pb-3">
                <FolderIcon className="text-cyan-400 w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-display font-bold text-sm tracking-widest text-white uppercase">
                    {category}
                  </h3>
                  <span className="text-[9px] text-cyan-400/50 block mt-0.5">
                    {categoryModules.length} FILE(S) DETECTED
                  </span>
                </div>
              </div>

              {/* Module Row Items */}
              <div className="flex flex-col gap-2.5">
                {categoryModules.map((module) => {
                  const isLocked = !module.isBasic && !isVip;
                  const isExpanded = expandedModuleId === module.id;
                  const isShaking = shakingRowId === module.id;

                  return (
                    <div key={module.id} className="relative">
                      {/* Row Clickable Container */}
                      <div
                        onClick={() => handleModuleClick(module)}
                        className={`flex items-center justify-between p-3.5 border transition-all cursor-pointer select-none chamfer-sm group relative ${
                          isShaking ? "animate-shake border-red-500/80 bg-red-950/10" : ""
                        } ${
                          isExpanded
                            ? "bg-cyan-950/20 border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.1)]"
                            : "border-cyan-400/5 bg-black/30 hover:bg-cyan-500/5 hover:border-cyan-400/20"
                        }`}
                      >
                        {/* Left Side: Icon & Title */}
                        <div className="flex items-center gap-3 pr-4 min-w-0">
                          <FileText
                            size={16}
                            className={`shrink-0 transition-colors ${
                              isExpanded
                                ? "text-cyan-300"
                                : "text-cyan-400/60 group-hover:text-cyan-300"
                            }`}
                          />
                          <span
                            className={`text-[12px] truncate transition-colors ${
                              isExpanded
                                ? "text-cyan-300 font-bold"
                                : "text-white/80 group-hover:text-white"
                            }`}
                          >
                            {module.name}
                          </span>
                          {!isVip && !module.isBasic && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 chamfer-sm shrink-0">
                              ADVANCED
                            </span>
                          )}
                        </div>

                        {/* Right Side: Lock Icon, Action Label or Expand Trigger */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isLocked ? (
                            <Lock
                              size={12}
                              className="text-yellow-500 shrink-0 animate-pulse"
                            />
                          ) : (
                            <span className="text-[9.5px] text-cyan-400/50 font-semibold tracking-wider group-hover:text-cyan-300 uppercase transition-colors">
                              {isExpanded ? "[ TUTUP ]" : "[ BUKA ]"}
                            </span>
                          )}
                        </div>

                        {/* Absolute Locked Toast specific to this row */}
                        {toast && toast.id === module.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-11 z-50 bg-[#0f0707] border border-red-500/60 px-3 py-2 chamfer-sm text-[10px] font-mono text-red-400 font-bold whitespace-nowrap shadow-lg shadow-black/80 animate-fade-in flex items-center gap-1.5">
                            <LockKeyhole size={11} className="text-red-500 animate-pulse" />
                            <span>{toast.message}</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Section Panel */}
                      {isExpanded && (
                        <div className="mt-2 p-3.5 border border-dashed border-cyan-400/30 bg-black/60 text-xs font-mono text-slate-300 transition-all duration-300 animate-slide-down chamfer-sm">
                          {/* Inside Folder Accents */}
                          <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-cyan-400/15">
                            <span className="text-[9.5px] text-cyan-300 font-bold tracking-widest uppercase">
                              [ FILE_PREVIEW // {module.id.toUpperCase()} ]
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">
                              DURASI: {module.duration}
                            </span>
                          </div>
                          <p className="text-[11.5px] leading-relaxed mb-3 text-slate-300">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-2 px-2.5 py-2 bg-cyan-950/20 border border-cyan-500/10 text-[10px] text-cyan-300">
                            <span className="animate-pulse font-bold text-cyan-400 text-xs">●</span>
                            <span className="font-semibold uppercase tracking-wider">
                              Modul akan segera hadir dalam rilis berikutnya.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Upgrade Banner (if not already VIP) */}
      {!isVip && (
        <div className="mt-8">
          <Link
            href="/dashboard/upgrade"
            className="block chamfer-sm p-4 border border-[#FFD700]/30 bg-gradient-to-r from-amber-950/20 to-black relative overflow-hidden group active:border-[#FFD700]/80 transition-all duration-200"
          >
            {/* Tactical Corner Accents */}
            <div className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t border-l border-[#FFD700]/80" />
            <div className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b border-r border-[#FFD700]/80" />

            <div className="flex items-center justify-between">
              <div className="flex-1 pr-3">
                <span className="text-[9.5px] font-bold tracking-widest text-[#FFD700] uppercase font-mono block mb-1">
                  [ ELITE PROTOCOL ACCESS ]
                </span>
                <h3 className="font-display font-bold text-white text-[14px] uppercase tracking-wide">
                  Buka Modul Edukasi VIP
                </h3>
                <p className="text-white/60 text-[10.5px] mt-1 leading-relaxed max-w-[260px]">
                  Dapatkan akses ke seluruh modul teknikal lanjutan, manajemen risiko profesional, dan sinyal live VIP.
                </p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] chamfer-sm transition-transform duration-200 group-hover:translate-x-1">
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
