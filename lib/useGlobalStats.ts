"use client";

import useSWR from "swr";
import { syncEmitter } from "./syncEmitter";

export interface GlobalStats {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  kelas_completed: number;
  updated_at: string;
}

const fetcher = async (url: string): Promise<GlobalStats> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch global statistics");
  const data = await res.json();
  if (!data.success || !data.stats) throw new Error(data.message || "Failed to fetch global stats");
  return data.stats;
};

export function useGlobalStats() {
  const { data, error, mutate } = useSWR<GlobalStats>("/api/global-stats", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    onSuccess: () => {
      syncEmitter.emit();
    },
  });

  return {
    stats: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
