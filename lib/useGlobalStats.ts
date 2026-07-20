"use client";

import useSWR from "swr";
import { syncEmitter } from "./syncEmitter";

export interface LatestSignal {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  status: string;
  audience: string;
  confidence: number | null;
  created_at: string;
}

export interface GlobalStats {
  win_rate: number;
  total_trade: number;
  profit_pips: number;
  latest_signal: LatestSignal | null;
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
  // Real combined community stats -- polled as fast as is practical (1s) without
  // hammering the DB pointlessly. True millisecond-level refresh would just mean
  // firing requests faster than they can ever complete, so 1s is the real ceiling.
  const { data, error, mutate } = useSWR<GlobalStats>("/api/global-stats", fetcher, {
    refreshInterval: 1000,
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
