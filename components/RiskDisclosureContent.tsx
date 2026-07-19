import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  TrendingDown, 
  Percent, 
  Coins, 
  Scale, 
  FileText, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

export default function RiskDisclosureContent() {
  const disclosures = [
    {
      id: "01",
      title: "RISIKO TINGGI KERUGIAN",
      desc: "Transaksi forex, komoditas, dan aset kripto melibatkan risiko finansial yang sangat tinggi. Pergerakan harga yang cepat dapat mengakibatkan kerugian sebagian atau seluruh modal awal Anda. Instrumen spekulatif ini tidak cocok bagi semua kategori investor.",
      icon: ShieldAlert,
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      bgGradient: "from-red-500/5"
    },
    {
      id: "02",
      title: "HANYA UNTUK EDUKASI & INFORMASI",
      desc: "Semua sinyal, analisis pasar, materi edukasi, dan data yang disediakan melalui platform LASTQUESTION.CO bersifat umum dan informasional semata. Layanan ini bukan merupakan, dan tidak boleh ditafsirkan sebagai, saran investasi atau rekomendasi finansial personal.",
      icon: Info,
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-400",
      bgGradient: "from-cyan-400/5"
    },
    {
      id: "03",
      title: "KINERJA MASA LALU BUKAN JAMINAN",
      desc: "Kinerja historis, hasil simulasi (backtesting), atau rekam jejak sinyal yang ditampilkan di platform kami (termasuk pada halaman /performance) hanya berfungsi sebagai referensi akademis. Hasil masa lalu sama sekali tidak menjamin atau mengindikasikan hasil trading di masa depan.",
      icon: TrendingDown,
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-400",
      bgGradient: "from-cyan-400/5"
    },
    {
      id: "04",
      title: "EFEK MULTIPLIKASI LEVERAGE",
      desc: "Penggunaan fasilitas leverage (daya ungkit) dalam trading forex atau derivatif kripto dapat memperbesar potensi keuntungan secara dramatis, namun di saat bersamaan juga melipatgandakan kecepatan dan skala kerugian dana Anda secara signifikan.",
      icon: Percent,
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      bgGradient: "from-purple-500/5"
    },
    {
      id: "05",
      title: "VOLATILITAS EKSTREM KRIPTO",
      desc: "Aset kripto (seperti BTC, ETH, SOL) memiliki volatilitas harga yang sangat ekstrem. Nilai pasar dapat berfluktuasi puluhan persen dalam hitungan jam akibat perubahan regulasi global, likuiditas order book, serta faktor teknologi dan keamanan jaringan.",
      icon: Coins,
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      bgGradient: "from-purple-500/5"
    },
    {
      id: "06",
      title: "BATAS MODAL RISIKO (RISK CAPITAL)",
      desc: "Pengguna sangat dianjurkan untuk hanya menggunakan dana dingin (risk capital) — yaitu dana yang jika hilang seluruhnya tidak akan mengganggu kelangsungan hidup, stabilitas finansial, atau kesejahteraan harian Anda dan keluarga Anda.",
      icon: AlertTriangle,
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      bgGradient: "from-red-500/5"
    },
    {
      id: "07",
      title: "SARAN KEUANGAN INDEPENDEN",
      desc: "Anda wajib melakukan riset mandiri (Do Your Own Research - DYOR) secara mendalam sebelum mengeksekusi transaksi apa pun. Kami menyarankan Anda untuk berkonsultasi dengan penasihat keuangan atau hukum independen yang berlisensi resmi di yurisdiksi Anda.",
      icon: Scale,
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-400",
      bgGradient: "from-cyan-400/5"
    },
    {
      id: "08",
      title: "BUKAN BROKER ATAU PENASIHAT BERLISENSI",
      desc: "LASTQUESTION.CO bukan merupakan pialang berjangka, pialang saham, kustodian, bursa berlisensi, maupun manajer investasi. Kami tidak mengelola dana nasabah, tidak menyediakan fasilitas perdagangan, dan tidak mengeksekusi transaksi atas nama pengguna.",
      icon: FileText,
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-400",
      bgGradient: "from-cyan-400/5"
    },
    {
      id: "09",
      title: "KETIADAAN JAMINAN AKURASI DATA",
      desc: "Meskipun seluruh sinyal dan analisis diusahakan seakurat mungkin oleh tim riset dan engine sistem kami, kami tidak memberikan jaminan tersurat maupun tersirat atas akurasi, kelengkapan, keterandalan, atau ketepatan waktu dari data yang disajikan.",
      icon: HelpCircle,
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      bgGradient: "from-purple-500/5"
    },
    {
      id: "10",
      title: "PENGECUALIAN TANGGUNG JAWAB (DISCLAIMER)",
      desc: "Dengan menggunakan platform kami, Anda memahami dan menyetujui bahwa semua keputusan trading dan investasinya adalah tanggung jawab penuh Anda pribadi. LASTQUESTION.CO dan seluruh afiliasi tidak bertanggung jawab atas segala kerugian finansial yang Anda alami.",
      icon: ShieldCheck,
      borderColor: "border-cyan-400/30",
      textColor: "text-cyan-400",
      bgGradient: "from-cyan-400/5"
    }
  ];

  return (
    <div className="flex flex-col gap-5 mt-6">
      {disclosures.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={`hud-card chamfer border ${item.borderColor} bg-[#0b0f18]/80 p-5 relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.bgGradient} to-transparent pointer-events-none`} />
            <h2 className="font-display font-bold text-sm text-white tracking-wide mb-2.5 flex items-center gap-2">
              <span className={`${item.textColor} font-mono`}>[{item.id}]</span> {item.title}
            </h2>
            <p className="text-white/70 text-[12px] leading-relaxed font-sans">
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
