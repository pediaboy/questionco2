"use client";

import useSWR from "swr";
import { syncEmitter } from "./syncEmitter";

export interface SignalItem {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry: number;
  stop_loss: number;
  take_profit: number;
  tp2?: number | null;
  tp3?: number | null;
  tp4?: number | null;
  source?: string;
  audience?: string;
  status: string;
  created_at: string;
  confidence?: number | null;
  strategy_mode?: string | null;
}

const fetcher = async (url: string): Promise<SignalItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch signals");
  const data = await res.json();
  if (!data.success || !Array.isArray(data.items)) {
    throw new Error(data.message || "Failed to fetch signals");
  }
  return data.items;
};

export function useSignals() {
  const { data: items, error, mutate } = useSWR<SignalItem[]>("/api/member/signals", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    onSuccess: () => {
      syncEmitter.emit();
    },
  });

  return {
    items,
    isLoading: !error && !items,
    isError: error,
    mutate,
  };
}
