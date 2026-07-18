"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/vip");
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 py-10">
      <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2 text-center">
        [ AUTH // LOGIN ]
      </p>
      <h1 className="font-display font-bold text-white text-2xl text-center mb-8 uppercase">
        Access Terminal
      </h1>

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
