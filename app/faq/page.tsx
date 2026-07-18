"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  category: "Langganan" | "Teknis" | "Akun";
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: "Langganan",
    question: "Bagaimana cara berlangganan VIP LASTQUESTION.CO?",
    answer: "Pilih paket VIP di halaman VIP, lakukan transfer sesuai nominal, lalu kirim bukti transfer ke WhatsApp admin. Akun Anda akan aktif dalam waktu maksimal 15 menit setelah pembayaran dikonfirmasi."
  },
  {
    id: 2,
    category: "Langganan",
    question: "Berapa lama proses verifikasi pembayaran?",
    answer: "Proses verifikasi dilakukan secara cepat oleh admin kami. Biasanya membutuhkan waktu kurang dari 15 menit setelah Anda mengirimkan bukti transfer yang sah melalui WhatsApp."
  },
  {
    id: 3,
    category: "Langganan",
    question: "Apakah ada jaminan uang kembali (refund policy)?",
    answer: "Karena produk kami berupa akses informasi real-time dan sinyal instan, semua pembelian bersifat final dan tidak dapat direfund. Kami sarankan mencoba paket Advanced terlebih dahulu untuk mencoba kualitas layanan kami."
  },
  {
    id: 4,
    category: "Teknis",
    question: "Bagaimana cara mengakses channel VIP Telegram?",
    answer: "Setelah pembayaran terverifikasi oleh admin, sistem akan memberikan tautan undangan khusus ke channel Telegram VIP. Tautan ini bersifat personal dan hanya dapat digunakan oleh akun Anda."
  },
  {
    id: 5,
    category: "Teknis",
    question: "Bagaimana cara membaca sinyal trading yang diberikan?",
    answer: "Setiap sinyal dilengkapi dengan parameter lengkap: Entry Zone, Take Profit (TP), Stop Loss (SL), serta rekomendasi Leverage/Risk per trade. Pastikan Anda membaca panduan manajemen risiko di channel VIP sebelum mengeksekusi trade."
  },
  {
    id: 6,
    category: "Teknis",
    question: "Apakah platform ini menyediakan bot trading otomatis?",
    answer: "Saat ini kami fokus pada sinyal trading manual presisi tinggi dan edukasi market. Kami tidak mengoperasikan bot trading otomatis demi keamanan kendali dana Anda sepenuhnya."
  },
  {
    id: 7,
    category: "Akun",
    question: "Saya lupa password atau tidak bisa login, apa yang harus dilakukan?",
    answer: "Gunakan fitur 'Lupa Password' di halaman login atau hubungi admin via link kontak. Kami akan mengirimkan OTP atau tautan reset password ke email terdaftar Anda."
  },
  {
    id: 8,
    category: "Akun",
    question: "Apakah saya bisa menggunakan satu akun di banyak perangkat sekaligus?",
    answer: "Setiap akun dibatasi untuk login aktif maksimal pada 2 perangkat secara bersamaan demi mencegah penyalahgunaan sharing akun. Pelanggaran terhadap kebijakan ini dapat memicu penangguhan akun."
  },
  {
    id: 9,
    category: "Akun",
    question: "Bagaimana cara mengubah alamat email atau nomor WhatsApp terdaftar?",
    answer: "Untuk alasan keamanan, perubahan data penting seperti email dan WhatsApp wajib melalui verifikasi admin. Silakan ajukan permohonan melalui form kontak atau hubungi admin secara langsung."
  }
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<"Langganan" | "Teknis" | "Akun">("Langganan");
  const [openId, setOpenId] = useState<number | null>(null);

  const filteredFaqs = FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#05080F]">
      <Header />
      <main className="pt-[104px] px-5 pb-12 flex flex-col min-h-screen">
        <div className="text-center mt-6 mb-8">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-3 text-[#00F0FF] text-glow-cyan">
            [ CLEARANCE_LEVEL // PUBLIC ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            System Manual:
            <br />
            <span className="text-[#00F0FF] text-glow-cyan">
              FAQ & Protocol
            </span>
          </h1>
          <p className="text-white/45 text-[12.5px] mt-4 max-w-[300px] mx-auto leading-relaxed">
            Panduan operasional, verifikasi pembayaran, dan pemecahan masalah teknis komunitas.
          </p>
        </div>

        {/* Categories Tab */}
        <div className="flex justify-center gap-2 mb-6">
          {(["Langganan", "Teknis", "Akun"] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenId(null); // Reset open FAQ on category change
                }}
                className={`chamfer-btn px-4 py-2 font-mono text-[11px] font-bold tracking-wider transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "border-[#00F0FF] text-[#00F0FF] text-glow-cyan bg-cyan-950/20 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                    : "border-white/10 text-white/40 bg-[#0d1017] hover:border-white/20 hover:text-white/60"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="flex flex-col gap-4 flex-grow mb-8">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div
                  layout
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0d1017] border border-white/5 overflow-hidden"
                >
                  {/* Question row */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full p-4 flex justify-between items-center gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-[13.5px] font-bold text-white/90 font-mono tracking-tight leading-relaxed">
                      {faq.question}
                    </span>
                    <span className="font-mono text-[#00F0FF] text-glow-cyan text-[14px] font-bold shrink-0">
                      {isOpen ? "[ - ]" : "[ + ]"}
                    </span>
                  </button>

                  {/* Answer Row */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-4 pb-4 pt-1">
                          <div className="pl-4 border-l-2 border-[#00F0FF] relative">
                            <p className="text-[12px] text-white/70 leading-relaxed font-mono">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
