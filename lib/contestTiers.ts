// LOT CONTEST — "Kontes Capai Lot" milestone tiers.
// Participants rank by total accumulated trading lot volume, not profit.
// Requirement to join: must be registered via the free partner broker (broker_registered=true),
// or be an admin-managed dummy competitor (is_dummy=true).

export type ContestTier = {
  lot: number;
  reward: string;
};

export const CONTEST_TIERS: ContestTier[] = [
  { lot: 1000, reward: "Rp 10.000.000" },
  { lot: 2000, reward: "iPhone 17" },
  { lot: 10000, reward: "Rp 50.000.000" },
  { lot: 30000, reward: "Rp 100.000.000" },
];

export function getNextTier(currentLot: number): ContestTier | null {
  const next = CONTEST_TIERS.find((t) => t.lot > currentLot);
  return next || null;
}

export function getProgressPercent(currentLot: number, nextTier: ContestTier | null): number {
  if (!nextTier) return 100;
  const pct = (currentLot / nextTier.lot) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}
