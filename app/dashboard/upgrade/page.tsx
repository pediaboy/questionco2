"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Copy, Send, AlertTriangle } from "lucide-react";
import { useMemberAuth } from "@/lib/MemberAuthContext";

const STEPS = ["Akun Dibuat", "Daftar Valetax", "Submit Akun", "Terverifikasi"];

export default function UpgradePage() {
  const { accessToken } = useMemberAuth();
  const [currentStep] = useState(1); // step 1 (index 0) already completed by default

  const [copied, setCopied] = useState(false);
  const partnerCode = "3038902";

  const [accountNo, setAccountNo] = useState("");
  const [valetaxEmail, setValetaxEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(partnerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async () => {
    if (!accountNo.trim() || !valetaxEmail.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi No. Akun dan Email Valetax." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/member/vip-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ valetax_account_no: accountNo, valetax_email: valetaxEmail }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message || "Gagal mengirim data." });
        setSubmitting(false);
        return;
      }
      setMessage({ type: "success", text: "Data terkirim, admin akan verifikasi dalam 1x24 jam." });
      setAccountNo("");
      setValetaxEmail("");
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ PROTOCOL // UNLOCK SIGNAL VIP ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Upgrade <span className="text-cyan-300 text-glow-cyan">VIP</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Ikuti langkah berikut untuk membuka akses sinyal live.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 px-1">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 chamfer-sm flex items-center justify-center border ${
                    done
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                      : active
                      ? "border-cyan-400 text-cyan-300"
                      : "border-white/15 text-slate-600"
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                </div>
                <span
                  className={`text-[9px] mt-2 text-center font-mono tracking-wide ${
                    done || active ? "text-cyan-300" : "text-slate-600"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 -mt-4 ${i < currentStep ? "bg-cyan-400/50" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Instruksi Pendaftaran */}
      <div className="chamfer-sm p-5 mb-5 bg-[#0b0f18]/60 border border-white/10 relative">
        <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70 font-mono mb-4 block">
          [ INSTRUKSI PENDAFTARAN ]
        </span>

        <ol className="space-y-4 text-sm text-white/80">
          <li className="flex gap-3">
            <span className="font-mono text-cyan-400 font-bold">1.</span>
            <span>Daftar akun di broker Valetax.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-cyan-400 font-bold">2.</span>
            <div className="flex-1">
              <p>
                Wajib buat akun dengan <span className="font-bold">Partner Code / Kode Mitra</span>:
              </p>
              <div className="mt-2 flex items-center gap-2 chamfer-sm bg-cyan-950/30 border border-cyan-400/40 px-4 py-2 w-fit">
                <span className="font-mono font-bold text-xl text-cyan-300 tracking-widest">{partnerCode}</span>
                <button
                  onClick={handleCopy}
                  className="text-cyan-300 hover:text-cyan-100 transition-colors"
                  aria-label="Copy partner code"
                >
                  <Copy size={16} />
                </button>
                {copied && <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>}
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-cyan-400 font-bold">3.</span>
            <span>Deposit minimal $100 (Akun Standar / Cent / ECN).</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-cyan-400 font-bold">4.</span>
            <span>Submit form verifikasi di bawah ini.</span>
          </li>
        </ol>
      </div>

      {/* Danger Box */}
      <div className="chamfer-sm p-4 mb-5 border-2 border-red-500/60 bg-red-500/5 flex gap-3">
        <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-300 leading-relaxed">
          Penting untuk akses VIP: deposit harus tetap utuh minimal $100 selama masa aktif VIP untuk
          verifikasi berkelanjutan.
        </p>
      </div>

      {/* Valetax Iframe */}
      <div className="mb-5">
        <iframe
          src="https://ma.valetax.com/embed/register/block/Wx7aDnkGc1qc%2Fvw4nQRo2iUVqM6yrg%2Bto38T2btOGOXt%2Bm1CEd2IBn83c26UII77f67NdAs0AQ4lpigT24UVQ2FQxz6r67jvgCUWt5eNG4Cb%2FpUyD2OOWzmsHhAxkbf5?lang=id&background=no-background"
          width="100%"
          height="490px"
          title="Valetax Registration"
          className="rounded-xl border border-gray-800"
        />
      </div>

      {/* Telegram Bot Alternative */}
      <a
        href="https://t.me/LASTQUESTIONVIP_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="chamfer-btn mb-6 w-full flex items-center justify-center gap-2 py-4 border border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/5 hover:bg-[#38BDF8]/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest"
      >
        <Send size={15} className="rotate-[-35deg]" />
        [ Daftar via Bot Telegram ]
      </a>

      {/* Form Verifikasi Internal */}
      <div className="chamfer p-5 mb-6 bg-[#0b0f18]/60 border border-cyan-400/20 relative">
        <div className="absolute top-[4px] left-[4px] w-3 h-3 border-t border-l border-cyan-400/60" />
        <div className="absolute bottom-[4px] right-[4px] w-3 h-3 border-b border-r border-cyan-400/60" />

        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono mb-4 block">
          [ FORM VERIFIKASI INTERNAL ]
        </span>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] text-cyan-300/70 mb-1 block font-mono">
              [ NO. AKUN VALETAX ]
            </label>
            <input
              type="text"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              placeholder="Contoh: 123456"
              className="chamfer-sm w-full bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] text-cyan-300/70 mb-1 block font-mono">
              [ EMAIL VALETAX ]
            </label>
            <input
              type="email"
              value={valetaxEmail}
              onChange={(e) => setValetaxEmail(e.target.value)}
              placeholder="email@valetax.com"
              className="chamfer-sm w-full bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          {message && (
            <p className={`text-xs font-mono ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="chamfer-btn w-full py-3 border border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 active:scale-[0.98] transition-all font-mono text-xs font-bold tracking-widest disabled:opacity-50"
          >
            {submitting ? "MENGIRIM..." : "[ Submit & Cek Sekarang ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
