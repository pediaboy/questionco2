import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "SYSTEM PROTOCOL // TERMS — LASTQUESTION.CO",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        {/* Header Title Section */}
        <div className="text-center mt-4 mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-mono font-bold mb-2 text-[#00F0FF] text-glow-cyan uppercase">
            [ SECURE_ACCESS // PROTOCOL_04 ]
          </p>
          <h1 className="font-display font-bold text-white text-[25px] leading-tight uppercase tracking-wide">
            TERMS OF USE
          </h1>
          <p className="text-[#00F0FF] font-mono text-[11px] tracking-[0.15em] font-medium uppercase mt-1">
            KETENTUAN LAYANAN LASTQUESTION
          </p>
          <p className="text-white/45 text-[12px] mt-3 max-w-[280px] mx-auto leading-relaxed">
            Harap baca dokumen regulasi sistem ini secara saksama sebelum mengakses platform kami.
          </p>
        </div>

        {/* Risk Warning Box */}
        <div className="chamfer-sm border border-[#00F0FF]/30 bg-[#0b0f18]/90 p-4 mb-6 relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#00F0FF]/10 to-transparent pointer-events-none" />
          <div className="flex gap-3 items-start">
            <ShieldAlert className="text-[#00F0FF] w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[11px] tracking-[0.1em] font-mono font-bold text-[#00F0FF] uppercase mb-1">
                [ PROTOKOL RISIKO FINANSIAL ]
              </h4>
              <p className="text-white/70 text-[11.5px] leading-relaxed font-sans">
                Seluruh sinyal, analisis pasar, dan data edukasi adalah murni bersifat informasi ilmiah. Kami bukan penasihat keuangan atau manajer investasi berlisensi. Kinerja masa lalu tidak menjamin kesuksesan trading Anda di masa depan.
              </p>
            </div>
          </div>
        </div>

        {/* Document Header Info */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="text-[#00F0FF]/60 w-4 h-4" />
            <span className="font-mono text-[10px] text-white/40 tracking-wider">REF: LQ-TOS-2026-V1</span>
          </div>
          <span className="font-mono text-[10px] text-[#00F0FF]/80 bg-cyan-950/40 px-2 py-0.5 border border-[#00F0FF]/20">
            AKTIF // 2026
          </span>
        </div>

        {/* Clauses List */}
        <div className="flex flex-col gap-6 mb-8">
          
          {/* Section 1 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[01]</span> PERSETUJUAN KETENTUAN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Dengan mengakses, mendaftar, atau menggunakan situs web, dashboard internal, aplikasi seluler, grup Telegram VIP, atau modul ekosistem LASTQUESTION.CO lainnya, Anda menyatakan telah menyetujui, mengerti, dan terikat oleh seluruh poin Ketentuan Penggunaan ini secara hukum.
              </p>
              <p>
                Jika Anda tidak setuju untuk mematuhi atau terikat oleh protokol regulasi ini, Anda tidak diperkenankan untuk mengakses atau memanfaatkan layanan kami dalam bentuk apa pun.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[02]</span> DESKRIPSI LAYANAN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                LASTQUESTION.CO mengoperasikan pusat distribusi informasi intelijen pasar, materi pelatihan mandiri, dan notifikasi indikasi teknis (sinyal trading) untuk pasar Valuta Asing (Forex) dan Aset Kripto (Cryptocurrency).
              </p>
              <p>
                Seluruh materi di platform ini, baik berupa artikel, grafik analisis, data entry, target profit, maupun batas penghentian kerugian, disediakan semata-mata untuk tujuan penelitian ilmiah dan simulasi mandiri oleh para pengguna.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="chamfer-sm border border-[#00F0FF]/15 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[03]</span> BUKAN NASIHAT KEUANGAN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p className="font-semibold text-white/90">
                LASTQUESTION.CO BUKAN MERUPAKAN PERUSAHAAN PIALANG BERJANGKA (BROKER), PIHAK PENASIHAT KEUANGAN BERLISENSI, ATAU MANAJER INVESTASI.
              </p>
              <p>
                Kami tidak menerima titip dana investasi, tidak mengelola portofolio publik, dan tidak menjanjikan pengembalian keuntungan berkala (passive income). Kami tidak memberikan saran investasi terpersonalisasi. Segala tindakan transaksi yang Anda eksekusi di pasar keuangan adalah tanggung jawab pribadi Anda secara mutlak.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[04]</span> PENILAIAN RISIKO TRADING
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Transaksi derivatif, leverage forex, dan spekulasi aset kripto memiliki volatilitas ekstrem dan tingkat risiko kerugian finansial yang sangat tinggi. Anda dapat kehilangan seluruh modal awal yang Anda tempatkan dalam sekejap jika tidak mengendalikan risiko dengan benar.
              </p>
              <p>
                Anda setuju bahwa LASTQUESTION.CO sama sekali tidak menjamin akurasi sinyal 100%, dan kami tidak dapat dimintai pertanggungjawaban atas kerugian saldo riil pada akun trading pribadi Anda.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[05]</span> KELAYAKAN & REGISTRASI AKUN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Untuk berpartisipasi dalam komunitas kami, Anda wajib memenuhi syarat batas kedewasaan hukum nasional (berusia minimal 18 tahun atau telah menikah secara sah).
              </p>
              <p>
                Anda berjanji untuk memberikan data pendaftaran yang valid, akurat, dan terus memantau kerahasiaan kredensial akses akun Anda (username, password, nomor kontak). Penyalahgunaan identitas atau pemalsuan data registrasi dapat memicu penutupan akses sistem Anda seketika.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[06]</span> KETENTUAN VIP & PEMBAYARAN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                LASTQUESTION.CO menyediakan opsi keanggotaan VIP berbayar untuk menerima pembaruan sinyal instan dan panduan belajar mendalam.
              </p>
              <p>
                Semua skema pembayaran langganan bersifat non-refundable (tidak dapat ditarik kembali) setelah proses verifikasi transfer selesai dan akses data diberikan. Pembatasan ini diterapkan karena sistem langsung membuka hak konsumsi data intelijen bernilai tinggi secara seketika.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="chamfer-sm border border-[#00F0FF]/15 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[07]</span> LARANGAN KERAS PENYEBARAN KONTEN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Seluruh materi edukasi, parameter sinyal VIP, jurnal, analisis teknis terenkripsi, serta diskusi internal di LASTQUESTION.CO berstatus hak kekayaan intelektual internal yang dilindungi undang-undang.
              </p>
              <p className="text-white/90 font-semibold border-l-2 border-[#00F0FF] pl-3 py-1 bg-cyan-950/20">
                Dilarang keras membagikan ulang, membocorkan, merekam, mempublikasikan ulang, atau menjual kembali sinyal atau konten VIP kami kepada publik, grup lain, atau platform eksternal mana pun.
              </p>
              <p>
                Pelanggaran terhadap larangan penyebaran ini akan dikenakan sanksi berupa pemblokiran akun permanen tanpa kompensasi refund, penghapusan hak akses komunitas, dan tindakan hukum formal.
              </p>
            </div>
          </div>

          {/* Section 8 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[08]</span> LIMITASI INTEGRITAS API & BOT
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Setiap pengguna dilarang keras mencoba melakukan reverse engineering (rekayasa balik), peretasan, ekstraksi jalur API (Application Programming Interface), pemindaian kerentanan sistem, atau pemantauan platform menggunakan robot/scraper otomatis tanpa izin resmi dari administrasi pusat.
              </p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[09]</span> BATASAN PERANGKAT LOGIN
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Untuk mencegah penyalahgunaan berbagi kredensial (account-sharing), satu akun langganan terdaftar hanya diizinkan untuk login aktif maksimal pada 2 (dua) perangkat fisik yang berbeda secara bersamaan. Upaya login massal secara beruntun akan diblokir otomatis oleh firewall keamanan kami.
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="chamfer-sm border border-[#00F0FF]/15 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[10]</span> PEMBATASAN TANGGUNG JAWAB HUKUM
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Sepanjang diperbolehkan oleh koridor hukum nasional Republik Indonesia, LASTQUESTION.CO, para pendiri, kontributor analisis, serta staf teknis kami dibebaskan sepenuhnya dari tanggung jawab atas kerugian langsung, tidak langsung, kerugian material, hilangnya keuntungan bisnis, kegagalan eksekusi, penipuan oleh broker eksternal, atau kerusakan reputasi yang dialami pengguna akibat ketergantungan pada data kami.
              </p>
            </div>
          </div>

          {/* Section 11 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[11]</span> HAK TERMINASI SEPIHAK
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Kami berhak untuk menangguhkan atau menghapus akun Anda sewaktu-waktu secara sepihak jika Anda dinilai menyebarkan ujaran kebencian, merusak harmoni komunitas chat, melakukan fitnah tanpa bukti ilmiah, atau berupaya mengeksploitasi sistem operasional kami.
              </p>
            </div>
          </div>

          {/* Section 12 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[12]</span> HUKUM YANG MENGATUR
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                Seluruh dokumen ketentuan layanan ini dibuat, tunduk, dan wajib ditafsirkan berdasarkan kerangka hukum Republik Indonesia. Setiap perselisihan perdata yang timbul akan dicoba diselesaikan secara mufakat sebelum diajukan ke ranah pengadilan yurisdiksi Republik Indonesia yang ditunjuk.
              </p>
            </div>
          </div>

          {/* Section 13 */}
          <div className="chamfer-sm border border-white/10 bg-[#0d1017]/50 p-4">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide mb-2.5 flex items-center gap-2">
              <span className="text-[#00F0FF] font-mono text-[12px]">[13]</span> PERUBAHAN PROTOKOL
            </h2>
            <div className="text-white/70 text-[12.5px] leading-relaxed font-sans space-y-2">
              <p>
                LASTQUESTION.CO berhak mengubah, memperbarui, menambah, atau menghapus pasal-pasal di dokumen Ketentuan Penggunaan ini kapan saja tanpa persetujuan pengguna sebelumnya. Versi terbaru yang terbit di halaman ini menggantikan versi terdahulu secara penuh. Penggunaan berkelanjutan atas situs ini menandakan persetujuan sukarela Anda.
              </p>
            </div>
          </div>

        </div>

        {/* Contact section card */}
        <div className="chamfer border border-[#00F0FF]/25 bg-[#0b0f18] p-5 mb-6 text-center">
          <p className="text-[#00F0FF] font-mono text-[10px] tracking-widest uppercase mb-2">
            [ CONTACT // VERIFICATION ]
          </p>
          <p className="text-white/70 text-[12px] leading-relaxed mb-4">
            Butuh verifikasi protokol hukum atau memiliki pertanyaan administratif terkait dokumen Ketentuan Penggunaan ini?
          </p>
          <Link
            href="/contact"
            className="chamfer-btn inline-flex items-center justify-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-[11px] tracking-widest py-2.5 px-4 w-full transition-all text-glow-cyan"
          >
            HUBUNGI PUSAT KONTROL <ArrowRight size={12} className="animate-pulse" />
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}
