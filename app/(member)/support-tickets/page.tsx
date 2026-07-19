"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Ticket, Send, Loader2, CheckCircle2, Clock } from "lucide-react";

interface TicketRow {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function SupportTicketsPage() {
  const { accessToken } = useMemberAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function fetchTickets() {
    if (!accessToken) return;
    const res = await fetch("/api/support-tickets", { headers: { Authorization: `Bearer ${accessToken}` } });
    const d = await res.json();
    if (d.success) setTickets(d.tickets || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function submitTicket() {
    if (!subject.trim() || !message.trim() || !accessToken) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ subject, message }),
      });
      const d = await res.json();
      if (!d.success) {
        setError(d.message || "Gagal mengirim tiket.");
        return;
      }
      setSubject("");
      setMessage("");
      await fetchTickets();
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ HELPDESK // SUPPORT TICKETS ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Tiket <span className="text-cyan-300 text-glow-cyan">Bantuan</span>
        </h2>
      </div>

      {/* New ticket form */}
      <div className="chamfer-sm border border-white/10 bg-[#0b0f18] p-4 mb-5">
        <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-3">Buat Tiket Baru</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subjek"
          className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none mb-2 focus:border-cyan-400/50"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Jelaskan kendala Anda..."
          rows={3}
          className="w-full bg-black/40 border border-white/10 px-3 py-2 text-[13px] text-white outline-none mb-2 resize-none focus:border-cyan-400/50"
        />
        {error && <p className="text-rose-400 text-[11px] font-mono mb-2">{error}</p>}
        <button
          onClick={submitTicket}
          disabled={sending || !subject.trim() || !message.trim()}
          className="chamfer-sm bg-cyan-400 text-black text-[12px] font-bold py-2.5 w-full flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          KIRIM TIKET
        </button>
      </div>

      <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono uppercase mb-2">Riwayat Tiket</p>
      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 bg-white/5 animate-pulse chamfer-sm" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <Ticket size={20} className="text-white/20 mx-auto mb-2" />
          <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA TIKET ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-semibold text-[12.5px]">{t.subject}</span>
                <span
                  className={`flex items-center gap-1 text-[10px] font-mono shrink-0 ${
                    t.status === "open" ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {t.status === "open" ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                  {t.status.toUpperCase()}
                </span>
              </div>
              <p className="text-white/50 text-[11.5px] mb-1.5">{t.message}</p>
              <p className="text-white/25 text-[10px] font-mono">
                {new Date(t.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
