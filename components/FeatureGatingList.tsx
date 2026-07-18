import React from "react";
import {
  Radio,
  TrendingUp,
  Newspaper,
  Award,
  Bell,
  GraduationCap,
  Users,
  UserCheck,
  History,
  Calculator,
  Trophy,
  Megaphone,
  Globe2,
  BookOpen,
  Calendar,
  Medal,
  LineChart,
} from "lucide-react";

interface Feature {
  label: string;
  isVip: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ALL_FEATURES: Feature[] = [
  // VIP/MEMBER features
  { label: "Signal Live (Real-time)", isVip: true, icon: Radio },
  { label: "Crypto Terminal (Whale Flow)", isVip: true, icon: TrendingUp },
  { label: "Analisis Harian Premium", isVip: true, icon: Newspaper },
  { label: "Sinyal XAUUSD Eksklusif", isVip: true, icon: Award },
  { label: "Notifikasi Sinyal Instan", isVip: true, icon: Bell },
  { label: "Kelas Trading Advance", isVip: true, icon: GraduationCap },
  { label: "Komunitas VIP (Telegram/Discord)", isVip: true, icon: Users },
  { label: "Konsultasi 1-on-1 dengan Mentor", isVip: true, icon: UserCheck },
  { label: "Riwayat Sinyal Lengkap (Unlimited)", isVip: true, icon: History },
  { label: "Kalkulator Risk Management Pro", isVip: true, icon: Calculator },
  // FREE features
  { label: "Kontes Trading Bulanan", isVip: false, icon: Trophy },
  { label: "Berita Pasar Harian", isVip: false, icon: Megaphone },
  { label: "Sesi Market (Jam Buka/Tutup)", isVip: false, icon: Globe2 },
  { label: "Kelas Trading Dasar", isVip: false, icon: BookOpen },
  { label: "Kalender Ekonomi", isVip: false, icon: Calendar },
  { label: "Leaderboard Publik", isVip: false, icon: Medal },
  { label: "Grafik Real-Time (Chart Viewer)", isVip: false, icon: LineChart },
];

export default function FeatureGatingList() {
  return (
    <section id="access-matrix" className="px-5 py-14 relative">
      <div className="text-center mb-8">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2 font-mono">
          [ ACCESS_MATRIX ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          17 FITUR, <span className="text-[#00F0FF] text-glow-cyan">1 LOGIN</span>.
        </h2>
        <p className="text-white/45 text-[12.5px] mt-3 max-w-[320px] mx-auto leading-relaxed font-mono">
          Satu gerbang masuk untuk menguasai seluruh instrumen pasar. Buka potensi penuh trading Anda.
        </p>
      </div>

      <div className="border border-dashed border-cyan-400/25 chamfer bg-[#0b0f18]/70 px-4 py-2">
        <div className="flex flex-col">
          {ALL_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-slate-400 flex-shrink-0" />
                  <span className="text-white/80 text-[13px] font-mono">{item.label}</span>
                </div>
                {item.isVip ? (
                  <span className="text-[9px] font-bold tracking-widest text-[#FFD700] border border-[#FFD700]/40 bg-[#FFD700]/5 px-2 py-0.5 font-mono flex-shrink-0">
                    [ MEMBER ]
                  </span>
                ) : (
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 border border-white/15 bg-white/5 px-2 py-0.5 font-mono flex-shrink-0">
                    [ FREE ]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
