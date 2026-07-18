"use client";

import useSWR from "swr";
import { useMemberAuth, MemberProfile } from "./MemberAuthContext";
import { syncEmitter } from "./syncEmitter";

const fetcher = async ([url, token]: [string, string]): Promise<MemberProfile> => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch member profile stats");
  }
  const data = await res.json();
  if (!data.success || !data.profile) {
    throw new Error(data.message || "Failed to fetch stats");
  }
  return data.profile;
};

export function useMemberStats() {
  const { accessToken } = useMemberAuth();

  const { data: profile, error, mutate } = useSWR<MemberProfile>(
    accessToken ? ["/api/member/me", accessToken] : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      onSuccess: () => {
        syncEmitter.emit();
      },
    }
  );

  return {
    profile,
    isLoading: !error && !profile,
    isError: error,
    mutate,
  };
}
