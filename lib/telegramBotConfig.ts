// Static config for the Telegram admin bot. Not secret data (IDs, not tokens) —
// mirrors the pattern already used for CRON_SECRET in app/api/cron/*.
export const TELEGRAM_ADMIN_ID = 7233272550;

// Shared "Live Status" inline keyboard -- attached to EVERY signal-related outbound
// message (initial signal blast, BE alerts, TP progress alerts, SL/timeout closures),
// not just the first one, so a subscriber can always check live status no matter
// which message they're looking at. Any subscriber can tap these (not admin-gated --
// see the `sigstat:` branch in the webhook's callback_query handler).
import type { InlineKeyboard } from "@/lib/telegramApi";

export function signalStatusKeyboard(signalId: string): InlineKeyboard {
  return [
    [
      { text: "🎯 TARGET", callback_data: `sigstat:target:${signalId}` },
      { text: "⚖️ BE", callback_data: `sigstat:be:${signalId}` },
      { text: "📊 LIVE", callback_data: `sigstat:live:${signalId}` },
    ],
  ];
}

export function vipChannelId(): string {
  return process.env.TELEGRAM_SIGNAL_CHANNEL_ID || "";
}

export function publicChannelId(): string {
  return process.env.TELEGRAM_PUBLIC_CHANNEL_ID || "";
}

export const SIGNAL_PAIR_OPTIONS = ["XAUUSD", "BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
