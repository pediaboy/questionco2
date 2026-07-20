// Static config for the Telegram admin bot. Not secret data (IDs, not tokens) —
// mirrors the pattern already used for CRON_SECRET in app/api/cron/*.
export const TELEGRAM_ADMIN_ID = 7233272550;

// Shared inline keyboard -- attached to EVERY signal-related outbound message
// (initial signal blast, BE alerts, TP progress alerts, SL/timeout closures), not
// just the first one. ADMIN-ONLY (owner 2026-07-20: "inline button nya itu khusus
// admin, jadi kalo gua pencet langsung ngirim alert ke channel") -- pressing TP1-4
// or SL manually fires that exact alert to the channel AND updates the signal's
// real state via lib/signalAlerts.ts, the SAME code path the automatic cron uses,
// so manual and automatic stay perfectly in sync (no double-fires, no conflicts).
// BE advances one threshold step per press. LIVE is a read-only price/pips check
// for the admin's own reference. Non-admin taps are rejected in the webhook's
// callback_query handler before reaching any of this.
import type { InlineKeyboard } from "@/lib/telegramApi";

export function signalStatusKeyboard(signalId: string): InlineKeyboard {
  return [
    [
      { text: "TP1", callback_data: `sigact:tp1:${signalId}` },
      { text: "TP2", callback_data: `sigact:tp2:${signalId}` },
      { text: "TP3", callback_data: `sigact:tp3:${signalId}` },
      { text: "TP4", callback_data: `sigact:tp4:${signalId}` },
    ],
    [
      { text: "🛑 SL", callback_data: `sigact:sl:${signalId}` },
      { text: "⚖️ BE", callback_data: `sigact:be:${signalId}` },
      { text: "📊 LIVE", callback_data: `sigact:live:${signalId}` },
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
