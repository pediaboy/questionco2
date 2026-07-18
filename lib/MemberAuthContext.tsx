"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

export interface MemberProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  tier: string | null;
  expired_at: string | null;
  is_vip: boolean;
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  kelas_completed: number;
  telegram_username?: string;
}

interface MemberAuthContextType {
  profile: MemberProfile | null;
  accessToken: string | null;
  loading: boolean;
  notLoggedIn: boolean;
  refreshProfile: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/member/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
          setNotLoggedIn(false);
        } else {
          setNotLoggedIn(true);
        }
      } else {
        setNotLoggedIn(true);
      }
    } catch (err) {
      console.error("Error fetching member profile:", err);
      setNotLoggedIn(true);
    }
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setNotLoggedIn(true);
        setProfile(null);
        setAccessToken(null);
      } else {
        const token = session.access_token;
        setAccessToken(token);
        await fetchProfile(token);
      }
    } catch (err) {
      console.error("Auth init error:", err);
      setNotLoggedIn(true);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    initAuth();

    // Listen for auth state changes to keep session updated
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setProfile(null);
        setAccessToken(null);
        setNotLoggedIn(true);
        setLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const token = session.access_token;
        setAccessToken(token);
        setLoading(true);
        await fetchProfile(token);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initAuth, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;
    await fetchProfile(accessToken);
  }, [accessToken, fetchProfile]);

  return (
    <MemberAuthContext.Provider
      value={{
        profile,
        accessToken,
        loading,
        notLoggedIn,
        refreshProfile,
      }}
    >
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error("useMemberAuth must be used within a MemberAuthProvider");
  }
  return context;
}
