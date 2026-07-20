"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2, ArrowLeft } from "lucide-react";
import { supabase, setRememberMe } from "@/lib/supabaseClient";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Set BEFORE signIn so the session gets written to the right storage
    // (localStorage = persists across browser restarts, sessionStorage =
    // cleared when the browser/tab closes; logout always clears both).
    setRememberMe(remember);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Record a real login event for the Security Center's login history --
    // fire-and-forget, never blocks the actual login redirect.
    const token = data?.session?.access_token;
    if (token) {
      fetch("/api/security", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 py-10 relative">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-[11px] tracking-widest text-gray-400 hover:text-cyan-300 transition-colors duration-200"
      >
        <ArrowLeft size={14} />
        KEMBALI KE TERMINAL
      </button>

      <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2 text-center">
        [ AUTH // LOGIN ]
      </p>
      <h1 className="font-display font-bold text-white text-2xl text-center mb-8 uppercase">
        Access Terminal
      </h1>

      {justRegistered && (
        <div className="mb-5 text-[12.5px] text-cyan-300 border border-cyan-400/40 bg-cyan-400/5 px-3 py-2.5 clip-corner text-center">
          Akun berhasil dibuat. Silakan login.
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/70"
        />
        <input
          type="password"
          required
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/70"
        />

        {error && <p className="text-red-400 text-[11px]">{error}</p>}

        <label className="flex items-center gap-2.5 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="peer sr-only"
          />
          <span className="w-4 h-4 shrink-0 chamfer-sm border border-cyan-400/40 bg-[#0b0f18] flex items-center justify-center peer-checked:bg-cyan-400 peer-checked:border-cyan-400 transition-colors">
            {remember && <span className="w-2 h-2 bg-black" />}
          </span>
          <span className="text-[11.5px] text-white/50 tracking-wide">Ingat saya di perangkat ini</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="chamfer-btn mt-2 flex items-center justify-center gap-2 bg-cyan-400 text-black font-bold text-[13px] tracking-[0.1em] py-3.5 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          LOGIN
        </button>
      </form>

      <p className="text-white/40 text-[12px] text-center mt-6">
        Belum punya akun?{" "}
        <a href="/register" className="text-cyan-300 font-semibold">
          Daftar di sini
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
