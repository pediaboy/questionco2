"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, KeyRound, Lock, Loader2 } from "lucide-react";

type Step = "email" | "otp" | "password";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendOtp(isResend = false) {
    setError("");
    setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "register" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Gagal mengirim kode OTP.");
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
        setLoading(false);
        return;
      }
      setInfo(isResend ? "Kode baru telah dikirim." : "Kode OTP telah dikirim ke email kamu.");
      setStep("otp");
      setCooldown(45);
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: "register" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Kode OTP salah.");
        setLoading(false);
        return;
      }
      setStep("password");
      setInfo("");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function completeRegister() {
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Gagal membuat akun.");
        setLoading(false);
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <Header />
      <main className="pt-[104px] px-6 pb-16">
        <p className="text-[10.5px] tracking-[0.3em] font-semibold mb-3 text-cyan-300">
          [ NEW_OPERATIVE // REGISTER ]
        </p>
        <h1 className="font-display font-bold text-white text-[24px] mb-8">Daftar Akun</h1>

        {error && (
          <div className="mb-5 text-[12.5px] text-red-300 border border-red-500/40 bg-red-500/10 px-3 py-2.5 clip-corner">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mb-5 text-[12.5px] text-cyan-300 border border-cyan-400/40 bg-cyan-400/5 px-3 py-2.5 clip-corner">
            {info}
          </div>
        )}

        {step === "email" && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] tracking-wider text-white/50 mb-2 block">EMAIL</label>
              <div className="flex items-center gap-2.5 border-b border-cyan-400/40 pb-2.5">
                <Mail size={16} className="text-cyan-300 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="bg-transparent outline-none text-white text-[14px] w-full placeholder:text-white/25"
                />
              </div>
            </div>
            <button
              onClick={() => sendOtp(false)}
              disabled={loading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-[14px] py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Kirim Kode OTP
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col gap-5">
            <p className="text-[12.5px] text-white/50">
              Kode 6-digit dikirim ke <span className="text-cyan-300">{email}</span>
            </p>
            <div className="flex gap-2 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-white text-lg font-bold bg-white/5 border border-cyan-400/30 focus:border-cyan-400 outline-none clip-corner"
                />
              ))}
            </div>
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-[14px] py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Verifikasi Kode
            </button>
            <button
              onClick={() => sendOtp(true)}
              disabled={cooldown > 0 || loading}
              className="text-[12.5px] text-cyan-300/70 disabled:text-white/25"
            >
              {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim ulang kode"}
            </button>
          </div>
        )}

        {step === "password" && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[11px] tracking-wider text-white/50 mb-2 block">PASSWORD</label>
              <div className="flex items-center gap-2.5 border-b border-cyan-400/40 pb-2.5">
                <Lock size={16} className="text-cyan-300 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="bg-transparent outline-none text-white text-[14px] w-full placeholder:text-white/25"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] tracking-wider text-white/50 mb-2 block">KONFIRMASI PASSWORD</label>
              <div className="flex items-center gap-2.5 border-b border-cyan-400/40 pb-2.5">
                <Lock size={16} className="text-cyan-300 shrink-0" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="bg-transparent outline-none text-white text-[14px] w-full placeholder:text-white/25"
                />
              </div>
            </div>
            <button
              onClick={completeRegister}
              disabled={loading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-[14px] py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Buat Akun
            </button>
          </div>
        )}

        <p className="text-center text-[12.5px] text-white/40 mt-8">
          Sudah punya akun?{" "}
          <a href="/login" className="text-cyan-300">
            Login
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
