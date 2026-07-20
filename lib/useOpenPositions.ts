"use client";

import useSWR from "swr";
import { syncEmitter } from "./syncEmitter";

export interface OpenPositionItem {
  id: string;
  name: string;
  pair: string;
  direction: "BUY" | "SELL";
  lot_size: number;
  modal: number;
  price: number;
  created_at: string;
  status: "RUNNING" | "BE_HIT" | "SL_HIT";
  pips: number | null;
  live_price: number | null;
}

const fetcher = async (url: string): Promise<OpenPositionItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch open positions");
  const data = await res.json();
  if (!data.success || !Array.isArray(data.items)) {
    throw new Error(data.message || "Failed to fetch open positions");
  }
  return data.items;
};

export function useOpenPositions() {
  // Server recomputes each entry's SL/BE status against REAL live market price on
  // every hit -- 2s keeps it feeling "per-second live" without hammering the
  // upstream OKX/TradingView feeds harder than the rest of the site already does.
  const { data: items, error, mutate } = useSWR<OpenPositionItem[]>("/api/member/open-positions", fetcher, {
    refreshInterval: 2000,
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
