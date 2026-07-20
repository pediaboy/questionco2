"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "member" | "admin";
  message: string;
  created_at: string;
}

export default function LiveChatPage() {
  const { accessToken } = useMemberAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  async function fetchMessages() {
    if (!accessToken) return;
    const res = await fetch("/api/live-chat", { headers: { Authorization: `Bearer ${accessToken}` } });
    const d = await res.json();
    if (d.success) {
      setMessages(d.messages || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      lastCountRef.current = messages.length;
    }
  }, [messages]);

  async function send() {
    const v = text.trim();
    if (!v || !accessToken || sending) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: v }),
      });
      const d = await res.json();
      if (d.success) await fetchMessages();
    } finally {
      setSending(false);
    }
  }

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ HELPDESK // LIVE CHAT ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1 flex items-center gap-2">
          Live <span className="text-cyan-300 text-glow-cyan">Chat</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ADMIN ONLINE
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto chamfer-sm border border-white/10 bg-[#0b0f18] p-3 flex flex-col gap-2">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 bg-white/5 animate-pulse chamfer-sm w-2/3" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <MessageCircle size={22} className="text-white/20 mb-2" />
            <span className="text-[11px] text-slate-500 font-mono">
              [ BELUM ADA PESAN — MULAI CHAT DENGAN ADMIN ]
            </span>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "member" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] chamfer-sm px-3 py-2 text-[12.5px] leading-relaxed ${
                  m.sender === "member"
                    ? "bg-cyan-500/15 border border-cyan-400/30 text-cyan-100"
                    : "bg-white/5 border border-white/10 text-white/80"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.message}</p>
                <p className="text-[9px] font-mono text-white/30 mt-1 text-right">
                  {m.sender === "admin" ? "Admin · " : ""}
                  {timeLabel(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tulis pesan..."
          className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 text-[13px] text-white outline-none focus:border-cyan-400/50 chamfer-sm"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="chamfer-sm bg-cyan-400 text-black px-4 py-2.5 flex items-center justify-center disabled:opacity-40"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
