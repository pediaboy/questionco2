"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Star, Quote, MessageSquarePlus } from "lucide-react";

interface Testimonial {
  name: string;
  role: string | null;
  message: string;
  rating: number;
  created_at: string;
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "SUCCESS STORIES // TESTIMONI — LASTQUESTION.CO";

    let isMounted = true;
    async function fetchTestimonials() {
      try {
        const res = await fetch("/api/public/testimonials");
        if (!res.ok) {
          throw new Error("Gagal mengambil data testimoni");
        }
        const data = await res.json();
        if (isMounted) {
          if (data.success) {
            setItems(data.items || []);
          } else {
            setError(data.message || "Gagal memuat testimoni");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Terjadi kesalahan koneksi");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  function StarRating({ rating }: { rating: number }) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i <= rating ? "fill-[#FFD700] text-[#FFD700]" : "text-white/20"}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-[#00F0FF] mb-2 uppercase">
            [ EST. 2021 // SUCCESS STORIES ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            TESTIMONIALS
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Hasil nyata dari para operator dan anggota elit ekosistem LASTQUESTION.CO.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="chamfer border border-cyan-400/10 bg-[#0b0f18]/50 p-5 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                    <div className="h-3 w-16 bg-white/5 rounded"></div>
                  </div>
                  <div className="h-4 w-20 bg-white/10 rounded"></div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 w-full bg-white/5 rounded"></div>
                  <div className="h-3 w-5/6 bg-white/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="chamfer border border-red-500/20 bg-[#0b0f18] p-6 text-center flex flex-col items-center justify-center my-8">
            <p className="text-red-400 text-xs leading-relaxed mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch("/api/public/testimonials")
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      setItems(data.items || []);
                    } else {
                      setError(data.message || "Gagal memuat testimoni");
                    }
                  })
                  .catch((err) => setError(err.message || "Terjadi kesalahan koneksi"))
                  .finally(() => setLoading(false));
              }}
              className="chamfer-btn inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[11px] tracking-widest py-2 px-4 transition-all"
            >
              COBA LAGI
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="chamfer border border-cyan-400/20 bg-[#0b0f18] p-6 text-center flex flex-col items-center justify-center my-8">
            <MessageSquarePlus className="text-[#00F0FF] w-12 h-12 mb-4 animate-pulse" />
            <h3 className="font-display font-semibold text-lg text-white uppercase tracking-wider mb-2">
              Belum Ada Testimoni
            </h3>
            <p className="text-white/60 text-xs leading-relaxed mb-6">
              Belum ada testimoni yang dipublikasikan. Jadilah yang pertama berbagi pengalaman Anda!
            </p>
            <a
              href="/contact"
              className="chamfer-btn inline-flex items-center justify-center gap-2 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[11px] tracking-widest py-2.5 px-4 w-full transition-all"
            >
              KIRIM TESTIMONI <MessageSquarePlus size={12} />
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none" />
                
                {/* Decorative subtle Quote icon in background */}
                <div className="absolute right-4 bottom-4 text-cyan-400/5 pointer-events-none">
                  <Quote size={56} />
                </div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div>
                    <h3 className="font-display font-bold text-white text-[15px] tracking-wide uppercase">
                      {item.name}
                    </h3>
                    {item.role ? (
                      <span className="inline-block text-[9px] font-mono text-[#00F0FF]/80 uppercase tracking-widest border border-[#00F0FF]/30 px-1.5 py-0.5 bg-[#00F0FF]/5 mt-1">
                        {item.role}
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-mono text-white/40 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 bg-white/5 mt-1">
                        [ VERIFIED USER ]
                      </span>
                    )}
                  </div>
                  
                  {/* Rating */}
                  <div className="flex flex-col items-end">
                    <StarRating rating={item.rating} />
                    <span className="text-[9px] text-white/40 font-mono mt-1">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="relative z-10">
                  <p className="text-white/75 text-[12.5px] leading-relaxed font-sans italic">
                    "{item.message}"
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-8 text-center">
              <p className="text-white/45 text-[11px] mb-3">
                Punya cerita sukses sendiri bersama ekosistem LASTQUESTION?
              </p>
              <a
                href="/contact"
                className="chamfer-btn inline-flex items-center justify-center gap-2 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[11px] tracking-widest py-2.5 px-4 w-full transition-all"
              >
                KIRIM TESTIMONI <MessageSquarePlus size={12} />
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
