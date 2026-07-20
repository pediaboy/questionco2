// LASTQUESTION.CO :: Portfolio page "Live Community Activity" ticker.
//
// IMPORTANT — what this is and isn't:
// This is a purely COSMETIC, client-side-generated ambient ticker meant to make
// the Portfolio page feel "alive". It uses generic trader ALIASES (not real
// member emails/identities), random modal ($100-$50,000) and random lot sizes,
// ticking every second. It is entirely decoupled from:
//   - real member accounts / qco2_profiles / admin panel emails
//   - the real "Kontes Capai Lot" contest standings or prize eligibility
//   - the member's own real win_rate / profit_pips / total_lot (shown honestly
//     elsewhere on the same page, unaffected by this file)
// Nothing here is persisted to the database and nothing here can ever influence
// who wins a real prize. If real per-member "recent activity" is ever wanted,
// that must come from real qco2_lot_entries data instead of this generator.

export interface FeedRow {
  id: string;
  alias: string;
  pair: string;
  direction: "BUY" | "SELL";
  modal: number;
  lot: number;
  secondsAgo: number;
}

const ALIAS_PREFIXES = [
  "Trader", "FX", "Scalper", "Whale", "Ronin", "Ghost", "Nova", "Viper",
  "Falcon", "Cipher", "Titan", "Nomad", "Zenith", "Drift", "Apex",
];
const PAIRS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT", "EURUSD", "GBPUSD"];

function randomAlias(): string {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const num = Math.floor(Math.random() * 900) + 10;
  return `${prefix}_${num}`;
}

function randomModal(): number {
  // $100 - $50,000, log-weighted so small accounts are more common than whale-sized ones
  const t = Math.random();
  const min = Math.log(100);
  const max = Math.log(50000);
  return Math.round(Math.exp(min + t * (max - min)));
}

function randomLot(): number {
  return Math.round((Math.random() * 4.9 + 0.01) * 100) / 100;
}

export function generateFeedRow(): FeedRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    alias: randomAlias(),
    pair: PAIRS[Math.floor(Math.random() * PAIRS.length)],
    direction: Math.random() > 0.5 ? "BUY" : "SELL",
    modal: randomModal(),
    lot: randomLot(),
    secondsAgo: 0,
  };
}

export function seedFeed(count: number): FeedRow[] {
  return Array.from({ length: count }, (_, i) => ({ ...generateFeedRow(), secondsAgo: i * 3 }));
}
