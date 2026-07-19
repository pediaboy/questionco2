import { SIGNAL_PAIRS } from "./signalPairs";

export interface RecapSignalRow {
  pair: string;
  status: string;
  hit_level: string | null;
  closed_at: string | null;
  created_at: string;
}

function pipsForHit(pairLabel: string, hitLevel: string | null): number {
  if (!hitLevel) return 0;
  const cfg = SIGNAL_PAIRS.find((p) => p.label === pairLabel);
  if (!cfg) return 0;
  if (hitLevel === "sl") return -cfg.slPips;
  const idx = Number(hitLevel.replace("tp", "")) - 1;
  return cfg.tpPips[idx] ?? 0;
}

export function summarizeSignals(rows: RecapSignalRow[]) {
  const total = rows.length;
  const profit = rows.filter((r) => r.status === "tp_hit").length;
  const loss = rows.filter((r) => r.status === "sl_hit").length;
  const beCancel = rows.filter((r) => r.status === "closed").length;

  const byPair: Record<string, { tpPips: number; slPips: number; net: number; suffix: string }> = {};
  for (const r of rows) {
    const cfg = SIGNAL_PAIRS.find((p) => p.label === r.pair);
    const suffix = cfg?.pipLabelSuffix || "pips";
    if (!byPair[r.pair]) byPair[r.pair] = { tpPips: 0, slPips: 0, net: 0, suffix };
    const pips = pipsForHit(r.pair, r.hit_level);
    if (pips > 0) byPair[r.pair].tpPips += pips;
    if (pips < 0) byPair[r.pair].slPips += pips;
    byPair[r.pair].net += pips;
  }

  return { total, profit, loss, beCancel, byPair };
}

export const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDateWIB(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = HARI_ID[wib.getUTCDay()];
  const date = wib.getUTCDate();
  const month = BULAN_ID[wib.getUTCMonth()];
  const year = wib.getUTCFullYear();
  return `${day}, ${date} ${month} ${year}`;
}

export function wibDayString(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}
