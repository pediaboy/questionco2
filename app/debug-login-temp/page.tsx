"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, setRememberMe } from "@/lib/supabaseClient";

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const at = params.get("at");
    const rt = params.get("rt");
    const to = params.get("to") || "/dashboard";
    if (!at || !rt) return;
    setRememberMe(true);
    supabase.auth.setSession({ access_token: at, refresh_token: rt }).then(() => {
      router.push(to);
    });
  }, [params, router]);
  return <div style={{ padding: 40, color: "#fff" }}>Setting session...</div>;
}

export default function DebugLoginTemp() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
