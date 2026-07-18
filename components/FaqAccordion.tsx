"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Kenapa harus daftar Valetax?",
    answer:
      "Valetax adalah broker partner resmi dengan regulasi terpercaya, eksekusi ultra-cepat, dan spread tipis. Kerja sama ini memungkinkan kami memverifikasi volume trading Anda secara otomatis untuk memberikan akses VIP gratis tanpa biaya bulanan.",
  },
  {
    question: "Berapa minimal deposit?",
    answer:
      "Minimal deposit mengikuti batas minimum broker partner (mulai dari $10 - $50). 100% dari dana tersebut adalah modal trading Anda sendiri, dapat ditarik kapan saja, dan LASTQUESTION.CO tidak memegang sepeser pun dana Anda.",
  },
  {
    question: "Apakah membership ini gratis?",
    answer:
      "Ya, membership VIP 100% gratis tanpa biaya langganan bulanan. Anda hanya perlu mempertahankan akun broker aktif di bawah jaringan rujukan kami agar server verifikasi kami tetap mengizinkan akses Anda.",
  },
  {
    question: "Bagaimana cara upgrade ke VIP?",
    answer:
      "Anda hanya perlu mendaftar akun Valetax melalui link resmi kami, melakukan deposit modal trading, lalu memasukkan ID akun broker Anda ke dashboard kami untuk diverifikasi secara otomatis oleh sistem.",
  },
  {
    question: "Apakah sinyal dijamin profit?",
    answer:
      "Tidak ada jaminan profit dalam trading finansial. Setiap sinyal kami merupakan hasil analisis probabilitas tinggi, namun pasar selalu dinamis. Trading melibatkan risiko kehilangan modal secara signifikan. Selalu gunakan money management yang ketat.",
  },
  {
    question: "Bagaimana jika saya butuh bantuan?",
    answer:
      "Jangan khawatir. Tim support operasional kami siap membantu Anda 24/7. Anda dapat menghubungi chat admin kami melalui tautan Telegram resmi yang tersedia di panel bantuan dan footer website.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="px-5 py-12 border-t border-dashed border-cyan-400/15">
      <div className="text-center mb-10">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-400/70 font-semibold mb-2">
          [ FAQ ]
        </p>
        <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          PERTANYAAN UMUM.
        </h2>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto mb-10">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="hud-card chamfer-sm border border-cyan-400/20 bg-[#111520] transition-all duration-200"
              style={{
                borderColor: isOpen ? "rgba(0, 240, 255, 0.6)" : "rgba(0, 240, 255, 0.2)",
                boxShadow: isOpen ? "0 0 15px rgba(0, 240, 255, 0.15)" : "none",
              }}
            >
              <button
                onClick={() => toggleItem(idx)}
                className="w-full flex items-center justify-between p-4 text-left transition-colors duration-200 focus:outline-none"
              >
                <span className="font-display font-bold text-[12.5px] text-white/90 uppercase tracking-wide pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-cyan-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {isOpen && (
                <div className="px-4 pb-4 text-white/50 text-[11px] font-mono leading-relaxed border-t border-cyan-400/10 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final CTA Box */}
      <div className="max-w-sm mx-auto">
        <div className="chamfer p-6 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-gradient-to-br from-cyan-950/20 to-black flex flex-col items-center text-center gap-4">
          <p className="font-display font-bold text-white text-[15px] tracking-wide uppercase leading-snug">
            "Membership-nya gratis. Disiplinnya yang mahal."
          </p>
          <Link
            href="/register"
            className="chamfer-btn w-full block text-center bg-cyan-400 hover:bg-cyan-300 text-black font-display font-bold text-[13px] tracking-[0.1em] py-3.5 transition-all duration-200 active:scale-[0.99]"
          >
            [ GABUNG SEKARANG ]
          </Link>
        </div>
      </div>
    </section>
  );
}
