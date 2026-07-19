"use client";

import useSWR from "swr";

export interface EtfItem {
  symbol: string;
  category: string;
  name: string;
  price: number | null;
  change: number | null;
  volume: number | null;
}

interface EtfResponse {
  success: boolean;
  items: EtfItem[];
  updated_at: string;
}

const fetcher = async (url: string): Promise<EtfItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch ETF data");
  const data: EtfResponse = await res.json();
  if (!data.success) throw new Error("Failed to fetch ETF data");
  return data.items;
};

export function useEtf() {
  const { data, error, isLoading } = useSWR<EtfItem[]>("/api/etf", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
  });

  return {
    items: data,
    isLoading: isLoading && !data,
    isError: !!error,
  };
}
