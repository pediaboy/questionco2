"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Gift, ListChecks, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { CONTEST_TIERS } from "@/lib/contestTiers";

export default function KontesLotPage() {
  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // KONTES CAPAI LOT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Syarat &amp; <span className="text-cyan-300 text-glow-cyan">Ketentuan</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">
          Baca ketentuan lengkap sebelum berpartisipasi dalam Kontes Capai Lot.
        </p>
      </div>

      {/* Tentang Kontes */}
      <div className="chamfer-sm bg-[#0b0f18]/70 border border-cyan-400/20 p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-cyan-400/60" />
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-cyan-300 font-bold mb-2 flex items-center gap-1.5">
          <Info size={13} /> Tentang Kontes
        </p>
        <p className="text-[12px] text-white/70 leading-relaxed">
          Kontes Capai Lot adalah program apresiasi untuk trader yang konsisten dan aktif bertransaksi.
          Semakin besar akumulasi volume lot trading kamu, semakin dekat kamu dengan hadiah milestone berikutnya.
          Peringkat diperbarui otomatis dan bisa dipantau real-time di halaman Leaderboard.
        </p>
      </div>

      {/* Milestone tiers */}
      <div className="chamfer-sm bg-[#0b0f18]/70 border border-amber-400/25 p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-[3px] left-[3px] w-3 h-3 border-t border-l border-amber-400/60" />
        <div className="absolute bottom-[3px] right-[3px] w-3 h-3 border-b border-r border-amber-400/60" />
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-3 flex items-center gap-1.5">
          <Gift size={13} /> Hadiah Milestone
        </p>
        <div className="space-y-2">
          {CONTEST_TIERS.map((t, i) => (
            <div
              key={t.lot}
              className="flex items-center justify-between chamfer-sm bg-black/30 border border-white/10 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 chamfer-sm bg-amber-400/10 border border-amber-400/40 text-amber-400 font-mono font-bold text-[11px]">
                  {i + 1}
                </span>
                <span className="text-white font-mono font-bold text-sm">{t.lot.toLocaleString("id-ID")} Lot</span>
              </div>
              <span className="text-emerald-400 text-[12px] font-semibold">{t.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Syarat Peserta */}
      <div className="chamfer-sm bg-[#0b0f18]/70 border border-white/10 p-4 mb-4">
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/70 font-bold mb-3 flex items-center gap-1.5">
          <ListChecks size={13} /> Syarat Peserta
        </p>
        <ul className="space-y-2.5 text-[12px] text-white/70 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-cyan-300 shrink-0">01.</span>
            Sudah terdaftar dan login sebagai member LASTQUESTION.CO.
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-300 shrink-0">02.</span>
            Memiliki akun trading real yang aktif dan terhubung/terverifikasi ke sistem kami. Belum punya akun trading? Kamu bisa mengaktifkannya lewat menu{" "}
            <Link href="/dashboard/upgrade" className="text-cyan-300 underline">
              Upgrade
            </Link>
            .
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-300 shrink-0">03.</span>
            Volume lot dihitung dari akumulasi transaksi riil pada akun trading terverifikasi tersebut — bukan akun demo.
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-300 shrink-0">04.</span>
            Satu peserta hanya boleh menggunakan satu akun trading yang terdaftar atas nama sendiri.
          </li>
        </ul>
      </div>

      {/* Ketentuan Tambahan */}
      <div className="chamfer-sm bg-[#0b0f18]/70 border border-white/10 p-4 mb-4">
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/70 font-bold mb-3 flex items-center gap-1.5">
          <ShieldCheck size={13} /> Ketentuan Lainnya
        </p>
        <ul className="space-y-2.5 text-[12px] text-white/70 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-white/30 shrink-0">-</span>
            Data volume lot dan peringkat diperbarui secara berkala dan dapat diverifikasi ulang oleh tim admin sebelum hadiah dicairkan.
          </li>
          <li className="flex gap-2">
            <span className="text-white/30 shrink-0">-</span>
            Proses klaim hadiah akan dihubungi langsung oleh admin melalui kontak yang terdaftar setelah milestone tercapai dan terverifikasi.
          </li>
          <li className="flex gap-2">
            <span className="text-white/30 shrink-0">-</span>
            Aktivitas trading yang terindikasi tidak wajar (misalnya bukan transaksi riil / manipulasi volume) akan didiskualifikasi dari kontes.
          </li>
          <li className="flex gap-2">
            <span className="text-white/30 shrink-0">-</span>
            LASTQUESTION.CO berhak mengubah, menambah, atau menghentikan ketentuan kontes ini sewaktu-waktu dengan pemberitahuan melalui platform.
          </li>
          <li className="flex gap-2">
            <span className="text-white/30 shrink-0">-</span>
            Keputusan tim admin terkait hasil kontes dan pemberian hadiah bersifat final.
          </li>
        </ul>
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/leaderboard"
        className="flex items-center justify-center gap-2 chamfer-sm bg-cyan-400 text-black font-bold text-xs tracking-wider py-3 hover:bg-cyan-300 transition-colors"
      >
        <Trophy size={14} /> LIHAT LEADERBOARD <ArrowRight size={14} />
      </Link>
    </div>
  );
}
