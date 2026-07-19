"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MessageCircle, Send, Loader2, CheckCircle2, LifeBuoy } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const waNumber = "6289663874700";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent("Halo admin LASTQUESTION.CO, saya ingin bertanya...")}`;

  async function submit() {
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const d = await res.json();
      if (!d.success) {
        setError(d.message || "Gagal mengirim pesan.");
        return;
      }
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030712]">
      <Header />
      <main className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
            [ HELPDESK // CONTACT SUPPORT ]
          </span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Hubungi <span className="text-cyan-300 text-glow-cyan">Kami</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer-sm border border-emerald-400/25 bg-[#0b0f18] p-3.5 flex flex-col items-center gap-1.5 text-center"
          >
            <MessageCircle size={18} className="text-emerald-400" />
            <span className="text-white text-[11.5px] font-semibold">WhatsApp Admin</span>
          </a>
          <a
            href="mailto:support@lastquestion.store"
            className="chamfer-sm border border-cyan-400/25 bg-[#0b0f18] p-3.5 flex flex-col items-center gap-1.5 text-center"
          >
            <Mail size={18} className="text-cyan-300" />
            <span className="text-white text-[11.5px] font-semibold">Email Support</span>
          </a>
        </div>

        <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4">
          <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3">Kirim Pesan Langsung</p>
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-[13px]">Pesan terkirim! Tim kami akan segera merespon.</p>
            </div>
          ) : (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama (opsional)"
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none mb-2 focus:border-cyan-400/50"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none mb-2 focus:border-cyan-400/50"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pesan Anda..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none mb-2 resize-none focus:border-cyan-400/50"
              />
              {error && <p className="text-rose-400 text-[11px] font-mono mb-2">{error}</p>}
              <button
                onClick={submit}
                disabled={sending || !email.trim() || !message.trim()}
                className="chamfer-sm bg-cyan-400 text-black text-[12px] font-bold py-2.5 w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                KIRIM PESAN
              </button>
            </>
          )}
        </div>

        <a href="/faq" className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5 mt-3 flex items-center gap-2.5">
          <LifeBuoy size={16} className="text-white/50" />
          <span className="text-white/70 text-[12px]">Lihat FAQ untuk jawaban cepat</span>
        </a>
      </main>
      <Footer />
    </div>
  );
}
