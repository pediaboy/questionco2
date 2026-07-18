"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session && data.user) {
      await supabase.from("qco2_profiles").insert({
        auth_user_id: data.user.id,
        email,
        full_name: fullName,
        role: "free_member",
      });
      setLoading(false);
      router.push("/vip");
      return;
    }

    setLoading(false);
    setError("Cek email untuk verifikasi akun sebelum login.");
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6 py-10">
      <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2 text-center">
        [ AUTH // REGISTER ]
      </p>
      <h1 className="font-display font-bold text-white text-2xl text-center mb-8 uppercase">
        New Identity
      </h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="text"
          required
          placeholder="NAMA LENGKAP"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/70"
        />
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
          minLength={6}
          placeholder="PASSWORD (MIN. 6 KARAKTER)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/70"
        />

        {error && <p className="text-yellow-400 text-[11px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="chamfer-btn mt-2 flex items-center justify-center gap-2 bg-cyan-400 text-black font-bold text-[13px] tracking-[0.1em] py-3.5 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          DAFTAR
        </button>
      </form>

      <p className="text-white/40 text-[12px] text-center mt-6">
        Sudah punya akun?{" "}
        <a href="/login" className="text-cyan-300 font-semibold">
          Login di sini
        </a>
      </p>
    </div>
  );
}
