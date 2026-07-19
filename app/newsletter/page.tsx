"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "TRANSMISI INTEL: NEWSLETTER — LASTQUESTION.CO";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Email tidak valid.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponseMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal melakukan pendaftaran. Silakan coba lagi.");
      }

      if (data.success) {
        setSuccess(true);
        if (data.message) {
          setResponseMessage(data.message);
        }
      } else {
        throw new Error(data.message || "Terjadi kesalahan.");
      }
    } catch (err: any) {
      setError(err.message || "Koneksi terganggu. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#030712]">
      <Header />
      <main className="pt-[104px] px-5 pb-6">
        <div className="text-center mb-6">
          <p className="text-[10.5px] tracking-[0.3em] font-semibold text-cyan-400 mb-2 uppercase">
            [ INTEL SUPPLY // NEWSLETTER ]
          </p>
          <h1 className="font-display font-bold text-white text-[26px] leading-tight uppercase tracking-wide">
            MARKET INTELLIGENCE
          </h1>
          <p className="text-white/45 text-[12.5px] mt-2 max-w-[300px] mx-auto leading-relaxed">
            Dapatkan rangkuman pergerakan pasar mingguan dan tips strategi trading langsung ke inbox Anda.
          </p>
        </div>

        {/* Form Card or Success State */}
        <div className="mb-8">
          {success ? (
            <div className="hud-card chamfer border border-emerald-500/30 bg-[#0b0f18]/80 p-6 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-white font-display font-bold text-lg tracking-wide uppercase mb-2">
                TRANSMISI BERHASIL
              </h2>
              <p className="text-white/70 text-xs font-mono leading-relaxed mb-6">
                {responseMessage || "Email Anda telah berhasil diregistrasi ke dalam pusat antrean intelijen LASTQUESTION.CO."}
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                  setResponseMessage(null);
                }}
                className="chamfer-btn inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] tracking-widest py-3 px-4 w-full transition-all"
              >
                DAFTARKAN EMAIL LAIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="hud-card chamfer border border-cyan-400/25 bg-[#0b0f18]/80 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />
              
              <h2 className="font-display font-bold text-[14px] text-white tracking-widest mb-4 uppercase flex items-center gap-2">
                <span className="text-cyan-400 font-mono">[ SIGN_UP ]</span> AMBIL KENDALI UTAS INTEL
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-mono rounded">
                  {error}
                </div>
              )}

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-cyan-400/50" />
                </div>
                <input
                  type="email"
                  placeholder="ALAMAT EMAIL ANDA..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-cyan-400/20 text-white placeholder-cyan-400/30 text-xs font-mono tracking-wider focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 chamfer-sm transition-all uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="chamfer-btn w-full flex items-center justify-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-mono text-[11px] tracking-widest py-3 px-4 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    MENGIRIM... <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    DAFTAR SEKARANG <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Content Section / Benefits list */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase">
            [ PROTOKOL DISTRIBUSI INTEL ]
          </h3>
          <ul className="space-y-4 text-xs text-white/70 font-mono leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold mt-0.5">•</span>
              <div>
                <span className="text-white font-semibold block mb-0.5">RANGKUMAN PASAR MINGGUAN</span>
                Analisis makro dan recap volatilitas pasar kripto & forex untuk membekali navigasi taktis Anda.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold mt-0.5">•</span>
              <div>
                <span className="text-white font-semibold block mb-0.5">TIPS STRATEGI TRADING</span>
                Pemetaan setup dan model manajemen risiko langsung dari sistem operasional kami.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 font-bold mt-0.5">•</span>
              <div>
                <span className="text-white font-semibold block mb-0.5">UPDATE PLATFORM & FITUR</span>
                Informasi rilis fitur baru, turnamen trading, dan modul intelijen eksklusif.
              </div>
            </li>
          </ul>
          
          <div className="pt-4 border-t border-cyan-400/10">
            <p className="text-[10px] text-white/40 italic font-mono leading-normal">
              *CATATAN: Sistem otomasi email pengiriman berkala saat ini sedang dipersiapkan. Daftar sekarang untuk mengunci antrean dan menjadi yang pertama tahu saat transmisi pertama dimulai.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
