// Static config for the Telegram admin bot. Not secret data (IDs, not tokens) —
// mirrors the pattern already used for CRON_SECRET in app/api/cron/*.
export const TELEGRAM_ADMIN_ID = 7233272550;

export function vipChannelId(): string {
  return process.env.TELEGRAM_SIGNAL_CHANNEL_ID || "";
}

export function publicChannelId(): string {
  return process.env.TELEGRAM_PUBLIC_CHANNEL_ID || "";
}

export const SIGNAL_PAIR_OPTIONS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
