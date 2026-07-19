import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, Clock, Circle, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "ROADMAP — LASTQUESTION.CO",
};

interface RoadmapItem {
  status: "shipped" | "progress" | "planned";
  title: string;
  sub: string;
  desc: string;
}

const IN_PROGRESS_ITEMS: RoadmapItem[] = [
  {
    status: "progress",
    title: "Broker Auto-Execution Integration",
    sub: "[ BROKER_API // AUTO_EXECUTE ]",
    desc: "Integrasi langsung API dengan broker forex/crypto mitra utama komunitas. Memungkinkan eksekusi otomatis sinyal trading (copy-trading) secara real-time dengan proteksi manajemen risiko (lot sizing, stop-loss, take-profit) yang dapat dikustomisasi mandiri oleh anggota.",
  },
  {
    status: "progress",
    title: "Mobile App & PWA Push Notifications",
    sub: "[ MOBILE_PWA // PUSH_ALERT ]",
    desc: "Pengembangan aplikasi berbasis Progressive Web App (PWA) dan aplikasi mobile native untuk menghadirkan notifikasi push instan langsung ke perangkat anggota begitu mesin sinyal memicu setup baru, membebaskan ketergantungan penuh pada platform pihak ketiga.",
  },
];

const PLANNED_ITEMS: RoadmapItem[] = [
  {
    status: "planned",
    title: "Two-Factor Authentication (2FA)",
    sub: "[ ACCOUNT_HARDENING // 2FA_SEC ]",
    desc: "Implementasi lapisan keamanan akun tambahan berbasis Google Authenticator (TOTP) serta SMS OTP guna mengamankan data kredensial, konfigurasi sinyal, pengaturan telegram bot, serta catatan ledger keuangan pribadi anggota.",
  },
  {
    status: "planned",
    title: "Expanded Pair Coverage",
    sub: "[ SMC_ENGINE_V2 // PAIR_EXPANSION ]",
    desc: "Perluasan cakupan deteksi algoritma SMC Engine ke instrumen forex major/minor lainnya (seperti GBPUSD, EURUSD, USDJPY, AUDUSD) serta aset-aset crypto altcoins dengan volume perdagangan tinggi guna memperluas peluang harian.",
  },
  {
    status: "planned",
    title: "Community Discussion Forum",
    sub: "[ SOCIAL_INTEL // FORUM_DECK ]",
    desc: "Pembangunan forum diskusi interaktif eksklusif di dalam dashboard untuk memfasilitasi komunikasi antar anggota, berbagi tangkapan layar analisis teknikal, membahas psikologi pasar, dan membentuk sinergi taktis komunitas.",
  },
];

const SHIPPED_ITEMS: RoadmapItem[] = [
  {
    status: "shipped",
    title: "Automated Institutional SMC Signal Engine",
    sub: "[ SMC_ENGINE_V1 // LIVE_CORE ]",
    desc: "Mesin analisis otomatis berbasis Smart Money Concepts (SMC) dengan algoritma 16-point confluence check (market structure, order block, FVG, liquidity sweep, dll.) yang bekerja tanpa henti untuk mendeteksi peluang presisi tinggi pada 4 aset utama: XAUUSD, BTCUSDT, ETHUSDT, dan SOLUSDT.",
  },
  {
    status: "shipped",
    title: "Live Market Terminal",
    sub: "[ WHALE_FLOW // TERMINAL_LIVE ]",
    desc: "Terminal streaming real-time yang menyajikan data order book terpusat, pendeteksian whale-trade berukuran besar, serta umpan data likuidasi bursa global Binance & OKX secara langsung guna menganalisis aliran modal aktif.",
  },
  {
    status: "shipped",
    title: "Kontes Capai Lot Leaderboard",
    sub: "[ LOT_CONTEST // LEADERBOARD_SYS ]",
    desc: "Turnamen interaktif pencapaian target volume transaksi (lot) bagi anggota komunitas, dilengkapi visualisasi papan peringkat (leaderboard) real-time guna memacu kedisiplinan dan konsistensi manajemen risiko trading.",
  },
  {
    status: "shipped",
    title: "Telegram Bot + Dual Channel Distribution",
    sub: "[ TELE_BOT // SIGNAL_DISPATCH ]",
    desc: "Bot Telegram administratif khusus yang terintegrasi penuh untuk mendistribusikan sinyal transaksi instan secara otomatis ke channel VIP dan channel Publik dengan latensi transmisi mendekati nol.",
  },
  {
    status: "shipped",
    title: "ETF Real-Time Data Page",
    sub: "[ ETF_MONITOR // INSTITUTIONAL_FLOW ]",
    desc: "Panel pemantau data makro terintegrasi untuk melacak arus kas masuk/keluar (inflow/outflow) serta performa harian dari reksa dana indeks ETF bitcoin, ethereum, dan komoditas global.",
  },
  {
    status: "shipped",
    title: "Daily & Weekly Signal Recap Broadcasts",
    sub: "[ RECAP_ENGINE // AUDIT_REPORT ]",
    desc: "Laporan rekapitulasi performa sinyal harian dan mingguan yang dipublikasikan secara otomatis, transparan, dan terperinci untuk mengukur win-rate harian, akumulasi pips, dan profitabilitas keseluruhan.",
  },
  {
    status: "shipped",
    title: "Session-Change Market Announcements",
    sub: "[ CHRONO_ALERT // SESSION_ALERTS ]",
    desc: "Sistem pengingat otomatis pergantian 4 sesi perdagangan global utama (Sydney, Tokyo, London, New York) langsung ke dashboard anggota untuk membantu mengantisipasi pergeseran likuiditas penting.",
  },
];

export default function RoadmapPage() {
  const renderItemCard = (item: RoadmapItem) => {
    let iconColor = "";
    let borderStyle = "";
    let badgeStyle = "";
    let gradientStyle = "";
    let IconComponent = Circle;

    if (item.status === "shipped") {
      IconComponent = CheckCircle2;
      iconColor = "text-[#00F0FF]";
      borderStyle = "border-cyan-400/20 bg-[#0b0f18]/80";
      badgeStyle = "text-[#00F0FF] border-cyan-400/30 bg-cyan-950/40";
      gradientStyle = "from-cyan-400/5 to-transparent";
    } else if (item.status === "progress") {
      IconComponent = Clock;
      iconColor = "text-amber-400";
      borderStyle = "border-amber-500/25 bg-[#0b0f18]/90 shadow-[0_0_15px_rgba(245,158,11,0.03)]";
      badgeStyle = "text-amber-400 border-amber-500/30 bg-amber-950/20";
      gradientStyle = "from-amber-500/5 to-transparent";
    } else {
      IconComponent = Circle;
      iconColor = "text-slate-400";
      borderStyle = "border-slate-800 bg-[#0b0f18]/40";
      badgeStyle = "text-slate-400 border-white/10 bg-white/5";
      gradientStyle = "from-slate-500/5 to-transparent";
    }

    return (
      <div className={`hud-card chamfer-sm border ${borderStyle} p-4 relative overflow-hidden transition-all duration-300`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientStyle} pointer-events-none`} />
        
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">
            {item.sub}
          </span>
          <span className={`text-[9px] font-bold tracking-widest font-mono border px-2 py-0.5 rounded-sm flex items-center gap-1 shrink-0 ${badgeStyle}`}>
            <IconComponent size={10} className={item.status === "progress" ? "animate-pulse" : ""} />
            {item.status === "shipped" && "SHIPPED"}
            {item.status === "progress" && "IN PROGRESS"}
            {item.status === "planned" && "PLANNED"}
          </span>
        </div>

        <h3 className="font-display font-bold text-white text-[13.5px] mb-1.5 uppercase tracking-wide">
          {item.title}
        </h3>
        <p className="text-white/60 text-[11.5px] leading-relaxed">
          {item.desc}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      
      <main className="pt-[104px] px-5 pb-8">
        {/* Navigation & Header tag */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={12} /> [ KEMBALI ]
          </Link>
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
            [ ROADMAP_SYSTEM ]
          </span>
        </div>

        {/* Page Title Section */}
        <div className="text-center mb-8">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2">
            [ FUTURE PROGRESS // INTEL MAP ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            SYSTEM ROADMAP
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Peta jalan pengembangan platform LASTQUESTION.CO — pelacakan transparan fitur aktif dan proyek masa depan.
          </p>
        </div>

        {/* Informative alert box */}
        <div className="chamfer border border-cyan-400/20 bg-cyan-950/20 p-4 mb-8 flex gap-3 items-start relative overflow-hidden">
          <div className="absolute top-[4px] left-[4px] w-2 h-2 border-t border-l border-cyan-400/40" />
          <div className="absolute bottom-[4px] right-[4px] w-2 h-2 border-b border-r border-cyan-400/40" />
          <ShieldAlert className="text-cyan-400 w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-cyan-200/80 leading-relaxed font-mono">
            <span className="font-bold text-cyan-300">PROTOKOL ESTIMASI:</span> Rencana di bawah bersifat fleksibel dan dapat menyesuaikan dinamika pasar global serta umpan balik komunitas. Jadwal rilis tidak bersifat mutlak demi menjamin stabilitas fungsional kode sistem.
          </div>
        </div>

        {/* Timeline container */}
        <div className="relative pl-6 ml-2 border-l border-white/10 space-y-10">
          
          {/* ========================================================
              SECTION: IN PROGRESS
              ======================================================== */}
          <div className="space-y-4">
            {/* Section Header Node */}
            <div className="relative">
              <div className="absolute -left-[32px] top-1 w-4 h-4 rounded-full border border-amber-500 bg-[#030712] flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[13px] tracking-[0.2em] text-amber-400 uppercase flex items-center gap-1.5">
                  <Clock size={12} /> // SEDANG DIKEMBANGKAN
                </h2>
                <p className="text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">
                  [ ACTIVE_DEVELOPMENT // PRIORITY_HIGH ]
                </p>
              </div>
            </div>

            {/* In Progress Cards */}
            <div className="space-y-4 pt-1">
              {IN_PROGRESS_ITEMS.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Item indicator dot */}
                  <div className="absolute -left-[32px] top-5 w-4 h-4 rounded-full border border-amber-500/50 bg-[#030712] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  {renderItemCard(item)}
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              SECTION: PLANNED
              ======================================================== */}
          <div className="space-y-4">
            {/* Section Header Node */}
            <div className="relative">
              <div className="absolute -left-[32px] top-1 w-4 h-4 rounded-full border border-slate-500 bg-[#030712] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[13px] tracking-[0.2em] text-slate-400 uppercase flex items-center gap-1.5">
                  <Circle size={12} /> // DIRENCANAKAN
                </h2>
                <p className="text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">
                  [ FUTURE_TARGETS // BACKLOG ]
                </p>
              </div>
            </div>

            {/* Planned Cards */}
            <div className="space-y-4 pt-1">
              {PLANNED_ITEMS.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Item indicator dot */}
                  <div className="absolute -left-[32px] top-5 w-4 h-4 rounded-full border border-slate-700 bg-[#030712] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  </div>
                  {renderItemCard(item)}
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              SECTION: SHIPPED
              ======================================================== */}
          <div className="space-y-4">
            {/* Section Header Node */}
            <div className="relative">
              <div className="absolute -left-[32px] top-1 w-4 h-4 rounded-full border border-cyan-400 bg-[#030712] flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-[13px] tracking-[0.2em] text-cyan-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> // SELESAI / SHIPPED
                </h2>
                <p className="text-[10px] text-white/30 font-mono mt-0.5 uppercase tracking-wider">
                  [ PLATFORM_FOUNDATION // ACTIVE_SERVICES ]
                </p>
              </div>
            </div>

            {/* Shipped Cards */}
            <div className="space-y-4 pt-1">
              {SHIPPED_ITEMS.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Item indicator dot */}
                  <div className="absolute -left-[32px] top-5 w-4 h-4 rounded-full border border-cyan-400/40 bg-[#030712] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/70" />
                  </div>
                  {renderItemCard(item)}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
