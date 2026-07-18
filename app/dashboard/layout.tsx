"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MemberAuthProvider, useMemberAuth } from "@/lib/MemberAuthContext";
import MemberHeader from "@/components/MemberHeader";
import MemberBottomNav from "@/components/MemberBottomNav";
import SyncIndicator from "@/components/SyncIndicator";

function MemberLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, notLoggedIn } = useMemberAuth();
  const router = useRouter();

  useEffect(() => {
    if (notLoggedIn) {
      router.replace("/login");
    }
  }, [notLoggedIn, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#05080f] font-mono text-cyan-300">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 border border-cyan-400/20 chamfer-sm"></div>
          <div className="w-6 h-6 border-2 border-t-cyan-300 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/70 animate-pulse">
          [ VERIFIKASI AKSES ]
        </div>
      </div>
    );
  }

  if (notLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto relative">
      <SyncIndicator />
      <MemberHeader />
      <main className="pt-20 px-4 pb-28 max-w-md mx-auto">
        {children}
      </main>
      <MemberBottomNav />
    </div>
  );
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberAuthProvider>
      <MemberLayoutContent>{children}</MemberLayoutContent>
    </MemberAuthProvider>
  );
}
