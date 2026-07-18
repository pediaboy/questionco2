"use client";

import useSWR from "swr";
import { syncEmitter } from "./syncEmitter";

interface LeaderboardItem {
  name: string;
  profit_pips: number;
  win_rate: number;
  total_trade: number;
}

const fetcher = async (url: string): Promise<LeaderboardItem[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard data");
  }
  const data = await res.json();
  if (!data.success || !Array.isArray(data.items)) {
    throw new Error(data.message || "Failed to fetch leaderboard");
  }
  return data.items;
};

export function useLeaderboard() {
  const { data: items, error, mutate } = useSWR<LeaderboardItem[]>(
    "/api/member/leaderboard",
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
    items,
    isLoading: !error && !items,
    isError: error,
    mutate,
  };
}
