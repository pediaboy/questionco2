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
  // Fix 2026-08-06: "timeout" signals were falling through every bucket (not
  // profit/loss/closed) so total didn't match profit+loss+beCancel whenever a
  // timeout happened that day. Timeout = no BE/TP/SL hit before expiry, so it
  // belongs in BE/Cancel same as an explicit "closed".
  const beCancel = rows.filter((r) => r.status === "closed" || r.status === "timeout").length;

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

/**
 * Fix 2026-08-06 (owner: "rekap signal itu dikirim jam 23.00 anjing bukan jam 1
 * malem... yg dibaca hari ini, dari kemaren ga bener banget"). Root cause: the
 * recap is meant to summarize a WIB calendar day that has essentially just
 * ended (fires ~23:00-23:55 WIB), but GitHub Actions' scheduled cron is
 * best-effort and was firing 50-95 min LATE most days -- often crossing
 * midnight WIB. Once execution time is past midnight, using `now` directly to
 * pick "today" silently recaps the WRONG (brand-new, nearly-empty) day instead
 * of the day that just ended.
 *
 * Fix: shift the reference time back by a buffer before deriving the WIB day
 * string, so late firing (up to ~20h late) still resolves to the correct
 * just-ended day. Used for BOTH the DB query filter and the displayed date
 * label -- they must always agree.
 */
const RECAP_LATE_FIRE_BUFFER_MS = 4 * 60 * 60 * 1000; // 4 hours

export function recapTargetDate(executedAt: Date): Date {
  return new Date(executedAt.getTime() - RECAP_LATE_FIRE_BUFFER_MS);
}
